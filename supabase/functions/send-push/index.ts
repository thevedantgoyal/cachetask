import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

// Simple JWT encoding for VAPID
function base64UrlEncode(data: string): string {
  return btoa(data).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };
  
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import the private key
  const privateKeyBuffer = base64UrlToArrayBuffer(privateKeyBase64);
  
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
    
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      encoder.encode(unsignedToken)
    );
    
    const signatureB64 = arrayBufferToBase64Url(signature);
    return `${unsignedToken}.${signatureB64}`;
  } catch (error) {
    console.error("Error creating VAPID JWT:", error);
    throw error;
  }
}

async function sendWebPushNotification(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  payload: string
): Promise<Response> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  let authHeader: string;
  try {
    const jwt = await createVapidJwt(audience, "mailto:admin@cachetask.app", vapidPrivateKey);
    authHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;
  } catch {
    // Fallback: simple authorization without full JWT signing
    authHeader = `WebPush ${vapidPublicKey}`;
  }
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
      "TTL": "86400",
      "Urgency": "high",
    },
    body: payload,
  });
  
  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Push notification request received");

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.log("VAPID keys not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Push notifications not configured. Please add VAPID keys." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, icon, url, tag }: PushNotificationRequest = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending push notification to user ${user_id}: ${title}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user");
      return new Response(
        JSON.stringify({ success: false, message: "No push subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushPayload = JSON.stringify({
            title,
            body,
            icon: icon || "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            url: url || "/",
            tag: tag || "default",
            timestamp: Date.now(),
          });

          const response = await sendWebPushNotification(
            sub.endpoint,
            vapidPublicKey,
            vapidPrivateKey,
            pushPayload
          );

          if (response.ok || response.status === 201) {
            console.log(`Push sent to endpoint: ${sub.endpoint.slice(0, 50)}...`);
            return { success: true, endpoint: sub.endpoint };
          } else {
            const status = response.status;
            const text = await response.text();
            console.error(`Push failed with status ${status}: ${text}`);
            
            // Remove invalid subscriptions (410 Gone or 404 Not Found)
            if (status === 410 || status === 404) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
              console.log(`Removed invalid subscription: ${sub.id}`);
            }
            
            return { success: false, endpoint: sub.endpoint, status };
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to send to endpoint: ${errorMessage}`);
          return { success: false, endpoint: sub.endpoint, error: errorMessage };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && (r.value as { success: boolean }).success
    ).length;

    console.log(`Push notifications sent: ${successful}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        total: subscriptions.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
