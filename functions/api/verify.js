export async function onRequestPost({ request, env }) {
    try {
        const { taskId, status, email } = await request.json();

        const zeptoUrl = "https://api.zeptomail.eu/v1.1/email";
        const zeptoToken = env.ZEPTOMAIL_TOKEN;

        if (!zeptoToken) return new Response("Config Error", { status: 500 });

        const subject = status === 'CONFIRMED'
            ? `[VERIFIED] User Confirmed Receipt (Task ${taskId})`
            : `[IMPORTANT] User Status Update: ${status} (Task ${taskId})`;

        // Simple alert style
        const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; background: #121212; color: white;">
        <h2 style="color: ${status === 'CONFIRMED' ? '#00ff00' : '#ff0000'}">Verification Log</h2>
        <p>User Email: ${email}</p>
        <p>Task ID: ${taskId}</p>
        <p>Status: <strong>${status}</strong></p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
    `;

        await fetch(zeptoUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": zeptoToken
            },
            body: JSON.stringify({
                "from": { "address": "no-reply@gotx.uk", "name": "GOTX Watchdog" },
                "to": [{ "email_address": { "address": "info@gotx.uk", "name": "GOTX Admin" } }],
                "subject": subject,
                "htmlbody": htmlBody,
            })
        });

        // --- UPDATE PERSISTENT LOG (KV) ---
        try {
            if (env.SUBMISSIONS) {
                const key = `mission:${taskId}`;
                const existingData = await env.SUBMISSIONS.get(key, { type: 'json' });

                if (existingData) {
                    existingData.status = status;
                    existingData.verifiedAt = new Date().toISOString();
                    await env.SUBMISSIONS.put(key, JSON.stringify(existingData));
                }
            }
        } catch (kvError) {
            console.error("KV Verification Update Error:", kvError);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        return new Response("Error", { status: 500 });
    }
}
