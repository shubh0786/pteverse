export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

export function corsPreflight(): Response {
  return json({ ok: true });
}

export function methodNotAllowed(allowed: string[]): Response {
  return json({ error: "Method not allowed", allowed }, 405);
}
