/* ============================================================================
   Painel GOP — aplicação em JavaScript puro (sem React, sem bibliotecas).
   Depende apenas de: data.js, icons.js, xlsx-reader.js, charts.js (todos locais).
   ========================================================================== */
(function () {
  "use strict";

  const APP_VERSION = "2.0.0";
  const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  /* ---------- DOM helper ---------- */
  // h("div.classe", {attrs}, ...filhos)  |  filhos: string | Node | array | falsy(ignorado)
  function h(tag, props, ...children) {
    let cls = "";
    const m = tag.match(/^([a-z0-9]+)((?:\.[^.#]+)*)(?:#([^.]+))?$/i);
    let name = tag, id = null;
    if (m) { name = m[1]; cls = (m[2] || "").split(".").filter(Boolean).join(" "); id = m[3] || null; }
    const el = document.createElement(name);
    if (cls) el.className = cls;
    if (id) el.id = id;
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === "class") el.className = (el.className ? el.className + " " : "") + v;
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k === "html") el.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "value") el.value = v;
        else if (k === "checked" || k === "disabled" || k === "selected") { if (v) el.setAttribute(k, ""); el[k] = !!v; }
        else el.setAttribute(k, v);
      }
    }
    append(el, children);
    return el;
  }
  function append(el, children) {
    for (const c of children) {
      if (c == null || c === false || c === true) continue;
      if (Array.isArray(c)) append(el, c);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
  }
  const ic = (name, opts) => window.icon(name, opts);
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };

  /* ---------- utils ---------- */
  const uid = () => Math.random().toString(36).slice(2, 10);
  const strip = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const ymLabel = (ym) => { const [y, m] = ym.split("-"); return MESES[+m - 1] + "/" + y; };
  const ymLabelFull = (ym) => { const [y, m] = ym.split("-"); return MESES_FULL[+m - 1] + " de " + y; };
  const fmtPct = (v) => v == null ? "—" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
  const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtPP = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  const LEVEL_COLOR = { G1:"#1B8C4C", G2:"#0E8A7B", G3:"#A97A1E", G4:"#C7791F" };
  const LEVEL_SOFT  = { G1:"#E5F4EA", G2:"#E1F1EE", G3:"#FBF2DE", G4:"#FBEDDB" };
  const C = getComputedStyle(document.documentElement);
  const cssvar = (n, fb) => (C.getPropertyValue(n) || fb).trim() || fb;
  const COL = {
    accent:"#0E8A7B", accentInk:"#0A6B60", ink:"#15212C", muted:"#65748A", border:"#E1E6EB",
    up:"#1B8C4C", down:"#D24343", gold:"#A97A1E", flat:"#8A97A5", flatSoft:"#EEF1F4",
  };

  /* ---------- META aliases (para importação) ---------- */
  const META_ALIAS = {};
  META_CANON.forEach((m) => { META_ALIAS[strip(m)] = m; });
  Object.assign(META_ALIAS, { "eficiencia":"Eficiencia","af sla 2 dias":"AF SLA 2 dias","fechamento sla 2 dias":"Fechamento SLA 2 dias" });
  const canonMeta = (hh) => META_ALIAS[strip(hh)] || null;

  /* ---------- patamares / avaliação ---------- */
  const alvoOf = (cfg) => cfg ? (cfg.g3 != null ? cfg.g3 : (cfg.alvo != null ? cfg.alvo : null)) : null;
  function tiersOf(cfg) {
    if (!cfg) return [];
    const out = [];
    if (cfg.g4 != null) out.push({ key:"G4", label:"Abaixo da Meta", value:cfg.g4, prem:cfg.valG4 });
    if (cfg.g3 != null) out.push({ key:"G3", label:"Meta", value:cfg.g3, prem:cfg.valG3 });
    if (cfg.g2 != null) out.push({ key:"G2", label:"Superação", value:cfg.g2, prem:cfg.valG2 });
    if (cfg.g1 != null) out.push({ key:"G1", label:"Alta Performance", value:cfg.g1, prem:cfg.valG1 });
    return out;
  }
  function evalMeta(cfg, v) {
    const tiers = tiersOf(cfg);
    const g3 = alvoOf(cfg);
    const cut = cfg && cfg.g6 != null ? cfg.g6 : null;
    if (v == null || !tiers.length) return { value:v, level:null, levelLabel:null, prem:0, hitG3:false, next:null, gap:null, tiers, g3, cut, belowCut:false, gapCut:null };
    let level = null, prem = 0;
    for (const t of tiers) { if (v >= t.value) { level = t; prem = t.prem != null ? t.prem : 0; } }
    const next = tiers.find((t) => v < t.value) || null;
    const gap = next ? Math.round((next.value - v) * 100) / 100 : null;
    const belowCut = cut != null && v < cut;
    const gapCut = cut != null ? Math.round((cut - v) * 100) / 100 : null;
    return { value:v, level: level ? level.key : null, levelLabel: level ? level.label : null, prem, hitG3: g3 != null && v >= g3, next, gap, tiers, g3, cut, belowCut, gapCut };
  }

  /* ---------- seed / estado ---------- */
  function buildSeed() {
    const profiles = Object.keys(SEED_PROFILES).map((name) => {
      const metas = {};
      const src = SEED_PROFILES[name];
      Object.keys(src).forEach((m) => { metas[m] = Object.assign({}, src[m]); });
      return { id: "p_" + uid(), name, metas };
    });
    const pByName = {}; profiles.forEach((p) => { pByName[strip(p.name)] = p.id; });
    const supervisors = [{ id:"s_"+uid(), name:"Supervisor 1" }, { id:"s_"+uid(), name:"Supervisor 2" }];
    const collaborators = SEED_COLLABS.map((row) => ({
      id:"c_"+uid(), matricula: row[0], perfilId: pByName[strip(row[1])] || null, supervisorId: null,
    }));
    const byMat = {};
    Object.keys(SEED_JUNE).forEach((mat) => { byMat[mat] = { valores: SEED_JUNE[mat].v, premiacao: SEED_JUNE[mat].p }; });
    return {
      version: 5, metas: META_CANON.slice(), profiles, supervisors, collaborators,
      monthly: { "2026-06": { byMat, importedAt: new Date().toISOString(), arquivo: "Exemplo_Junho_2026.xlsx" } },
    };
  }

  const STORAGE_KEY = "gop:data";
  let DB = null;
  let storageOk = true;

  function loadDB() {
    let data = null;
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) data = JSON.parse(raw); }
    catch (e) { storageOk = false; }
    if (!data) data = buildSeed();
    DB = data;
  }
  let saveTimer = null, savingFlag = false;
  function saveDB() {
    if (saveTimer) clearTimeout(saveTimer);
    savingFlag = true; renderFootStatus();
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }
      catch (e) { storageOk = false; }
      savingFlag = false; renderFootStatus();
    }, 400);
  }
  function update(fn) { fn(DB); saveDB(); rerender(); }

  /* ---------- consultas ---------- */
  function profById(id) { return DB.profiles.find((p) => p.id === id) || null; }
  function supById(id) { return DB.supervisors.find((s) => s.id === id) || null; }
  function months() { return Object.keys(DB.monthly).sort(); }
  function collabMonths(mat) { return Object.keys(DB.monthly).filter((ym) => DB.monthly[ym].byMat[mat]).sort(); }

  function scoreFor(collab, prof, ym) {
    if (!prof || !ym) return null;
    const rec = DB.monthly[ym] && DB.monthly[ym].byMat[collab.matricula];
    if (!rec) return null;
    const metas = Object.keys(prof.metas);
    if (!metas.length) return null;
    let hit=0, counted=0, prem=0, g1=0, g2=0, g3=0, g4=0, belowCut=0;
    metas.forEach((m) => {
      const v = rec.valores[m];
      if (v == null) return;
      counted++;
      const e = evalMeta(prof.metas[m], v);
      if (e.hitG3) hit++;
      if (e.belowCut) belowCut++;
      prem += e.prem || 0;
      if (e.level === "G1") g1++; else if (e.level === "G2") g2++; else if (e.level === "G3") g3++; else if (e.level === "G4") g4++;
    });
    return counted ? { pct:(hit/counted)*100, hit, counted, total:metas.length, prem, g1, g2, g3, g4, belowCut } : null;
  }

  // expõe para os outros módulos/segunda parte
  window.GOP = {
    h, append, ic, clear, uid, strip, ymLabel, ymLabelFull, fmtPct, fmtBRL, fmtPP,
    LEVEL_COLOR, LEVEL_SOFT, COL, MESES, MESES_FULL, APP_VERSION,
    META_ALIAS, canonMeta, alvoOf, tiersOf, evalMeta,
    buildSeed, loadDB, saveDB, update, get DB() { return DB; }, set DB(v){ DB=v; },
    get storageOk(){ return storageOk; }, set storageOk(v){ storageOk=v; }, get savingFlag(){ return savingFlag; },
    profById, supById, months, collabMonths, scoreFor,
    renderFootStatus: function(){ if (window.__renderFootStatus) window.__renderFootStatus(); },
    rerender: function(){ if (window.__rerender) window.__rerender(); },
  };
  function renderFootStatus(){ if (window.__renderFootStatus) window.__renderFootStatus(); }
  function rerender(){ if (window.__rerender) window.__rerender(); }
})();
