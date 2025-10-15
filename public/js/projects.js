// public/js/projects.js
const wrap = document.getElementById("projects"); // this element has class="film"
const dlg  = document.getElementById("detail");
const body = document.getElementById("detailBody");

// Map project id → image in /public/images (use your actual file names)
const IMAGE_MAP = {
  "desktop-utility":  "images/desktop-utility-thumb.jpg",
  "remax-admin":      "images/remax-admin-thumb.jpg",
  "parcelpro":        "images/parcelpro-thumb.jpg",
  "retechx":          "images/retechx-thumb.jpg",
  "colortone":        "images/colortone-thumb.jpg",
  "flask-auth":       "images/flask-auth-thumb.jpg",
  "password-manager": "images/password-manager-thumb.jpg"
};

// Accept either an array or { projects: [] }
function normalizeProjects(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.projects)) return payload.projects;
  return [];
}

fetch("/api/projects")
  .then(r => r.json())
  .then(data => {
    const list = normalizeProjects(data);

    // Render cards (with image if available)
    wrap.innerHTML = list.map(p => {
      const img = IMAGE_MAP[p.id]
        ? `<div class="thumb">
             <img loading="lazy"
                  src="${IMAGE_MAP[p.id]}"
                  alt="${p.title} thumbnail"
                  onerror="this.closest('.thumb').classList.add('noimg'); this.remove();">
           </div>`
        : "";

      return `
        <article class="card" id="${p.id}">
          ${img}
          <h3>${p.title}</h3>
          <p>${p.blurb}</p>
          <div>${(p.tech || []).map(t => `<span class="pill">${t}</span>`).join("")}</div>
          <div style="margin-top:.6rem">
            ${p.links?.github ? `<a class="cta" href="${p.links.github}" target="_blank">GitHub</a>` : ""}
            ${p.links?.live   ? `<a class="cta" href="${p.links.live}"   target="_blank">Live</a>`   : ""}
            <button class="cta" data-id="${p.id}" aria-label="Open details of ${p.title}">More</button>
          </div>
        </article>
      `;
    }).join("");

    // ------- Dialog (More) -------
    wrap.addEventListener("click", (e) => {
      const id = e.target?.dataset?.id;
      if (!id) return;
      const p = list.find(x => x.id === id);
      if (!p) return;

      body.innerHTML = `
        <h2>${p.title}</h2>
        <p>${p.blurb}</p>
        ${p.tech?.length ? `<h3>Tech</h3><p>${p.tech.map(t => `<span class="pill">${t}</span>`).join("")}</p>` : ""}
      `;
      dlg.showModal();
    });

    // ------- Deep link via #id -------
    const anchor = location.hash?.slice(1);
    if (anchor) {
      const p = list.find(x => x.id === anchor);
      if (p) {
        body.innerHTML = `<h2>${p.title}</h2><p>${p.blurb}</p>`;
        dlg.showModal();
      }
    }

    // ===== Filmstrip interactions =====
    const film   = wrap; // #projects is the film container
    const prevBtn = document.querySelector(".film-btn.prev");
    const nextBtn = document.querySelector(".film-btn.next");

    if (film && prevBtn && nextBtn) {
      const step = () => Math.max(film.clientWidth * 0.9, 300);

      // Arrow buttons
      prevBtn.addEventListener("click", () =>
        film.scrollBy({ left: -step(), behavior: "smooth" })
      );
      nextBtn.addEventListener("click", () =>
        film.scrollBy({ left:  step(), behavior: "smooth" })
      );

      // Horizontal wheel scroll (nice on trackpads/mice)
      film.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          film.scrollLeft += e.deltaY;
        }
      }, { passive: false });

      // Drag to scroll (desktop)
      let isDown = false, startX = 0, startLeft = 0;
      film.addEventListener("mousedown", (e) => {
        isDown = true; film.classList.add("dragging");
        startX = e.pageX; startLeft = film.scrollLeft;
      });
      ["mouseleave","mouseup"].forEach(ev => film.addEventListener(ev, () => {
        isDown = false; film.classList.remove("dragging");
      }));
      film.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        const dx = e.pageX - startX;
        film.scrollLeft = startLeft - dx;
      });

      // Optionally try to center hovered card
      film.addEventListener("mouseover", (e) => {
        const card = e.target.closest(".card");
        if (!card) return;
        const { left, width } = card.getBoundingClientRect();
        const cx = left + width / 2;
        const vw = window.innerWidth;
        if (cx < vw * 0.25 || cx > vw * 0.75) {
          card.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
        }
      });
    }
  })
  .catch(err => {
    console.error("Failed to load /api/projects:", err);
    wrap.innerHTML = `<p class="muted">Couldn’t load projects right now.</p>`;
  });
