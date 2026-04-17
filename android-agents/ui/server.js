#!/usr/bin/env node
// Node.js equivalent of server.py — runs without Python.
// Usage: node server.js

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.OPEN_ZEU_PORT || "8765", 10);
const BASE_DIR = path.resolve(__dirname, "..");
const UI_DIR = __dirname;
const AVATAR_DIR = path.join(UI_DIR, "avatars");
const SHARED_SKILLS_DIR = path.join(BASE_DIR, "_skills");

const REPOS = {
  orchestrator: {
    path: path.join(BASE_DIR, "team", "orchestrator", "data.json"),
    root: path.join(BASE_DIR, "team", "orchestrator"),
    skillsDir: path.join(BASE_DIR, "team", "orchestrator", "skills"),
    color: "#c084fc",
    label: "Raava",
    codename: "Raava",
    role: "Orchestrator",
    sub: "Task creation & intake",
  },
  "project-manager": {
    path: path.join(BASE_DIR, "team", "project-manager", "data.json"),
    root: path.join(BASE_DIR, "team", "project-manager"),
    skillsDir: path.join(BASE_DIR, "team", "project-manager", "skills"),
    color: "#60a5fa",
    label: "Project Manager",
    codename: "Project Manager",
    role: "Project Manager",
    sub: "Delegation & prioritization",
  },
  "backend-dev": {
    path: path.join(BASE_DIR, "team", "backend-dev", "data.json"),
    root: path.join(BASE_DIR, "team", "backend-dev"),
    skillsDir: path.join(BASE_DIR, "team", "backend-dev", "skills"),
    color: "#10b981",
    label: "Backend Dev",
    codename: "Backend Dev",
    role: "Backend Developer",
    sub: "APIs, integrations & services",
  },
  dba: {
    path: path.join(BASE_DIR, "team", "dba", "data.json"),
    root: path.join(BASE_DIR, "team", "dba"),
    skillsDir: path.join(BASE_DIR, "team", "dba", "skills"),
    color: "#f97316",
    label: "DBA",
    codename: "DBA",
    role: "DBA",
    sub: "Schema design & migrations",
  },
  "frontend-dev": {
    path: path.join(BASE_DIR, "team", "frontend-dev", "data.json"),
    root: path.join(BASE_DIR, "team", "frontend-dev"),
    skillsDir: path.join(BASE_DIR, "team", "frontend-dev", "skills"),
    color: "#f59e0b",
    label: "Frontend Dev",
    codename: "Frontend Dev",
    role: "Frontend Developer",
    sub: "UI & components",
  },
  architect: {
    path: path.join(BASE_DIR, "team", "architect", "data.json"),
    root: path.join(BASE_DIR, "team", "architect"),
    skillsDir: path.join(BASE_DIR, "team", "architect", "skills"),
    color: "#94a3b8",
    label: "Architect",
    codename: "Architect",
    role: "Software Architect",
    sub: "ADRs & code review",
  },
  "qa-tester": {
    path: path.join(BASE_DIR, "team", "qa-tester", "data.json"),
    root: path.join(BASE_DIR, "team", "qa-tester"),
    skillsDir: path.join(BASE_DIR, "team", "qa-tester", "skills"),
    color: "#f87171",
    label: "QA Tester",
    codename: "QA Tester",
    role: "QA Tester",
    sub: "Testing & bug reports",
  },
  research: {
    path: path.join(BASE_DIR, "team", "research", "data.json"),
    root: path.join(BASE_DIR, "team", "research"),
    skillsDir: path.join(BASE_DIR, "team", "research", "skills"),
    color: "#22d3ee",
    label: "Research",
    codename: "Research",
    role: "Researcher",
    sub: "Web research & documentation",
  },
};

// Load agent-names.json (local, gitignored) or fall back to agent-names-example.json.
// Orchestrator is always Raava regardless of the file.
(function loadAgentNames() {
  const local = path.join(BASE_DIR, "agent-names.json");
  const example = path.join(BASE_DIR, "agent-names-example.json");
  const namesFile = fs.existsSync(local) ? local : example;
  if (!fs.existsSync(namesFile)) return;
  let names;
  try { names = JSON.parse(fs.readFileSync(namesFile, "utf8")); } catch { return; }
  for (const [key, name] of Object.entries(names)) {
    if (key === "_comment" || !REPOS[key] || key === "orchestrator") continue;
    REPOS[key].label = name;
    REPOS[key].codename = name;
  }
})();

// ── SSE client registry ───────────────────────────────────────────────────────

const sseClients = new Set();

function broadcastChange(filePath) {
  if (sseClients.size === 0) return;
  const payload = JSON.stringify({ file: path.basename(filePath), ts: Date.now() });
  const message = `event: change\ndata: ${payload}\n\n`;
  for (const client of sseClients) {
    try { client.write(message); } catch { sseClients.delete(client); }
  }
}

function setupWatcher() {
  const debounceTimers = new Map();

  // Watch the parent *directory* of each data.json rather than the file itself.
  // On Windows, fs.watch() on a file misses atomic writes (write-to-temp then rename),
  // which is the pattern used by many editors and the edit tool. Directory-level
  // watching catches rename events reliably.
  const watchedDirs = new Map(); // dirPath → Set of { name, filePath }
  for (const [name, info] of Object.entries(REPOS)) {
    const filePath = info.path;
    const dir = path.dirname(filePath);
    if (!watchedDirs.has(dir)) watchedDirs.set(dir, []);
    watchedDirs.get(dir).push({ name, filePath, fileName: path.basename(filePath) });
  }

  for (const [dir, entries] of watchedDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      fs.watch(dir, (eventType, changedFile) => {
        for (const { name, filePath, fileName } of entries) {
          if (changedFile !== fileName) continue;
          clearTimeout(debounceTimers.get(name));
          debounceTimers.set(name, setTimeout(() => broadcastChange(filePath), 120));
        }
      });
    } catch { /* dir may not exist yet — skip */ }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadRepoData(repoName) {
  try {
    return JSON.parse(fs.readFileSync(REPOS[repoName].path, "utf8"));
  } catch {
    return { backlog: [], archive: [] };
  }
}

function saveRepoData(repoName, data) {
  fs.writeFileSync(REPOS[repoName].path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function normalizeRepo(repoName) {
  const data = loadRepoData(repoName);
  for (const item of data.backlog || []) item.repo = repoName;
  for (const item of data.archive || []) item.repo = repoName;
  return data;
}

function denormalizeItem(item) {
  const { repo, ...rest } = item;
  return rest;
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    { ".html": "text/html", ".svg": "image/svg+xml", ".json": "application/json", ".md": "text/plain", ".png": "image/png", ".ico": "image/x-icon" }[ext] ||
    "application/octet-stream"
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  // GET /
  if (pathname === "/" && req.method === "GET") {
    const html = fs.readFileSync(path.join(UI_DIR, "index.html"), "utf8");
    res.writeHead(200, { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" });
    return res.end(html);
  }

  // GET /avatars/<file>
  if (pathname.startsWith("/avatars/") && req.method === "GET") {
    const file = path.basename(pathname);
    const avatarPath = path.join(AVATAR_DIR, file);
    if (!avatarPath.startsWith(AVATAR_DIR) || !fs.existsSync(avatarPath)) {
      res.writeHead(404); return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": getMime(avatarPath), "Access-Control-Allow-Origin": "*" });
    return res.end(fs.readFileSync(avatarPath));
  }

  // GET /api/repos
  if (pathname === "/api/repos" && req.method === "GET") {
    return json(res, 200, Object.fromEntries(
      Object.entries(REPOS).map(([name, info]) => [
        name,
        { root: info.root, color: info.color, label: info.label, codename: info.codename, role: info.role, sub: info.sub },
      ])
    ));
  }

  // GET /api/data
  if (pathname === "/api/data" && req.method === "GET") {
    return json(res, 200, Object.fromEntries(Object.keys(REPOS).map((n) => [n, normalizeRepo(n)])));
  }

  // GET /api/data/:repo
  const repoMatch = pathname.match(/^\/api\/data\/([^/]+)$/);
  if (repoMatch) {
    const repoName = repoMatch[1];
    if (!(repoName in REPOS)) return json(res, 404, { error: "Unknown repo" });

    if (req.method === "GET") return json(res, 200, normalizeRepo(repoName));

    if (req.method === "PUT") {
      const incoming = await readBody(req);
      saveRepoData(repoName, {
        backlog: (incoming.backlog || []).map(denormalizeItem),
        archive: (incoming.archive || []).map(denormalizeItem),
      });
      return json(res, 200, { status: "ok" });
    }
  }

  // GET /api/skills
  if (pathname === "/api/skills" && req.method === "GET") {
    const result = {};
    for (const [repoName, info] of Object.entries(REPOS)) {
      if (!fs.existsSync(info.skillsDir)) continue;
      const skills = fs.readdirSync(info.skillsDir)
        .filter((f) => f.startsWith("skill_") && f.endsWith(".md"))
        .sort()
        .map((f) => ({
          name: f.replace("skill_", "").replace(".md", "").replace(/_/g, " "),
          file: f,
          path: path.join(info.skillsDir, f),
        }));
      if (skills.length) result[repoName] = skills;
    }
    if (fs.existsSync(SHARED_SKILLS_DIR)) {
      const shared = fs.readdirSync(SHARED_SKILLS_DIR)
        .filter((f) => f.startsWith("skill_") && f.endsWith(".md"))
        .sort()
        .map((f) => ({
          name: f.replace("skill_", "").replace(".md", "").replace(/_/g, " "),
          file: f,
          path: path.join(SHARED_SKILLS_DIR, f),
        }));
      if (shared.length) result["shared"] = shared;
    }
    return json(res, 200, result);
  }

  // GET /api/file?path=...
  if (pathname === "/api/file" && req.method === "GET") {
    const filePath = url.searchParams.get("path");
    if (!filePath) return json(res, 400, { error: "No path provided" });

    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(BASE_DIR)) return json(res, 403, { error: "Access denied" });
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile())
      return json(res, 404, { error: "File not found" });

    try {
      return json(res, 200, { content: fs.readFileSync(resolved, "utf8") });
    } catch (e) {
      return json(res, 500, { error: String(e) });
    }
  }

  // GET /api/events  — Server-Sent Events for live board refresh
  if (pathname === "/api/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    });
    res.write("retry: 3000\n\n"); // client reconnects after 3 s on error
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return; // keep connection open — do NOT call res.end()
  }

  // GET — static files from UI_DIR (favicon, SVGs, etc.)
  if (req.method === "GET" && !pathname.startsWith("/api/") && !pathname.startsWith("/avatars/") && pathname !== "/") {
    const safeName = path.basename(pathname); // no directory traversal
    const staticPath = path.join(UI_DIR, safeName);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      res.writeHead(200, { "Content-Type": getMime(staticPath), "Access-Control-Allow-Origin": "*" });
      return res.end(fs.readFileSync(staticPath));
    }
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Starting Dev Team Board at http://localhost:${PORT}`);
  setupWatcher();
  // Keep SSE connections alive across proxies / browser idle timeouts
  setInterval(() => {
    for (const client of sseClients) {
      try { client.write(": heartbeat\n\n"); } catch { sseClients.delete(client); }
    }
  }, 25000);
});
