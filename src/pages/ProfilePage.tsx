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
import { BottomNav } from "@/components/layout/BottomNav";

const profileData = {
  name: "Ethan Carter",
  title: "Senior Product Designer",
  department: "Product & Design",
  location: "London Office",
  status: "Available",
  hours: "9:00 AM - 6:00 PM",
  lastOnline: "2m ago",
  email: "ethan.carter@enterprise.com",
  phone: "+44 7700 900 123",
  linkedin: "linkedin.com/in/ethancarter-ux",
  manager: {
    name: "Sarah Jenkins",
    title: "Director of Design",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  team: "Global Design Center",
};

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
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
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
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-2xl font-display font-bold mt-4">{profileData.name}</h2>
            <p className="text-primary font-medium uppercase tracking-wide text-sm">
              {profileData.title}
            </p>
            <p className="text-muted-foreground text-sm">
              {profileData.department} · {profileData.location}
            </p>

            {/* Status */}
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                {profileData.status}
              </span>
              <span className="text-border">|</span>
              <span>{profileData.hours}</span>
              <span className="text-border">|</span>
              <span className="italic">Last online: {profileData.lastOnline}</span>
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
                  <p className="font-medium">{profileData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Mobile</p>
                  <p className="font-medium">{profileData.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">LinkedIn Profile</p>
                  <p className="font-medium">{profileData.linkedin}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </motion.section>

          {/* Team & Hierarchy */}
          <motion.section variants={itemVariants}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Team & Hierarchy
            </h3>
            <div className="bg-card rounded-2xl divide-y divide-border shadow-soft border border-border/50">
              <button className="flex items-center gap-4 p-4 w-full text-left hover:bg-muted/50 transition-colors rounded-t-2xl">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-accent">
                  <img
                    src={profileData.manager.avatar}
                    alt={profileData.manager.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Reports to Manager</p>
                  <p className="font-semibold">{profileData.manager.name}</p>
                  <p className="text-sm text-muted-foreground">{profileData.manager.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="flex items-center gap-4 p-4 w-full text-left hover:bg-muted/50 transition-colors rounded-b-2xl">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-primary font-semibold">GD</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Works Under Team</p>
                  <p className="font-semibold">{profileData.team}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </motion.section>
        </motion.div>

        <BottomNav />
      </div>
    </div>
  );
};

export default ProfilePage;
