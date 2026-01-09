/**
 * Cloudflare Pages Function to handle Media Subscription (Newsletter)
 * and send emails via Zoho ZeptoMail.
 */

export async function onRequestPost({ request, env }) {
    try {
        const { email } = await request.json();

        // Validate required fields
        if (!email) {
            return new Response(JSON.stringify({ error: "Missing email address" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // ZeptoMail API Configuration
        const zeptoUrl = "https://api.zeptomail.eu/v1.1/email"; // EU Data Center
        const zeptoToken = env.ZEPTOMAIL_TOKEN;

        if (!zeptoToken) {
            console.error("Missing ZEPTOMAIL_TOKEN environment variable");
            return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
        }

        // 1. Send Notification to GOTX Team
        const adminPayload = {
            "from": { "address": "no-reply@gotx.uk", "name": "GOTX Watchdog" },
            "to": [
                { "email_address": { "address": "info@gotx.uk", "name": "GOTX Admin" } }
            ],
            "subject": `New Media Subscriber: ${email}`,
            "htmlbody": `
                <div style="font-family: sans-serif; padding: 20px; background: #121212; color: white;">
                    <h2 style="color: #00f2ff;">New Subscriber Logged</h2>
                    <p>A user has signed up for the "Stay Involved" list via the Media page.</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                </div>
            `,
        };

        // 2. Send Welcome Email to Subscriber
        const welcomePayload = {
            "from": { "address": "no-reply@gotx.uk", "name": "GOTX Managed IT" },
            "to": [
                { "email_address": { "address": email, "name": "New Subscriber" } }
            ],
            "subject": `You're In: GOTX Media & News`,
            "htmlbody": `
                <div style="font-family: sans-serif; padding: 40px; background: #121212; color: #e0e0e0; max-width: 600px; margin: 0 auto; border: 1px solid #333;">
                    <h1 style="color: #ffffff; text-align: center;">Mission Acknowledged</h1>
                    <p>Thank you for subscribing to GOTX Media. You are now on the list to receive our latest News Media & Public Communication updates.</p>
                    <p>We're hard at work building out our services and can't wait to share our progress with you.</p>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; font-size: 12px; color: #666; text-align: center;">
                        &copy; 2026 GOTX Connect Ltd. Reading, RG2.
                    </div>
                </div>
            `,
        };

        // Execute both requests
        const [adminRes, welcomeRes] = await Promise.all([
            fetch(zeptoUrl, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": zeptoToken
                },
                body: JSON.stringify(adminPayload)
            }),
            fetch(zeptoUrl, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": zeptoToken
                },
                body: JSON.stringify(welcomePayload)
            })
        ]);

        if (!adminRes.ok || !welcomeRes.ok) {
            console.error("ZeptoMail Error:", await adminRes.text(), await welcomeRes.text());
            return new Response(JSON.stringify({ error: "Failed to process subscription" }), { status: 502 });
        }

        return new Response(JSON.stringify({ message: "Subscription Successful" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
