import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // --- Parse body ---
    const body = await req.json();
    const { capturedImage, timestamp } = body as {
      capturedImage: string; // base64 data URL
      timestamp: number;
    };

    if (!capturedImage || !timestamp) {
      return json({ error: "Missing capturedImage or timestamp" }, 400);
    }

    // Anti-replay: reject if timestamp is older than 30 seconds
    const now = Date.now();
    if (Math.abs(now - timestamp) > 30_000) {
      return json(
        { faceVerified: false, message: "Request expired. Please try again." },
        400
      );
    }

    // --- Fetch user's profile avatar ---
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return json(
        { faceVerified: false, message: "Profile not found." },
        404
      );
    }

    if (!profile.avatar_url) {
      return json(
        {
          faceVerified: false,
          message:
            "No profile photo found. Please upload a profile photo first.",
        },
        400
      );
    }

    // Build full avatar URL if relative
    let avatarUrl = profile.avatar_url;
    if (!avatarUrl.startsWith("http")) {
      avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${avatarUrl}`;
    }

    // --- Use Lovable AI (Gemini vision) to compare faces ---
    console.log("Calling AI vision model for face comparison...");

    const aiResponse = await fetch(
      "https://api.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a strict face verification system. You will be given two images:
1. A stored profile photo of an employee
2. A live camera capture

Your task:
- Determine if the SAME person appears in both images.
- Focus on facial features: face shape, eyes, nose, mouth, skin tone, hair.
- Ignore differences in lighting, angle, background, clothing, and accessories.
- If either image has NO face visible, respond with match=false.
- If MULTIPLE faces appear in the captured image, respond with match=false and note "multiple_faces".

You MUST respond with ONLY a valid JSON object (no markdown, no explanation):
{"match": true/false, "confidence": 0-100, "reason": "brief reason", "flags": []}

Possible flags: "no_face_profile", "no_face_capture", "multiple_faces", "low_quality", "possible_spoof"

Threshold: confidence >= 75 means match=true. Below 75 means match=false.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Compare these two images. Image 1 is the stored profile photo. Image 2 is the live camera capture. Are they the same person?",
                },
                {
                  type: "image_url",
                  image_url: { url: avatarUrl },
                },
                {
                  type: "image_url",
                  image_url: { url: capturedImage },
                },
              ],
            },
          ],
          max_tokens: 300,
          temperature: 0.1,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      return json(
        {
          faceVerified: false,
          message: "Face verification service unavailable. Please try again.",
        },
        503
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content ?? "";
    console.log("AI raw response:", content);

    // Parse AI response
    let parsed: {
      match: boolean;
      confidence: number;
      reason: string;
      flags: string[];
    };

    try {
      // Strip markdown code fences if present
      const cleaned = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return json(
        {
          faceVerified: false,
          message: "Verification processing error. Please retry.",
        },
        500
      );
    }

    // Security checks on flags
    if (parsed.flags?.includes("multiple_faces")) {
      return json({
        faceVerified: false,
        message: "Multiple faces detected. Only one person should be visible.",
      });
    }

    if (parsed.flags?.includes("possible_spoof")) {
      return json({
        faceVerified: false,
        message:
          "Possible spoofing detected. Please use a live camera capture.",
      });
    }

    if (parsed.flags?.includes("no_face_capture")) {
      return json({
        faceVerified: false,
        message: "No face detected in camera. Please position your face clearly.",
      });
    }

    if (parsed.flags?.includes("no_face_profile")) {
      return json({
        faceVerified: false,
        message:
          "Profile photo does not contain a clear face. Please update your profile photo.",
      });
    }

    const verified = parsed.match === true && (parsed.confidence ?? 0) >= 75;

    console.log(
      `Face verification for ${profile.full_name}: match=${parsed.match}, confidence=${parsed.confidence}, verified=${verified}`
    );

    if (verified) {
      return json({
        faceVerified: true,
        message: "Face Verified",
        confidence: parsed.confidence,
      });
    } else {
      return json({
        faceVerified: false,
        message: "Face Not Verified. The captured face does not match your profile photo.",
        confidence: parsed.confidence,
      });
    }
  } catch (error) {
    console.error("verify-face error:", error);
    return json(
      {
        faceVerified: false,
        message: "Internal error during face verification.",
      },
      500
    );
  }
});
