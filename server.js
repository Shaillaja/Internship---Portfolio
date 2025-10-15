// server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

const WX_CACHE = new Map();               // simple in-memory cache
const WX_TTL_MS = 30 * 60 * 1000;  

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serves your HTML/CSS/JS from /public

/** ---------- Data ---------- */
const projects = [
  {
    id: "desktop-utility",
    title: "Multi-Functional Desktop Utility",
    blurb:
      "Windows desktop app with Lotto Max/649, IP Validator, currency/temp conversion, calculator; heavy file I/O and regex.",
    tech: ["C#", ".NET", "WinForms", "OOP", "Regex", "File I/O"],
    links: { github: "", live: "" }
  },
  {
    id: "remax-admin",
    title: "Remax Administration System",
    blurb:
      "3-tier real-estate admin: employees, clients, houses; ADO.NET CRUD; role-based access; themed MDI UI.",
    tech: ["C#", "WinForms", "ADO.NET", "OOP", "Access"],
    links: { github: "", live: "" }
  },
  {
    id: "parcelpro",
    title: "Parcel Inventory System Pro (Curiorio)",
    blurb:
      "JSON-driven parcel tracking & inventory; auth, CRUD, responsive Tailwind, animations.",
    tech: ["Java 17", "Jakarta Servlet 6", "JSTL 3", "Tomcat 10", "Tailwind", "Maven"],
    links: { github: "", live: "" }
  },
  {
    id: "retechx",
    title: "ReTechX – Used Electronics Marketplace",
    blurb:
      "Full-stack marketplace: listings, condition-based pricing, secure transactions, pickup booking, search/filter.",
    tech: ["PHP", "MySQL", "HTML", "CSS", "JavaScript", "XAMPP", "Tailwind"],
    links: { github: "", live: "" }
  },
  {
    id: "colortone",
    title: "ColorTone – Smart Outfit Color Advisor (iOS)",
    blurb:
      "AI fashion assistant: suggests outfit colors from skin tone + weather; ResNet-18 (87%) → CoreML; AR try-on (planned).",
    tech: ["Swift", "UIKit", "CoreML", "ARKit (planned)", "PyTorch", "OpenWeather"],
    links: { github: "", live: "" }
  },
  {
    id: "flask-auth",
    title: "Flask Authentication & Authorization",
    blurb:
      "Secure auth with hashed passwords, sessions, route protection; planned JWT/OAuth.",
    tech: ["Flask", "PostgreSQL", "Flask-Session", "bcrypt", "HTML", "CSS"],
    links: { github: "", live: "" }
  },
  {
    id: "password-manager",
    title: "Password Manager – Secure Credential Vault",
    blurb:
      "Generates, encrypts (Fernet AES), stores, and retrieves passwords; tabbed Tkinter UI with search/delete.",
    tech: ["Python", "Tkinter", "SQLite3", "cryptography.fernet"],
    links: { github: "https://github.com/Shaillaja/Password-Manager", live: "" }
  }
];

const skills = {
  frontend: ["HTML", "CSS", "JavaScript", "Tailwind", "React (basics)"],
  backend: ["PHP", "Node.js (Express)", "Flask", "Java (Servlets)", "FastAPI (basics)"],
  databases: ["MySQL", "PostgreSQL", "SQLite", "Amazon Aurora", "Access", "Firestore (basics)"],
  tools: ["Git/GitHub", "Docker (basics)", "Xcode", "Android Studio", "Talend", "Tableau"]
};

/** ---------- Helpers / “processing” ---------- */
function inferCategory(tech = []) {
  const t = tech.map(x => (x || "").toLowerCase());
  if (t.some(x => ["swift","uikit","coreml","arkit"].some(k => x.includes(k)))) return "ios";
  if (t.some(x => ["jakarta","java","tomcat","jstl","spring"].some(k => x.includes(k)))) return "java";
  if (t.some(x => ["python","flask","django","tkinter"].some(k => x.includes(k)))) return "python";
  if (t.some(x => ["php","javascript","html","css","mysql","tailwind","bootstrap","react","node"].some(k => x.includes(k)))) return "web";
  return "web";
}

function wxKey(lat, lon, tz){ return `${lat.toFixed(3)},${lon.toFixed(3)},${tz||"auto"}`; }

/** ---------- Student-created API ---------- */
app.get("/api/projects", (req, res) => res.json(projects));

app.get("/api/projects/:id", (req, res) => {
  const p = projects.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json({ ...p, category: p.category || inferCategory(p.tech) });
});

app.get("/api/skills", (req, res) => res.json(skills));

/** ---------- External API (GitHub) ---------- */
const GH_USER = "Shaillaja";
app.get("/api/github/latest", async (req, res) => {
  try {
    const r = await fetch(`https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=6`, {
      headers: { "User-Agent": "portfolio-app" }
    });
    if (!r.ok) return res.status(502).json({ error: "GitHub API error", status: r.status });
    const data = await r.json();
    const mapped = data
      .map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        updated: repo.updated_at,
        stars: repo.stargazers_count
      }))
      .filter(x => x.description || x.language);
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** ---------- Contact API (form validation) ---------- */
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body || {};
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Enter your name.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (!message || message.trim().length < 10) errors.message = "Message is too short.";
  if (Object.keys(errors).length) return res.status(400).json({ ok:false, errors });
  console.log("Contact message:", { name, email, message }); // could write to file/email
  res.json({ ok:true });
});

/** ---------- External API: Weather proxy (added) ---------- */
// GET /api/weather?lat=..&lon=..&tz=America/Toronto
app.get("/api/weather", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const tz  = req.query.tz || "auto";
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: "lat/lon required" });
    }

    const key = wxKey(lat, lon, tz);
    const hit = WX_CACHE.get(key);
    if (hit && (Date.now() - hit.ts) < WX_TTL_MS) {
      return res.json(hit.data);
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(tz)}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: "Open-Meteo error" });
    const j = await r.json();

    const cw = j.current_weather;
    const out = {
      now: {
        temperature: Math.round(cw.temperature),
        windspeed: Math.round(cw.windspeed),
        weathercode: cw.weathercode,
        time: cw.time
      },
      daily: {
        tmax: Math.round(j.daily?.temperature_2m_max?.[0] ?? cw.temperature),
        tmin: Math.round(j.daily?.temperature_2m_min?.[0] ?? cw.temperature),
        unit: j.daily_units?.temperature_2m_max || "°C"
      }
    };

    WX_CACHE.set(key, { ts: Date.now(), data: out });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Optional geocode helper: /api/geocode?q=City
app.get("/api/geocode", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "q required" });
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en`);
    if (!r.ok) return res.status(502).json({ error: "Geocode error" });
    const j = await r.json();
    const best = j.results?.[0];
    if (!best) return res.status(404).json({ error: "not found" });
    res.json({ name: best.name, lat: best.latitude, lon: best.longitude, country: best.country });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Portfolio running → http://localhost:${PORT}`);
});
