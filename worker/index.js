/**
 * Amara Vale — Private Gallery Worker
 * -----------------------------------
 * Fronts an R2 bucket. Nothing in the bucket is ever public.
 * A viewer must POST the correct password to get a short-lived token,
 * and every file request must carry a valid token.
 *
 * Routes:
 *   POST /api/unlock          { password }              -> { token, expires }
 *   GET  /api/media           ?token=...                 -> { items: [...] }
 *   GET  /api/file/:key       ?token=...  (Range OK)      -> the actual file
 *   POST /api/admin/login     { password }               -> { token, expires }
 *   POST /api/admin/upload    Authorization: Bearer ...   -> { ok, key }
 *        header X-Filename: <name>, body = raw file bytes
 *   POST /api/admin/delete    Authorization: Bearer ...   { key }          -> { ok }
 *
 * Required secrets (wrangler secret put ...):
 *   GALLERY_PASSWORD_HASH   sha256 hex of the client-facing password
 *   ADMIN_PASSWORD_HASH     sha256 hex of your admin/upload password
 *   SIGNING_SECRET          any long random string, used to sign tokens
 * Optional var (wrangler.toml [vars]):
 *   ALLOWED_ORIGIN           e.g. "https://www.amaravale.com" (defaults to "*")
 * Required KV binding:
 *   RATE_LIMIT               used to lock out an IP after repeated wrong passwords
 */

const VIEW_TTL_MS = 4 * 60 * 60 * 1000;   // 4 hours for clients
const ADMIN_TTL_MS = 2 * 60 * 60 * 1000;  // 2 hours for admin uploads

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes

// ---------- crypto helpers ----------

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

async function makeToken(secret, scope, ttlMs) {
  const payload = `${scope}:${Date.now() + ttlMs}`;
  const sig = await hmacHex(secret, payload);
  return `${b64url(payload)}.${sig}`;
}

async function verifyToken(secret, token, requiredScope) {
  if (!token || !token.includes(".")) return false;
  const [encPayload, sig] = token.split(".");
  let payload;
  try {
    payload = b64urlDecode(encPayload);
  } catch {
    return false;
  }
  const expected = await hmacHex(secret, payload);
  if (expected !== sig) return false;
  const [scope, expiryStr] = payload.split(":");
  if (scope !== requiredScope) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;
  return true;
}

// ---------- response helpers ----------

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Filename",
  };
}

function json(env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

function guessContentType(key) {
  const ext = key.split(".").pop().toLowerCase();
  const map = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", avif: "image/avif",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", m4v: "video/x-m4v",
  };
  return map[ext] || "application/octet-stream";
}

function mediaKind(key) {
  const ext = key.split(".").pop().toLowerCase();
  const video = ["mp4", "webm", "mov", "m4v"];
  return video.includes(ext) ? "video" : "image";
}

// ---------- brute-force lockout (per IP, per scope) ----------

async function getAttemptState(env, ip, scope) {
  const key = `attempts:${scope}:${ip}`;
  const raw = await env.RATE_LIMIT.get(key);
  return { key, state: raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 } };
}

async function recordFailure(env, key, state) {
  const count = state.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_SECONDS * 1000 : 0;
  await env.RATE_LIMIT.put(
    key,
    JSON.stringify({ count, lockedUntil }),
    { expirationTtl: LOCKOUT_SECONDS }
  );
  return lockedUntil;
}

async function clearAttempts(env, key) {
  await env.RATE_LIMIT.delete(key);
}

// ---------- route handlers ----------

async function handleUnlock(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const { key, state } = await getAttemptState(env, ip, "view");

  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const waitSec = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return json(env, { error: `Too many attempts. Try again in ${Math.ceil(waitSec / 60)} minute(s).` }, 429);
  }

  const { password } = await request.json().catch(() => ({}));
  if (!password) return json(env, { error: "Password required" }, 400);
  const hash = await sha256Hex(password);

  if (hash !== env.GALLERY_PASSWORD_HASH) {
    await recordFailure(env, key, state);
    const remaining = Math.max(0, MAX_ATTEMPTS - (state.count + 1));
    return json(env, {
      error: remaining > 0
        ? `Incorrect password. ${remaining} attempt(s) left.`
        : `Too many attempts. Try again in ${LOCKOUT_SECONDS / 60} minutes.`,
    }, 401);
  }

  await clearAttempts(env, key);
  const token = await makeToken(env.SIGNING_SECRET, "view", VIEW_TTL_MS);
  return json(env, { token, expires: Date.now() + VIEW_TTL_MS });
}

async function handleAdminLogin(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const { key, state } = await getAttemptState(env, ip, "admin");

  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const waitSec = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return json(env, { error: `Too many attempts. Try again in ${Math.ceil(waitSec / 60)} minute(s).` }, 429);
  }

  const { password } = await request.json().catch(() => ({}));
  if (!password) return json(env, { error: "Password required" }, 400);
  const hash = await sha256Hex(password);

  if (hash !== env.ADMIN_PASSWORD_HASH) {
    await recordFailure(env, key, state);
    const remaining = Math.max(0, MAX_ATTEMPTS - (state.count + 1));
    return json(env, {
      error: remaining > 0
        ? `Incorrect password. ${remaining} attempt(s) left.`
        : `Too many attempts. Try again in ${LOCKOUT_SECONDS / 60} minutes.`,
    }, 401);
  }

  await clearAttempts(env, key);
  const token = await makeToken(env.SIGNING_SECRET, "admin", ADMIN_TTL_MS);
  return json(env, { token, expires: Date.now() + ADMIN_TTL_MS });
}

async function handleMediaList(request, env, url) {
  const token = url.searchParams.get("token");
  if (!(await verifyToken(env.SIGNING_SECRET, token, "view"))) {
    return json(env, { error: "Unauthorized" }, 401);
  }
  const listed = await env.MEDIA_BUCKET.list({ limit: 1000 });
  const items = listed.objects
    .filter((o) => !o.key.startsWith("_"))
    .map((o) => ({
      key: o.key,
      kind: mediaKind(o.key),
      size: o.size,
      uploaded: o.uploaded,
    }))
    .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
  return json(env, { items });
}

async function handleFile(request, env, key, url) {
  const token = url.searchParams.get("token");
  if (!(await verifyToken(env.SIGNING_SECRET, token, "view"))) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders(env) });
  }

  const rangeHeader = request.headers.get("Range");
  let r2Options = {};
  let status = 200;
  let extraHeaders = {};

  if (rangeHeader) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (match) {
      const offset = Number(match[1]);
      const head = await env.MEDIA_BUCKET.head(key);
      if (!head) return new Response("Not found", { status: 404, headers: corsHeaders(env) });
      const end = match[2] ? Number(match[2]) : head.size - 1;
      const length = end - offset + 1;
      r2Options = { range: { offset, length } };
      status = 206;
      extraHeaders = {
        "Content-Range": `bytes ${offset}-${end}/${head.size}`,
        "Content-Length": String(length),
      };
    }
  }

  const object = await env.MEDIA_BUCKET.get(key, r2Options);
  if (!object) return new Response("Not found", { status: 404, headers: corsHeaders(env) });

  return new Response(object.body, {
    status,
    headers: {
      "Content-Type": guessContentType(key),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      ...extraHeaders,
      ...corsHeaders(env),
    },
  });
}

async function handleAdminUpload(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!(await verifyToken(env.SIGNING_SECRET, token, "admin"))) {
    return json(env, { error: "Unauthorized" }, 401);
  }
  const filename = request.headers.get("X-Filename");
  if (!filename) return json(env, { error: "X-Filename header required" }, 400);

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  await env.MEDIA_BUCKET.put(key, request.body, {
    httpMetadata: { contentType: guessContentType(key) },
  });

  return json(env, { ok: true, key });
}

async function handleAdminDelete(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!(await verifyToken(env.SIGNING_SECRET, token, "admin"))) {
    return json(env, { error: "Unauthorized" }, 401);
  }
  const { key } = await request.json().catch(() => ({}));
  if (!key) return json(env, { error: "key required" }, 400);
  await env.MEDIA_BUCKET.delete(key);
  return json(env, { ok: true });
}

// ---------- router ----------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    try {
      if (pathname === "/api/unlock" && request.method === "POST") {
        return await handleUnlock(request, env);
      }
      if (pathname === "/api/admin/login" && request.method === "POST") {
        return await handleAdminLogin(request, env);
      }
      if (pathname === "/api/media" && request.method === "GET") {
        return await handleMediaList(request, env, url);
      }
      if (pathname.startsWith("/api/file/") && request.method === "GET") {
        const key = decodeURIComponent(pathname.replace("/api/file/", ""));
        return await handleFile(request, env, key, url);
      }
      if (pathname === "/api/admin/upload" && request.method === "POST") {
        return await handleAdminUpload(request, env);
      }
      if (pathname === "/api/admin/delete" && request.method === "POST") {
        return await handleAdminDelete(request, env);
      }
      return json(env, { error: "Not found" }, 404);
    } catch (err) {
      return json(env, { error: "Server error", detail: String(err) }, 500);
    }
  },
};
