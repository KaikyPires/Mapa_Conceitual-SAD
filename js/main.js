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

function pastelBg(hex) {
  // clareia um hex em direção ao branco, para uso como fundo de chip
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const amount = 0.85;
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function areaChip(area) {
  return `<span class="chip chip-area" style="background:${pastelBg(area.cor)};color:${area.cor}">${area.nome}</span>`;
}

function optativaTag(disc) {
  return disc.tipo === "optativa" ? `<span class="chip chip-optativa-tag">Optativa</span>` : "";
}

/* ---------------- Legend ---------------- */

function buildAreaLegend() {
  const el = document.getElementById("area-legend");
  el.innerHTML = DATA.areas.map((a) => areaChip(a)).join("");
}

/* ---------------- Modo 1: Estrutura do Curso ---------------- */

function buildAreasRow() {
  areasRow.innerHTML = DATA.areas
    .map((a) => {
      const count = disciplinasDaArea(a.id).length;
      return `
      <button class="area-card" data-area="${a.id}">
        <span class="area-card-top">
          <span class="area-dot" style="background:${a.cor}"></span>
          <span class="area-name">${a.nome}</span>
          <span class="chevron">⌄</span>
        </span>
        <span class="area-count">${count} disciplina(s)</span>
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
          <button class="disc-card ${d.tipo === "optativa" ? "optativa" : ""}" data-disc="${d.id}">
            <span class="disc-card-title">${d.nome}</span>
            <span class="disc-card-tags">
              ${optativaTag(d)}
              ${areaChip(area)}
              <span class="chip chip-muted">${d.cargaHoraria}h</span>
              <span class="chip chip-muted">${periodoTxt}</span>
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
    </div>
  `;

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
          <button class="disc-card ${d.tipo === "optativa" ? "optativa" : ""}" data-disc="${d.id}">
            <span class="disc-card-title">${d.nome}</span>
            <span class="disc-card-tags">
              ${optativaTag(d)}
              ${areaChip(a)}
              <span class="chip chip-muted">${peso === "forte" ? "chave" : "apoio"}</span>
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
    <span class="details-type" style="background:${pastelBg(area.cor)};color:${area.cor}">Disciplina · ${tipoLabel(disc.tipo)}</span>
    <h3>${disc.nome}</h3>
    <p class="details-desc">${disc.descricao}</p>
    <div class="meta-row">
      <span class="chip chip-muted">${disc.cargaHoraria}h</span>
      <span class="chip chip-muted">${disc.periodo ? disc.periodo + "º período" : disc.periodoTipico || ""}</span>
      <button class="chip chip-link" data-goto-area="${area.id}">${area.nome}</button>
    </div>
    ${
      disc.prerequisitos && disc.prerequisitos.length
        ? `<div class="details-section">
            <h4 class="details-section-title">Pré-requisito(s)</h4>
            <ul class="details-list">${disc.prerequisitos
              .map((p) => `<li><button data-goto-disc="${p}">${discById[p]?.nome || p}</button></li>`)
              .join("")}</ul>
          </div>`
        : ""
    }
    ${
      carreiras.length
        ? `<div class="details-section">
            <h4 class="details-section-title">Contribui para as carreiras</h4>
            <ul class="details-list">${carreiras
              .map(
                (c) =>
                  `<li><button data-goto-career="${c.id}">${c.nome}</button><span class="chip chip-muted">${c.peso}</span></li>`
              )
              .join("")}</ul>
          </div>`
        : `<p class="details-desc"><em>Disciplina de formação de base, sem ligação direta com uma carreira específica no mapa.</em></p>`
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

  document.getElementById("close-intro").addEventListener("click", () => {
    document.getElementById("intro").classList.add("collapsed");
  });
}
