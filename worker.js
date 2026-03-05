/**
 * Cloudflare Worker — Bytez API CORS Proxy for VamsiBot
 * Deploy this at: https://dash.cloudflare.com → Workers & Pages → Create Worker
 * Then update WORKER_URL in script.js to your worker's URL.
 */

const BYTEZ_API_KEY = "a2b2438a59047e659c9a278c1b9fa1c5";
const BYTEZ_MODEL = "openai/gpt-oss-20b";
const BYTEZ_URL = `https://api.bytez.com/models/v1/${BYTEZ_MODEL}/chat/completions`;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export default {
    async fetch(request) {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: CORS_HEADERS });
        }

        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
        }

        try {
            const body = await request.json();

            const bytezResponse = await fetch(BYTEZ_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Key ${BYTEZ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await bytezResponse.json();

            return new Response(JSON.stringify(data), {
                status: bytezResponse.status,
                headers: {
                    "Content-Type": "application/json",
                    ...CORS_HEADERS,
                },
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }
    },
};
