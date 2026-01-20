import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Paperclip, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddWorkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockTasks = [
  { id: "1", title: "Complete Project Proposal" },
  { id: "2", title: "Team Meeting Prep" },
  { id: "3", title: "Client Feedback Review" },
  { id: "4", title: "Review Q3 Marketing Plan" },
];

export const AddWorkUpdateModal = ({ isOpen, onClose }: AddWorkUpdateModalProps) => {
  const [selectedTask, setSelectedTask] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    // In production, this would submit to the database
    console.log({ selectedTask, description });
    setSelectedTask("");
    setDescription("");
    onClose();
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
                {/* Task Select */}
                <div>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full p-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="">Select Task</option>
                    {mockTasks.map((task) => (
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
                  disabled={!selectedTask || !description}
                  className="w-full py-6 text-base font-semibold rounded-xl"
                >
                  Submit Update
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
