import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  UserPlus, 
  Users, 
  Upload,
  Trash2,
  Edit,
  Shield,
  Building2,
  Check,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  department: string | null;
  location: string | null;
  manager_id: string | null;
  user_roles: { role: string }[] | null;
}

interface Manager {
  id: string;
  full_name: string;
  job_title: string | null;
}

const employeeSchema = z.object({
  email: z.string().email("Invalid email"),
  full_name: z.string().min(2, "Name required"),
  job_title: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"employees" | "bulk" | "roles">("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Bulk onboard state
  const [bulkData, setBulkData] = useState<string>("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Single employee form
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    full_name: "",
    job_title: "",
    department: "",
    location: "",
    manager_id: "",
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke("admin-manage", {
        body: { action: "get-all-employees" },
      });

      if (response.error) throw response.error;
      setEmployees(response.data?.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to fetch employees");
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke("admin-manage", {
        body: { action: "get-managers" },
      });

      if (response.error) throw response.error;
      setManagers(response.data?.managers || []);
    } catch (err) {
      console.error("Error fetching managers:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchManagers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchEmployees, fetchManagers]);

  const handleAddSingleEmployee = async () => {
    try {
      const validation = employeeSchema.safeParse(newEmployee);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setBulkLoading(true);
      
      const response = await supabase.functions.invoke("bulk-onboard", {
        body: {
          employees: [{
            email: newEmployee.email,
            full_name: newEmployee.full_name,
            job_title: newEmployee.job_title || undefined,
            department: newEmployee.department || undefined,
            location: newEmployee.location || undefined,
            manager_id: newEmployee.manager_id || undefined,
          }],
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success?.length > 0) {
        toast.success(`Employee ${newEmployee.email} onboarded successfully!`);
        setNewEmployee({ email: "", full_name: "", job_title: "", department: "", location: "", manager_id: "" });
        fetchEmployees();
      } else if (response.data?.failed?.length > 0) {
        toast.error(`Failed: ${response.data.failed[0].error}`);
      }
    } catch (err) {
      console.error("Error adding employee:", err);
      toast.error("Failed to add employee");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkOnboard = async () => {
    try {
      if (!bulkData.trim()) {
        toast.error("Please enter employee data");
        return;
      }

      setBulkLoading(true);

      // Parse CSV-like data (email, full_name, job_title, department, location)
      const lines = bulkData.trim().split("\n");
      const employees = lines.map(line => {
        const parts = line.split(",").map(p => p.trim());
        return {
          email: parts[0],
          full_name: parts[1] || parts[0].split("@")[0],
          job_title: parts[2] || undefined,
          department: parts[3] || undefined,
          location: parts[4] || undefined,
        };
      }).filter(e => e.email);

      if (employees.length === 0) {
        toast.error("No valid employees found in data");
        return;
      }

      const response = await supabase.functions.invoke("bulk-onboard", {
        body: { employees },
      });

      if (response.error) throw response.error;

      const successCount = response.data?.success?.length || 0;
      const failedCount = response.data?.failed?.length || 0;

      if (successCount > 0) {
        toast.success(`Successfully onboarded ${successCount} employees`);
        setBulkData("");
        fetchEmployees();
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} employees failed to onboard`);
        console.log("Failed:", response.data?.failed);
      }
    } catch (err) {
      console.error("Error bulk onboarding:", err);
      toast.error("Failed to bulk onboard employees");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleUpdateEmployee = async (employeeId: string, updates: Record<string, unknown>) => {
    try {
      const response = await supabase.functions.invoke("admin-manage", {
        body: {
          action: "update-employee",
          employee_profile_id: employeeId,
          updates,
        },
      });

      if (response.error) throw response.error;

      toast.success("Employee updated successfully");
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      console.error("Error updating employee:", err);
      toast.error("Failed to update employee");
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      const response = await supabase.functions.invoke("admin-manage", {
        body: { action: "assign-role", user_id: userId, role },
      });

      if (response.error) throw response.error;

      toast.success(`Role ${role} assigned successfully`);
      fetchEmployees();
    } catch (err) {
      console.error("Error assigning role:", err);
      toast.error("Failed to assign role");
    }
  };

  const roles = ["employee", "team_lead", "manager", "hr", "admin"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4 mb-6">
          <button 
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Admin Dashboard</h1>
          <div className="w-10" />
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("employees")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === "employees" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            <Users className="w-4 h-4" />
            Employees
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === "bulk" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            <Upload className="w-4 h-4" />
            Bulk Onboard
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === "roles" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            <Shield className="w-4 h-4" />
            Manage Roles
          </button>
        </div>

        {/* Employees Tab */}
        {activeTab === "employees" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Add Single Employee */}
            <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add New Employee
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newEmployee.full_name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={newEmployee.job_title}
                  onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newEmployee.location}
                  onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <select
                  value={newEmployee.manager_id}
                  onChange={(e) => setNewEmployee({ ...newEmployee, manager_id: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Manager (optional)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} {m.job_title ? `- ${m.job_title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleAddSingleEmployee}
                disabled={bulkLoading}
                className="mt-4"
              >
                {bulkLoading ? "Adding..." : "Add Employee"}
              </Button>
            </motion.div>

            {/* Employee List */}
            <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                All Employees ({employees.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No employees found</div>
              ) : (
                <div className="space-y-3">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{emp.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {emp.job_title && (
                            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                              {emp.job_title}
                            </span>
                          )}
                          {emp.department && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                              {emp.department}
                            </span>
                          )}
                          {emp.user_roles?.[0]?.role && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {emp.user_roles[0].role}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        className="p-2 hover:bg-background rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Bulk Onboard Tab */}
        {activeTab === "bulk" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Bulk Employee Onboarding
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter employee data in CSV format (one per line):<br />
                <code className="text-xs bg-muted px-2 py-1 rounded">email, full_name, job_title, department, location</code>
              </p>
              <textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                placeholder={`john@company.com, John Doe, Software Engineer, Engineering, New York
jane@company.com, Jane Smith, Product Manager, Product, London
bob@company.com, Bob Wilson, Designer, Design, Remote`}
                rows={10}
                className="w-full p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex items-center gap-4 mt-4">
                <Button
                  onClick={handleBulkOnboard}
                  disabled={bulkLoading || !bulkData.trim()}
                >
                  {bulkLoading ? "Processing..." : "Onboard Employees"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {bulkData.trim().split("\n").filter(l => l.trim()).length} employees ready
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Manage Roles Tab */}
        {activeTab === "roles" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Assign Roles
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click on a role badge to assign it to an employee.
              </p>
              
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{emp.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {roles.map((role) => {
                          const isActive = emp.user_roles?.[0]?.role === role;
                          return (
                            <button
                              key={role}
                              onClick={() => !isActive && handleAssignRole(emp.user_id, role)}
                              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Edit Employee Modal */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-6 shadow-elevated max-w-md w-full"
            >
              <h3 className="font-semibold mb-4">Edit Employee</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Job Title</label>
                  <input
                    type="text"
                    value={editingEmployee.job_title || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, job_title: e.target.value })}
                    className="w-full p-3 rounded-xl border border-border bg-background mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={editingEmployee.department || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full p-3 rounded-xl border border-border bg-background mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Location</label>
                  <input
                    type="text"
                    value={editingEmployee.location || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, location: e.target.value })}
                    className="w-full p-3 rounded-xl border border-border bg-background mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Manager</label>
                  <select
                    value={editingEmployee.manager_id || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, manager_id: e.target.value || null })}
                    className="w-full p-3 rounded-xl border border-border bg-background mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No Manager</option>
                    {managers.filter(m => m.id !== editingEmployee.id).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} {m.job_title ? `- ${m.job_title}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateEmployee(editingEmployee.id, {
                    job_title: editingEmployee.job_title,
                    department: editingEmployee.department,
                    location: editingEmployee.location,
                    manager_id: editingEmployee.manager_id,
                  })}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
