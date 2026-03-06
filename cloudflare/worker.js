function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function getKeyFromPath(url) {
  const prefix = "/api/storage/";
  if (!url.pathname.startsWith(prefix)) return "";
  const raw = url.pathname.slice(prefix.length);
  return decodeURIComponent(raw.split("?")[0] || "").trim();
}

async function getAllStorage(env) {
  const rows = await env.DB.prepare("SELECT key, value FROM app_storage").all();
  const data = {};
  for (const row of rows.results || []) {
    data[row.key] = row.value;
  }
  return data;
}

async function getStorageValue(env, key) {
  const row = await env.DB.prepare("SELECT value FROM app_storage WHERE key = ?1").bind(key).first();
  return row ? row.value : null;
}

async function setStorageValue(env, key, value) {
  await env.DB
    .prepare(
      "INSERT INTO app_storage (key, value, updated_at) VALUES (?1, ?2, unixepoch()) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()"
    )
    .bind(key, value)
    .run();
}

async function deleteStorageValue(env, key) {
  await env.DB.prepare("DELETE FROM app_storage WHERE key = ?1").bind(key).run();
}

async function clearStorage(env) {
  await env.DB.prepare("DELETE FROM app_storage").run();
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (url.pathname === "/api/health" && method === "GET") {
    return jsonResponse({
      ok: true,
      app: env.APP_NAME || "Money Command Center",
      runtime: "cloudflare-workers"
    });
  }

  if (url.pathname === "/api/storage/all" && method === "GET") {
    const data = await getAllStorage(env);
    return jsonResponse({ data });
  }

  if (url.pathname === "/api/storage/all" && method === "DELETE") {
    await clearStorage(env);
    return jsonResponse({ ok: true });
  }

  if (url.pathname.startsWith("/api/storage/")) {
    const key = getKeyFromPath(url);
    if (!key) return jsonResponse({ error: "Key is required" }, 400);

    if (method === "GET") {
      const value = await getStorageValue(env, key);
      return jsonResponse({ key, value });
    }

    if (method === "PUT") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
      }

      const value = body && Object.prototype.hasOwnProperty.call(body, "value")
        ? String(body.value)
        : "null";

      await setStorageValue(env, key, value);
      return jsonResponse({ ok: true, key });
    }

    if (method === "DELETE") {
      await deleteStorageValue(env, key);
      return jsonResponse({ ok: true, key });
    }
  }

  return null;
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        const apiResponse = await handleApi(request, env);
        if (apiResponse) return apiResponse;
        return jsonResponse({ error: "Not found" }, 404);
      }

      try {
        return await env.ASSETS.fetch(request);
      } catch {
        const fallback = new Request(new URL("/index.html", request.url), request);
        return await env.ASSETS.fetch(fallback);
      }
    } catch (error) {
      return jsonResponse({ error: error && error.message ? error.message : "Server error" }, 500);
    }
  }
};