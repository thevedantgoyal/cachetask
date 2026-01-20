import { motion } from "framer-motion";
import { FileText, ChevronLeft, Loader2 } from "lucide-react";
import { HistoryItem } from "@/components/cards/HistoryItem";
import { BottomNav } from "@/components/layout/BottomNav";
import { useNavigate } from "react-router-dom";
import { useContributions, groupContributionsByDate } from "@/hooks/useContributions";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const { data: contributions, isLoading, error } = useContributions();

  const groupedContributions = contributions 
    ? groupContributionsByDate(contributions) 
    : [];

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
          <h1 className="page-header py-0">Contribution History</h1>
          <div className="w-10" />
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Failed to load contributions
          </div>
        ) : groupedContributions.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 mt-2"
          >
            {groupedContributions.map((group) => (
              <motion.section key={group.label} variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-2">{group.label}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <motion.div key={item.id} variants={itemVariants}>
                      <HistoryItem
                        icon={FileText}
                        title={item.title}
                        status={(item.status as "pending" | "approved" | "rejected") || "pending"}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No contributions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first work update to start tracking your progress
            </p>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
};

export default HistoryPage;
