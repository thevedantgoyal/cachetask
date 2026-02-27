import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateEmployeeRequest {
  action: "update-employee";
  employee_profile_id: string;
  updates: {
    job_title?: string;
    department?: string;
    location?: string;
    manager_id?: string | null;
    team_id?: string | null;
  };
}

interface AssignRoleRequest {
  action: "assign-role";
  user_id: string;
  role: "employee" | "team_lead" | "manager" | "hr" | "admin";
}

interface GetAllEmployeesRequest {
  action: "get-all-employees";
}

interface GetManagersRequest {
  action: "get-managers";
}

interface GetEmployeeRequest {
  action: "get-employee";
  employee_profile_id: string;
}

interface ResetPasswordRequest {
  action: "reset-password";
  user_id: string;
  new_password: string;
}

type AdminRequest =
  | UpdateEmployeeRequest
  | AssignRoleRequest
  | GetAllEmployeesRequest
  | GetManagersRequest
  | GetEmployeeRequest
  | ResetPasswordRequest;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Admin manage request received");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AdminRequest = await req.json();
    const action = body.action;

    console.log("Action:", action);

    if (action === "update-employee") {
      const { employee_profile_id, updates } = body as UpdateEmployeeRequest;

      console.log(`Updating employee ${employee_profile_id}:`, updates);

      // Hierarchy validation: prevent self-manager
      if (updates.manager_id && updates.manager_id === employee_profile_id) {
        return new Response(
          JSON.stringify({ error: "An employee cannot be their own manager" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Circular reference check
      if (updates.manager_id) {
        let currentManagerId: string | null = updates.manager_id;
        const visited = new Set<string>([employee_profile_id]);
        while (currentManagerId) {
          if (visited.has(currentManagerId)) {
            return new Response(
              JSON.stringify({ error: "Circular reporting structure detected" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          visited.add(currentManagerId);
          const { data: mgrProfile } = await supabaseAdmin
            .from("profiles")
            .select("manager_id")
            .eq("id", currentManagerId)
            .single();
          currentManagerId = mgrProfile?.manager_id ?? null;
        }
      }

      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", employee_profile_id);

      if (error) {
        console.error("Update error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Employee updated successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "assign-role") {
      const { user_id, role } = body as AssignRoleRequest;

      console.log(`Assigning role ${role} to user ${user_id}`);

      // Remove existing roles and add new one
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);

      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id, role });

      if (error) {
        console.error("Role assignment error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Role assigned successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-all-employees") {
      console.log("Fetching all employees");

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Fetch profiles error:", profilesError);
        return new Response(
          JSON.stringify({ error: profilesError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: roles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Fetch roles error:", rolesError);
        return new Response(
          JSON.stringify({ error: rolesError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rolesMap = new Map<string, { role: string }[]>();
      roles?.forEach((r) => {
        if (!rolesMap.has(r.user_id)) {
          rolesMap.set(r.user_id, []);
        }
        rolesMap.get(r.user_id)!.push({ role: r.role });
      });

      const employeesWithRoles = profiles?.map((p) => ({
        ...p,
        user_roles: rolesMap.get(p.user_id) || null,
      }));

      return new Response(
        JSON.stringify({ employees: employeesWithRoles }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-managers") {
      console.log("Fetching managers");

      const { data: managers, error } = await supabaseAdmin
        .from("profiles")
        .select(`id, full_name, job_title, user_id`)
        .order("full_name");

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ managers }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-employee") {
      const { employee_profile_id } = body as GetEmployeeRequest;
      console.log("Fetching employee:", employee_profile_id);

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", employee_profile_id)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "Employee not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get role
      const { data: userRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id);

      // Get manager name
      let managerName: string | null = null;
      if (profile.manager_id) {
        const { data: mgr } = await supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("id", profile.manager_id)
          .single();
        managerName = mgr?.full_name ?? null;
      }

      return new Response(
        JSON.stringify({
          employee: {
            ...profile,
            user_roles: userRoles || [],
            manager_name: managerName,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset-password") {
      const { user_id, new_password } = body as ResetPasswordRequest;
      console.log("Resetting password for user:", user_id);

      // Validate password strength
      if (!new_password || new_password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!/[A-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
        return new Response(
          JSON.stringify({ error: "Password must contain at least one uppercase letter and one number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use Supabase Auth admin API to update password (handles hashing securely)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: new_password,
      });

      if (error) {
        console.error("Password reset error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Password reset successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin manage error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
