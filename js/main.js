/* Mapa Conceitual — Sistemas de Informação (IFMG Ouro Branco)
   Constrói um grafo Cytoscape.js a partir de data/mapa.json:
   Área --compõe--> Disciplina --contribui para--> Carreira */

const SLOT_COLOR = "#6b7280";
const CAREER_COLOR = "#f2b134";

let cy;
let DATA = null;
let areaById = {};
let discById = {};
let careerById = {};

const detailsContent = document.getElementById("details-content");
const careerSelect = document.getElementById("career-select");
const isolateToggle = document.getElementById("isolate-toggle");
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
  buildCareerSelect();
  buildGraph();
  wireControls();
}

function tintColor(hex, amount) {
  // lighten a hex color toward white by `amount` (0-1)
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

if (window.cytoscapeDagre) {
  cytoscape.use(window.cytoscapeDagre);
}

function buildGraph() {
  const elements = [];

  DATA.areas.forEach((area) => {
    elements.push({
      data: { id: area.id, label: area.nome, type: "area", color: area.cor },
    });
  });

  DATA.disciplinas.forEach((d) => {
    const area = areaById[d.areaId];
    const baseColor = d.tipo === "slot-optativa" ? SLOT_COLOR : area.cor;
    elements.push({
      data: {
        id: d.id,
        label: d.nome,
        type: "disciplina",
        discTipo: d.tipo,
        color: tintColor(baseColor, 0.82),
        borderColor: baseColor,
      },
    });
    if (d.tipo !== "slot-optativa") {
      elements.push({
        data: {
          id: `e-${area.id}-${d.id}`,
          source: area.id,
          target: d.id,
          kind: "area-disc",
        },
      });
    }
  });

  DATA.carreiras.forEach((c) => {
    elements.push({
      data: { id: c.id, label: c.nome, type: "carreira", color: CAREER_COLOR },
    });
  });

  DATA.disciplinas.forEach((d) => {
    (d.carreiras || []).forEach((rel) => {
      elements.push({
        data: {
          id: `e-${d.id}-${rel.carreiraId}`,
          source: d.id,
          target: rel.carreiraId,
          kind: "disc-carreira",
          peso: rel.peso,
        },
      });
    });
  });

  cy = cytoscape({
    container: document.getElementById("cy"),
    elements,
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          shape: "round-rectangle",
          width: "label",
          height: "label",
          padding: "10px",
          "font-size": "11px",
          "font-family": "Segoe UI, Roboto, Arial, sans-serif",
          "font-weight": "600",
          color: "#12172a",
          "text-wrap": "wrap",
          "text-max-width": "110px",
          "text-valign": "center",
          "text-halign": "center",
          "background-color": "data(color)",
          "border-width": 2,
          "border-color": "data(borderColor)",
        },
      },
      {
        selector: 'node[type="area"]',
        style: {
          "font-size": "13px",
          "font-weight": "bold",
          color: "#ffffff",
          "border-width": 0,
          "text-max-width": "130px",
        },
      },
      {
        selector: 'node[type="disciplina"]',
        style: {
          "font-size": "10px",
        },
      },
      {
        selector: 'node[discTipo="optativa"]',
        style: { "border-style": "dashed" },
      },
      {
        selector: 'node[discTipo="slot-optativa"]',
        style: { "border-style": "dotted", color: "#4b5773", "font-style": "italic" },
      },
      {
        selector: 'node[type="carreira"]',
        style: {
          "font-size": "12px",
          "font-weight": "bold",
          color: "#241a02",
          "border-width": 3,
          "border-color": "#c98a10",
          "text-max-width": "120px",
        },
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
        },
      },
      {
        selector: 'edge[kind="area-disc"]',
        style: {
          width: 1.6,
          "line-color": "#3d4b70",
          "target-arrow-shape": "none",
          opacity: 0.7,
        },
      },
      {
        selector: 'edge[kind="disc-carreira"]',
        style: {
          "line-style": "dashed",
          "target-arrow-shape": "triangle",
          "arrow-scale": 0.7,
          "target-arrow-color": "#f2b134",
        },
      },
      {
        selector: 'edge[kind="disc-carreira"][peso="forte"]',
        style: {
          width: 2,
          "line-color": "#f2b134",
          opacity: 0.6,
        },
      },
      {
        selector: 'edge[kind="disc-carreira"][peso="moderado"]',
        style: {
          width: 1,
          "line-color": "#f2b134",
          opacity: 0.3,
        },
      },
      {
        selector: ".dimmed",
        style: { opacity: 0.06 },
      },
      {
        selector: ".hidden-el",
        style: { display: "none" },
      },
      {
        selector: ".highlighted",
        style: { opacity: 1 },
      },
      {
        selector: "node.selected",
        style: {
          "border-width": 4,
          "border-color": "#ffffff",
        },
      },
    ],
    layout: {
      name: "dagre",
      rankDir: "LR",
      nodeSep: 14,
      rankSep: 220,
      edgeSep: 10,
      align: undefined,
      animate: false,
      fit: true,
      padding: 40,
    },
    minZoom: 0.08,
    maxZoom: 3,
    wheelSensitivity: 0.25,
  });

  cy.on("tap", "node", (evt) => {
    const node = evt.target;
    selectNode(node.id());
  });

  cy.on("tap", (evt) => {
    if (evt.target === cy) clearSelectionStyles();
  });
}

function clearSelectionStyles() {
  cy.nodes().removeClass("selected");
}

function selectNode(id) {
  clearSelectionStyles();
  cy.getElementById(id).addClass("selected");
  cy.animate({ center: { eles: cy.getElementById(id) }, zoom: Math.max(cy.zoom(), 1) }, { duration: 300 });
  renderDetails(id);
}

function renderDetails(id) {
  const area = areaById[id];
  const disc = discById[id];
  const career = careerById[id];

  if (area) {
    const discs = DATA.disciplinas.filter((d) => d.areaId === id && d.tipo !== "slot-optativa");
    detailsContent.innerHTML = `
      <span class="details-type" style="border-color:${area.cor};color:${area.cor}">Área</span>
      <h3>${area.nome}</h3>
      <p>${area.descricao}</p>
      <div class="meta-row"><span class="meta-chip">${discs.length} disciplina(s)</span></div>
      <ul>${discs
        .map((d) => `<li><button data-goto="${d.id}">${d.nome}</button></li>`)
        .join("")}</ul>
    `;
  } else if (disc) {
    const area2 = areaById[disc.areaId];
    const carreiras = (disc.carreiras || []).map((rel) => careerById[rel.carreiraId]);
    const tipoLabel =
      disc.tipo === "obrigatoria" ? "Obrigatória" : disc.tipo === "optativa" ? "Optativa" : "Vaga de optativa";
    detailsContent.innerHTML = `
      <span class="details-type" style="border-color:${area2.cor};color:${area2.cor}">Disciplina · ${tipoLabel}</span>
      <h3>${disc.nome}</h3>
      <p>${disc.descricao}</p>
      <div class="meta-row">
        <span class="meta-chip">${disc.cargaHoraria}h</span>
        <span class="meta-chip">${disc.periodo ? disc.periodo + "º período" : disc.periodoTipico || ""}</span>
        <span class="meta-chip"><button data-goto="${area2.id}" style="color:inherit;background:none;border:none;padding:0;cursor:pointer;">${area2.nome}</button></span>
      </div>
      ${
        disc.prerequisitos && disc.prerequisitos.length
          ? `<p><strong>Pré-requisito(s):</strong></p><ul>${disc.prerequisitos
              .map((p) => `<li><button data-goto="${p}">${discById[p]?.nome || p}</button></li>`)
              .join("")}</ul>`
          : ""
      }
      ${
        carreiras.length
          ? `<p><strong>Contribui para as carreiras:</strong></p><ul>${carreiras
              .map((c) => `<li><button data-goto="${c.id}">${c.nome}</button></li>`)
              .join("")}</ul>`
          : `<p><em>Disciplina de formação de base, sem ligação direta com uma carreira específica no mapa.</em></p>`
      }
    `;
  } else if (career) {
    const related = DATA.disciplinas.filter((d) => (d.carreiras || []).some((r) => r.carreiraId === id));
    const strong = related.filter((d) => d.carreiras.find((r) => r.carreiraId === id).peso === "forte");
    const mod = related.filter((d) => d.carreiras.find((r) => r.carreiraId === id).peso === "moderado");
    const aggInfo = career.agregaCarreiras
      ? `<p><em>Agrupamento sugerido, reunindo as carreiras: ${career.agregaCarreiras
          .map((cid) => careerById[cid].nome)
          .join(" + ")}.</em></p>`
      : "";
    detailsContent.innerHTML = `
      <span class="details-type" style="border-color:${CAREER_COLOR};color:${CAREER_COLOR}">Carreira</span>
      <h3>${career.nome}</h3>
      <p>${career.descricao}</p>
      ${aggInfo}
      <div class="meta-row"><span class="meta-chip">${related.length} disciplina(s) relacionadas</span></div>
      ${strong.length ? `<p><strong>Disciplinas-chave:</strong></p><ul>${strong.map((d) => `<li><button data-goto="${d.id}">${d.nome}</button></li>`).join("")}</ul>` : ""}
      ${mod.length ? `<p><strong>Disciplinas de apoio:</strong></p><ul>${mod.map((d) => `<li><button data-goto="${d.id}">${d.nome}</button></li>`).join("")}</ul>` : ""}
    `;
  }

  detailsContent.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => selectNode(btn.getAttribute("data-goto")));
  });
}

function buildAreaLegend() {
  const el = document.getElementById("area-legend");
  el.innerHTML = DATA.areas
    .map(
      (a) =>
        `<div class="area-legend-item"><span class="area-legend-swatch" style="background:${a.cor}"></span>${a.nome}</div>`
    )
    .join("");
}

function buildCareerSelect() {
  DATA.carreiras.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nome;
    careerSelect.appendChild(opt);
  });
}

function applyCareerHighlight(careerId) {
  cy.elements().removeClass("dimmed highlighted hidden-el");
  if (!careerId) return;

  const careerNode = cy.getElementById(careerId);
  const discEdges = careerNode.connectedEdges('[kind="disc-carreira"]');
  const discNodes = discEdges.sources();
  const areaEdges = discNodes.connectedEdges('[kind="area-disc"]');
  const areaNodes = areaEdges.sources();

  const keep = careerNode.union(discNodes).union(areaNodes).union(discEdges).union(areaEdges);

  if (isolateToggle.checked) {
    cy.elements().difference(keep).addClass("hidden-el");
    keep.addClass("highlighted");
  } else {
    cy.elements().difference(keep).addClass("dimmed");
    keep.addClass("highlighted");
  }
}

function wireControls() {
  document.getElementById("toggle-intro").addEventListener("click", () => {
    const intro = document.getElementById("intro");
    intro.classList.toggle("collapsed");
  });
  document.getElementById("close-intro").addEventListener("click", () => {
    document.getElementById("intro").classList.add("collapsed");
  });

  careerSelect.addEventListener("change", () => applyCareerHighlight(careerSelect.value));
  isolateToggle.addEventListener("change", () => applyCareerHighlight(careerSelect.value));

  document.getElementById("reset-view").addEventListener("click", () => {
    careerSelect.value = "";
    isolateToggle.checked = false;
    cy.elements().removeClass("dimmed highlighted hidden-el selected");
    cy.fit(undefined, 40);
    detailsContent.innerHTML = `<p class="details-placeholder">Clique em uma área, disciplina ou carreira para ver os detalhes aqui.</p>`;
  });

  document.getElementById("close-details").addEventListener("click", () => {
    clearSelectionStyles();
    detailsContent.innerHTML = `<p class="details-placeholder">Clique em uma área, disciplina ou carreira para ver os detalhes aqui.</p>`;
  });

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchResults.innerHTML = "";
      return;
    }
    const matches = [];
    DATA.disciplinas.forEach((d) => {
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
      .map((m) => `<div class="search-result-item" data-goto="${m.id}"><span>${m.nome}</span><span class="tag">${m.tag}</span></div>`)
      .join("");

    searchResults.querySelectorAll("[data-goto]").forEach((row) => {
      row.addEventListener("click", () => {
        selectNode(row.getAttribute("data-goto"));
        searchResults.innerHTML = "";
        searchInput.value = "";
      });
    });
  });
}
