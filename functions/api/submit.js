/**
 * Cloudflare Pages Function to handle Contact Form submissions
 * and send emails via Zoho ZeptoMail.
 */

export async function onRequestPost({ request, env }) {
    try {
        const formData = await request.json();

        // Validate required fields
        if (!formData.email || !formData.fullName || !formData.description) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Generate a unique Task ID for tracking
        const taskId = `GOTX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Prepare Email Content (Injecting data into the template)
        // Note: In a real build, we might import this, but for simple Pages Functions, 
        // embedding the template string is robust.
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background-color: #121212; font-family: 'Arial', sans-serif; color: #e0e0e0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1e1e1e; border: 1px solid #333; }
        .header { background-color: #121212; padding: 30px; text-align: center; border-bottom: 3px solid #00f2ff; }
        .header img { height: 50px; }
        .content { padding: 40px 30px; }
        .h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; font-weight: bold; }
        .field-row { margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px; }
        .label { color: #00f2ff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; display: block; }
        .value { color: #ffffff; font-size: 16px; line-height: 1.5; }
        .footer { background-color: #121212; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #333; }
        .highlight { background: rgba(0, 242, 255, 0.1); border-left: 4px solid #00f2ff; padding: 15px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://raw.githubusercontent.com/markotuisk/logos/ce8bf7fa8baff3acc97aac35d8733f7c9122af1c/GOTX.png" alt="GOTX Managed IT">
        </div>
        <div class="content">
            <div class="h1">New Mission Inquiry: ${taskId}</div>
            <p style="color: #aaaaaa; margin-bottom: 30px;">A new contact request has been received from the website.</p>
            <div class="field-row"><span class="label">Client Name</span><div class="value">${formData.fullName}</div></div>
            <div class="field-row"><span class="label">Contact Info</span><div class="value">${formData.email}<br>${formData.phone || 'N/A'}</div></div>
            <div class="field-row"><span class="label">Profile & Urgency</span><div class="value">
                <span style="background: #333; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${formData.userType}</span>
                <span style="background: #333; padding: 4px 8px; border-radius: 4px; font-size: 14px; margin-left: 10px;">${formData.contactTime}</span>
            </div></div>
            <div class="field-row"><span class="label">Location</span><div class="value">${formData.postcode}</div></div>
            <div class="highlight"><span class="label">Mission Brief</span><div class="value">${formData.description}</div></div>
        </div>
        <div class="footer">&copy; 2026 GOTX Connect Ltd. Secure Transmission.<br>Sent from gotx-managed-it.co.uk</div>
    </div>
</body>
</html>`;

        // ZeptoMail API Configuration
        const zeptoUrl = "https://api.zeptomail.eu/v1.1/email"; // EU Data Center
        const zeptoToken = env.ZEPTOMAIL_TOKEN; // Accessed via Cloudflare Env Vars

        if (!zeptoToken) {
            console.error("Missing ZEPTOMAIL_TOKEN environment variable");
            return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
        }

        const payload = {
            "from": { "address": "no-reply@gotx.uk", "name": "GOTX Website" },
            "to": [
                { "email_address": { "address": "info@gotx.uk", "name": "GOTX Info" } },
                { "email_address": { "address": formData.email, "name": formData.fullName } }
            ],
            "subject": `New Inquiry from ${formData.fullName}: ${formData.userType} [${taskId}]`,
            "htmlbody": emailHtml,
        };

        const response = await fetch(zeptoUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": zeptoToken
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ZeptoMail Error:", errorText);
            return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 502 });
        }

        // --- PERSISTENT LOGGING (KV) ---
        // We do this after the email is sent to prioritize communication.
        // We use a try/catch so that if KV fails, the user still gets a success message.
        try {
            if (env.SUBMISSIONS) {
                // 1. Get and Increment the Counter
                const counterKey = 'stats:counter';
                let counter = await env.SUBMISSIONS.get(counterKey);
                counter = counter ? parseInt(counter) + 1 : 1;
                await env.SUBMISSIONS.put(counterKey, counter.toString());

                const logEntry = {
                    logId: `Log:${counter}`,
                    taskId: taskId,
                    timestamp: new Date().toISOString(),
                    status: 'SENT',
                    data: formData
                };
                // Key format: mission:taskId
                await env.SUBMISSIONS.put(`mission:${taskId}`, JSON.stringify(logEntry));
            }
        } catch (kvError) {
            console.error("KV Logging Error:", kvError);
            // We don't return an error response here because the email was already sent.
        }

        return new Response(JSON.stringify({ message: "Mission Received", taskId: taskId }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error: " + err.message }), { status: 500 });
    }
}
