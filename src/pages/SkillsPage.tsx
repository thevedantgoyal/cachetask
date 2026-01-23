import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  Target, 
  TrendingUp,
  Trash2,
  Edit,
  Loader2,
  X,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { SkillCard } from "@/components/cards/SkillCard";
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill } from "@/hooks/useSkills";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const SkillsPage = () => {
  const navigate = useNavigate();
  const { data: skills, isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState({
    name: "",
    proficiency_level: 1,
    goal_level: 5,
  });
  const [editValues, setEditValues] = useState({
    proficiency_level: 1,
    goal_level: 5,
  });

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) {
      toast.error("Please enter a skill name");
      return;
    }

    try {
      await createSkill.mutateAsync({
        name: newSkill.name.trim(),
        proficiency_level: newSkill.proficiency_level,
        goal_level: newSkill.goal_level,
      });
      toast.success("Skill added!");
      setNewSkill({ name: "", proficiency_level: 1, goal_level: 5 });
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to add skill");
    }
  };

  const handleUpdateSkill = async (id: string) => {
    try {
      await updateSkill.mutateAsync({
        id,
        proficiency_level: editValues.proficiency_level,
        goal_level: editValues.goal_level,
      });
      toast.success("Skill updated!");
      setEditingSkill(null);
    } catch (error) {
      toast.error("Failed to update skill");
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await deleteSkill.mutateAsync(id);
      toast.success("Skill removed");
    } catch (error) {
      toast.error("Failed to remove skill");
    }
  };

  const startEditing = (skill: { id: string; proficiency_level: number | null; goal_level: number | null }) => {
    setEditingSkill(skill.id);
    setEditValues({
      proficiency_level: skill.proficiency_level || 1,
      goal_level: skill.goal_level || 5,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4 mb-6">
          <button 
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Skills & Growth</h1>
          <button 
            onClick={() => setShowAddForm(true)}
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {/* Add Skill Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add New Skill</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="Skill name (e.g., React, Leadership)"
                className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Current Level</label>
                  <select
                    value={newSkill.proficiency_level}
                    onChange={(e) => setNewSkill({ ...newSkill, proficiency_level: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>{level} - {getLevelLabel(level)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Goal Level</label>
                  <select
                    value={newSkill.goal_level}
                    onChange={(e) => setNewSkill({ ...newSkill, goal_level: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>{level} - {getLevelLabel(level)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                onClick={handleAddSkill}
                disabled={createSkill.isPending}
                className="w-full"
              >
                {createSkill.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Skill"
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Skills Tracked</span>
            </div>
            <p className="text-2xl font-bold">{skills?.length || 0}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
            <div className="flex items-center gap-2 text-success mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">At Goal</span>
            </div>
            <p className="text-2xl font-bold">
              {skills?.filter((s) => (s.proficiency_level || 0) >= (s.goal_level || 5)).length || 0}
            </p>
          </div>
        </div>

        {/* Skills List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : skills && skills.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {skills.map((skill) => (
              <motion.div
                key={skill.id}
                variants={itemVariants}
                className="bg-card rounded-2xl p-4 shadow-soft border border-border/50"
              >
                {editingSkill === skill.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{skill.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateSkill(skill.id)}
                          className="p-2 hover:bg-success/10 rounded-lg text-success"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingSkill(null)}
                          className="p-2 hover:bg-muted rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Current</label>
                        <select
                          value={editValues.proficiency_level}
                          onChange={(e) => setEditValues({ ...editValues, proficiency_level: Number(e.target.value) })}
                          className="w-full p-2 rounded-lg border border-border bg-background text-sm"
                        >
                          {[1, 2, 3, 4, 5].map((level) => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Goal</label>
                        <select
                          value={editValues.goal_level}
                          onChange={(e) => setEditValues({ ...editValues, goal_level: Number(e.target.value) })}
                          className="w-full p-2 rounded-lg border border-border bg-background text-sm"
                        >
                          {[1, 2, 3, 4, 5].map((level) => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{skill.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Level {skill.proficiency_level || 1} → Goal: {skill.goal_level || 5}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditing(skill)} className="p-2 hover:bg-muted rounded-lg">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDeleteSkill(skill.id)} className="p-2 hover:bg-destructive/10 rounded-lg">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No skills tracked yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Add skills to track your professional growth
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Skill
            </Button>
          </div>
        )}

        <RoleBasedNav />
      </div>
    </div>
  );
};

function getLevelLabel(level: number): string {
  switch (level) {
    case 1: return "Beginner";
    case 2: return "Elementary";
    case 3: return "Intermediate";
    case 4: return "Advanced";
    case 5: return "Expert";
    default: return "";
  }
}

export default SkillsPage;
