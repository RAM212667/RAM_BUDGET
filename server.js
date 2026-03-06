const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "127.0.0.1";
const STARTED_AT = new Date().toISOString();

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const STORAGE_PATH = path.join(DATA_DIR, "storage.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function ensureStorageFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORAGE_PATH)) fs.writeFileSync(STORAGE_PATH, "{}", "utf8");
}

function readStorage() {
  ensureStorageFile();
  try {
    const raw = fs.readFileSync(STORAGE_PATH, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(next) {
  ensureStorageFile();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(next, null, 2), "utf8");
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function safeFilePath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname === "/") pathname = "/index.html";
  const normalized = path.normalize(pathname).replace(/^([\\/])+/, "");
  const fullPath = path.join(ROOT, normalized);
  if (!fullPath.startsWith(ROOT)) return null;
  return fullPath;
}

function serveStatic(req, res) {
  const fullPath = safeFilePath(req.url || "/");
  if (!fullPath) {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if ((req.url || "/") !== "/index.html" && (req.url || "/") !== "/") {
        const fallback = path.join(ROOT, "index.html");
        fs.readFile(fallback, (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404);
            res.end("Not Found");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(fallbackData);
        });
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = req.url || "/";

  if (url === "/api/health" && method === "GET") {
    sendJson(res, 200, {
      ok: true,
      host: HOST,
      port: PORT,
      startedAt: STARTED_AT,
      uptimeSeconds: Math.floor(process.uptime())
    });
    return;
  }

  if (url === "/api/storage/all" && method === "GET") {
    sendJson(res, 200, { data: readStorage() });
    return;
  }

  if (url.startsWith("/api/storage/") && method === "GET") {
    const key = decodeURIComponent(url.replace("/api/storage/", "").split("?")[0] || "");
    if (!key) {
      sendJson(res, 400, { error: "Key is required" });
      return;
    }
    const data = readStorage();
    sendJson(res, 200, { key, value: Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null });
    return;
  }

  if (url.startsWith("/api/storage/") && method === "PUT") {
    const key = decodeURIComponent(url.replace("/api/storage/", "").split("?")[0] || "");
    if (!key) {
      sendJson(res, 400, { error: "Key is required" });
      return;
    }

    try {
      const body = await parseBody(req);
      const data = readStorage();
      data[key] = body.value ?? null;
      writeStorage(data);
      sendJson(res, 200, { ok: true, key });
    } catch (err) {
      sendJson(res, 400, { error: err.message || "Bad request" });
    }
    return;
  }

  if (url.startsWith("/api/storage/") && method === "DELETE") {
    const key = decodeURIComponent(url.replace("/api/storage/", "").split("?")[0] || "");
    if (!key) {
      sendJson(res, 400, { error: "Key is required" });
      return;
    }
    const data = readStorage();
    delete data[key];
    writeStorage(data);
    sendJson(res, 200, { ok: true, key });
    return;
  }

  if (url === "/api/storage/all" && method === "DELETE") {
    writeStorage({});
    sendJson(res, 200, { ok: true });
    return;
  }

  serveStatic(req, res);
});

ensureStorageFile();

server.on("error", err => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other app or start with another port.`);
    process.exit(1);
  }
  console.error("Server failed to start:", err);
  process.exit(1);
});

process.on("uncaughtException", err => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled rejection:", err);
});

server.listen(PORT, HOST, () => {
  console.log(`Money Command Center server running at http://${HOST}:${PORT}`);
  console.log(`Storage file: ${STORAGE_PATH}`);
});