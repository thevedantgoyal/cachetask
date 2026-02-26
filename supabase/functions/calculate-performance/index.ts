import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get calling user from JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "me"; // "me" or "team"
    const targetUserId = url.searchParams.get("user_id"); // for managers viewing a specific report

    // Determine which user(s) to calculate for
    let targetUserIds: string[] = [];

    if (mode === "me") {
      targetUserIds = [user.id];
    } else if (mode === "team") {
      // Verify caller is manager/admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasManagerRole = roles?.some((r: any) =>
        ["manager", "team_lead", "admin", "hr", "organization"].includes(r.role)
      );

      if (!hasManagerRole) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get caller's profile id
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!callerProfile) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (targetUserId) {
        // Verify manager-of relationship or admin
        const isAdmin = roles?.some((r: any) => ["admin", "hr", "organization"].includes(r.role));
        if (!isAdmin) {
          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("manager_id")
            .eq("user_id", targetUserId)
            .single();
          if (!targetProfile || targetProfile.manager_id !== callerProfile.id) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        targetUserIds = [targetUserId];
      } else {
        // Get all direct reports
        const { data: reports } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("manager_id", callerProfile.id);
        targetUserIds = (reports || []).map((r: any) => r.user_id);
      }
    }

    const results = [];

    for (const uid of targetUserIds) {
      const score = await calculatePerformance(supabase, uid);
      results.push(score);
    }

    const response = mode === "me" && results.length === 1 ? results[0] : results;

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Performance calculation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function calculatePerformance(supabase: any, userId: string) {
  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return { userId, fullName: "Unknown", overallScore: 0, attendanceScore: 0, taskCompletionScore: 0, overduePenalty: 0, collaborationScore: 0, skillsScore: 0 };
  }

  const profileId = profile.id;

  // --- 1. ATTENDANCE SCORE (25%) ---
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: attendance } = await supabase
    .from("attendance")
    .select("status")
    .eq("user_id", userId)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

  const totalAttDays = attendance?.length || 0;
  const workingDays = 22; // approx working days in a month
  let attendanceRaw = 0;
  if (totalAttDays > 0) {
    const presentDays = attendance.filter((a: any) => a.status === "present").length;
    const lateDays = attendance.filter((a: any) => a.status === "late").length;
    const halfDays = attendance.filter((a: any) => a.status === "half_day").length;
    const effectiveDays = presentDays + lateDays * 0.8 + halfDays * 0.5;
    attendanceRaw = Math.min((effectiveDays / workingDays) * 100, 100);
  }
  const attendanceScore = Math.round(attendanceRaw);

  // --- 2. TASK COMPLETION SCORE (30%) ---
  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", profileId)
    .eq("is_deleted", false);

  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", profileId)
    .eq("is_deleted", false)
    .in("status", ["completed", "approved"]);

  let taskCompletionScore = 0;
  if ((totalTasks || 0) > 0) {
    taskCompletionScore = Math.round(((completedTasks || 0) / (totalTasks || 1)) * 100);
  }

  // --- 3. OVERDUE PENALTY (-20%) ---
  const now = new Date().toISOString();
  const { count: overdueTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", profileId)
    .eq("is_deleted", false)
    .not("status", "in", '("completed","approved")')
    .lt("due_date", now)
    .not("due_date", "is", null);

  let overduePenalty = 0;
  if ((totalTasks || 0) > 0) {
    const overdueRatio = (overdueTasks || 0) / (totalTasks || 1);
    overduePenalty = Math.round(overdueRatio * 100);
  }

  // --- 4. COLLABORATION SCORE (15%) ---
  const { count: projectMemberships } = await supabase
    .from("project_members")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", profileId);

  const { count: contributionsCount } = await supabase
    .from("contributions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { count: commentsCount } = await supabase
    .from("task_comments")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profileId);

  // Normalize: projects (max 5 = 100%), contributions (max 20 = 100%), comments (max 30 = 100%)
  const projectScore = Math.min(((projectMemberships || 0) / 5) * 100, 100);
  const contribScore = Math.min(((contributionsCount || 0) / 20) * 100, 100);
  const commentScore = Math.min(((commentsCount || 0) / 30) * 100, 100);
  const collaborationScore = Math.round((projectScore * 0.4 + contribScore * 0.4 + commentScore * 0.2));

  // --- 5. SKILLS SCORE (10%) ---
  const { data: skills } = await supabase
    .from("skills")
    .select("proficiency_level, goal_level")
    .eq("user_id", userId);

  let skillsScore = 0;
  if (skills && skills.length > 0) {
    const countBonus = Math.min((skills.length / 5) * 50, 50); // up to 50 for having 5+ skills
    const avgProficiency = skills.reduce((sum: number, s: any) => sum + (s.proficiency_level || 0), 0) / skills.length;
    const proficiencyBonus = Math.min((avgProficiency / 100) * 50, 50); // up to 50 for proficiency
    skillsScore = Math.round(countBonus + proficiencyBonus);
  }

  // --- WEIGHTED OVERALL SCORE ---
  const overall = Math.round(
    attendanceScore * 0.25 +
    taskCompletionScore * 0.30 +
    Math.max(-20, -(overduePenalty * 0.20)) + // penalty capped at -20
    collaborationScore * 0.15 +
    skillsScore * 0.10
  );

  const overallScore = Math.max(0, Math.min(100, overall));

  return {
    userId,
    fullName: profile.full_name,
    overallScore,
    attendanceScore,
    taskCompletionScore,
    overduePenalty: -Math.min(overduePenalty, 100),
    collaborationScore,
    skillsScore,
    calculatedAt: new Date().toISOString(),
  };
}
