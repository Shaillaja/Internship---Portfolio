const grid = document.getElementById("skillsGrid");
const search = document.getElementById("skillSearch");
const filterBar = document.querySelector(".filters");

// Optional: proficiency map (1..5). Add/adjust as you like.
const LEVELS = {
  // Frontend
  "HTML":4, "CSS":4, "JavaScript":4, "Tailwind":4, "React (basics)":2,
  // Backend
  "PHP":4, "Node.js (Express)":3, "Flask":3, "Java (Servlets)":3, "FastAPI (basics)":2,
  // DB
  "MySQL":4, "PostgreSQL":3, "SQLite":4, "Amazon Aurora":3, "Access":3, "Firestore (basics)":2,
  // Tools
  "Git/GitHub":4, "Docker (basics)":2, "Xcode":3, "Android Studio":3, "Talend":3, "Tableau":2
};

const LEVEL_LABEL = { 1:"Beginner", 2:"Novice", 3:"Intermediate", 4:"Advanced", 5:"Pro" };

// cache projects to compute “used in N projects”
let projects = [];

function percentFor(level){ return Math.max(10, Math.min(100, (level/5)*100)); }

function usageCount(skill){
  const key = (skill||"").toLowerCase();
  return projects.filter(p => (p.tech||[]).some(t => (t||"").toLowerCase().includes(key))).length;
}

function renderCategory(title, items){
  const rows = items.map(name => {
    const lvl = LEVELS[name] || 3;
    const pct = percentFor(lvl);
    const used = usageCount(name);
    const usedHtml = used ? `<span class="skill-usage">Used in ${used} project${used>1?"s":""}</span>` : "";
    return `
      <div class="skill-row" data-name="${name.toLowerCase()}">
        <div class="skill-name">${name}</div>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <span class="level" data-tip="${LEVEL_LABEL[lvl] || "Skill"}">${lvl}/5</span>
        ${usedHtml}
      </div>`;
  }).join("");
  return `<article class="skill-card" data-cat="${title.toLowerCase()}">
    <h3>${title}</h3>
    ${rows}
  </article>`;
}

function applyFilters(){
  const q = (search.value||"").trim().toLowerCase();
  const activeBtn = filterBar.querySelector("button.active");
  const cat = activeBtn?.dataset?.cat || "all";

  [...grid.querySelectorAll(".skill-card")].forEach(card => {
    const inCat = (cat==="all") || card.dataset.cat===cat;
    let hit = false;
    if (!q) { hit = true; }
    else {
      // match on any row inside this card
      hit = [...card.querySelectorAll(".skill-row")].some(r => r.dataset.name.includes(q));
    }
    card.style.display = (inCat && hit) ? "" : "none";
  });
}

async function main(){
  // fetch data
  const [skills, projs] = await Promise.all([
    fetch("/api/skills").then(r=>r.json()),
    fetch("/api/projects").then(r=>r.json()),
  ]);
  projects = projs;

  // render
  grid.innerHTML = [
    renderCategory("Frontend", skills.frontend||[]),
    renderCategory("Backend", skills.backend||[]),
    renderCategory("Databases", skills.databases||[]),
    renderCategory("Tools", skills.tools||[]),
  ].join("");

  // events
  search.addEventListener("input", applyFilters);
  filterBar.addEventListener("click", (e)=>{
    const b = e.target.closest("button[data-cat]");
    if(!b) return;
    filterBar.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    applyFilters();
  });
  applyFilters();
}

document.addEventListener("DOMContentLoaded", main);
