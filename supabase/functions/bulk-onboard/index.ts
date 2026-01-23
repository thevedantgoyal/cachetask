import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmployeeData {
  email: string;
  full_name: string;
  job_title?: string;
  department?: string;
  location?: string;
  manager_id?: string;
  password?: string;
  role?: string;
}

interface BulkOnboardRequest {
  employees: EmployeeData[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Bulk onboard request received");

    // Create Supabase client with service role for admin operations
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

    // Create client with user's token to verify permissions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
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

    // Get the calling user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.error("User is not admin:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin verified");

    // Parse request body
    const { employees }: BulkOnboardRequest = await req.json();

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return new Response(
        JSON.stringify({ error: "No employees provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${employees.length} employees`);

    const results = {
      success: [] as string[],
      failed: [] as { email: string; error: string }[],
    };

    for (const employee of employees) {
      try {
        // Generate a random password if not provided
        const password = employee.password || Math.random().toString(36).slice(-12) + "A1!";

        // Create user using admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: employee.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: employee.full_name,
          },
        });

        if (createError) {
          console.error(`Failed to create user ${employee.email}:`, createError);
          results.failed.push({ email: employee.email, error: createError.message });
          continue;
        }

        console.log(`User created: ${employee.email}`);

        // Update profile with additional info (profile is auto-created by trigger)
        if (newUser?.user) {
          // Wait a moment for trigger to complete
          await new Promise(resolve => setTimeout(resolve, 500));

          const updateData: Record<string, unknown> = {};
          if (employee.job_title) updateData.job_title = employee.job_title;
          if (employee.department) updateData.department = employee.department;
          if (employee.location) updateData.location = employee.location;
          if (employee.manager_id) updateData.manager_id = employee.manager_id;

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update(updateData)
              .eq("user_id", newUser.user.id);

            if (updateError) {
              console.error(`Failed to update profile for ${employee.email}:`, updateError);
            }
          }

          // Assign role if specified (and different from default 'employee')
          if (employee.role && employee.role !== "employee") {
            const validRoles = ["employee", "team_lead", "manager", "hr", "admin", "organization"];
            if (validRoles.includes(employee.role)) {
              // Update the existing role (created by trigger) to the specified role
              const { error: roleError } = await supabaseAdmin
                .from("user_roles")
                .update({ role: employee.role })
                .eq("user_id", newUser.user.id);

              if (roleError) {
                console.error(`Failed to assign role for ${employee.email}:`, roleError);
              } else {
                console.log(`Role '${employee.role}' assigned to ${employee.email}`);
              }
            } else {
              console.warn(`Invalid role '${employee.role}' for ${employee.email}, keeping default 'employee'`);
            }
          }
        }

        results.success.push(employee.email);
      } catch (err) {
        console.error(`Error processing ${employee.email}:`, err);
        results.failed.push({ email: employee.email, error: String(err) });
      }
    }

    console.log(`Bulk onboard complete: ${results.success.length} success, ${results.failed.length} failed`);

    return new Response(
      JSON.stringify({
        message: `Successfully onboarded ${results.success.length} employees`,
        success: results.success,
        failed: results.failed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bulk onboard error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
