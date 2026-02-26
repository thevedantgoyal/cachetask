import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mail, Phone, Link as LinkIcon, ExternalLink, ChevronRight,
  MapPin, Building2, Briefcase, Edit2, Save, X, Camera, FileText,
  Calendar, AlignLeft, Loader2, Circle, Coffee, EyeOff,
} from "lucide-react";
import { ConnectPlusLoader } from "@/components/ui/ConnectPlusLoader";
import { useAuth } from "@/contexts/AuthContext";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { WorkingStatusSelector } from "@/components/profile/WorkingStatusSelector";
import {
  useExtendedProfile,
  useUpdateProfile,
  useProfileFileUpload,
} from "@/hooks/useProfileManagement";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const STATUS_INDICATORS: Record<string, { color: string; label: string }> = {
  available: { color: "bg-emerald-500", label: "Available" },
  busy: { color: "bg-red-500", label: "Busy" },
  brb: { color: "bg-amber-500", label: "Be Right Back" },
  offline: { color: "bg-muted-foreground", label: "Appear Offline" },
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useExtendedProfile();
  const updateProfile = useUpdateProfile();
  const { uploadAvatar, uploadResume, uploading } = useProfileFileUpload();

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Manager state
  const [manager, setManager] = useState<{ full_name: string; job_title: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!profile?.manager_id) return;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("profiles")
        .select("full_name, job_title, avatar_url")
        .eq("id", profile.manager_id!)
        .single()
        .then(({ data }) => { if (data) setManager(data); });
    });
  }, [profile?.manager_id]);

  const startEditing = () => {
    if (!profile) return;
    setEditData({
      phone: profile.phone || "",
      bio: profile.bio || "",
      linkedin_url: profile.linkedin_url || "",
      joining_date: profile.joining_date || "",
      job_title: profile.job_title || "",
      location: profile.location || "",
      department: profile.department || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editData as any);
      setEditing(false);
    } catch {
      // handled by mutation
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAvatar(file);
      if (url) {
        await updateProfile.mutateAsync({ avatar_url: url } as any);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadResume(file);
      if (url) {
        await updateProfile.mutateAsync({ resume_url: url } as any);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <ConnectPlusLoader variant="inline" message="Loading profile..." />;
  }

  const statusInfo = STATUS_INDICATORS[profile?.working_status || "available"] || STATUS_INDICATORS.available;
  const skills = profile?.other_social_links && typeof profile.other_social_links === "object"
    ? (profile.other_social_links as Record<string, string>).skills?.split(",").filter(Boolean) || []
    : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Profile Header */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <span />
          {editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
              <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={startEditing}><Edit2 className="w-4 h-4" /></Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-accent ring-4 ring-background shadow-elevated cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-2xl font-display font-bold text-primary">
                    {profile?.full_name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-full">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${statusInfo.color} border-2 border-card`} />
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold">{profile?.full_name || "User"}</h2>
            {editing ? (
              <Input value={editData.job_title} onChange={(e) => setEditData({ ...editData, job_title: e.target.value })}
                placeholder="Job Title" className="mt-1 h-8 text-sm" />
            ) : (
              <p className="text-primary font-medium text-sm">{profile?.job_title || "Employee"}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {editing ? (
                <>
                  <Input value={editData.department} onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                    placeholder="Department" className="h-7 text-xs w-28" />
                  <Input value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    placeholder="Location" className="h-7 text-xs w-28" />
                </>
              ) : (
                <>
                  {profile?.department && (
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{profile.department}</span>
                  )}
                  {profile?.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Working Status */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Working Status</p>
          <WorkingStatusSelector currentStatus={profile?.working_status || "available"} />
        </div>
      </motion.div>

      {/* Bio */}
      {(profile?.bio || editing) && (
        <motion.section variants={itemVariants}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">About</h3>
          <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
            {editing ? (
              <Textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell your team about yourself..." maxLength={500} rows={3} />
            ) : (
              <p className="text-sm text-foreground/80">{profile?.bio}</p>
            )}
          </div>
        </motion.section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <motion.section variants={itemVariants}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Skills</h3>
          <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Contact Information */}
      <motion.section variants={itemVariants}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Contact Information</h3>
        <div className="bg-card rounded-2xl divide-y divide-border shadow-soft border border-border/50 overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="p-2 bg-primary/10 rounded-xl"><Mail className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Work Email</p>
              <p className="font-medium truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="p-2 bg-primary/10 rounded-xl"><Phone className="w-5 h-5 text-primary" /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Mobile</p>
              {editing ? (
                <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Phone number" className="h-8 text-sm mt-0.5" />
              ) : (
                <p className="font-medium">{profile?.phone || "Not set"}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="p-2 bg-primary/10 rounded-xl"><LinkIcon className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">LinkedIn</p>
              {editing ? (
                <Input value={editData.linkedin_url} onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                  placeholder="LinkedIn URL" className="h-8 text-sm mt-0.5" />
              ) : profile?.linkedin_url ? (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="font-medium truncate block text-primary hover:underline">{profile.linkedin_url}</a>
              ) : (
                <p className="font-medium text-muted-foreground">Not set</p>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Joining Date & Resume */}
      <motion.section variants={itemVariants}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Work Details</h3>
        <div className="bg-card rounded-2xl divide-y divide-border shadow-soft border border-border/50 overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="p-2 bg-primary/10 rounded-xl"><Calendar className="w-5 h-5 text-primary" /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Joining Date</p>
              {editing ? (
                <Input type="date" value={editData.joining_date}
                  onChange={(e) => setEditData({ ...editData, joining_date: e.target.value })}
                  className="h-8 text-sm mt-0.5" />
              ) : (
                <p className="font-medium">
                  {profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString() : "Not set"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => resumeInputRef.current?.click()}>
            <div className="p-2 bg-primary/10 rounded-xl"><FileText className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Resume</p>
              {profile?.resume_url ? (
                <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline text-sm" onClick={(e) => e.stopPropagation()}>
                  View Resume
                </a>
              ) : (
                <p className="font-medium text-muted-foreground text-sm">Tap to upload</p>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
          </div>
        </div>
      </motion.section>

      {/* Team & Hierarchy */}
      <motion.section variants={itemVariants}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Team & Hierarchy</h3>
        <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
          {manager ? (
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-accent">
                {manager.avatar_url ? (
                  <img src={manager.avatar_url} alt={manager.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-sm font-semibold text-primary">{manager.full_name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Reports to</p>
                <p className="font-semibold">{manager.full_name}</p>
                <p className="text-sm text-muted-foreground">{manager.job_title || "Manager"}</p>
              </div>
            </div>
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
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Notification Settings</h3>
        <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
          <PushNotificationToggle />
        </div>
      </motion.section>
    </motion.div>
  );
};

export default ProfilePage;
