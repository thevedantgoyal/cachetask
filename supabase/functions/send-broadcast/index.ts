import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BroadcastRequest {
  title: string;
  message: string;
  target_type: "all" | "role" | "user";
  target_value: string | null;
  scheduled_at: string;
  send_push: boolean;
  send_email: boolean;
  send_now: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Broadcast notification request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: BroadcastRequest = await req.json();
    const { title, message, target_type, target_value, scheduled_at, send_push, send_email, send_now } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Broadcast: ${title} to ${target_type}${target_value ? `: ${target_value}` : ""}`);

    // Get target users
    let targetUsers: { user_id: string; email: string }[] = [];

    if (target_type === "all") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email");
      targetUsers = profiles || [];
    } else if (target_type === "role") {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", target_value);
      
      const userIds = userRoles?.map((ur) => ur.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);
        targetUsers = profiles || [];
      }
    } else if (target_type === "user" && target_value) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, email")
        .eq("user_id", target_value)
        .single();
      
      if (profile) {
        targetUsers = [profile];
      }
    }

    console.log(`Found ${targetUsers.length} target users`);

    // Save to scheduled_notifications table
    const { data: savedNotification, error: saveError } = await supabase
      .from("scheduled_notifications")
      .insert({
        created_by: user.id,
        title,
        message,
        target_type,
        target_value,
        scheduled_at,
        send_push,
        send_email,
        status: send_now ? "sent" : "pending",
        sent_at: send_now ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving notification:", saveError);
      throw saveError;
    }

    // If sending now, send to all target users
    if (send_now && targetUsers.length > 0) {
      let successCount = 0;
      let failedCount = 0;

      for (const targetUser of targetUsers) {
        try {
          // Create in-app notification
          await supabase.from("notifications").insert({
            user_id: targetUser.user_id,
            type: "general",
            title,
            message,
            metadata: { broadcast_id: savedNotification.id },
          });

          // Send push notification if enabled
          if (send_push) {
            await supabase.functions.invoke("send-push", {
              body: {
                user_id: targetUser.user_id,
                title,
                body: message,
                tag: "admin-broadcast",
              },
            });
          }

          // Send email if enabled
          if (send_email && targetUser.email) {
            await supabase.functions.invoke("send-email", {
              body: {
                to: targetUser.email,
                subject: title,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">${title}</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #374151;">${message}</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #9ca3af;">This is an automated notification from CacheTask.</p>
                  </div>
                `,
                type: "broadcast",
              },
            });
          }

          successCount++;
        } catch (err) {
          console.error(`Failed to notify user ${targetUser.user_id}:`, err);
          failedCount++;
        }
      }

      console.log(`Broadcast complete: ${successCount} success, ${failedCount} failed`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: successCount, 
          failed: failedCount,
          total: targetUsers.length,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If scheduled for later, just return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled: true,
        scheduled_at,
        target_count: targetUsers.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
