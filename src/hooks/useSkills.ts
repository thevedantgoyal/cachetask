import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Skill {
  id: string;
  name: string;
  proficiency_level: number | null;
  goal_level: number | null;
  last_updated: string | null;
}

export const useSkills = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["skills", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      // If no skills in table, try to hydrate from profile other_social_links
      if (!data || data.length === 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("other_social_links")
          .eq("user_id", user.id)
          .single();

        const skillsStr =
          profile?.other_social_links &&
          typeof profile.other_social_links === "object"
            ? (profile.other_social_links as Record<string, string>).skills
            : null;

        if (skillsStr) {
          const skillNames = skillsStr.split(",").map((s: string) => s.trim()).filter(Boolean);
          if (skillNames.length > 0) {
            const rows = skillNames.map((name: string) => ({
              user_id: user.id,
              name,
              proficiency_level: 1,
              goal_level: 5,
            }));
            const { data: inserted, error: insertErr } = await supabase
              .from("skills")
              .insert(rows)
              .select();
            if (!insertErr && inserted) return inserted;
          }
        }
      }

      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateSkill = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      name,
      proficiency_level,
      goal_level,
    }: {
      name: string;
      proficiency_level: number;
      goal_level: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          name,
          proficiency_level,
          goal_level,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
};

export const useUpdateSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      proficiency_level,
      goal_level,
    }: {
      id: string;
      proficiency_level?: number;
      goal_level?: number;
    }) => {
      const { data, error } = await supabase
        .from("skills")
        .update({
          proficiency_level,
          goal_level,
          last_updated: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
};

export const useDeleteSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
};
