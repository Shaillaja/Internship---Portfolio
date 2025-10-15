// /public/js/main.js
const $ = (id) => document.getElementById(id);

const WX_LABELS = {
  0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
  45:"Fog",48:"Freezing fog",51:"Drizzle",53:"Drizzle",55:"Drizzle",
  61:"Rain",63:"Rain",65:"Rain",66:"Freezing rain",67:"Freezing rain",
  71:"Snow",73:"Snow",75:"Snow",77:"Snow grains",
  80:"Showers",81:"Showers",82:"Heavy showers",85:"Snow showers",86:"Snow showers",
  95:"Thunderstorm",96:"Thunderstorm",99:"Thunderstorm"
};
const WX_EMOJI = {0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌦️",61:"🌧️",63:"🌧️",65:"🌧️",66:"🌧️",67:"🌧️",71:"❄️",73:"❄️",75:"❄️",77:"❄️",80:"🌧️",81:"🌧️",82:"🌧️",85:"🌨️",86:"🌨️",95:"⛈️",96:"⛈️",99:"⛈️"};

function startClock(){
  const el = document.getElementById("clock"); if(!el) return;
  const tick = () => {
    const now = new Date();
    const date = now.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
    const time = now.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
    el.innerHTML = `<span class="big">🕒 ${time}</span><span class="muted">• ${date}</span>`;
  };
  tick(); setInterval(tick, 1000);
}
async function loadWeather(){
  const el = document.getElementById("weather"); if(!el) return;
  // try geolocation; fallback to Montréal
  let lat=43.65107, lon=-79.347015, place="Montréal";
  try {
    await new Promise((resolve,reject)=>{
      if(!navigator.geolocation) return resolve();
      navigator.geolocation.getCurrentPosition(
        p => { lat=p.coords.latitude; lon=p.coords.longitude; place="Near you"; resolve(); },
        () => resolve(), { timeout:4000 }
      );
    });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "auto";
    const r = await fetch(`/api/weather?lat=${lat}&lon=${lon}&tz=${encodeURIComponent(tz)}`);
    const data = await r.json();
    if(!r.ok) throw new Error(data.error || "weather error");

    const label = WX_LABELS[data.now.weathercode] || "Weather";
    const emoji = WX_EMOJI[data.now.weathercode] || "🌡️";
    el.innerHTML =
      `<span class="big">${emoji} ${data.now.temperature}${data.daily.unit}</span>
       <span class="muted">• ${label} • H:${data.daily.tmax}${data.daily.unit} / L:${data.daily.tmin}${data.daily.unit}</span>
       <span class="muted">• ${place}</span>`;
  } catch(e){
    console.error(e);
    el.textContent = "Weather unavailable";
  }
}


// Accepts either an array or { projects: [] }
function normalizeProjects(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.projects)) return payload.projects;
  return [];
}

function projectCard(p) {
  const tech = (p.tech || [])
    .slice(0, 5)
    .map(t => `<span class="pill">${t}</span>`)
    .join("");
  return `
    <article class="card">
      <h3>${p.title}</h3>
      <p class="meta">${p.blurb}</p>
      <p>${tech}</p>
      <a class="cta" href="projects.html#${p.id}">Details</a>
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const y = $("year");
  startClock();
  loadWeather();
  if (y) y.textContent = new Date().getFullYear();

  // ---- Featured Projects ----
  try {
    const res = await fetch("/api/projects", { headers: { Accept: "application/json" } });
    const data = await res.json();
    const all = normalizeProjects(data);

    // Prefer these if they exist; otherwise just take first 3
    const preferred = ["colortone", "retechx", "parcelpro"];
    const picked = preferred.map(id => all.find(p => p.id === id)).filter(Boolean);
    const featured = (picked.length ? picked : all).slice(0, 3);

    const root = $("featured");
    if (root) root.innerHTML = featured.map(projectCard).join("");
  } catch (e) {
    console.error("[home] Failed to load /api/projects:", e);
    const root = $("featured");
    if (root) root.innerHTML = `<p class="muted">Couldn’t load featured projects.</p>`;
  }

  // ---- Latest on GitHub (stars removed) ----
  try {
    const repos = await fetch("/api/github/latest").then(r => r.json());
    const gh = $("github");
    if (gh && Array.isArray(repos)) {
      gh.innerHTML = repos.map(r => `
        <article class="card">
          <h3>${r.name}</h3>
          <p class="meta">${r.description ?? "No description"}</p>
          <p class="muted">
            ${r.language ? `${r.language} · ` : ""}Updated: ${r.updated ? new Date(r.updated).toLocaleDateString() : "—"}
          </p>
          <a class="cta" href="${r.url}" target="_blank" rel="noreferrer">View Repo</a>
        </article>
      `).join("");
    }
  } catch (e) {
    console.error("[home] Failed to load /api/github/latest:", e);
  }
});
