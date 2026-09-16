/* Mapa Conceitual — Sistemas de Informação (IFMG Ouro Branco)
   Dois modos, sem grafo com física:
   1) Estrutura do Curso — árvore/accordion: Curso -> Áreas -> Disciplinas
   2) Trilhas de Carreira — roadmap linear vertical por período, uma carreira por vez */

let DATA = null;
let areaById = {};
let discById = {};
let careerById = {};

let currentTab = "estrutura";
let expandedAreaId = null;
let activeCareerId = null;

const detailsContent = document.getElementById("details-content");
const areasRow = document.getElementById("areas-row");
const areaExpandPanel = document.getElementById("area-expand-panel");
const careersMenu = document.getElementById("careers-menu");
const roadmapHeader = document.getElementById("roadmap-header");
const roadmapContent = document.getElementById("roadmap-content");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

init();

async function init() {
  const res = await fetch("data/mapa.json");
  DATA = await res.json();

  areaById = Object.fromEntries(DATA.areas.map((a) => [a.id, a]));
  discById = Object.fromEntries(DATA.disciplinas.map((d) => [d.id, d]));
  careerById = Object.fromEntries(DATA.carreiras.map((c) => [c.id, c]));

  buildAreaLegend();
  buildAreasRow();
  buildCareersMenu();
  wireControls();
}

/* ---------------- Helpers ---------------- */

function disciplinasDaArea(areaId) {
  return DATA.disciplinas.filter((d) => d.areaId === areaId && d.tipo !== "slot-optativa");
}

function disciplinasDaCarreira(careerId) {
  return DATA.disciplinas.filter((d) => (d.carreiras || []).some((r) => r.carreiraId === careerId));
}

function pesoDaCarreira(disc, careerId) {
  const rel = (disc.carreiras || []).find((r) => r.carreiraId === careerId);
  return rel ? rel.peso : null;
}

function tipoLabel(tipo) {
  return tipo === "obrigatoria" ? "Obrigatória" : tipo === "optativa" ? "Optativa" : "Vaga de optativa";
}

function scrollToEl(el) {
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------------- Legend ---------------- */

function buildAreaLegend() {
  const el = document.getElementById("area-legend");
  el.innerHTML = DATA.areas
    .map(
      (a) =>
        `<span class="area-legend-item"><span class="area-legend-swatch" style="background:${a.cor}"></span>${a.nome}</span>`
    )
    .join("");
}

/* ---------------- Modo 1: Estrutura do Curso ---------------- */

function buildAreasRow() {
  areasRow.innerHTML = DATA.areas
    .map((a) => {
      const count = disciplinasDaArea(a.id).length;
      return `
      <button class="area-card" data-area="${a.id}" style="background:${a.cor}">
        ${a.nome}
        <span class="area-count">${count} disciplina(s)</span>
        <span class="chevron">▾</span>
      </button>`;
    })
    .join("");

  areasRow.querySelectorAll(".area-card").forEach((btn) => {
    btn.addEventListener("click", () => toggleArea(btn.getAttribute("data-area")));
  });
}

function toggleArea(areaId) {
  if (expandedAreaId === areaId) {
    expandedAreaId = null;
  } else {
    expandedAreaId = areaId;
  }
  renderAreaExpansion();
}

function renderAreaExpansion() {
  areasRow.querySelectorAll(".area-card").forEach((btn) => {
    btn.classList.toggle("expanded", btn.getAttribute("data-area") === expandedAreaId);
  });

  if (!expandedAreaId) {
    areaExpandPanel.innerHTML = "";
    return;
  }

  const area = areaById[expandedAreaId];
  const discs = disciplinasDaArea(expandedAreaId).slice().sort((a, b) => {
    const pa = a.periodo ?? 99;
    const pb = b.periodo ?? 99;
    return pa - pb;
  });

  areaExpandPanel.innerHTML = `
    <div class="area-expand-inner">
      <h3>${area.nome}</h3>
      <p class="area-desc">${area.descricao}</p>
      <div class="discipline-grid">
        ${discs
          .map((d) => {
            const periodoTxt = d.periodo ? `${d.periodo}º período` : d.periodoTipico || "";
            return `
          <button class="discipline-chip ${d.tipo === "optativa" ? "optativa" : ""}" style="--chip-color:${area.cor}" data-disc="${d.id}">
            ${d.nome}
            <span class="chip-meta">
              <span class="chip-badge">${d.cargaHoraria}h</span>
              <span class="chip-badge">${periodoTxt}</span>
            </span>
          </button>`;
          })
          .join("")}
      </div>
    </div>`;

  areaExpandPanel.querySelectorAll("[data-disc]").forEach((btn) => {
    btn.addEventListener("click", () => selectDisciplina(btn.getAttribute("data-disc")));
  });
}

/* ---------------- Modo 2: Trilhas de Carreira ---------------- */

function buildCareersMenu() {
  careersMenu.innerHTML = DATA.carreiras
    .map((c) => `<button class="career-item" data-career="${c.id}">${c.nome}</button>`)
    .join("");

  careersMenu.querySelectorAll("[data-career]").forEach((btn) => {
    btn.addEventListener("click", () => selectCareer(btn.getAttribute("data-career")));
  });
}

function selectCareer(careerId) {
  activeCareerId = careerId;
  careersMenu.querySelectorAll(".career-item").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-career") === careerId);
  });
  renderRoadmap(careerId);
}

function renderRoadmap(careerId) {
  const career = careerById[careerId];
  const related = disciplinasDaCarreira(careerId);

  const aggInfo = career.agregaCarreiras
    ? `<p class="desc"><em>Agrupamento sugerido, reunindo as carreiras: ${career.agregaCarreiras
        .map((cid) => careerById[cid].nome)
        .join(" + ")}. Não é um nome literal do PPC, mas uma trilha comum de mercado.</em></p>`
    : "";

  roadmapHeader.innerHTML = `
    <h2>${career.nome}</h2>
    <p class="desc">${career.descricao}</p>
    ${aggInfo}
    <div class="meta-row">
      <span class="meta-chip">${related.length} disciplina(s) na trilha</span>
      <button id="trocar-carreira" class="btn-secondary">🔁 Ver outra carreira</button>
    </div>
  `;
  document.getElementById("trocar-carreira").addEventListener("click", () => {
    scrollToEl(document.querySelector(".careers-list"));
  });

  const comPeriodo = related.filter((d) => d.periodo != null).sort((a, b) => a.periodo - b.periodo);
  const semPeriodo = related.filter((d) => d.periodo == null);

  const periodos = {};
  comPeriodo.forEach((d) => {
    periodos[d.periodo] = periodos[d.periodo] || [];
    periodos[d.periodo].push(d);
  });

  let html = "";
  let first = true;
  Object.keys(periodos)
    .sort((a, b) => a - b)
    .forEach((p) => {
      html += renderPeriodSection(`${p}º Período`, periodos[p], careerId, first, false);
      first = false;
    });

  if (semPeriodo.length) {
    html += renderPeriodSection("Optativas relacionadas (5º–8º período)", semPeriodo, careerId, first, true);
  }

  if (!related.length) {
    html = `<p class="details-placeholder">Nenhuma disciplina mapeada para esta carreira.</p>`;
  }

  roadmapContent.innerHTML = html;

  roadmapContent.querySelectorAll("[data-disc]").forEach((btn) => {
    btn.addEventListener("click", () => selectDisciplina(btn.getAttribute("data-disc")));
  });
}

function renderPeriodSection(label, discs, careerId, isFirst, isOptativas) {
  const area = null;
  return `
    <div class="period-section ${isOptativas ? "optativas-section" : ""}">
      ${isFirst ? "" : '<div class="period-connector"></div>'}
      <div class="period-label">${label}</div>
      <div class="period-row">
        ${discs
          .map((d) => {
            const a = areaById[d.areaId];
            const peso = pesoDaCarreira(d, careerId);
            return `
          <button class="roadmap-disc-card ${d.tipo === "optativa" ? "optativa" : ""}" style="--chip-color:${a.cor}" data-disc="${d.id}">
            ${d.nome}
            <span class="chip-meta">
              <span class="chip-badge">${a.nome}</span>
              <span class="chip-badge">${peso === "forte" ? "chave" : "apoio"}</span>
            </span>
          </button>`;
          })
          .join("")}
      </div>
    </div>`;
}

/* ---------------- Painel de detalhes ---------------- */

function selectDisciplina(id) {
  const disc = discById[id];
  const area = areaById[disc.areaId];
  const carreiras = (disc.carreiras || []).map((rel) => ({ ...careerById[rel.carreiraId], peso: rel.peso }));

  detailsContent.innerHTML = `
    <span class="details-type" style="border-color:${area.cor};color:${area.cor}">Disciplina · ${tipoLabel(disc.tipo)}</span>
    <h3>${disc.nome}</h3>
    <p>${disc.descricao}</p>
    <div class="meta-row">
      <span class="meta-chip">${disc.cargaHoraria}h</span>
      <span class="meta-chip">${disc.periodo ? disc.periodo + "º período" : disc.periodoTipico || ""}</span>
      <span class="meta-chip"><button data-goto-area="${area.id}" style="color:inherit;background:none;border:none;padding:0;cursor:pointer;">${area.nome}</button></span>
    </div>
    ${
      disc.prerequisitos && disc.prerequisitos.length
        ? `<p><strong>Pré-requisito(s):</strong></p><ul>${disc.prerequisitos
            .map((p) => `<li><button data-goto-disc="${p}">${discById[p]?.nome || p}</button></li>`)
            .join("")}</ul>`
        : ""
    }
    ${
      carreiras.length
        ? `<p><strong>Contribui para as carreiras:</strong></p><ul>${carreiras
            .map((c) => `<li><button data-goto-career="${c.id}">${c.nome}</button> <em style="color:var(--text-dim);font-size:0.75rem;">(${c.peso})</em></li>`)
            .join("")}</ul>`
        : `<p><em>Disciplina de formação de base, sem ligação direta com uma carreira específica no mapa.</em></p>`
    }
  `;
  wireDetailsLinks();
}

function selectCareerDetailsShortcut(id) {
  // usado pela busca: leva o usuário até o modo Trilhas com a carreira já selecionada
  switchTab("trilhas");
  selectCareer(id);
  scrollToEl(roadmapHeader);
}

function wireDetailsLinks() {
  detailsContent.querySelectorAll("[data-goto-disc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const discId = btn.getAttribute("data-goto-disc");
      goToDisciplina(discId);
    });
  });
  detailsContent.querySelectorAll("[data-goto-area]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab("estrutura");
      const areaId = btn.getAttribute("data-goto-area");
      expandedAreaId = areaId;
      renderAreaExpansion();
      scrollToEl(areaExpandPanel);
    });
  });
  detailsContent.querySelectorAll("[data-goto-career]").forEach((btn) => {
    btn.addEventListener("click", () => selectCareerDetailsShortcut(btn.getAttribute("data-goto-career")));
  });
}

function goToDisciplina(discId) {
  const disc = discById[discId];
  switchTab("estrutura");
  expandedAreaId = disc.areaId;
  renderAreaExpansion();
  selectDisciplina(discId);
  scrollToEl(areaExpandPanel);
}

/* ---------------- Tabs ---------------- */

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
  });
  document.getElementById("mode-estrutura").classList.toggle("active", tab === "estrutura");
  document.getElementById("mode-trilhas").classList.toggle("active", tab === "trilhas");
}

/* ---------------- Controles gerais ---------------- */

function wireControls() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
  });

  document.getElementById("toggle-intro").addEventListener("click", () => {
    document.getElementById("intro").classList.toggle("collapsed");
  });
  document.getElementById("close-intro").addEventListener("click", () => {
    document.getElementById("intro").classList.add("collapsed");
  });

  document.getElementById("close-details").addEventListener("click", () => {
    detailsContent.innerHTML = `<p class="details-placeholder">Clique em uma área, disciplina ou carreira para ver os detalhes aqui.</p>`;
  });

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchResults.innerHTML = "";
      return;
    }
    const matches = [];
    DATA.disciplinas
      .filter((d) => d.tipo !== "slot-optativa")
      .forEach((d) => {
        if (d.nome.toLowerCase().includes(q)) matches.push({ id: d.id, nome: d.nome, tag: "Disciplina" });
      });
    DATA.carreiras.forEach((c) => {
      if (c.nome.toLowerCase().includes(q)) matches.push({ id: c.id, nome: c.nome, tag: "Carreira" });
    });
    DATA.areas.forEach((a) => {
      if (a.nome.toLowerCase().includes(q)) matches.push({ id: a.id, nome: a.nome, tag: "Área" });
    });

    searchResults.innerHTML = matches
      .slice(0, 15)
      .map((m) => `<div class="search-result-item" data-id="${m.id}" data-tag="${m.tag}"><span>${m.nome}</span><span class="tag">${m.tag}</span></div>`)
      .join("");

    searchResults.querySelectorAll("[data-id]").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-id");
        const tag = row.getAttribute("data-tag");
        if (tag === "Disciplina") goToDisciplina(id);
        else if (tag === "Área") {
          switchTab("estrutura");
          expandedAreaId = id;
          renderAreaExpansion();
          scrollToEl(areaExpandPanel);
        } else if (tag === "Carreira") {
          selectCareerDetailsShortcut(id);
        }
        searchResults.innerHTML = "";
        searchInput.value = "";
      });
    });
  });
}
