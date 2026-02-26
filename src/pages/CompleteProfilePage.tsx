import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera, Phone, FileText, LinkIcon, Calendar, AlignLeft,
  Upload, Loader2, CheckCircle2, Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCompleteProfile, useProfileFileUpload } from "@/hooks/useProfileManagement";
import { useExtendedProfile } from "@/hooks/useProfileManagement";
import { toast } from "sonner";

const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL",
  "Project Management", "Data Analysis", "UI/UX Design", "DevOps",
  "Communication", "Leadership", "Problem Solving", "Agile",
];

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile } = useExtendedProfile();
  const completeProfile = useCompleteProfile();
  const { uploadAvatar, uploadResume, uploading } = useProfileFileUpload();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAvatar(file);
      if (url) setAvatarUrl(url);
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
        setResumeUrl(url);
        setResumeName(file.name);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!phone.trim()) { toast.error("Phone number is required"); return; }
    if (!bio.trim()) { toast.error("Short bio is required"); return; }
    if (skills.length === 0) { toast.error("Please add at least one skill"); return; }
    if (!joiningDate) { toast.error("Joining date is required"); return; }
    if (!avatarUrl) { toast.error("Profile picture is required"); return; }

    setSubmitting(true);
    try {
      await completeProfile.mutateAsync({
        phone,
        bio,
        linkedin_url: linkedinUrl || undefined,
        joining_date: joiningDate,
        avatar_url: avatarUrl,
        resume_url: resumeUrl || undefined,
        other_social_links: { ...socialLinks, skills: skills.join(",") },
      });
      navigate("/", { replace: true });
    } catch {
      // Error handled by mutation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-center px-4 h-14">
          <h1 className="text-base font-display font-semibold">Complete Your Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Complete all required fields (<span className="text-destructive">*</span>) to get started with CacheTask.
          </p>
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex flex-col items-center gap-3">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-accent ring-4 ring-background shadow-elevated cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10">
                <Camera className="w-6 h-6 text-primary" />
                <span className="text-[10px] text-primary mt-0.5">Upload</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <p className="text-xs text-muted-foreground">Tap to upload profile picture <span className="text-destructive">*</span></p>
        </motion.div>

        {/* Email (read-only) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-2">
          <Label className="text-sm font-medium">Email</Label>
          <Input value={profile?.email || ""} disabled className="bg-muted" />
        </motion.div>

        {/* Phone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input placeholder="+1 234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </motion.div>

        {/* Bio */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5" /> Short Bio <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Tell your team a bit about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
        </motion.div>

        {/* Skills */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="space-y-2">
          <Label className="text-sm font-medium">Skills <span className="text-destructive">*</span></Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
            />
            <Button type="button" size="icon" variant="outline" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
              <button key={s} onClick={() => addSkill(s)}
                className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-accent transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Joining Date */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Joining Date <span className="text-destructive">*</span>
          </Label>
          <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
        </motion.div>

        {/* LinkedIn */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5" /> LinkedIn URL
          </Label>
          <Input placeholder="https://linkedin.com/in/yourprofile" value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)} />
        </motion.div>

        {/* Resume */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Resume
          </Label>
          <div
            onClick={() => resumeInputRef.current?.click()}
            className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {resumeName ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm truncate flex-1">{resumeName}</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">Upload PDF or DOC (max 10MB)</span>
              </>
            )}
          </div>
          <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="pt-4 pb-8">
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || uploading}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Complete Profile
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default CompleteProfilePage;
