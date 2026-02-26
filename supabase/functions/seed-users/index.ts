import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeedUser {
  email: string;
  password: string;
  full_name: string;
  role: string;
  manager_email?: string;
}

const seedUsers: SeedUser[] = [
  { email: "admin@company.com", password: "Admin@123", full_name: "System Admin", role: "admin" },
  { email: "manager1@company.com", password: "Manager@123", full_name: "Manager One", role: "manager" },
  { email: "manager2@company.com", password: "Manager@123", full_name: "Manager Two", role: "manager" },
  { email: "employee1@company.com", password: "Employee@123", full_name: "Employee One", role: "employee", manager_email: "manager1@company.com" },
  { email: "employee2@company.com", password: "Employee@123", full_name: "Employee Two", role: "employee", manager_email: "manager1@company.com" },
  { email: "employee3@company.com", password: "Employee@123", full_name: "Employee Three", role: "employee", manager_email: "manager1@company.com" },
  { email: "employee4@company.com", password: "Employee@123", full_name: "Employee Four", role: "employee", manager_email: "manager2@company.com" },
  { email: "employee5@company.com", password: "Employee@123", full_name: "Employee Five", role: "employee", manager_email: "manager2@company.com" },
  { email: "employee6@company.com", password: "Employee@123", full_name: "Employee Six", role: "employee", manager_email: "manager2@company.com" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; status: string; error?: string }[] = [];
    const profileMap: Record<string, string> = {}; // email -> profile.id

    // Phase 1: Create all users (admin, managers first, then employees)
    for (const user of seedUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u) => u.email === user.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: user.email, status: "already_exists" });
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (error) {
          results.push({ email: user.email, status: "error", error: error.message });
          continue;
        }
        userId = data.user.id;
        results.push({ email: user.email, status: "created" });
      }

      // Get profile id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        profileMap[user.email] = profile.id;
      }

      // Set role (upsert - avoid duplicates)
      if (user.role !== "employee") {
        // Employee role is auto-assigned by trigger, only add non-employee roles
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", user.role)
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({
            user_id: userId,
            role: user.role,
          });
        }
      }
    }

    // Phase 2: Assign manager relationships
    for (const user of seedUsers) {
      if (user.manager_email && profileMap[user.email] && profileMap[user.manager_email]) {
        await supabase
          .from("profiles")
          .update({ manager_id: profileMap[user.manager_email] })
          .eq("id", profileMap[user.email]);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        credentials: seedUsers.map((u) => ({
          email: u.email,
          password: u.password,
          role: u.role,
          manager: u.manager_email || null,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
