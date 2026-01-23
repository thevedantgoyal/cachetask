import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  LogOut, 
  Mail, 
  Phone, 
  Link as LinkIcon,
  ExternalLink,
  ChevronRight,
  MapPin,
  Building2,
  Briefcase
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  department: string | null;
  location: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string | null;
  work_hours: string | null;
  linkedin_url: string | null;
}

interface Manager {
  id: string;
  full_name: string;
  job_title: string | null;
  avatar_url: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        setProfile(profileData);

        // Fetch manager if exists
        if (profileData?.manager_id) {
          const { data: managerData } = await supabase
            .from("profiles")
            .select("id, full_name, job_title, avatar_url")
            .eq("id", profileData.manager_id)
            .single();

          if (managerData) {
            setManager(managerData);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-2">
        <PageHeader
          title="My Profile"
          showNotifications
          onNotificationClick={() => setIsNotificationsOpen(true)}
          rightElement={
            <button 
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          }
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Profile Header */}
          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-accent ring-4 ring-background shadow-elevated">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-2xl font-display font-bold text-primary">
                        {profile?.full_name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-success border-2 border-card" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-display font-bold">{profile?.full_name || "User"}</h2>
                <p className="text-primary font-medium text-sm">
                  {profile?.job_title || "Employee"}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  {profile?.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {profile.department}
                    </span>
                  )}
                  {profile?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-success" />
                {profile?.status || "Available"}
              </span>
              <span className="text-border">•</span>
              <span className="text-muted-foreground">{profile?.work_hours || "9:00 AM - 6:00 PM"}</span>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.section variants={itemVariants}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Contact Information
            </h3>
            <div className="bg-card rounded-2xl divide-y divide-border shadow-soft border border-border/50 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Work Email</p>
                  <p className="font-medium truncate">{profile?.email}</p>
                </div>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-4 p-4">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                </div>
              )}
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <LinkIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">LinkedIn Profile</p>
                    <p className="font-medium truncate">{profile.linkedin_url}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          </motion.section>

          {/* Team & Hierarchy */}
          <motion.section variants={itemVariants}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Team & Hierarchy
            </h3>
            <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
              {manager ? (
                <button className="flex items-center gap-4 p-4 w-full text-left hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-accent">
                    {manager.avatar_url ? (
                      <img
                        src={manager.avatar_url}
                        alt={manager.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-sm font-semibold text-primary">
                          {manager.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Reports to</p>
                    <p className="font-semibold">{manager.full_name}</p>
                    <p className="text-sm text-muted-foreground">{manager.job_title || "Manager"}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ) : (
                <div className="p-6 text-center">
                  <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No manager assigned</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Notification Settings */}
          <motion.section variants={itemVariants}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Notification Settings
            </h3>
            <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
              <PushNotificationToggle />
            </div>
          </motion.section>

          {/* Sign Out */}
          <motion.section variants={itemVariants}>
            <button
              onClick={handleSignOut}
              className="w-full py-4 text-destructive font-medium text-center bg-card hover:bg-destructive/10 rounded-2xl transition-colors border border-border/50"
            >
              Sign Out
            </button>
          </motion.section>
        </motion.div>

        <RoleBasedNav />
      </div>

      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
