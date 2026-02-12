import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarIcon, Paperclip, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { ProjectOption } from "@/hooks/useTimesheetManagement";

interface Props {
  projects: ProjectOption[];
  validate: (date: Date | undefined, projectId: string, taskId: string, hours: number, description: string) => string | null;
  onSubmit: (date: Date, projectId: string, taskId: string, hours: number, description: string, attachment: string | null) => void;
  onCancel: () => void;
}

export const LogTimeForm = ({ projects, validate, onSubmit, onCancel }: Props) => {
  const [date, setDate] = useState<Date>();
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === projectId);
  const tasks = selectedProject?.tasks || [];

  const handleProjectChange = (val: string) => {
    setProjectId(val);
    setTaskId("");
  };

  const handleSubmit = () => {
    const h = parseFloat(hours);
    const err = validate(date, projectId, taskId, isNaN(h) ? 0 : h, description);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSubmit(date!, projectId, taskId, h, description, attachment);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="text-lg font-semibold">Log Time Entry</h2>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd MMM yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={handleProjectChange}>
            <SelectTrigger><SelectValue placeholder="Select assigned project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Task</Label>
          <Select value={taskId} onValueChange={setTaskId} disabled={!projectId}>
            <SelectTrigger><SelectValue placeholder={projectId ? "Select task" : "Select a project first"} /></SelectTrigger>
            <SelectContent>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Hours Worked</Label>
          <Input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            placeholder="e.g. 4"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Description <span className="text-destructive">*</span></Label>
          <Textarea
            placeholder="Describe the work done..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Evidence (Optional)</Label>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setAttachment("evidence_screenshot.png")}>
            <Paperclip className="w-4 h-4" />
            {attachment || "Attach Evidence"}
          </Button>
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg">
          Save Entry
        </Button>
      </div>
    </motion.div>
  );
};
