import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Paperclip, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserTasks, useCreateContribution } from "@/hooks/useContributions";
import { useToast } from "@/hooks/use-toast";

interface AddWorkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWorkUpdateModal = ({ isOpen, onClose }: AddWorkUpdateModalProps) => {
  const [selectedTask, setSelectedTask] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const { data: tasks, isLoading: tasksLoading } = useUserTasks();
  const createContribution = useCreateContribution();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      await createContribution.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        taskId: selectedTask || undefined,
      });
      
      toast({
        title: "Work update submitted",
        description: "Your contribution has been submitted for review.",
      });
      
      setSelectedTask("");
      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      toast({
        title: "Failed to submit",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-elevated max-h-[85vh] overflow-auto"
          >
            <div className="p-6 max-w-lg mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-display font-semibold">Add Work Update</h2>
                <div className="w-9" />
              </div>

              <div className="space-y-6">
                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full p-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Task Select */}
                <div>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    disabled={tasksLoading}
                    className="w-full p-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="">Link to Task (Optional)</option>
                    {tasks?.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    rows={5}
                    className="w-full p-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Attachment buttons */}
                <div className="flex gap-4">
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-sm font-medium">Attach Evidence</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <Image className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-sm font-medium">Attach Image</span>
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !description.trim() || createContribution.isPending}
                  className="w-full py-6 text-base font-semibold rounded-xl"
                >
                  {createContribution.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Submit Update"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
