import { motion } from "framer-motion";
import { FileText, Users, Flag, Code2, Megaphone, ChevronLeft } from "lucide-react";
import { HistoryItem } from "@/components/cards/HistoryItem";
import { BottomNav } from "@/components/layout/BottomNav";
import { useNavigate } from "react-router-dom";

interface HistoryGroup {
  label: string;
  items: {
    id: string;
    icon: typeof FileText;
    title: string;
    status: "pending" | "approved" | "rejected";
  }[];
}

const historyData: HistoryGroup[] = [
  {
    label: "Today",
    items: [
      { id: "1", icon: FileText, title: "Project Alpha Update", status: "pending" },
      { id: "2", icon: Megaphone, title: "Team Meeting Notes", status: "approved" },
      { id: "3", icon: Flag, title: "Client Feedback Summary", status: "approved" },
    ],
  },
  {
    label: "Yesterday",
    items: [
      { id: "4", icon: FileText, title: "Sprint Planning Notes", status: "approved" },
      { id: "5", icon: Code2, title: "Code Review", status: "approved" },
    ],
  },
  {
    label: "This Week",
    items: [
      { id: "6", icon: Users, title: "Onboarding Documentation", status: "approved" },
      { id: "7", icon: FileText, title: "Q4 OKRs Draft", status: "pending" },
    ],
  },
];

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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 mt-2"
        >
          {historyData.map((group) => (
            <motion.section key={group.label} variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-2">{group.label}</h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <HistoryItem
                      icon={item.icon}
                      title={item.title}
                      status={item.status}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </motion.div>

        <BottomNav />
      </div>
    </div>
  );
};

export default HistoryPage;
