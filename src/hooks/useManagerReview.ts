import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";

export interface PendingContribution {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: string | null;
  evidence_url: string | null;
  evidence_type: string | null;
  user_id: string;
  employee_name: string;
  employee_email: string;
  task_title: string | null;
}

export const usePendingContributions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-contributions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get manager's profile
      const { data: managerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!managerProfile) return [];

      // Check roles - manager, hr, or admin can review
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = roles?.map((r) => r.role) || [];
      const canReviewAll = userRoles.includes("hr") || userRoles.includes("admin");
      const isManager = userRoles.includes("manager") || userRoles.includes("team_lead");

      if (!canReviewAll && !isManager) return [];

      // Fetch contributions based on role
      let query = supabase
        .from("contributions")
        .select(`
          id,
          title,
          description,
          created_at,
          status,
          evidence_url,
          evidence_type,
          user_id,
          tasks (title)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const { data: contributions, error } = await query;

      if (error) throw error;

      // Get employee info for each contribution
      const userIds = [...new Set(contributions?.map((c) => c.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, manager_id")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      // Filter based on role
      const filteredContributions = contributions?.filter((c) => {
        if (canReviewAll) return true;
        
        const employee = profileMap.get(c.user_id);
        return employee?.manager_id === managerProfile.id;
      });

      return (filteredContributions || []).map((c) => {
        const employee = profileMap.get(c.user_id);
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          created_at: c.created_at,
          status: c.status,
          evidence_url: c.evidence_url,
          evidence_type: c.evidence_type,
          user_id: c.user_id,
          employee_name: employee?.full_name || "Unknown",
          employee_email: employee?.email || "",
          task_title: c.tasks?.title || null,
        };
      });
    },
    enabled: !!user,
  });
};

export const useReviewContribution = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contributionId,
      status,
      notes,
    }: {
      contributionId: string;
      status: "approved" | "rejected";
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get reviewer's profile id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // Get the contribution details first
      const { data: contribution } = await supabase
        .from("contributions")
        .select("title, user_id")
        .eq("id", contributionId)
        .single();

      const { data, error } = await supabase
        .from("contributions")
        .update({
          status,
          review_notes: notes || null,
          reviewed_by: profile?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", contributionId)
        .select()
        .single();

      if (error) throw error;

      // Send notification to the contributor
      if (contribution?.user_id) {
        try {
          await createNotification(
            contribution.user_id,
            status === "approved" ? "contribution_approved" : "contribution_rejected",
            status === "approved" ? "Contribution Approved! 🎉" : "Contribution Needs Revision",
            status === "approved"
              ? `Your contribution "${contribution.title}" has been approved by ${profile?.full_name || "a manager"}.${notes ? ` Notes: ${notes}` : ""}`
              : `Your contribution "${contribution.title}" was not approved.${notes ? ` Feedback: ${notes}` : " Please check with your manager for details."}`,
            { contributionId, reviewerName: profile?.full_name }
          );
        } catch (notifError) {
          console.error("Failed to send notification:", notifError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
  });
};
