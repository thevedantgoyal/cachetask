import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PerformanceData {
  userId: string;
  fullName: string;
  overallScore: number;
  attendanceScore: number;
  taskCompletionScore: number;
  overduePenalty: number;
  collaborationScore: number;
  skillsScore: number;
  calculatedAt: string;
}

export const usePerformance = (mode: "me" | "team" = "me") => {
  const { user } = useAuth();

  return useQuery<PerformanceData | PerformanceData[]>({
    queryKey: ["performance", user?.id, mode],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/calculate-performance?mode=${mode}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to fetch performance");
      }

      return res.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
