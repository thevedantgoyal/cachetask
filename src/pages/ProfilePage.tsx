import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Settings, 
  LogOut, 
  Mail, 
  Phone, 
  Link as LinkIcon,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/layout/BottomNav";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto page-container">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="page-header py-0">Enterprise Profile</h1>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Profile Header */}
          <motion.div variants={itemVariants} className="flex flex-col items-center pt-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-accent ring-4 ring-background shadow-elevated">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-3xl font-display font-bold text-primary">
                      {profile?.full_name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-2xl font-display font-bold mt-4">{profile?.full_name || "User"}</h2>
            <p className="text-primary font-medium uppercase tracking-wide text-sm">
              {profile?.job_title || "Employee"}
            </p>
            <p className="text-muted-foreground text-sm">
              {[profile?.department, profile?.location].filter(Boolean).join(" · ") || "Not set"}
            </p>

            {/* Status */}
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground flex-wrap justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                {profile?.status || "Available"}
              </span>
              <span className="text-border">|</span>
              <span>{profile?.work_hours || "9:00 AM - 6:00 PM"}</span>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.section variants={itemVariants}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Contact Information
            </h3>
            <div className="bg-card rounded-2xl divide-y divide-border shadow-soft border border-border/50">
              <div className="flex items-center gap-4 p-4">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Work Email</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-4 p-4">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Mobile</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                </div>
              )}
              {profile?.linkedin_url && (
                <div className="flex items-center gap-4 p-4">
                  <LinkIcon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">LinkedIn Profile</p>
                    <p className="font-medium truncate">{profile.linkedin_url}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </motion.section>

          {/* Team & Hierarchy */}
          <motion.section variants={itemVariants}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Team & Hierarchy
            </h3>
            <div className="bg-card rounded-2xl divide-y divide-border shadow-soft border border-border/50">
              {manager ? (
                <button className="flex items-center gap-4 p-4 w-full text-left hover:bg-muted/50 transition-colors rounded-t-2xl">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-accent">
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Reports to Manager</p>
                    <p className="font-semibold">{manager.full_name}</p>
                    <p className="text-sm text-muted-foreground">{manager.job_title || "Manager"}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No manager assigned
                </div>
              )}
            </div>
          </motion.section>

          {/* Account Actions */}
          <motion.section variants={itemVariants}>
            <button
              onClick={handleSignOut}
              className="w-full py-4 text-destructive font-medium text-center hover:bg-destructive/10 rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </motion.section>
        </motion.div>

        <BottomNav />
      </div>
    </div>
  );
};

export default ProfilePage;
