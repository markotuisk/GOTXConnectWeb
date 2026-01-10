/**
 * Cloudflare Pages Function to retrieve all submission logs from KV.
 * Access is protected by a token via query parameter.
 */

export async function onRequestGet({ request, env }) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        // Security check: Match against a secret token
        // In a real environment, this should be stored in an environment variable.
        const SECURE_TOKEN = env.LOGS_TOKEN || "GOTX-ADMIN-99";

        if (token !== SECURE_TOKEN) {
            return new Response(JSON.stringify({ error: "Unauthorized access" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!env.SUBMISSIONS) {
            return new Response(JSON.stringify({ error: "KV Namespace not bound" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // List all keys with 'mission:' prefix
        const list = await env.SUBMISSIONS.list({ prefix: "mission:" });
        const submissions = [];

        // Fetch each submission's data
        for (const key information of list.keys) {
            const data = await env.SUBMISSIONS.get(key.name, { type: 'json' });
            if (data) {
                submissions.push(data);
            }
        }

        // Sort by timestamp (newest first)
        submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return new Response(JSON.stringify(submissions, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                // Encourage browsers to display this as a file if visited directly
                "Content-Disposition": "inline; filename=\"mission_logs.json\""
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error: " + err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
