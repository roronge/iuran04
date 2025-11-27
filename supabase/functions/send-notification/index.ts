import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  rumah_ids: string[];
  tagihan_id?: string;
  judul: string;
  pesan: string;
  jenis?: string;
  send_email?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rumah_ids, tagihan_id, judul, pesan, jenis = "tagihan", send_email = true }: NotificationRequest = await req.json();

    console.log("Received notification request:", { rumah_ids, tagihan_id, judul, jenis, send_email });

    if (!rumah_ids || rumah_ids.length === 0) {
      throw new Error("rumah_ids is required");
    }

    // Get rumah data with email
    const { data: rumahList, error: rumahError } = await supabase
      .from("rumah")
      .select("id, kepala_keluarga, email, no_rumah, blok")
      .in("id", rumah_ids);

    if (rumahError) {
      console.error("Error fetching rumah:", rumahError);
      throw rumahError;
    }

    console.log("Found rumah:", rumahList?.length);

    // Create notifications in database
    const notifications = rumah_ids.map((rumah_id) => ({
      rumah_id,
      tagihan_id,
      judul,
      pesan,
      jenis,
    }));

    const { data: notifData, error: notifError } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (notifError) {
      console.error("Error creating notifications:", notifError);
      throw notifError;
    }

    console.log("Created notifications:", notifData?.length);

    // Send emails if requested
    let emailsSent = 0;
    let emailErrors: string[] = [];

    if (send_email && rumahList) {
      for (const rumah of rumahList) {
        if (rumah.email) {
          try {
            const alamat = [rumah.blok, rumah.no_rumah].filter(Boolean).join(" ");
            
            const emailResponse = await resend.emails.send({
              from: "Iuran RT <onboarding@resend.dev>",
              to: [rumah.email],
              subject: judul,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Iuran RT</h1>
                  </div>
                  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #0d9488; margin-top: 0;">${judul}</h2>
                    <p style="color: #475569;">Yth. Bapak/Ibu <strong>${rumah.kepala_keluarga}</strong></p>
                    <p style="color: #475569;">Alamat: ${alamat}</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0d9488; margin: 20px 0;">
                      <p style="color: #1e293b; margin: 0; white-space: pre-line;">${pesan}</p>
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                      Terima kasih atas perhatian dan kerjasamanya.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                      Email ini dikirim secara otomatis oleh sistem Iuran RT
                    </p>
                  </div>
                </div>
              `,
            });

            console.log("Email sent to:", rumah.email, emailResponse);
            emailsSent++;
          } catch (emailError: any) {
            console.error("Error sending email to:", rumah.email, emailError);
            emailErrors.push(`${rumah.email}: ${emailError.message}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notifData?.length || 0,
        emails_sent: emailsSent,
        email_errors: emailErrors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
