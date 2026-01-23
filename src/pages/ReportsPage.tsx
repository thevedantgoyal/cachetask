import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Briefcase,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface RoleStats {
  role: string;
  count: number;
}

interface TaskStats {
  status: string;
  count: number;
}

interface ContributionStats {
  status: string;
  count: number;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  department: string | null;
  role: string;
}

interface PerformanceData {
  category: string;
  avgScore: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const ReportsPage = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats[]>([]);
  const [contributionStats, setContributionStats] = useState<ContributionStats[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // Fetch all profiles with roles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, job_title, department");

        const { data: roles } = await supabase.from("user_roles").select("user_id, role");

        // Combine profiles with roles
        const membersWithRoles: TeamMember[] = (profiles || []).map((p) => {
          const userRole = roles?.find((r) => r.user_id === p.id);
          return {
            ...p,
            role: userRole?.role || "employee",
          };
        });
        setTeamMembers(membersWithRoles);

        // Calculate role distribution
        const roleCount: Record<string, number> = {};
        (roles || []).forEach((r) => {
          roleCount[r.role] = (roleCount[r.role] || 0) + 1;
        });
        setRoleStats(Object.entries(roleCount).map(([role, count]) => ({ role, count })));

        // Fetch task statistics
        const { data: tasks } = await supabase.from("tasks").select("status");
        const taskCount: Record<string, number> = {};
        (tasks || []).forEach((t) => {
          const status = t.status || "pending";
          taskCount[status] = (taskCount[status] || 0) + 1;
        });
        setTaskStats(Object.entries(taskCount).map(([status, count]) => ({ status, count })));

        // Fetch contribution statistics
        const { data: contributions } = await supabase.from("contributions").select("status");
        const contribCount: Record<string, number> = {};
        (contributions || []).forEach((c) => {
          const status = c.status || "pending";
          contribCount[status] = (contribCount[status] || 0) + 1;
        });
        setContributionStats(
          Object.entries(contribCount).map(([status, count]) => ({ status, count }))
        );

        // Fetch performance metrics
        const { data: metrics } = await supabase
          .from("performance_metrics")
          .select("score, category_id, metric_categories(name)");

        const perfByCategory: Record<string, { total: number; count: number }> = {};
        (metrics || []).forEach((m: any) => {
          const catName = m.metric_categories?.name || "General";
          if (!perfByCategory[catName]) {
            perfByCategory[catName] = { total: 0, count: 0 };
          }
          perfByCategory[catName].total += m.score;
          perfByCategory[catName].count += 1;
        });
        setPerformanceData(
          Object.entries(perfByCategory).map(([category, data]) => ({
            category,
            avgScore: Math.round(data.total / data.count),
          }))
        );
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const totalMembers = teamMembers.length;
  const totalTasks = taskStats.reduce((sum, t) => sum + t.count, 0);
  const completedTasks = taskStats.find((t) => t.status === "completed")?.count || 0;
  const totalContributions = contributionStats.reduce((sum, c) => sum + c.count, 0);
  const approvedContributions = contributionStats.find((c) => c.status === "approved")?.count || 0;

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500/10 text-red-500",
      manager: "bg-blue-500/10 text-blue-500",
      hr: "bg-purple-500/10 text-purple-500",
      team_lead: "bg-amber-500/10 text-amber-500",
      employee: "bg-green-500/10 text-green-500",
      organization: "bg-indigo-500/10 text-indigo-500",
    };
    return colors[role] || "bg-muted text-muted-foreground";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader
          title="Organization Reports"
          showNotifications
          onNotificationClick={() => setIsNotificationsOpen(true)}
        />

        {/* Summary Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-2xl p-5 shadow-soft border border-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalMembers}</p>
            <p className="text-sm text-muted-foreground">Total Staff</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-card rounded-2xl p-5 shadow-soft border border-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{totalTasks}</p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-card rounded-2xl p-5 shadow-soft border border-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Task Completion</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-card rounded-2xl p-5 shadow-soft border border-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{totalContributions}</p>
            <p className="text-sm text-muted-foreground">Contributions</p>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Role Distribution */}
            <motion.div
              variants={itemVariants}
              className="bg-card rounded-2xl p-6 shadow-soft border border-border/50"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Role Distribution
              </h3>
              <div className="space-y-3">
                {roleStats.map(({ role, count }) => (
                  <div key={role} className="flex items-center gap-3">
                    <Badge className={`capitalize ${getRoleColor(role)}`}>{role}</Badge>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(count / totalMembers) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Task & Contribution Summary */}
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                variants={itemVariants}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border/50"
              >
                <h3 className="font-semibold mb-4">Task Status</h3>
                <div className="space-y-3">
                  {taskStats.map(({ status, count }) => (
                    <div key={status} className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <span className="text-sm capitalize flex-1">{status.replace("_", " ")}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border/50"
              >
                <h3 className="font-semibold mb-4">Contribution Status</h3>
                <div className="space-y-3">
                  {contributionStats.map(({ status, count }) => (
                    <div key={status} className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <span className="text-sm capitalize flex-1">{status}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  variants={itemVariants}
                  className="bg-card rounded-xl p-4 shadow-soft border border-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {member.job_title && (
                        <p className="text-xs text-muted-foreground mt-1">{member.job_title}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className={`capitalize ${getRoleColor(member.role)}`}>
                        {member.role}
                      </Badge>
                      {member.department && (
                        <p className="text-xs text-muted-foreground mt-1">{member.department}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <motion.div
              variants={itemVariants}
              className="bg-card rounded-2xl p-6 shadow-soft border border-border/50"
            >
              <h3 className="font-semibold mb-4">Task Completion Rate</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed</span>
                  <span className="text-sm font-medium">
                    {completedTasks} / {totalTasks}
                  </span>
                </div>
                <Progress
                  value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
                  className="h-3"
                />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-card rounded-2xl p-6 shadow-soft border border-border/50"
            >
              <h3 className="font-semibold mb-4">Contribution Approval Rate</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Approved</span>
                  <span className="text-sm font-medium">
                    {approvedContributions} / {totalContributions}
                  </span>
                </div>
                <Progress
                  value={
                    totalContributions > 0 ? (approvedContributions / totalContributions) * 100 : 0
                  }
                  className="h-3"
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {performanceData.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {performanceData.map(({ category, avgScore }) => (
                  <motion.div
                    key={category}
                    variants={itemVariants}
                    className="bg-card rounded-xl p-4 shadow-soft border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category}</span>
                      <span className="text-lg font-bold text-primary">{avgScore}/100</span>
                    </div>
                    <Progress value={avgScore} className="h-2" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No performance data available yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RoleBasedNav />
      <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
};

export default ReportsPage;
