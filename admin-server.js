const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5174);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime"
};

function headers(type = "text/plain; charset=utf-8") {
  return {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, headers(type));
  res.end(body);
}

function safeJoin(...parts) {
  const target = path.resolve(root, ...parts);
  if (!target.startsWith(root)) throw new Error("Invalid path");
  return target;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 200 * 1024 * 1024) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function cleanNumber(number) {
  const value = String(number || "").trim();
  if (!/^\d{1,8}$/.test(value)) throw new Error("Invalid technician number");
  return value.padStart(3, "0");
}

function cleanFileName(fileName) {
  const base = path.basename(String(fileName || ""));
  if (!base) throw new Error("Invalid file name");
  const invalid = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
  for (const ch of base) {
    if (invalid.has(ch) || ch.charCodeAt(0) < 32) throw new Error("Invalid file name");
  }
  return base;
}

async function unusedFilePath(dir, fileName) {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let candidate = fileName;
  let index = 2;
  while (true) {
    const target = safeJoin(dir, candidate);
    try {
      await fs.access(target);
      candidate = `${stem}-${index}${ext}`;
      index += 1;
    } catch {
      return { fileName: candidate, target };
    }
  }
}

function cleanMediaSrc(src) {
  const value = String(src || "").replace(/\\/g, "/");
  if (!value.startsWith("assets/media/")) throw new Error("Invalid media path");
  const parts = value.split("/").filter(Boolean);
  if (parts.length < 4 || parts[0] !== "assets" || parts[1] !== "media") {
    throw new Error("Invalid media path");
  }
  cleanNumber(parts[2]);
  cleanFileName(parts[parts.length - 1]);
  return parts;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, headers());
      res.end();
      return;
    }

    const url = new URL(req.url, "http://127.0.0.1");
    if (req.method === "POST" && url.pathname === "/api/save-data") {
      const body = await readJson(req);
      if (typeof body.text !== "string" || !body.text.startsWith("window.TECHNICIANS = ")) {
        throw new Error("Invalid data.js payload");
      }
      await fs.writeFile(safeJoin("data.js"), body.text, "utf8");
      send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/upload-resource") {
      const body = await readJson(req);
      const number = cleanNumber(body.number);
      const fileName = cleanFileName(body.fileName);
      const match = String(body.dataUrl || "").match(/^data:([^;,]+)?;base64,(.+)$/);
      if (!match) throw new Error("Invalid data URL");
      const dir = safeJoin("assets", "media", number);
      await fs.mkdir(dir, { recursive: true });
      const upload = await unusedFilePath(dir, fileName);
      const target = upload.target;
      await fs.writeFile(target, Buffer.from(match[2], "base64"));
      const src = `assets/media/${number}/${upload.fileName}`;
      send(res, 200, JSON.stringify({ ok: true, src }), "application/json; charset=utf-8");
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/delete-resource") {
      const body = await readJson(req);
      const parts = cleanMediaSrc(body.src);
      const target = safeJoin(...parts);
      await fs.rm(target, { force: true });
      send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "Method not allowed");
      return;
    }

    const requestPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = safeJoin("." + requestPath);
    const data = await fs.readFile(filePath);
    res.writeHead(200, headers(mime[path.extname(filePath).toLowerCase()] || "application/octet-stream"));
    if (req.method === "HEAD") res.end();
    else res.end(data);
  } catch (error) {
    send(res, 404, String(error.message || error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Admin server running: http://127.0.0.1:${port}/admin.html`);
});
