/* ============================================================================
   Painel GOP — script.js  (Vanilla JS, sem React/JSX/Tailwind runtime)
   ----------------------------------------------------------------------------
   Estrutura geral (espelha o arquivo JSX original):
     1) TOKENS / CONSTANTES
     2) HELPERS (uid, strip, formatadores, etc.)
     3) ÍCONES (substituem lucide-react por SVG inline idêntico)
     4) DOM HELPER  h()  — mini-fábrica de elementos (substitui o JSX)
     5) SEED de dados + migrações de versão
     6) HELPERS DE DADOS (scoreFor, evalMeta, profForMonth, …)
     7) GERAÇÃO DE PPT (copiada integralmente — já era framework-free)
     8) ESTADO GLOBAL + render() (substitui useState/useEffect/re-render)
     9) VIEWS: Home, CollabDetail, ImportView, Admin (+subviews) e Modais
   ----------------------------------------------------------------------------
   Conversão de hooks React:
     - useState  -> propriedades em objetos de estado + chamada a rerender()
     - useEffect -> efeitos disparados manualmente nos pontos equivalentes
     - useMemo / useCallback -> simples funções recalculadas no render
     - useRef    -> variáveis de módulo / closures
   ============================================================================ */

"use strict";

/* ============================== TOKENS ============================== */
const APP_VERSION = "1.0.0";
const C = {
  bg: "#EDF0F3", surface: "#FFFFFF", border: "#E1E6EB", ink: "#15212C", muted: "#65748A",
  sidebar: "#0B222F", sidebarHi: "#10394D", accent: "#0E8A7B", accentInk: "#0A6B60",
  accentSoft: "#E1F1EE", up: "#1B8C4C", upSoft: "#E5F4EA", down: "#D24343", downSoft: "#FBE9E9",
  flat: "#8A97A5", flatSoft: "#EEF1F4", gold: "#A97A1E", goldSoft: "#FBF2DE",
  okBg: "#F0F8F4", okBorder: "#BFE3CD", badBg: "#FCF1F0",
};
const FONT_HEAD = "'Archivo', 'Inter', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/* ============================== HELPERS ============================== */
const uid = () => Math.random().toString(36).slice(2, 10);
const strip = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const ymLabel = (ym) => { const [y, m] = ym.split("-"); return `${MESES[+m - 1]}/${y}`; };
const ymLabelFull = (ym) => { const [y, m] = ym.split("-"); return `${MESES_FULL[+m - 1]} de ${y}`; };
const fmtPct = (v) => v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const fmtBRL = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const META_CANON = ["Tabulação", "CSAT", "CSAT Resposta", "ABS", "Monitoria", "Eficiencia", "Tempo resposta", "AF SLA 2 dias", "Assertividade", "Fechamento SLA 2 dias", "Tempo Produtivo", "Faturamento 2 dias"];
const META_ALIAS = {};
META_CANON.forEach((m) => { META_ALIAS[strip(m)] = m; });
Object.assign(META_ALIAS, { "eficiência": "Eficiencia", "af sla 2 dias": "AF SLA 2 dias", "fechamento sla 2 dias": "Fechamento SLA 2 dias" });
const canonMeta = (h) => META_ALIAS[strip(h)] || null;

/* ============================== ÍCONES (lucide -> SVG inline) ============================== */
/* Cada função recebe { size, color, class } e devolve um <svg> idêntico ao
   ícone correspondente do lucide-react usado no projeto. */
const ICON_PATHS = {
  LayoutDashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  Upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  Settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  Search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  ChevronLeft: '<path d="m15 18-6-6 6-6"/>',
  ChevronRight: '<path d="m9 18 6-6-6-6"/>',
  TrendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  TrendingDown: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  Minus: '<path d="M5 12h14"/>',
  Plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  Pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  Trash2: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  Award: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  FileSpreadsheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
  AlertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  X: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  Users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  Target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  History: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  UserCog: '<circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/>',
  CalendarDays: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
  Save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  Download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
};

/* Cria um <svg> de ícone. `cls` recebe classes utilitárias (ex.: "shrink-0"). */
function icon(name, { size = 18, color = "currentColor", cls = "" } = {}) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", color);
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", ("lucide " + cls).trim());
  svg.innerHTML = ICON_PATHS[name] || "";
  return svg;
}

/* ============================== DOM HELPER (substitui o JSX) ============================== */
/*
  h(tag, props, ...children)
  - props.class      -> className
  - props.style      -> objeto de estilos inline (camelCase ou kebab)
  - props.on{Event}  -> listeners (onClick -> click, onChange -> change, …)
  - demais props      -> atributos / propriedades diretas (value, checked, type…)
  - children: nós, strings, números, null/false (ignorados) ou arrays
*/
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class" || k === "className") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k === "style") el.setAttribute("style", v);
      else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === "checked" || k === "disabled" || k === "selected") {
        el[k] = !!v;
      } else if (k === "value") {
        el.value = v;
      } else if (k === "html") {
        el.innerHTML = v;
      } else {
        el.setAttribute(k, v);
      }
    }
  }
  appendChildren(el, children);
  return el;
}
function appendChildren(el, children) {
  for (const c of children) {
    if (c == null || c === false || c === true) continue;
    if (Array.isArray(c)) { appendChildren(el, c); continue; }
    if (c instanceof Node) { el.appendChild(c); continue; }
    el.appendChild(document.createTextNode(String(c)));
  }
}
/* fragmento: devolve um array de nós (para usar como children) */
const frag = (...nodes) => nodes;

/* ============================== SEED ============================== */
const SEED_PROFILES = {
  "Analista Conferencia": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:13.5,valG3:27,valG2:40.5,valG1:54,peso:0.09}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:13.5,valG3:27,valG2:40.5,valG1:54,peso:0.09}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.1}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.1}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:22.5,valG3:45,valG2:67.5,valG1:90,peso:0.15}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:13.5,valG3:27,valG2:40.5,valG1:54,peso:0.09}, "Faturamento 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:19.5,valG3:39,valG2:58.5,valG1:78,peso:0.13}, "Assertividade": {g6:80,g4:93,g3:95,g2:97,g1:100,valG4:19.5,valG3:39,valG2:58.5,valG1:78,peso:0.13} },
  "Analista Gilberto": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:25.5,valG3:51,valG2:76.5,valG1:102,peso:0.17}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:25.5,valG3:51,valG2:76.5,valG1:102,peso:0.17}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:27,valG3:54,valG2:81,valG1:108,peso:0.18}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12} },
  "Analista_Conferencia_sem_asser_Fat": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:22.5,valG3:45,valG2:67.5,valG1:90,peso:0.15}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:19.5,valG3:39,valG2:58.5,valG1:78,peso:0.13}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:21,valG3:42,valG2:63,valG1:84,peso:0.14}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:30,valG3:60,valG2:90,valG1:120,peso:0.2}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:21,valG3:42,valG2:63,valG1:84,peso:0.14} },
  "Analista_Conferencia_sem_assertividade": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:19.5,valG3:39,valG2:58.5,valG1:78,peso:0.13}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:19.5,valG3:39,valG2:58.5,valG1:78,peso:0.13}, "Faturamento 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:24,valG3:48,valG2:72,valG1:96,peso:0.16} },
  "Analistas Diurno": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:25.5,valG3:51,valG2:76.5,valG1:102,peso:0.17}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:25.5,valG3:51,valG2:76.5,valG1:102,peso:0.17}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:27,valG3:54,valG2:81,valG1:108,peso:0.18}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.12} },
  "Analistas Noturno": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11}, "AF SLA 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:25.5,valG3:51,valG2:76.5,valG1:102,peso:0.17}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:25.5,valG3:51,valG2:76.5,valG1:102,peso:0.17}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:16.5,valG3:33,valG2:49.5,valG1:66,peso:0.11} },
  "Assistente Apoio": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.2}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.2}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.2}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.2}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.2} },
  "Assistente Diurno": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "AF SLA 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:25,valG3:50,valG2:75,valG1:100,peso:0.25}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15} },
  "Assistente Noturno": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:10,valG3:20,valG2:30,valG1:40,peso:0.1}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:10,valG3:20,valG2:30,valG1:40,peso:0.1}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:10,valG3:20,valG2:30,valG1:40,peso:0.1}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:10,valG3:20,valG2:30,valG1:40,peso:0.1}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:10,valG3:20,valG2:30,valG1:40,peso:0.1}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.2}, "AF SLA 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.2}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:10,valG3:20,valG2:30,valG1:40,peso:0.1} },
  "Backoffice": { "Fechamento SLA 2 dias": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:23,valG3:46,valG2:69,valG1:92,peso:0.23}, "Assertividade": {g6:80,g4:93,g3:95,g2:97,g1:100,valG4:23,valG3:46,valG2:69,valG1:92,peso:0.23}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.18}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.18}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.18} },
  "Backoffice_sem_assertividade": { "Fechamento SLA 2 dias": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:23,valG3:46,valG2:69,valG1:92,peso:0.23}, "Assertividade": {g6:80,g4:93,g3:95,g2:97,g1:100,valG4:23,valG3:46,valG2:69,valG1:92,peso:0.23}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.18}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.18}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:18,valG3:36,valG2:54,valG1:72,peso:0.18} },
  "Supervisores": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:17.5,valG3:35,valG2:52.5,valG1:70,peso:0.07}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:17.5,valG3:35,valG2:52.5,valG1:70,peso:0.07}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:17.5,valG3:35,valG2:52.5,valG1:70,peso:0.07}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:17.5,valG3:35,valG2:52.5,valG1:70,peso:0.07}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:17.5,valG3:35,valG2:52.5,valG1:70,peso:0.07}, "AF SLA 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:25,valG3:50,valG2:75,valG1:100,peso:0.1}, "Faturamento 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:25,valG3:50,valG2:75,valG1:100,peso:0.1}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:37.5,valG3:75,valG2:112.5,valG1:150,peso:0.15}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:25,valG3:50,valG2:75,valG1:100,peso:0.1}, "Fechamento SLA 2 dias": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:25,valG3:50,valG2:75,valG1:100,peso:0.1}, "Assertividade": {g6:80,g4:93,g3:95,g2:97,g1:100,valG4:25,valG3:50,valG2:75,valG1:100,peso:0.1} },
  "Supervisores_sem_Ass_Fat": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:22.5,valG3:45,valG2:67.5,valG1:90,peso:0.09}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:22.5,valG3:45,valG2:67.5,valG1:90,peso:0.09}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:22.5,valG3:45,valG2:67.5,valG1:90,peso:0.09}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:22.5,valG3:45,valG2:67.5,valG1:90,peso:0.09}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:22.5,valG3:45,valG2:67.5,valG1:90,peso:0.09}, "AF SLA 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:37.5,valG3:75,valG2:112.5,valG1:150,peso:0.15}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:35,valG3:70,valG2:105,valG1:140,peso:0.14}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:30,valG3:60,valG2:90,valG1:120,peso:0.12}, "Fechamento SLA 2 dias": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:35,valG3:70,valG2:105,valG1:140,peso:0.14} },
  "Supervisores_sem_assertividade": { "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.08}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.08}, "Eficiencia": {g6:50,g4:65,g3:70,g2:77,g1:84,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.08}, "Monitoria": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.08}, "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:20,valG3:40,valG2:60,valG1:80,peso:0.08}, "AF SLA 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:27.5,valG3:55,valG2:82.5,valG1:110,peso:0.11}, "Faturamento 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:27.5,valG3:55,valG2:82.5,valG1:110,peso:0.11}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:40,valG3:80,valG2:120,valG1:160,peso:0.16}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:27.5,valG3:55,valG2:82.5,valG1:110,peso:0.11}, "Fechamento SLA 2 dias": {g6:75,g4:85,g3:90,g2:95,g1:100,valG4:27.5,valG3:55,valG2:82.5,valG1:110,peso:0.11} },
  "Novato(a)": { "Tabulação": {g6:75,g4:85,g3:90,g2:98,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "CSAT Resposta": {g6:25,g4:35,g3:40,g2:50,g1:60,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "CSAT": {g6:80,g4:90,g3:95,g2:98,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "Tempo resposta": {g6:40,g4:55,g3:60,g2:65,g1:70,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "AF SLA 2 dias": {g6:85,g4:90,g3:95,g2:97,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "Tempo Produtivo": {g6:70,g4:80,g3:85,g2:95,g1:100,valG4:15,valG3:30,valG2:45,valG1:60,peso:0.15}, "Faturamento 2 dias": {g6:80,g4:90,g3:95,g2:97,g1:100,valG4:10,valG3:20,valG2:30,valG1:40,peso:0.1} },
  "Outros": {},
};
const SEED_COLLABS = [
  ["282", "Analistas Noturno"], ["258", "Analistas Noturno"], ["309", "Analistas Noturno"],
  ["290", "Assistente Diurno"], ["274", "Assistente Apoio"], ["286", "Backoffice"],
  ["295", "Backoffice"], ["285", "Assistente Diurno"], ["307", "Analista Gilberto"],
  ["301", "Assistente Noturno"], ["312", "Assistente Diurno"], ["316", "Novato(a)"],
  ["297", "Analista Conferencia"], ["299", "Analistas Diurno"], ["81", "Analistas Noturno"],
  ["313", "Assistente Diurno"], ["296", "Assistente Diurno"], ["265", "Analistas Diurno"],
  ["291", "Analista Conferencia"], ["315", "Novato(a)"], ["233", "Analistas Diurno"],
  ["250", "Supervisores"], ["276", "Supervisores"],
  ["292", "Outros"], ["400", "Assistente Diurno"],
];
const SEED_JUNE = {
  "282": { v: { "Faturamento 2 dias": 0 }, p: null },
  "315": { v: { "Tabulação": 87.76, CSAT: 100, "CSAT Resposta": 26.83, "Tempo resposta": 100, "AF SLA 2 dias": 96.15, "Tempo Produtivo": 88.82, "Faturamento 2 dias": 0 }, p: null },
  "290": { v: { "Tabulação": 82.14, CSAT: 100, "CSAT Resposta": 15.38, "AF SLA 2 dias": 83.33, "Tempo Produtivo": 80.55, "Faturamento 2 dias": 0 }, p: 0 },
  "274": { v: { "Tabulação": 73.91, CSAT: 100, "CSAT Resposta": 41.67, Eficiencia: 100, "Tempo resposta": 62.5, "AF SLA 2 dias": 100, Assertividade: 100, "Fechamento SLA 2 dias": 80, "Tempo Produtivo": 96.53, "Faturamento 2 dias": 0 }, p: 0 },
  "286": { v: { "Tabulação": 94.12, CSAT: 100, "CSAT Resposta": 50, "Tempo resposta": 40, Assertividade: 97.73, "Fechamento SLA 2 dias": 52.27, "Tempo Produtivo": 88.49, "Faturamento 2 dias": 0 }, p: 0 },
  "295": { v: { "Tabulação": 100, ABS: 50, Assertividade: 100, "Tempo Produtivo": 67.21, "Faturamento 2 dias": 0 }, p: 0 },
  "316": { v: { ABS: 66.67, "AF SLA 2 dias": 100, "Tempo Produtivo": 0, "Faturamento 2 dias": 0 }, p: 0 },
  "297": { v: { "Tabulação": 93.33, CSAT: 100, "CSAT Resposta": 64.29, Eficiencia: 85.71, "Tempo resposta": 35.71, "AF SLA 2 dias": 100, Assertividade: 100, "Fechamento SLA 2 dias": 100, "Tempo Produtivo": 86.14, "Faturamento 2 dias": 100 }, p: 0 },
  "233": { v: { "Tabulação": 86.96, CSAT: 100, "CSAT Resposta": 31.58, ABS: 33.33, Eficiencia: 80, "Tempo resposta": 33.33, "AF SLA 2 dias": 100, "Tempo Produtivo": 93.29, "Faturamento 2 dias": 0 }, p: 0 },
  "313": { v: { "Tabulação": 77.08, CSAT: 100, "CSAT Resposta": 25.81, "AF SLA 2 dias": 83.33, "Tempo Produtivo": 83.41, "Faturamento 2 dias": 0 }, p: 75 },
  "301": { v: { "Tabulação": 92.31, CSAT: 100, "CSAT Resposta": 58.06, Eficiencia: 66.67, "Tempo resposta": 52.94, "AF SLA 2 dias": 89.47, "Tempo Produtivo": 90.71, "Faturamento 2 dias": 0 }, p: 120 },
  "312": { v: { "Tabulação": 95.92, CSAT: 100, "CSAT Resposta": 48.57, "AF SLA 2 dias": 88, "Tempo Produtivo": 89.31, "Faturamento 2 dias": 0 }, p: 150 },
  "258": { v: { "Tabulação": 87.5, CSAT: 90, "CSAT Resposta": 28.57, "AF SLA 2 dias": 100, "Tempo Produtivo": 99.15, "Faturamento 2 dias": 0 }, p: 184.5 },
  "285": { v: { "Tabulação": 96.08, CSAT: 100, "CSAT Resposta": 53.12, Eficiencia: 50, "AF SLA 2 dias": 100, "Tempo Produtivo": 96.91, "Faturamento 2 dias": 0 }, p: 280 },
  "307": { v: { "Tabulação": 83.87, CSAT: 84.62, "CSAT Resposta": 46.43, Eficiencia: 100, "Tempo resposta": 100, "AF SLA 2 dias": 100, "Tempo Produtivo": 85.45, "Faturamento 2 dias": 0 }, p: 282 },
  "299": { v: { "Tabulação": 93.02, CSAT: 100, "CSAT Resposta": 33.33, Eficiencia: 83.33, "Tempo resposta": 77.27, "AF SLA 2 dias": 100, "Tempo Produtivo": 78.36, "Faturamento 2 dias": 0 }, p: 292.5 },
  "296": { v: { "Tabulação": 98.18, CSAT: 100, "CSAT Resposta": 53.33, Eficiencia: 80, "Tempo resposta": 50, "AF SLA 2 dias": 100, "Tempo Produtivo": 95.2, "Faturamento 2 dias": 0 }, p: 295 },
  "309": { v: { "Tabulação": 93.33, CSAT: 100, "CSAT Resposta": 70, Eficiencia: 92.31, "Tempo resposta": 57.89, "AF SLA 2 dias": 91.3, "Tempo Produtivo": 92.79, "Faturamento 2 dias": 0 }, p: 315 },
  "265": { v: { "Tabulação": 100, CSAT: 100, "CSAT Resposta": 57.14, Eficiencia: 100, "Tempo resposta": 47.37, "AF SLA 2 dias": 100, "Tempo Produtivo": 91.9, "Faturamento 2 dias": 0 }, p: 336 },
  "291": { v: { "Tabulação": 100, CSAT: 100, "CSAT Resposta": 66.67, Eficiencia: 83.33, "Tempo resposta": 52.94, Assertividade: 100, "Fechamento SLA 2 dias": 50, "Tempo Produtivo": 81.78, "Faturamento 2 dias": 100 }, p: 391.5 },
  "81": { v: { "Tabulação": 87.84, CSAT: 100, "CSAT Resposta": 76.47, Eficiencia: 85.71, "Tempo resposta": 70, "AF SLA 2 dias": 100, "Tempo Produtivo": 93.69, "Faturamento 2 dias": 0 }, p: 451.5 },
};

function buildSeed() {
  const profiles = Object.entries(SEED_PROFILES).map(([name, metas]) => ({
    id: "p_" + uid(), name,
    metas: Object.fromEntries(Object.entries(metas).map(([m, cfg]) => [m, { ...cfg }])),
  }));
  const pByName = {}; profiles.forEach((p) => { pByName[strip(p.name)] = p.id; });
  const supervisors = [
    { id: "s_" + uid(), name: "Supervisor 1" },
    { id: "s_" + uid(), name: "Supervisor 2" },
  ];
  const collaborators = SEED_COLLABS.map(([mat, perfil]) => ({
    id: "c_" + uid(), matricula: mat, perfilId: pByName[strip(perfil)] || null, supervisorId: null,
  }));
  const byMat = {};
  const pidByMat = {}; collaborators.forEach((c) => { pidByMat[c.matricula] = c.perfilId; });
  Object.entries(SEED_JUNE).forEach(([mat, d]) => { byMat[mat] = { valores: d.v, premiacao: d.p, perfilId: pidByMat[mat] || null }; });
  return {
    version: 6, metas: [...META_CANON], profiles, supervisors, collaborators,
    monthly: { "2026-06": { byMat, importedAt: new Date().toISOString(), arquivo: "Exemplo_Junho_2026.xlsx" } },
  };
}

// Patamares padrão por indicador (G6 corte, G4 abaixo da meta premiado, G3 meta, G2 superação, G1 alta perf.).
const META_TIERS_DEFAULT = {
  "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100 }, CSAT: { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100 }, "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60 },
  ABS: { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100 }, Monitoria: { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100 }, Eficiencia: { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84 },
  "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70 }, "AF SLA 2 dias": { g6: 85, g4: 90, g3: 95, g2: 97, g1: 100 }, Assertividade: { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100 },
  "Fechamento SLA 2 dias": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100 }, "Faturamento 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100 },
};

/* ============================== HELPERS DE DADOS ============================== */
function collabMonths(db, mat) {
  return Object.keys(db.monthly).filter((ym) => db.monthly[ym].byMat[mat]).sort();
}
// Perfil vigente em um mês: usa o perfil gravado na importação daquele mês (perfilId no registro
// mensal); na ausência (dados antigos), cai para o perfil atual do colaborador.
function profForMonth(db, collab, ym) {
  const rec = ym ? (db.monthly[ym] && db.monthly[ym].byMat[collab.matricula]) : null;
  const pid = (rec && rec.perfilId) ? rec.perfilId : collab.perfilId;
  return db.profiles.find((p) => p.id === pid) || null;
}
// Compatibilidade: o alvo de uma meta é o G3.
const alvoOf = (cfg) => cfg ? (cfg.g3 ?? cfg.alvo ?? null) : null;

// Define os níveis premiados de uma meta em ordem crescente, ignorando os ausentes.
function tiersOf(cfg) {
  if (!cfg) return [];
  const out = [];
  if (cfg.g4 != null) out.push({ key: "G4", label: "Abaixo da Meta", value: cfg.g4, prem: cfg.valG4 });
  if (cfg.g3 != null) out.push({ key: "G3", label: "Meta", value: cfg.g3, prem: cfg.valG3 });
  if (cfg.g2 != null) out.push({ key: "G2", label: "Superação", value: cfg.g2, prem: cfg.valG2 });
  if (cfg.g1 != null) out.push({ key: "G1", label: "Alta Performance", value: cfg.g1, prem: cfg.valG1 });
  return out;
}

// Avalia o desempenho de uma meta: nível atingido, premiação, próximo nível, gap e situação de corte (G6).
function evalMeta(cfg, v) {
  const tiers = tiersOf(cfg);
  const g3 = alvoOf(cfg);
  const cut = cfg ? (cfg.g6 ?? null) : null; // linha de corte
  if (v == null || !tiers.length) return { value: v, level: null, levelLabel: null, prem: 0, hitG3: false, next: null, gap: null, tiers, g3, cut, belowCut: false, gapCut: null };
  let level = null, prem = 0;
  for (const t of tiers) { if (v >= t.value) { level = t; prem = t.prem ?? 0; } }
  const next = tiers.find((t) => v < t.value) || null;
  const gap = next ? Math.round((next.value - v) * 100) / 100 : null;
  const belowCut = cut != null && v < cut;
  const gapCut = cut != null ? Math.round((cut - v) * 100) / 100 : null;
  return { value: v, level: level ? level.key : null, levelLabel: level ? level.label : null, prem, hitG3: g3 != null && v >= g3, next, gap, tiers, g3, cut, belowCut, gapCut };
}

const LEVEL_COLOR = { G1: "#1B8C4C", G2: "#0E8A7B", G3: "#A97A1E", G4: "#C7791F" };
const LEVEL_SOFT = { G1: "#E5F4EA", G2: "#E1F1EE", G3: "#FBF2DE", G4: "#FBEDDB" };

function scoreFor(db, collab, prof, ym) {
  if (!prof || !ym) return null;
  const rec = db.monthly[ym] && db.monthly[ym].byMat[collab.matricula];
  if (!rec) return null;
  const metas = Object.keys(prof.metas);
  if (!metas.length) return null;
  let hit = 0, counted = 0, prem = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, belowCut = 0;
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
  return counted ? { pct: (hit / counted) * 100, hit, counted, total: metas.length, prem, g1, g2, g3, g4, belowCut } : null;
}

/* ============================== GERAÇÃO DE PPT (self-contained) ==============================
   Gera um .pptx (OOXML) sem bibliotecas externas: monta o XML dos slides e empacota num ZIP
   "store" (sem compressão) com CRC32 calculado manualmente. Não depende de CDN nem de CSP. */

const _CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function _crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = _CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
const _enc = (s) => new TextEncoder().encode(s);
function _zipStore(files) {
  const chunks = [], central = []; let offset = 0;
  const u16 = (n) => [n & 0xff, (n >>> 8) & 0xff];
  const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  for (const f of files) {
    const name = _enc(f.name), crc = _crc32(f.data), size = f.data.length;
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)]);
    chunks.push(local, name, f.data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += local.length + name.length + f.data.length;
  }
  const cStart = offset; let cSize = 0;
  for (const c of central) { chunks.push(c); cSize += c.length; }
  chunks.push(new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(central.length / 2), ...u16(central.length / 2), ...u32(cSize), ...u32(cStart), ...u16(0)]));
  let total = 0; chunks.forEach((c) => (total += c.length));
  const out = new Uint8Array(total); let p = 0; chunks.forEach((c) => { out.set(c, p); p += c.length; });
  return out;
}

const _esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const _EMU = 914400;
const _in = (v) => Math.round(v * _EMU);
let _spId = 1;
function _txt(x, y, w, h, runs, opt = {}) {
  const algn = opt.align === "center" ? "ctr" : opt.align === "right" ? "r" : "l";
  const anchor = opt.valign === "middle" ? "ctr" : "t";
  const rx = runs.map((r) => {
    const pr = `sz="${(r.size || 14) * 100}"${r.bold ? ' b="1"' : ""}${r.italic ? ' i="1"' : ""}`;
    const col = r.color ? `<a:solidFill><a:srgbClr val="${r.color}"/></a:solidFill>` : "";
    const face = `<a:latin typeface="${r.face || "Calibri"}"/>`;
    return `<a:r><a:rPr lang="pt-BR" ${pr}>${col}${face}</a:rPr><a:t>${_esc(r.text)}</a:t></a:r>`;
  }).join("");
  const fill = opt.fill ? `<a:solidFill><a:srgbClr val="${opt.fill}"/></a:solidFill>` : "<a:noFill/>";
  const ln = opt.line ? `<a:ln w="${_in(opt.line.w || 0.01)}"><a:solidFill><a:srgbClr val="${opt.line.color}"/></a:solidFill></a:ln>` : "";
  return `<p:sp><p:nvSpPr><p:cNvPr id="${++_spId}" name="t${_spId}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${_in(x)}" y="${_in(y)}"/><a:ext cx="${_in(w)}" cy="${_in(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill}${ln}</p:spPr>` +
    `<p:txBody><a:bodyPr wrap="square" anchor="${anchor}" lIns="${_in(0.07)}" rIns="${_in(0.07)}" tIns="${_in(0.02)}" bIns="${_in(0.02)}"/><a:lstStyle/><a:p><a:pPr algn="${algn}"/>${rx}</a:p></p:txBody></p:sp>`;
}
function _rect(x, y, w, h, color, opt = {}) {
  const ln = opt.line ? `<a:ln w="${_in(opt.line.w || 0.01)}"><a:solidFill><a:srgbClr val="${opt.line.color}"/></a:solidFill></a:ln>` : "<a:ln><a:noFill/></a:ln>";
  const geom = opt.round ? `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom>` : `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${++_spId}" name="r${_spId}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${_in(x)}" y="${_in(y)}"/><a:ext cx="${_in(w)}" cy="${_in(h)}"/></a:xfrm>${geom}<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>${ln}</p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`;
}
// Cartão de prioridade no slide de detalhamento do PPT
function sh3card(arr, x, y, it, rank, C2) {
  const crit = it.belowCut;
  const accent = crit ? C2.DOWN : rank === 0 ? C2.GOLD : C2.LINE;
  const bg = crit ? "FBE9E9" : rank === 0 ? "FBF2DE" : "F7F9FA";
  arr.push(_rect(x, y, 3.85, 1.55, bg, { round: true, line: { color: accent } }));
  arr.push(_txt(x + 0.2, y + 0.13, 2.5, 0.35, [{ text: it.meta, size: 13, bold: true, color: C2.INK }], { valign: "middle" }));
  arr.push(_txt(x + 2.7, y + 0.13, 1.0, 0.35, [{ text: crit ? "CORTE" : `#${rank + 1}`, size: crit ? 9 : 11, bold: true, color: C2.DOWN }], { align: "center", valign: "middle" }));
  arr.push(_txt(x + 0.2, y + 0.55, 3.5, 0.35, [
    { text: "Atual ", size: 11, color: C2.MUTED }, { text: C2.fmt(it.value), size: 11, bold: true, color: C2.INK },
    ...(it.next ? [{ text: `  ->  ${it.next.key} ${C2.fmt(it.next.value)}`, size: 11, color: C2.MUTED }] : []),
  ], { valign: "middle" }));
  if (crit) {
    arr.push(_txt(x + 0.2, y + 0.92, 3.5, 0.3, [{ text: `${it.gapCut.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp abaixo do corte (${C2.fmt(it.cut)})`, size: 11, bold: true, color: C2.DOWN }], { valign: "middle" }));
    if (it.next && it.ganho > 0) arr.push(_txt(x + 0.2, y + 1.2, 3.5, 0.3, [{ text: `+${C2.brl(it.ganho)} ao atingir ${it.next.label}`, size: 11, bold: true, color: C2.GOLD }], { valign: "middle" }));
  } else if (it.next) {
    arr.push(_txt(x + 0.2, y + 0.92, 3.5, 0.3, [{ text: `Faltam ${it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`, size: 11, bold: true, color: it.hitG3 ? C2.ACCINK : C2.DOWN }], { valign: "middle" }));
    if (it.ganho > 0) arr.push(_txt(x + 0.2, y + 1.2, 3.5, 0.3, [{ text: `+${C2.brl(it.ganho)} ao atingir ${it.next.label}`, size: 11, bold: true, color: C2.GOLD }], { valign: "middle" }));
  }
}

function _slideXml(shapes, bg) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${bg ? `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>` : ""}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes.join("")}</p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sld>`;
}

async function gerarPpt({ db, c, prof, supById, cms, refYm, score, prem, profMetas }) {
  _spId = 1;
  const W = 13.333, H = 7.5;
  const INK = "15212C", MUTED = "65748A", ACC = "0E8A7B", ACCINK = "0A6B60";
  const UP = "1B8C4C", DOWN = "D24343", FLAT = "8A97A5", GOLD = "A97A1E", LINE = "E1E6EB", DARK = "0B222F";
  const supName = c.supervisorId ? ((supById[c.supervisorId] && supById[c.supervisorId].name) || "") : "não definido";
  const fmt = (v) => v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const monthLabel = (ym) => { const [y, m] = ym.split("-"); return `${MESES_FULL[+m - 1]}/${y}`; };
  const rec = refYm ? (db.monthly[refYm] && db.monthly[refYm].byMat[c.matricula]) : null;

  /* ---------- Slide 1: capa ---------- */
  const sh1 = [
    _rect(0, 0, 0.35, H, ACC),
    _txt(0.9, 2.2, 11, 0.5, [{ text: "ACOMPANHAMENTO DE METAS", size: 18, color: "7FA3B3" }]),
    _txt(0.9, 2.75, 11.5, 1.1, [{ text: `Matrícula ${c.matricula}`, size: 54, bold: true, color: "FFFFFF" }]),
    _txt(0.9, 4.05, 11.5, 0.5, [
      { text: "Perfil  ", size: 16, color: "7FA3B3" }, { text: `${(prof && prof.name) || "—"}      `, size: 16, bold: true, color: "FFFFFF" },
      { text: "Supervisor  ", size: 16, color: "7FA3B3" }, { text: supName, size: 16, bold: true, color: "FFFFFF" },
    ]),
    _txt(0.9, 4.65, 11.5, 0.4, [{ text: refYm ? `Resultados referentes a ${monthLabel(refYm)}` : "Sem dados importados", size: 14, color: "9FB8C4" }]),
    _txt(0.9, 6.7, 8, 0.4, [{ text: "Painel GOP · Gestão de Metas", size: 11, color: "5E7E8E" }]),
  ];

  const G1C = "1B8C4C", G2C = "0E8A7B", G3C = "A97A1E", G4C = "C7791F";
  const tierColor = (lvl) => lvl === "G1" ? G1C : lvl === "G2" ? G2C : lvl === "G3" ? G3C : lvl === "G4" ? G4C : DOWN;
  const tierSoft = (lvl) => lvl === "G1" ? "E5F4EA" : lvl === "G2" ? "E1F1EE" : lvl === "G3" ? "FBF2DE" : lvl === "G4" ? "FBEDDB" : "FBEDEC";

  // análise por meta no mês de referência
  const analysis = profMetas.map((m) => {
    const cfg = prof.metas[m];
    const e = evalMeta(cfg, rec ? rec.valores[m] : null);
    const ganho = e.next ? (e.next.prem ?? 0) - (e.prem ?? 0) : 0;
    return { meta: m, cfg, ...e, ganho };
  });

  /* ---------- Slide 2: resultados do mês de referência ---------- */
  const sh2 = [
    _txt(0.6, 0.45, 12, 0.6, [{ text: `Resultados · ${refYm ? monthLabel(refYm) : "—"}`, size: 30, bold: true, color: INK }]),
    _rect(0.6, 1.18, 12.13, 0.02, LINE),
  ];
  const kpis = [
    { lab: "METAS ATINGIDAS (≥ G3)", val: score ? `${score.hit}/${score.counted}` : "—", sub: score ? `${Math.round(score.pct)}% de atingimento` : "sem dados", col: score && score.pct >= 70 ? UP : score && score.pct >= 40 ? GOLD : DOWN },
    { lab: "PREMIAÇÃO DO MÊS", val: prem ? brl(prem) : "—", sub: score ? `G1:${score.g1} G2:${score.g2} G3:${score.g3} G4:${score.g4}` : "sem premiação", col: GOLD },
    { lab: "INDICADORES NO PERFIL", val: String(profMetas.length), sub: "metas configuradas", col: ACCINK },
  ];
  kpis.forEach((k, i) => {
    const x = 0.6 + i * 4.08;
    sh2.push(_rect(x, 1.45, 3.85, 1.7, "F7F9FA", { round: true, line: { color: LINE } }));
    sh2.push(_txt(x + 0.22, 1.6, 3.5, 0.3, [{ text: k.lab, size: 10, bold: true, color: MUTED }]));
    sh2.push(_txt(x + 0.22, 1.95, 3.5, 0.75, [{ text: k.val, size: 30, bold: true, color: k.col }]));
    sh2.push(_txt(x + 0.22, 2.7, 3.5, 0.35, [{ text: k.sub, size: 11, color: MUTED }]));
  });
  // tabela do mês: Indicador | Corte | Meta (G3) | Resultado | Nível | Premiação
  const tX = 0.6, tW = 12.13, cols = [4.0, 1.55, 1.7, 1.7, 1.78, 1.6], rowH = 0.4;
  let tY = 3.4;
  const colX = []; let acc = tX; cols.forEach((w) => { colX.push(acc); acc += w; });
  const headLabels = ["Indicador", "Corte", "Meta (G3)", "Resultado", "Nível", "Premiação"];
  sh2.push(_rect(tX, tY, tW, rowH, ACCINK));
  headLabels.forEach((t, i) => sh2.push(_txt(colX[i], tY, cols[i], rowH, [{ text: t, size: 11, bold: true, color: "FFFFFF" }], { align: i === 0 ? "left" : "center", valign: "middle" })));
  tY += rowH;
  if (profMetas.length) {
    analysis.forEach((it, idx) => {
      const lvl = it.level, lvlTxt = it.belowCut ? "Abaixo corte" : lvl ? `${lvl} · ${it.levelLabel}` : (it.value == null ? "—" : "Abaixo");
      if (idx % 2 === 1) sh2.push(_rect(tX, tY, tW, rowH, "F7F9FA"));
      if (it.belowCut) sh2.push(_rect(tX, tY, tW, rowH, "FBE9E9"));
      sh2.push(_rect(colX[4], tY, cols[4], rowH, it.belowCut ? "FBE9E9" : tierSoft(lvl)));
      sh2.push(_txt(colX[0], tY, cols[0], rowH, [{ text: it.meta, size: 11, color: INK }], { align: "left", valign: "middle" }));
      sh2.push(_txt(colX[1], tY, cols[1], rowH, [{ text: it.cut != null ? fmt(it.cut) : "—", size: 11, color: DOWN }], { align: "center", valign: "middle" }));
      sh2.push(_txt(colX[2], tY, cols[2], rowH, [{ text: it.g3 != null ? fmt(it.g3) : "—", size: 11, color: MUTED }], { align: "center", valign: "middle" }));
      sh2.push(_txt(colX[3], tY, cols[3], rowH, [{ text: fmt(it.value), size: 11, bold: true, color: it.belowCut ? DOWN : it.hitG3 ? INK : it.value == null ? MUTED : DOWN }], { align: "center", valign: "middle" }));
      sh2.push(_txt(colX[4], tY, cols[4], rowH, [{ text: lvlTxt, size: 10, bold: true, color: it.belowCut ? DOWN : tierColor(lvl) }], { align: "center", valign: "middle" }));
      sh2.push(_txt(colX[5], tY, cols[5], rowH, [{ text: it.prem > 0 ? brl(it.prem) : "—", size: 11, bold: it.prem > 0, color: it.prem > 0 ? GOLD : MUTED }], { align: "center", valign: "middle" }));
      tY += rowH;
    });
  } else {
    sh2.push(_txt(tX, tY + 0.1, 12, 0.5, [{ text: "O perfil deste colaborador não possui metas configuradas.", size: 13, italic: true, color: MUTED }]));
  }

  /* ---------- Slide 3: detalhamento e prioridades ---------- */
  const comDados = analysis.filter((it) => it.value != null);
  const naoBatendo = comDados.filter((it) => !it.hitG3);
  const abaixoCorte = comDados.filter((it) => it.belowCut);
  const rankP = (it) => it.belowCut ? 0 : !it.hitG3 ? 1 : 2;
  const prioridade = comDados.filter((it) => it.next || it.belowCut)
    .map((it) => ({ ...it, sc: (it.ganho || 1) / Math.max(it.gap || 0.5, 0.5) }))
    .sort((a, b) => { const ra = rankP(a), rb = rankP(b); if (ra !== rb) return ra - rb; if (ra === 0) return (b.gapCut || 0) - (a.gapCut || 0); return b.sc - a.sc; });
  const shD = [
    _txt(0.6, 0.45, 12, 0.6, [{ text: `Onde focar · ${refYm ? monthLabel(refYm) : "—"}`, size: 30, bold: true, color: INK }]),
    _rect(0.6, 1.18, 12.13, 0.02, LINE),
    _txt(0.6, 1.32, 12, 0.4, [{ text: abaixoCorte.length ? `${abaixoCorte.length} meta(s) abaixo da linha de corte — atenção máxima` : "Prioridades — menor distância ao próximo nível, maior ganho", size: 12, bold: abaixoCorte.length > 0, color: abaixoCorte.length ? DOWN : MUTED }]),
  ];
  // três cards de prioridade
  const top = prioridade.slice(0, 3);
  if (top.length) {
    top.forEach((it, i) => {
      const x = 0.6 + i * 4.08;
      sh3card(shD, x, 1.8, it, i, { brl, fmt, GOLD, DOWN, ACCINK, INK, MUTED, LINE, tierColor });
    });
  } else {
    shD.push(_txt(0.6, 2.0, 12, 0.5, [{ text: "Todas as metas com dados já estão no nível máximo (G1). 🎯", size: 13, italic: true, color: MUTED }]));
  }
  // lista "abaixo da meta"
  let dY = 3.95;
  shD.push(_txt(0.6, dY, 12, 0.35, [{ text: `ABAIXO DA META (${naoBatendo.length})`, size: 11, bold: true, color: DOWN }]));
  dY += 0.45;
  if (naoBatendo.length) {
    naoBatendo.slice(0, 6).forEach((it, idx) => {
      if (idx % 2 === 1) shD.push(_rect(0.6, dY, 12.13, 0.4, "F7F9FA"));
      if (it.belowCut) shD.push(_rect(0.6, dY, 12.13, 0.4, "FBE9E9"));
      shD.push(_txt(0.7, dY, 4.0, 0.4, [{ text: it.belowCut ? `⚠ ${it.meta}` : it.meta, size: 11, bold: it.belowCut, color: it.belowCut ? DOWN : INK }], { align: "left", valign: "middle" }));
      shD.push(_txt(4.8, dY, 2.6, 0.4, [{ text: `atual ${fmt(it.value)}${it.cut != null ? ` (corte ${fmt(it.cut)})` : ""}`, size: 11, bold: true, color: DOWN }], { align: "left", valign: "middle" }));
      shD.push(_txt(7.5, dY, 5.2, 0.4, [{ text: it.next ? `faltam ${it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp para ${it.next.key} (${fmt(it.next.value)})${it.ganho > 0 ? ` -> +${brl(it.ganho)}` : ""}` : "", size: 11, color: MUTED }], { align: "left", valign: "middle" }));
      dY += 0.4;
    });
  } else {
    shD.push(_txt(0.7, dY, 12, 0.4, [{ text: "Nenhuma — todas as metas com dados foram atingidas. 🎯", size: 12, italic: true, color: UP }], { valign: "middle" }));
  }

  /* ---------- Slide 4: evolução mês a mês ---------- */
  const sh3 = [
    _txt(0.6, 0.45, 12, 0.6, [{ text: "Evolução mês a mês", size: 30, bold: true, color: INK }]),
    _rect(0.6, 1.18, 12.13, 0.02, LINE),
  ];
  if (cms.length && profMetas.length) {
    const mc = cms.slice(-7);
    const labW = 3.1, alvoW = 1.0, eachW = (12.13 - labW - alvoW) / mc.length, eRowH = 0.4;
    let eY = 1.4;
    const firstMonthX = 0.6 + labW + alvoW;
    const eColX = []; for (let i = 0; i < mc.length; i++) eColX.push(firstMonthX + i * eachW);
    // header: Indicador | Alvo | meses...
    sh3.push(_rect(0.6, eY, 12.13, eRowH, ACCINK));
    sh3.push(_txt(0.6, eY, labW, eRowH, [{ text: "Indicador", size: 11, bold: true, color: "FFFFFF" }], { align: "left", valign: "middle" }));
    sh3.push(_txt(0.6 + labW, eY, alvoW, eRowH, [{ text: "Meta G3", size: 11, bold: true, color: "FFFFFF" }], { align: "center", valign: "middle" }));
    mc.forEach((ym, i) => { const [y, m] = ym.split("-"); sh3.push(_txt(eColX[i], eY, eachW, eRowH, [{ text: `${MESES[+m - 1]}/${String(y).slice(2)}`, size: 11, bold: true, color: "FFFFFF" }], { align: "center", valign: "middle" })); });
    eY += eRowH;
    profMetas.forEach((meta, idx) => {
      const alvo = alvoOf(prof.metas[meta]);
      if (idx % 2 === 1) sh3.push(_rect(0.6, eY, 12.13, eRowH, "F7F9FA"));
      sh3.push(_txt(0.6, eY, labW, eRowH, [{ text: meta, size: 11, color: INK }], { align: "left", valign: "middle" }));
      sh3.push(_txt(0.6 + labW, eY, alvoW, eRowH, [{ text: alvo != null ? fmt(alvo) : "—", size: 11, bold: true, color: ACCINK }], { align: "center", valign: "middle" }));
      let prev = null;
      mc.forEach((ym, i) => {
        const v = db.monthly[ym].byMat[c.matricula] && db.monthly[ym].byMat[c.matricula].valores[meta];
        let arrow = "", acol = INK;
        if (v != null && prev != null) { const d = v - prev; if (Math.abs(d) < 0.05) { arrow = " ="; acol = FLAT; } else if (d > 0) { arrow = " ▲"; acol = UP; } else { arrow = " ▼"; acol = DOWN; } }
        const ok = v != null && alvo != null ? v >= alvo : null;
        if (ok != null) sh3.push(_rect(eColX[i], eY, eachW, eRowH, ok ? "F0F8F4" : "FCF1F0"));
        sh3.push(_txt(eColX[i], eY, eachW, eRowH, [{ text: v == null ? "—" : `${fmt(v)}${arrow}`, size: 10, bold: true, color: ok === false ? DOWN : acol === FLAT ? INK : acol }], { align: "center", valign: "middle" }));
        if (v != null) prev = v;
      });
      eY += eRowH;
    });
    sh3.push(_txt(0.6, 7.0, 12, 0.35, [{ text: "Meta G3 = alvo do perfil (há ainda G2 superação e G1 alta performance)   ·   ▲ aumento  ▼ queda  = estável  ·  verde = meta atingida", size: 10, italic: true, color: MUTED }]));
  } else {
    sh3.push(_txt(0.6, 1.5, 12, 0.5, [{ text: "Sem histórico suficiente para montar a evolução.", size: 13, italic: true, color: MUTED }]));
  }

  /* ---------- Empacotar OOXML ---------- */
  const slides = [_slideXml(sh1, DARK), _slideXml(sh2, "FFFFFF"), _slideXml(shD, "FFFFFF"), _slideXml(sh3, "FFFFFF")];
  const files = [];
  const add = (name, str) => files.push({ name, data: typeof str === "string" ? _enc(str) : str });

  const ctOverrides = slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("");
  add("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${ctOverrides}</Types>`);
  add("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`);

  const sldIds = slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("");
  add("ppt/presentation.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIds}</p:sldIdLst><p:sldSz cx="${_in(W)}" cy="${_in(H)}"/><p:notesSz cx="${_in(H)}" cy="${_in(W)}"/></p:presentation>`);

  const presRels = slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("");
  add("ppt/_rels/presentation.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${presRels}<Relationship Id="rId${slides.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>`);

  add("ppt/theme/theme1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="GOP"><a:themeElements><a:clrScheme name="GOP"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="15212C"/></a:dk2><a:lt2><a:srgbClr val="EDF0F3"/></a:lt2><a:accent1><a:srgbClr val="0E8A7B"/></a:accent1><a:accent2><a:srgbClr val="1B8C4C"/></a:accent2><a:accent3><a:srgbClr val="D24343"/></a:accent3><a:accent4><a:srgbClr val="A97A1E"/></a:accent4><a:accent5><a:srgbClr val="65748A"/></a:accent5><a:accent6><a:srgbClr val="0B222F"/></a:accent6><a:hlink><a:srgbClr val="0E8A7B"/></a:hlink><a:folHlink><a:srgbClr val="0A6B60"/></a:folHlink></a:clrScheme><a:fontScheme name="GOP"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="GOP"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`);

  add("ppt/slideMasters/slideMaster1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`);
  add("ppt/slideMasters/_rels/slideMaster1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`);
  add("ppt/slideLayouts/slideLayout1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sldLayout>`);
  add("ppt/slideLayouts/_rels/slideLayout1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`);

  const slideRel = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
  slides.forEach((xml, i) => { add(`ppt/slides/slide${i + 1}.xml`, xml); add(`ppt/slides/_rels/slide${i + 1}.xml.rels`, slideRel); });

  const zip = _zipStore(files);
  const blob = new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `Apresentacao_Matricula_${c.matricula}_${refYm || "sem-mes"}.pptx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ============================== UI PRIMITIVES ============================== */
/* Cada primitiva devolve um elemento DOM (equivalente aos componentes JSX). */

function Card(props, children) {
  props = props || {};
  const el = h("div", {
    class: ("rounded-2xl " + (props.class || "")).trim(),
    style: Object.assign({ background: C.surface, border: `1px solid ${C.border}` }, props.style || {}),
  });
  appendChildren(el, children || []);
  return el;
}

function Btn({ children = [], onClick, kind = "primary", small, disabled, class: cls = "" } = {}) {
  const base = {
    primary: { background: C.accent, color: "#fff", border: "1px solid transparent" },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.border}` },
    danger: { background: "transparent", color: C.down, border: `1px solid ${C.downSoft}` },
    dark: { background: C.sidebar, color: "#fff", border: "1px solid transparent" },
  }[kind];
  const sizeCls = small ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const stateCls = disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-85";
  const btn = h("button", {
    class: `inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity ${sizeCls} ${stateCls} ${cls}`.trim(),
    style: Object.assign({ fontFamily: FONT_BODY }, base),
    disabled: !!disabled,
    onClick: disabled ? null : onClick,
  });
  appendChildren(btn, Array.isArray(children) ? children : [children]);
  return btn;
}

function Input(props = {}) {
  const { class: cls = "", style = {}, ...rest } = props;
  const el = h("input", Object.assign({
    class: `w-full rounded-lg px-3 py-2 text-sm outline-none ${cls}`.trim(),
    style: Object.assign({ border: `1px solid ${C.border}`, background: "#fff", color: C.ink, fontFamily: FONT_BODY }, style),
  }, rest));
  return el;
}

function Select(props = {}, options = []) {
  const { class: cls = "", style = {}, ...rest } = props;
  const el = h("select", Object.assign({
    class: `w-full rounded-lg px-3 py-2 text-sm outline-none ${cls}`.trim(),
    style: Object.assign({ border: `1px solid ${C.border}`, background: "#fff", color: C.ink, fontFamily: FONT_BODY }, style),
  }, rest));
  appendChildren(el, options);
  // garante que o valor desejado fique selecionado após inserir as <option>
  if (props.value !== undefined) el.value = props.value;
  return el;
}
function Opt(value, label, selected) {
  return h("option", { value, selected: !!selected }, label);
}

function Label(text) {
  return h("div", { class: "text-xs font-semibold uppercase tracking-wide mb-1", style: { color: C.muted } }, text);
}

/* ---------- Modal ---------- */
/* Renderiza num container global (#modal-root). onClose fecha. */
function openModal({ title, wide, build }) {
  const root = document.getElementById("modal-root");
  const overlay = h("div", {
    class: "fixed inset-0 z-50 flex items-center justify-center p-4",
    style: { background: "rgba(11,34,47,0.45)" },
    onClick: () => closeModal(),
  });
  const panel = h("div", {
    class: `w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl overflow-hidden flex flex-col`,
    style: { background: C.surface, maxHeight: "90vh" },
    onClick: (e) => e.stopPropagation(),
  });
  const header = h("div", { class: "flex items-center justify-between px-5 py-4", style: { borderBottom: `1px solid ${C.border}` } },
    h("div", { class: "font-bold text-base", style: { fontFamily: FONT_HEAD, color: C.ink } }, title),
    h("button", { class: "p-1 rounded hover:bg-gray-100", onClick: () => closeModal() }, icon("X", { size: 18, color: C.muted })),
  );
  const body = h("div", { class: "p-5 overflow-y-auto" });
  appendChildren(body, [build(closeModal)]);
  panel.appendChild(header);
  panel.appendChild(body);
  overlay.appendChild(panel);
  root.appendChild(overlay);
  return closeModal;
}
function closeModal() {
  const root = document.getElementById("modal-root");
  if (root && root.lastChild) root.removeChild(root.lastChild);
}

/* ---------- Confirmação (equivalente ao useConfirm) ---------- */
function askConfirm(message, onYes) {
  openModal({
    title: onYes ? "Confirmar ação" : "Aviso",
    build: (close) => {
      const wrap = h("div", {});
      wrap.appendChild(h("div", { class: "text-sm leading-relaxed mb-5", style: { color: C.ink } }, message));
      const actions = h("div", { class: "flex justify-end gap-2" });
      if (onYes) {
        actions.appendChild(Btn({ kind: "ghost", children: ["Cancelar"], onClick: () => close() }));
        actions.appendChild(Btn({
          kind: "danger",
          children: [icon("Check", { size: 15 }), " Confirmar"],
          onClick: () => { close(); onYes(); },
        }));
      } else {
        actions.appendChild(Btn({ children: ["Entendi"], onClick: () => close() }));
      }
      wrap.appendChild(actions);
      return wrap;
    },
  });
}

/* ---------- Delta (variação em pp) ---------- */
function Delta(d) {
  if (d == null) return null;
  if (Math.abs(d) < 0.05) {
    return h("span", {
      class: "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
      style: { background: C.flatSoft, color: C.flat },
    }, icon("Minus", { size: 11, color: C.flat }), " estável");
  }
  const up = d > 0;
  return h("span", {
    class: "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
    style: { background: up ? C.upSoft : C.downSoft, color: up ? C.up : C.down },
  },
    icon(up ? "TrendingUp" : "TrendingDown", { size: 11, color: up ? C.up : C.down }),
    `${up ? "+" : ""}${d.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`,
  );
}

/* ---------- MatBadge ---------- */
function MatBadge(mat, size = 40) {
  return h("div", {
    class: "rounded-xl flex items-center justify-center font-bold shrink-0 tabular-nums",
    style: { width: size + "px", height: size + "px", background: C.accentSoft, color: C.accentInk, fontSize: (size * 0.34) + "px", fontFamily: FONT_HEAD },
  }, mat);
}

/* ---------- Ring (anel de progresso SVG) ---------- */
function Ring(pct, size = 64) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r;
  const color = pct >= 70 ? C.up : pct >= 40 ? C.gold : C.down;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", size); svg.setAttribute("height", size);
  const c1 = document.createElementNS(ns, "circle");
  c1.setAttribute("cx", size / 2); c1.setAttribute("cy", size / 2); c1.setAttribute("r", r);
  c1.setAttribute("fill", "none"); c1.setAttribute("stroke", C.flatSoft); c1.setAttribute("stroke-width", "7");
  const c2 = document.createElementNS(ns, "circle");
  c2.setAttribute("cx", size / 2); c2.setAttribute("cy", size / 2); c2.setAttribute("r", r);
  c2.setAttribute("fill", "none"); c2.setAttribute("stroke", color); c2.setAttribute("stroke-width", "7");
  c2.setAttribute("stroke-linecap", "round");
  c2.setAttribute("stroke-dasharray", `${(pct / 100) * circ} ${circ}`);
  c2.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
  svg.appendChild(c1); svg.appendChild(c2);
  const wrap = h("div", { class: "relative shrink-0", style: { width: size + "px", height: size + "px" } });
  wrap.appendChild(svg);
  wrap.appendChild(h("div", {
    class: "absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums",
    style: { color: C.ink, fontFamily: FONT_HEAD },
  }, `${Math.round(pct)}%`));
  return wrap;
}

/* ---------- MonthPicker ---------- */
function MonthPicker({ months, value, onChange, lastMonth }) {
  if (!months.length) return null;
  const idx = months.indexOf(value);
  const go = (d) => { const n = idx + d; if (n >= 0 && n < months.length) onChange(months[n]); };
  const wrap = h("div", { class: "flex items-center gap-1.5" });
  wrap.appendChild(icon("CalendarDays", { size: 15, color: C.muted, cls: "shrink-0" }));
  const prevBtn = h("button", {
    class: "p-1.5 rounded-lg",
    style: Object.assign({ border: `1px solid ${C.border}`, background: "#fff" }, idx <= 0 ? { opacity: 0.3 } : {}),
    disabled: idx <= 0, "aria-label": "Mês anterior",
    onClick: () => go(-1),
  }, icon("ChevronLeft", { size: 15, color: C.ink }));
  wrap.appendChild(prevBtn);
  const sel = Select({
    value: value || "",
    class: "px-3 py-1.5 text-sm font-semibold",
    style: { border: `1px solid ${C.border}`, background: "#fff", color: C.ink, fontFamily: FONT_BODY, width: "auto" },
    onChange: (e) => onChange(e.target.value),
  }, months.map((ym) => Opt(ym, ymLabelFull(ym) + (ym === lastMonth ? " (último)" : ""), ym === value)));
  // o seletor de mês não deve ocupar 100% — remove w-full
  sel.classList.remove("w-full");
  wrap.appendChild(sel);
  const nextBtn = h("button", {
    class: "p-1.5 rounded-lg",
    style: Object.assign({ border: `1px solid ${C.border}`, background: "#fff" }, idx >= months.length - 1 ? { opacity: 0.3 } : {}),
    disabled: idx >= months.length - 1, "aria-label": "Próximo mês",
    onClick: () => go(1),
  }, icon("ChevronRight", { size: 15, color: C.ink }));
  wrap.appendChild(nextBtn);
  return wrap;
}

/* ============================== ESTADO GLOBAL / STORE ==============================
   Substitui os hooks de topo do componente PainelGOP:
     db, storageOk, route, saving, selMonth  -> propriedades em STATE
     useState setters -> mutações em STATE + rerender()
     persistência (window.storage) -> localStorage com debounce, equivalente
*/
const STORAGE_KEY = "gop:data";

const STATE = {
  db: null,
  storageOk: true,
  route: { view: "home" },     // {view:'home'|'collab'|'import'|'admin', id?}
  saving: false,
  selMonth: null,
  loaded: false,
  // estado local persistente entre renders de cada view (substitui useState das views)
  ui: {
    home: { q: "", fSup: "", fProf: "" },
    collab: {},                // por id de colaborador: { selMeta, showExtra, pptState }
    import: null,              // estado da importação (criado on demand)
    admin: { tab: "collabs", collabsQ: "", supsName: "", profilesEdit: undefined },
  },
};

let _saveTimer = null;

/* leitura inicial + migrações (equivalente ao primeiro useEffect) */
function loadDb() {
  let data = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) {
    STATE.storageOk = false;
  }
  // detecta indisponibilidade de localStorage (modo privado, etc.)
  try { localStorage.setItem("__gop_test__", "1"); localStorage.removeItem("__gop_test__"); }
  catch (e) { STATE.storageOk = false; }

  if (!data) data = buildSeed();
  else {
    const v = data.version || 1;
    if (v < 2) {
      (data.profiles || []).forEach((p) => {
        const m = p.metas || {};
        if (m.CSAT && m.CSAT.alvo === 40) m.CSAT.alvo = 95;
        if (m["CSAT Resposta"] && m["CSAT Resposta"].alvo === 95) m["CSAT Resposta"].alvo = 40;
      });
      (data.collaborators || []).forEach((c) => { delete c.nome; });
    }
    if (v < 3) {
      (data.profiles || []).forEach((p) => {
        const ref = SEED_PROFILES[p.name] || {};
        const out = {};
        Object.entries(p.metas || {}).forEach(([m, cfg]) => {
          if (cfg && cfg.g3 != null) { out[m] = cfg; return; }
          if (ref[m]) { out[m] = { ...ref[m] }; return; }
          const t = META_TIERS_DEFAULT[m] || { g3: (cfg && cfg.alvo) ?? 90, g2: null, g1: null };
          const g3 = (cfg && cfg.alvo) ?? t.g3;
          out[m] = { g3, g2: t.g2, g1: t.g1, valG3: null, valG2: null, valG1: null, peso: null };
        });
        p.metas = out;
      });
    }
    if (v < 4) {
      (data.profiles || []).forEach((p) => {
        const ref = SEED_PROFILES[p.name] || {};
        Object.entries(p.metas || {}).forEach(([m, cfg]) => {
          if (cfg.g6 != null) return;
          cfg.g6 = (ref[m] && ref[m].g6) ?? (META_TIERS_DEFAULT[m] && META_TIERS_DEFAULT[m].g6) ?? null;
        });
      });
    }
    if (v < 5) {
      (data.profiles || []).forEach((p) => {
        const ref = SEED_PROFILES[p.name] || {};
        Object.entries(p.metas || {}).forEach(([m, cfg]) => {
          if (cfg.g4 == null) cfg.g4 = (ref[m] && ref[m].g4) ?? (META_TIERS_DEFAULT[m] && META_TIERS_DEFAULT[m].g4) ?? null;
          if (cfg.valG4 == null) cfg.valG4 = (ref[m] && ref[m].valG4) ?? (cfg.valG3 != null ? Math.round(cfg.valG3 * 50) / 100 : null);
        });
      });
    }
    if (v < 6) {
      const pidByMat = {}; (data.collaborators || []).forEach((c) => { pidByMat[c.matricula] = c.perfilId; });
      Object.values(data.monthly || {}).forEach((mes) => {
        Object.entries(mes.byMat || {}).forEach(([mat, rec]) => {
          if (rec && rec.perfilId == null) rec.perfilId = pidByMat[mat] || null;
        });
      });
    }
    data.version = 6;
  }
  STATE.db = data;
  STATE.loaded = true;
}

/* salva (equivalente ao segundo useEffect, com debounce e indicador "salvando") */
function scheduleSave() {
  if (!STATE.db || !STATE.loaded) return;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      STATE.saving = true;
      updateSaveIndicator();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.db));
    } catch (e) {
      STATE.storageOk = false;
    } finally {
      setTimeout(() => { STATE.saving = false; updateSaveIndicator(); }, 400);
    }
  }, 500);
}

/* update(fn): aplica mutação sobre cópia profunda (equivalente ao update do React) */
function update(fn) {
  const clone = structuredClone(STATE.db);
  STATE.db = fn(clone) || clone;
  scheduleSave();
  rerender();
}

/* setSelMonth mantém o mês válido (equivalente ao terceiro useEffect) */
function setSelMonth(ym) { STATE.selMonth = ym; rerender(); }
function ensureValidSelMonth() {
  const db = STATE.db; if (!db) return;
  const ms = Object.keys(db.monthly).sort();
  if (!ms.length) { if (STATE.selMonth !== null) STATE.selMonth = null; return; }
  if (!STATE.selMonth || !db.monthly[STATE.selMonth]) STATE.selMonth = ms[ms.length - 1];
}

function setRoute(route) { STATE.route = route; rerender(); window.scrollTo(0, 0); }

/* atualiza só o rodapé de status sem re-render completo (suaviza o "salvando…") */
function updateSaveIndicator() {
  const el = document.getElementById("save-indicator");
  if (!el) return;
  el.innerHTML = "";
  if (STATE.saving) { el.appendChild(icon("Save", { size: 11, color: "#5E7E8E" })); el.appendChild(document.createTextNode(" salvando…")); }
  else if (STATE.storageOk) { el.appendChild(icon("Check", { size: 11, color: C.accent })); el.appendChild(document.createTextNode(" dados salvos")); }
  else { el.appendChild(icon("AlertTriangle", { size: 11, color: "#E2B33C" })); el.appendChild(document.createTextNode(" sem persistência")); }
}

/* ============================== APP SHELL / RENDER ============================== */
const NAV = [
  { key: "home", label: "Visão geral", icon: "LayoutDashboard" },
  { key: "import", label: "Importar planilha", icon: "Upload" },
  { key: "admin", label: "Administração", icon: "Settings" },
];

function rerender() {
  const root = document.getElementById("app");
  root.innerHTML = "";
  // garante container de modais
  if (!document.getElementById("modal-root")) {
    const mr = h("div", { id: "modal-root" });
    document.body.appendChild(mr);
  }

  const db = STATE.db;
  if (!db) {
    root.appendChild(h("div", { class: "min-h-screen flex items-center justify-center", style: { background: C.bg } },
      h("div", { class: "text-sm", style: { color: C.muted, fontFamily: FONT_BODY } }, "Carregando painel…")));
    return;
  }

  ensureValidSelMonth();

  const profById = Object.fromEntries(db.profiles.map((p) => [p.id, p]));
  const supById = Object.fromEntries(db.supervisors.map((s) => [s.id, s]));
  const months = Object.keys(db.monthly).sort();
  const lastMonth = months[months.length - 1] || null;
  const activeKey = STATE.route.view === "collab" ? "home" : STATE.route.view;

  const shell = h("div", {
    class: "min-h-screen flex flex-col md:flex-row",
    style: { background: C.bg, fontFamily: FONT_BODY, color: C.ink },
  });

  /* ---------- SIDEBAR (desktop) ---------- */
  const aside = h("aside", {
    class: "hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen",
    style: { background: C.sidebar },
  });
  const brand = h("div", { class: "px-5 pt-6 pb-5" },
    h("div", { class: "flex items-center gap-2.5" },
      h("div", { class: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: C.accent } }, icon("Target", { size: 18, color: "#fff" })),
      h("div", {},
        h("div", { class: "text-white font-extrabold leading-none text-lg tracking-tight", style: { fontFamily: FONT_HEAD } }, "GOP"),
        h("div", { class: "text-[11px] mt-0.5", style: { color: "#7FA3B3" } }, "Gestão de Metas"),
      ),
    ),
  );
  aside.appendChild(brand);
  const navEl = h("nav", { class: "px-3 flex flex-col gap-1" });
  NAV.forEach((n) => {
    navEl.appendChild(h("button", {
      class: "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors",
      style: { background: activeKey === n.key ? C.sidebarHi : "transparent", color: activeKey === n.key ? "#fff" : "#9FB8C4" },
      onClick: () => setRoute({ view: n.key }),
    }, icon(n.icon, { size: 17, color: activeKey === n.key ? "#fff" : "#9FB8C4" }), " " + n.label));
  });
  aside.appendChild(navEl);

  const footer = h("div", { class: "mt-auto px-5 pb-5 text-[11px] leading-relaxed", style: { color: "#5E7E8E" } });
  if (lastMonth) {
    footer.appendChild(document.createTextNode("Último mês lançado"));
    footer.appendChild(h("br"));
    footer.appendChild(h("span", { class: "text-white font-semibold" }, ymLabelFull(lastMonth)));
  } else {
    footer.appendChild(document.createTextNode("Nenhum mês importado"));
  }
  const saveInd = h("div", { id: "save-indicator", class: "mt-2 flex items-center gap-1.5" });
  footer.appendChild(saveInd);
  const verRow = h("div", { class: "mt-2 pt-2", style: { borderTop: "1px solid #1C3A4B" } },
    "Versão ", h("span", { class: "font-semibold", style: { color: "#9FB8C4" } }, APP_VERSION));
  footer.appendChild(verRow);
  aside.appendChild(footer);
  shell.appendChild(aside);

  /* ---------- MOBILE TOP NAV ---------- */
  const topnav = h("div", {
    class: "md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3",
    style: { background: C.sidebar },
  });
  topnav.appendChild(h("div", { class: "flex items-center gap-2" },
    h("div", { class: "w-8 h-8 rounded-lg flex items-center justify-center", style: { background: C.accent } }, icon("Target", { size: 15, color: "#fff" })),
    h("span", { class: "text-white font-extrabold tracking-tight", style: { fontFamily: FONT_HEAD } }, "GOP"),
    h("span", { class: "text-[10px]", style: { color: "#5E7E8E" } }, "v" + APP_VERSION),
  ));
  const mobBtns = h("div", { class: "flex gap-1" });
  NAV.forEach((n) => {
    mobBtns.appendChild(h("button", {
      class: "p-2.5 rounded-lg",
      style: { background: activeKey === n.key ? C.sidebarHi : "transparent" },
      onClick: () => setRoute({ view: n.key }),
    }, icon(n.icon, { size: 18, color: activeKey === n.key ? "#fff" : "#9FB8C4" })));
  });
  topnav.appendChild(mobBtns);
  shell.appendChild(topnav);

  /* ---------- CONTENT ---------- */
  const main = h("main", { class: "flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8 max-w-1200 w-full mx-auto" });
  if (!STATE.storageOk) {
    main.appendChild(h("div", {
      class: "mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
      style: { background: C.goldSoft, color: C.gold, border: `1px solid #EAD9AE` },
    }, icon("AlertTriangle", { size: 16, color: C.gold, cls: "mt-0.5 shrink-0" }),
      "Armazenamento persistente indisponível neste ambiente — os dados ficam apenas nesta sessão."));
  }

  const ctx = { db, profById, supById, months, lastMonth };
  if (STATE.route.view === "home") main.appendChild(viewHome(ctx));
  else if (STATE.route.view === "collab") main.appendChild(viewCollab(ctx, STATE.route.id));
  else if (STATE.route.view === "import") main.appendChild(viewImport(ctx));
  else if (STATE.route.view === "admin") main.appendChild(viewAdmin(ctx));

  shell.appendChild(main);
  root.appendChild(shell);
  updateSaveIndicator();
}

/* ============================== HOME ============================== */
function viewHome(ctx) {
  const { db, profById, supById, months, lastMonth } = ctx;
  const ui = STATE.ui.home;
  const refMonth = (STATE.selMonth && db.monthly[STATE.selMonth]) ? STATE.selMonth : lastMonth;

  function computeList() {
    return db.collaborators
      .filter((c) => {
        const t = strip(ui.q);
        if (t && !c.matricula.includes(t)) return false;
        if (ui.fSup === "none" && c.supervisorId) return false;
        if (ui.fSup && ui.fSup !== "none" && c.supervisorId !== ui.fSup) return false;
        if (ui.fProf && c.perfilId !== ui.fProf) return false;
        return true;
      })
      .sort((a, b) => (+a.matricula) - (+b.matricula));
  }

  function computeStats() {
    if (!refMonth) return null;
    let hit = 0, counted = 0, prem = 0, withData = 0;
    db.collaborators.forEach((c) => {
      const s = scoreFor(db, c, profForMonth(db, c, refMonth), refMonth);
      const rec = db.monthly[refMonth] && db.monthly[refMonth].byMat[c.matricula];
      if (rec) withData++;
      if (rec && rec.premiacao) prem += rec.premiacao;
      if (s) { hit += s.hit; counted += s.counted; }
    });
    return { atingimento: counted ? (hit / counted) * 100 : 0, prem, withData };
  }
  const stats = computeStats();

  const wrap = h("div", {});

  // Cabeçalho
  const head = h("div", { class: "flex flex-wrap items-end justify-between gap-3 mb-5" });
  const headLeft = h("div", {});
  headLeft.appendChild(h("h1", { class: "text-2xl md:text-[28px] font-extrabold tracking-tight", style: { fontFamily: FONT_HEAD } }, "Acompanhamento de metas"));
  const headP = h("p", { class: "text-sm mt-1", style: { color: C.muted } });
  if (refMonth) { headP.appendChild(document.createTextNode("Exibindo resultados de ")); headP.appendChild(h("b", { style: { color: C.ink } }, ymLabelFull(refMonth))); }
  else headP.appendChild(document.createTextNode("Importe a primeira planilha para começar."));
  headLeft.appendChild(headP);
  head.appendChild(headLeft);
  head.appendChild(Btn({ children: [icon("Upload", { size: 15 }), " Importar mês"], onClick: () => setRoute({ view: "import" }) }));
  wrap.appendChild(head);

  // Seletor de mês
  if (refMonth) {
    const selCard = Card({ class: "p-3 md:px-4 mb-4 flex flex-wrap items-center justify-between gap-2" }, [
      h("div", { class: "text-sm font-semibold", style: { color: C.ink } }, "Mês de referência"),
      MonthPicker({ months, value: refMonth, onChange: setSelMonth, lastMonth }),
    ]);
    wrap.appendChild(selCard);
  }

  // Cards de KPI
  const kpiGrid = h("div", { class: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" });
  const kpis = [
    { lab: "Colaboradores", val: db.collaborators.length, icon: "Users" },
    { lab: refMonth ? `Com dados · ${ymLabel(refMonth)}` : "Com dados", val: stats ? `${stats.withData}/${db.collaborators.length}` : "—", icon: "CalendarDays" },
    { lab: refMonth ? `Atingimento · ${ymLabel(refMonth)}` : "Atingimento", val: stats ? fmtPct(stats.atingimento) : "—", icon: "Target" },
    { lab: refMonth ? `Premiação · ${ymLabel(refMonth)}` : "Premiação", val: stats ? fmtBRL(stats.prem) : "—", icon: "Award" },
  ];
  kpis.forEach((k) => {
    kpiGrid.appendChild(Card({ class: "p-4" }, [
      h("div", { class: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide", style: { color: C.muted } },
        icon(k.icon, { size: 13, color: C.muted }), " " + k.lab),
      h("div", { class: "mt-2 text-xl md:text-2xl font-extrabold tabular-nums", style: { fontFamily: FONT_HEAD } }, String(k.val)),
    ]));
  });
  wrap.appendChild(kpiGrid);

  // Filtros
  const filterCard = Card({ class: "p-3 md:p-4 mb-4" });
  const filterRow = h("div", { class: "flex flex-col md:flex-row gap-2.5" });
  const searchBox = h("div", { class: "relative flex-1" });
  searchBox.appendChild(icon("Search", { size: 15, color: C.muted, cls: "absolute left-3 top-1/2 -translate-y-1/2" }));
  const searchInput = Input({
    placeholder: "Buscar por matrícula…",
    value: ui.q,
    style: { paddingLeft: "34px" },
    onInput: (e) => { ui.q = e.target.value.replace(/\D/g, ""); e.target.value = ui.q; refreshList(); },
  });
  searchBox.appendChild(searchInput);
  filterRow.appendChild(searchBox);

  const supSel = Select({
    value: ui.fSup, style: { maxWidth: "220px" },
    onChange: (e) => { ui.fSup = e.target.value; refreshList(); },
  }, [
    Opt("", "Todos os supervisores", ui.fSup === ""),
    ...db.supervisors.map((s) => Opt(s.id, s.name, ui.fSup === s.id)),
    Opt("none", "Sem supervisor definido", ui.fSup === "none"),
  ]);
  filterRow.appendChild(supSel);

  const profSel = Select({
    value: ui.fProf, style: { maxWidth: "260px" },
    onChange: (e) => { ui.fProf = e.target.value; refreshList(); },
  }, [
    Opt("", "Todos os perfis", ui.fProf === ""),
    ...db.profiles.map((p) => Opt(p.id, p.name, ui.fProf === p.id)),
  ]);
  filterRow.appendChild(profSel);
  filterCard.appendChild(filterRow);
  wrap.appendChild(filterCard);

  // Lista (re-renderizável sem perder foco da busca)
  const listHost = h("div", {});
  wrap.appendChild(listHost);

  function renderList() {
    listHost.innerHTML = "";
    const list = computeList();
    if (!list.length) {
      listHost.appendChild(Card({ class: "p-10 text-center text-sm", style: { color: C.muted } }, ["Nenhum colaborador encontrado com os filtros atuais."]));
      return;
    }
    const grid = h("div", { class: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" });
    list.forEach((c) => {
      const hasMonth = refMonth && db.monthly[refMonth] && db.monthly[refMonth].byMat[c.matricula];
      const prof = hasMonth ? profForMonth(db, c, refMonth) : profById[c.perfilId];
      const s = hasMonth ? scoreFor(db, c, prof, refMonth) : null;
      const prem = hasMonth ? (db.monthly[refMonth].byMat[c.matricula] && db.monthly[refMonth].byMat[c.matricula].premiacao) : null;

      const cardInner = Card({ class: "p-4 h-full transition-shadow group-hover:shadow-md" });
      const topRow = h("div", { class: "flex items-start gap-3" });
      topRow.appendChild(MatBadge(c.matricula));
      const info = h("div", { class: "min-w-0 flex-1" });
      info.appendChild(h("div", { class: "flex items-center justify-between gap-2" },
        h("div", { class: "font-bold truncate", style: { fontFamily: FONT_HEAD } }, "Matrícula " + c.matricula),
        icon("ChevronRight", { size: 15, color: C.muted, cls: "shrink-0" }),
      ));
      info.appendChild(h("div", { class: "text-xs mt-0.5 flex flex-wrap items-center gap-1.5", style: { color: C.muted } },
        h("span", { class: "truncate" }, (prof && prof.name) || "Sem perfil")));
      info.appendChild(h("div", { class: "text-[11px] mt-1", style: { color: C.muted } },
        c.supervisorId ? (supById[c.supervisorId] && supById[c.supervisorId].name) : "Sem supervisor definido"));
      topRow.appendChild(info);
      cardInner.appendChild(topRow);

      const bottom = h("div", { class: "mt-3 pt-3 flex items-center justify-between gap-2", style: { borderTop: `1px dashed ${C.border}` } });
      if (s) {
        const left = h("div", { class: "flex items-center gap-2" });
        const bar = h("div", { class: "h-1.5 w-20 rounded-full overflow-hidden", style: { background: C.flatSoft } });
        bar.appendChild(h("div", { class: "h-full rounded-full", style: { width: `${s.pct}%`, background: s.pct >= 70 ? C.up : s.pct >= 40 ? C.gold : C.down } }));
        left.appendChild(bar);
        left.appendChild(h("span", { class: "text-xs font-semibold tabular-nums" }, `${s.hit}/${s.counted} metas`));
        bottom.appendChild(left);
      } else {
        bottom.appendChild(h("span", { class: "text-xs", style: { color: C.muted } }, `Sem dados em ${refMonth ? ymLabel(refMonth) : "—"}`));
      }
      if (prem) bottom.appendChild(h("span", { class: "text-xs font-bold tabular-nums", style: { color: C.gold } }, fmtBRL(prem)));
      cardInner.appendChild(bottom);

      const btn = h("button", { class: "text-left group", onClick: () => setRoute({ view: "collab", id: c.id }) }, cardInner);
      grid.appendChild(btn);
    });
    listHost.appendChild(grid);
  }
  function refreshList() { renderList(); }
  renderList();

  return wrap;
}

/* ============================== COLABORADOR ============================== */
function viewCollab(ctx, id) {
  const { db, profById, supById, months } = ctx;
  const c = db.collaborators.find((x) => x.id === id);

  // estado local por colaborador (substitui useState de CollabDetail)
  if (!STATE.ui.collab[id]) STATE.ui.collab[id] = { selMeta: null, showExtra: false, pptState: "idle" };
  const lui = STATE.ui.collab[id];

  if (!c) {
    return h("div", {}, "Colaborador não encontrado. ", Btn({ small: true, children: ["Voltar"], onClick: () => setRoute({ view: "home" }) }));
  }

  const cms = collabMonths(db, c.matricula);
  const lastYm = cms[cms.length - 1];
  const refYm = (STATE.selMonth && db.monthly[STATE.selMonth]) ? STATE.selMonth : lastYm;
  const prof = profForMonth(db, c, refYm);
  const profMetas = prof ? Object.keys(prof.metas) : [];

  const extraMetas = (() => {
    const set = new Set();
    cms.forEach((ym) => Object.keys(db.monthly[ym].byMat[c.matricula].valores).forEach((m) => set.add(m)));
    return [...set].filter((m) => !profMetas.includes(m));
  })();

  const hasRef = refYm && db.monthly[refYm] && db.monthly[refYm].byMat[c.matricula];
  const score = hasRef ? scoreFor(db, c, prof, refYm) : null;
  const prem = hasRef ? (db.monthly[refYm].byMat[c.matricula] && db.monthly[refYm].byMat[c.matricula].premiacao) : null;
  const rows = lui.showExtra ? [...profMetas, ...extraMetas] : profMetas;

  const selCfg = (lui.selMeta && prof && prof.metas[lui.selMeta]) ? prof.metas[lui.selMeta] : null;
  const selTiers = selCfg ? tiersOf(selCfg) : [];
  const chartData = lui.selMeta ? cms.map((ym) => ({
    mes: ymLabel(ym), valor: db.monthly[ym].byMat[c.matricula].valores[lui.selMeta] ?? null,
  })) : [];

  // monthAnalysis
  const monthAnalysis = (() => {
    if (!hasRef || !profMetas.length) return null;
    const recRef = db.monthly[refYm].byMat[c.matricula];
    const items = profMetas.map((m) => {
      const cfg = prof.metas[m];
      const e = evalMeta(cfg, recRef.valores[m]);
      const ganho = e.next ? (e.next.prem ?? 0) - (e.prem ?? 0) : 0;
      return { meta: m, cfg, ...e, ganho };
    });
    const comDados = items.filter((it) => it.value != null);
    const semDados = items.filter((it) => it.value == null);
    const batendo = comDados.filter((it) => it.hitG3);
    const naoBatendo = comDados.filter((it) => !it.hitG3);
    const abaixoCorte = comDados.filter((it) => it.belowCut);
    const rank = (it) => it.belowCut ? 0 : !it.hitG3 ? 1 : 2;
    const prioridade = comDados
      .filter((it) => it.next || it.belowCut)
      .map((it) => ({ ...it, score: (it.ganho || 1) / Math.max(it.gap || 0.5, 0.5) }))
      .sort((a, b) => {
        const ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra - rb;
        if (ra === 0) return (b.gapCut || 0) - (a.gapCut || 0);
        return b.score - a.score;
      });
    const foraItems = (lui.showExtra ? extraMetas : []).map((m) => ({ meta: m, value: recRef.valores[m] ?? null })).filter((it) => it.value != null);
    return { items, batendo, naoBatendo, abaixoCorte, semDados, prioridade, foraItems };
  })();

  function toggleMeta(m) { lui.selMeta = lui.selMeta === m ? null : m; rerender(); }
  function setShowExtra(v) { lui.showExtra = v; rerender(); }

  async function downloadPpt() {
    lui.pptState = "loading"; rerender();
    try {
      await gerarPpt({ db, c, prof, supById, cms, refYm, score, prem, profMetas });
      lui.pptState = "idle"; rerender();
    } catch (e) { console.error(e); lui.pptState = "error"; rerender(); }
  }

  const wrap = h("div", {});

  // Voltar
  wrap.appendChild(h("button", {
    class: "flex items-center gap-1 text-sm font-medium mb-4 hover:underline",
    style: { color: C.accentInk },
    onClick: () => setRoute({ view: "home" }),
  }, icon("ChevronLeft", { size: 16, color: C.accentInk }), " Voltar para a lista"));

  // RESUMO
  const resumo = Card({ class: "p-5 mb-5" });
  const resumoTop = h("div", { class: "flex flex-wrap items-center gap-4 md:gap-6" });
  resumoTop.appendChild(MatBadge(c.matricula, 56));
  const resumoInfo = h("div", { class: "min-w-0 flex-1" });
  resumoInfo.appendChild(h("h2", { class: "text-xl md:text-2xl font-extrabold tracking-tight", style: { fontFamily: FONT_HEAD } }, "Matrícula " + c.matricula));
  const metaRow = h("div", { class: "flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm", style: { color: C.muted } });
  metaRow.appendChild(h("span", {}, `Perfil em ${refYm ? ymLabel(refYm) : "—"} `, h("b", { style: { color: C.ink } }, (prof && prof.name) || "—")));
  metaRow.appendChild(h("span", {}, "Supervisor ", h("b", { style: { color: C.ink } }, c.supervisorId ? (supById[c.supervisorId] && supById[c.supervisorId].name) : "não definido")));
  metaRow.appendChild(h("span", {}, "Último mês lançado ", h("b", { style: { color: C.ink } }, lastYm ? ymLabelFull(lastYm) : "—")));
  resumoInfo.appendChild(metaRow);
  resumoTop.appendChild(resumoInfo);

  const resumoRight = h("div", { class: "flex items-center gap-5" });
  if (prem != null && prem > 0) {
    resumoRight.appendChild(h("div", { class: "text-right" },
      h("div", { class: "text-[11px] font-semibold uppercase tracking-wide", style: { color: C.gold } }, "Premiação " + ymLabel(refYm)),
      h("div", { class: "text-lg font-extrabold tabular-nums", style: { color: C.gold, fontFamily: FONT_HEAD } }, fmtBRL(prem)),
    ));
  }
  if (score) {
    const ringWrap = h("div", { class: "flex items-center gap-2.5" });
    ringWrap.appendChild(Ring(score.pct));
    const ringTxt = h("div", { class: "text-xs leading-tight", style: { color: C.muted } });
    ringTxt.appendChild(h("b", { style: { color: C.ink } }, `${score.hit} de ${score.counted}`));
    ringTxt.appendChild(document.createTextNode(" metas"));
    ringTxt.appendChild(h("br"));
    ringTxt.appendChild(document.createTextNode("atingidas em " + ymLabel(refYm)));
    ringWrap.appendChild(ringTxt);
    resumoRight.appendChild(ringWrap);
  }
  resumoTop.appendChild(resumoRight);
  resumo.appendChild(resumoTop);

  // Seletor de mês
  if (months.length > 0) {
    const selBlock = h("div", { class: "mt-4 pt-4 flex flex-wrap items-center justify-between gap-2", style: { borderTop: `1px dashed ${C.border}` } });
    const lbl = h("div", { class: "text-sm font-semibold", style: { color: C.ink } }, "Mês de referência");
    lbl.appendChild(h("span", { class: "font-normal ml-1", style: { color: C.muted } }, "· define o resultado exibido e a apresentação"));
    selBlock.appendChild(lbl);
    selBlock.appendChild(MonthPicker({ months, value: refYm, onChange: setSelMonth, lastMonth: lastYm }));
    resumo.appendChild(selBlock);
  }
  if (!hasRef && refYm) {
    resumo.appendChild(h("div", { class: "mt-2 text-xs flex items-center gap-1.5", style: { color: C.gold } },
      icon("AlertTriangle", { size: 13, color: C.gold }),
      ` Esta matrícula não possui dados em ${ymLabelFull(refYm)}. O comparativo abaixo mostra os meses disponíveis.`));
  }

  // PPT
  const pptBlock = h("div", { class: "mt-4 pt-4 flex flex-wrap items-center justify-between gap-2", style: { borderTop: `1px dashed ${C.border}` } });
  pptBlock.appendChild(h("div", { class: "text-xs", style: { color: C.muted } },
    `Gere uma apresentação (.pptx) com a evolução mês a mês e os resultados de ${refYm ? ymLabelFull(refYm) : "—"}.`));
  const pptBtn = Btn({
    kind: "dark",
    disabled: lui.pptState === "loading" || !cms.length,
    children: lui.pptState === "loading"
      ? [icon("Save", { size: 15, cls: "animate-spin" }), " Gerando…"]
      : [icon("Download", { size: 15 }), " Baixar apresentação (PPT)"],
    onClick: downloadPpt,
  });
  pptBlock.appendChild(pptBtn);
  resumo.appendChild(pptBlock);
  if (lui.pptState === "error") {
    resumo.appendChild(h("div", { class: "mt-2 text-xs flex items-center gap-1.5", style: { color: C.down } },
      icon("AlertTriangle", { size: 13, color: C.down }), " Não foi possível gerar o arquivo. Tente novamente."));
  }
  if (!cms.length) {
    resumo.appendChild(h("div", { class: "mt-2 text-xs", style: { color: C.muted } }, "Importe ao menos um mês para habilitar a geração da apresentação."));
  }
  wrap.appendChild(resumo);

  // DETALHAMENTO DO MÊS
  if (monthAnalysis) {
    wrap.appendChild(buildMonthDetail({ db, c, refYm, score, monthAnalysis, extraMetas, lui, toggleMeta, setShowExtra }));
  }

  // DETALHE DA META
  if (lui.selMeta && selCfg) {
    wrap.appendChild(MetaDetailCard({
      meta: lui.selMeta, cfg: selCfg, tiers: selTiers, chartData,
      valor: hasRef ? (db.monthly[refYm].byMat[c.matricula] && db.monthly[refYm].byMat[c.matricula].valores[lui.selMeta]) : null,
      refYm, onClose: () => { lui.selMeta = null; rerender(); },
    }));
  }

  // COMPARATIVO
  wrap.appendChild(buildComparativo({ db, c, cms, rows, profMetas, prof, extraMetas, lui, toggleMeta, setShowExtra }));

  return wrap;
}

/* ---------- Bloco: Detalhamento do mês ---------- */
function buildMonthDetail({ db, c, refYm, score, monthAnalysis, extraMetas, lui, toggleMeta, setShowExtra }) {
  const card = Card({ class: "mb-5 p-5" });

  const headerRow = h("div", { class: "flex flex-wrap items-center justify-between gap-2 mb-4" });
  const hl = h("div", {});
  hl.appendChild(h("div", { class: "font-bold", style: { fontFamily: FONT_HEAD } }, "Detalhamento de " + ymLabelFull(refYm)));
  hl.appendChild(h("div", { class: "text-xs mt-0.5", style: { color: C.muted } }, "Situação por meta, premiação acumulada e onde focar. Clique em uma meta para ver os patamares."));
  headerRow.appendChild(hl);
  const hr = h("div", { class: "flex items-center gap-3" });
  if (extraMetas.length > 0) {
    const lab = h("label", { class: "flex items-center gap-1.5 text-xs cursor-pointer", style: { color: C.muted } });
    const cb = h("input", { type: "checkbox", checked: lui.showExtra, onChange: (e) => setShowExtra(e.target.checked) });
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(` indicadores fora do perfil (${extraMetas.length})`));
    hr.appendChild(lab);
  }
  if (score) {
    const chips = h("div", { class: "flex items-center gap-1.5 text-xs" });
    [["G1", score.g1], ["G2", score.g2], ["G3", score.g3], ["G4", score.g4]].forEach(([k, n]) => {
      chips.appendChild(h("span", {
        class: "inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold",
        style: { background: LEVEL_SOFT[k], color: LEVEL_COLOR[k] },
      }, k + " ", h("b", { class: "tabular-nums" }, String(n))));
    });
    hr.appendChild(chips);
  }
  headerRow.appendChild(hr);
  card.appendChild(headerRow);

  // alerta de corte
  if (monthAnalysis.abaixoCorte.length > 0) {
    const txt = monthAnalysis.abaixoCorte.map((it) => `${it.meta} (${fmtPct(it.value)} < corte ${fmtPct(it.cut)})`).join(", ");
    const alert = h("div", { class: "flex items-start gap-2 mb-4 p-3 rounded-xl text-sm", style: { background: C.downSoft, color: C.down, border: `1px solid ${C.down}33` } });
    alert.appendChild(icon("AlertTriangle", { size: 16, color: C.down, cls: "mt-0.5 shrink-0" }));
    const span = h("span", {});
    span.appendChild(h("b", {}, `${monthAnalysis.abaixoCorte.length} meta(s) abaixo da linha de corte`));
    span.appendChild(document.createTextNode(` — atenção máxima: ${txt}.`));
    alert.appendChild(span);
    card.appendChild(alert);
  }

  // premiação total do mês
  if (score) {
    const prBox = h("div", { class: "flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 p-3 rounded-xl", style: { background: C.goldSoft } });
    prBox.appendChild(h("div", {},
      h("div", { class: "text-[11px] font-semibold uppercase tracking-wide", style: { color: C.gold } }, "Premiação estimada no mês"),
      h("div", { class: "text-xl font-extrabold tabular-nums", style: { color: C.gold, fontFamily: FONT_HEAD } }, fmtBRL(score.prem)),
    ));
    const desc = h("div", { class: "text-xs", style: { color: C.ink } }, `${score.hit} de ${score.counted} metas no nível Meta (G3) ou acima`);
    if (monthAnalysis.prioridade.length > 0) {
      const ganhoTotal = monthAnalysis.prioridade.reduce((s, it) => s + (it.ganho || 0), 0);
      if (ganhoTotal > 0) {
        desc.appendChild(document.createTextNode(" · até "));
        desc.appendChild(h("b", { style: { color: C.gold } }, fmtBRL(ganhoTotal)));
        desc.appendChild(document.createTextNode(" a mais alcançando o próximo nível de cada meta"));
      }
    }
    prBox.appendChild(desc);
    card.appendChild(prBox);
  }

  // PRIORIDADES
  if (monthAnalysis.prioridade.length > 0) {
    const prio = h("div", { class: "mb-5" });
    const prioHead = h("div", { class: "text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5", style: { color: C.muted } });
    prioHead.appendChild(icon("Award", { size: 13, color: C.down }));
    prioHead.appendChild(document.createTextNode(" Prioridades — abaixo do corte primeiro, depois maior retorno por esforço"));
    prio.appendChild(prioHead);
    const prioGrid = h("div", { class: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" });
    monthAnalysis.prioridade.slice(0, 3).forEach((it, i) => {
      const crit = it.belowCut;
      const btn = h("button", {
        class: "text-left rounded-xl p-3 transition-shadow hover:shadow-md",
        style: { border: `1px solid ${crit ? C.down : i === 0 ? C.gold : C.border}`, background: crit ? C.downSoft : i === 0 ? C.goldSoft : "#fff" },
        onClick: () => toggleMeta(it.meta),
      });
      const tr = h("div", { class: "flex items-center justify-between gap-2" });
      tr.appendChild(h("span", { class: "font-bold text-sm", style: { fontFamily: FONT_HEAD } }, it.meta));
      tr.appendChild(crit
        ? h("span", { class: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: C.down, color: "#fff" } }, "ABAIXO DO CORTE")
        : h("span", { class: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: C.flatSoft, color: C.muted } }, "#" + (i + 1)));
      btn.appendChild(tr);
      const sub = h("div", { class: "text-xs mt-1.5", style: { color: C.muted } });
      sub.appendChild(document.createTextNode("Atual "));
      sub.appendChild(h("b", { class: "tabular-nums", style: { color: C.ink } }, fmtPct(it.value)));
      if (crit) {
        sub.appendChild(document.createTextNode(" · "));
        sub.appendChild(h("b", { class: "tabular-nums", style: { color: C.down } }, `${it.gapCut.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`));
        sub.appendChild(document.createTextNode(` abaixo do corte (${fmtPct(it.cut)})`));
      } else if (it.next) {
        sub.appendChild(document.createTextNode(" · faltam "));
        sub.appendChild(h("b", { class: "tabular-nums", style: { color: it.hitG3 ? C.accentInk : C.down } }, `${it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`));
        sub.appendChild(document.createTextNode(` p/ ${it.next.key}`));
      }
      btn.appendChild(sub);
      if (it.next && it.ganho > 0) {
        btn.appendChild(h("div", { class: "text-xs mt-1 font-semibold", style: { color: C.gold } }, `+${fmtBRL(it.ganho)} ao atingir ${it.next.label}`));
      }
      prioGrid.appendChild(btn);
    });
    prio.appendChild(prioGrid);
    card.appendChild(prio);
  }

  // BATENDO x NÃO BATENDO
  const split = h("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" });
  const colA = h("div", {});
  const headA = h("div", { class: "text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5", style: { color: C.up } });
  headA.appendChild(icon("Check", { size: 13, color: C.up }));
  headA.appendChild(document.createTextNode(` Batendo a meta (${monthAnalysis.batendo.length})`));
  colA.appendChild(headA);
  const listA = h("div", { class: "flex flex-col gap-1.5" });
  if (monthAnalysis.batendo.length) monthAnalysis.batendo.forEach((it) => listA.appendChild(MetaRow(it, () => toggleMeta(it.meta), lui.selMeta === it.meta)));
  else listA.appendChild(h("div", { class: "text-xs py-2", style: { color: C.muted } }, "Nenhuma meta atingida neste mês."));
  colA.appendChild(listA);
  split.appendChild(colA);

  const colB = h("div", {});
  const headB = h("div", { class: "text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5", style: { color: C.down } });
  headB.appendChild(icon("X", { size: 13, color: C.down }));
  headB.appendChild(document.createTextNode(` Abaixo da meta (${monthAnalysis.naoBatendo.length})`));
  colB.appendChild(headB);
  const listB = h("div", { class: "flex flex-col gap-1.5" });
  if (monthAnalysis.naoBatendo.length) monthAnalysis.naoBatendo.forEach((it) => listB.appendChild(MetaRow(it, () => toggleMeta(it.meta), lui.selMeta === it.meta)));
  else listB.appendChild(h("div", { class: "text-xs py-2", style: { color: C.muted } }, "Todas as metas com dados foram atingidas. 🎯"));
  colB.appendChild(listB);
  split.appendChild(colB);
  card.appendChild(split);

  if (monthAnalysis.semDados.length > 0) {
    card.appendChild(h("div", { class: "text-xs mt-3 pt-3", style: { color: C.muted, borderTop: `1px dashed ${C.border}` } },
      `Sem dados em ${ymLabel(refYm)}: ${monthAnalysis.semDados.map((it) => it.meta).join(", ")}.`));
  }
  if (lui.showExtra && monthAnalysis.foraItems.length > 0) {
    const fora = h("div", { class: "mt-4 pt-4", style: { borderTop: `1px dashed ${C.border}` } });
    const fh = h("div", { class: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: C.muted } }, "Indicadores fora do perfil ");
    fh.appendChild(h("span", { class: "font-normal normal-case" }, "· não exigidos, apenas informativo"));
    fora.appendChild(fh);
    const chips = h("div", { class: "flex flex-wrap gap-1.5" });
    monthAnalysis.foraItems.forEach((it) => {
      chips.appendChild(h("span", { class: "text-xs px-2.5 py-1 rounded-full tabular-nums", style: { background: C.flatSoft, color: C.muted } },
        it.meta + " ", h("b", { style: { color: C.ink } }, fmtPct(it.value))));
    });
    fora.appendChild(chips);
    card.appendChild(fora);
  }

  return card;
}

/* ---------- MetaRow ---------- */
function MetaRow(it, onClick, active) {
  const col = it.hitG3 ? (it.level === "G1" ? LEVEL_COLOR.G1 : it.level === "G2" ? LEVEL_COLOR.G2 : LEVEL_COLOR.G3) : C.down;
  const btn = h("button", {
    class: "w-full text-left rounded-lg px-3 py-2 transition-colors",
    style: { border: `1px solid ${active ? C.accent : it.belowCut ? C.down : C.border}`, background: active ? C.accentSoft : it.belowCut ? C.downSoft : "#fff" },
    onClick,
  });
  const r1 = h("div", { class: "flex items-center justify-between gap-2" });
  r1.appendChild(h("span", { class: "font-semibold text-sm truncate" }, it.meta));
  const r1r = h("span", { class: "flex items-center gap-1.5 shrink-0" });
  if (it.belowCut) r1r.appendChild(h("span", { class: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: C.down, color: "#fff" } }, "CORTE"));
  if (it.level) r1r.appendChild(h("span", { class: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: LEVEL_SOFT[it.level], color: LEVEL_COLOR[it.level] } }, it.level));
  r1r.appendChild(h("span", { class: "font-bold tabular-nums text-sm", style: { color: col } }, fmtPct(it.value)));
  r1.appendChild(r1r);
  btn.appendChild(r1);

  const r2 = h("div", { class: "text-[11px] mt-0.5 flex items-center justify-between gap-2", style: { color: C.muted } });
  const r2l = h("span", {});
  if (it.belowCut) r2l.appendChild(h("span", { style: { color: C.down, fontWeight: 600 } }, `Abaixo do corte (${fmtPct(it.cut)})`));
  else r2l.appendChild(document.createTextNode(it.levelLabel ? `Nível: ${it.levelLabel}` : "Abaixo da meta"));
  if (it.prem > 0) r2l.appendChild(document.createTextNode(` · ${fmtBRL(it.prem)}`));
  r2.appendChild(r2l);
  if (it.next) {
    const r2r = h("span", {}, "faltam ", h("b", { style: { color: it.hitG3 ? C.accentInk : C.down } }, `${it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`), ` p/ ${it.next.key}`);
    r2.appendChild(r2r);
  }
  btn.appendChild(r2);
  return btn;
}

/* ---------- MetaDetailCard ---------- */
function MetaDetailCard({ meta, cfg, tiers, valor, refYm, onClose, chartData }) {
  const e = evalMeta(cfg, valor);
  const card = Card({ class: "mb-5 p-5" });

  const head = h("div", { class: "flex items-center justify-between mb-1" });
  const ht = h("div", { class: "font-bold flex items-center gap-2", style: { fontFamily: FONT_HEAD } });
  ht.appendChild(icon("Award", { size: 16, color: C.gold }));
  ht.appendChild(document.createTextNode(" Patamares · " + meta));
  head.appendChild(ht);
  head.appendChild(h("button", { class: "text-xs flex items-center gap-1", style: { color: C.muted }, onClick: onClose },
    icon("X", { size: 13, color: C.muted }), " fechar"));
  card.appendChild(head);

  const sub = h("div", { class: "text-xs mb-4", style: { color: C.muted } });
  sub.appendChild(document.createTextNode(`Resultado em ${ymLabelFull(refYm)}: `));
  sub.appendChild(h("b", { class: "tabular-nums", style: { color: C.ink } }, fmtPct(valor)));
  if (e.level) {
    sub.appendChild(document.createTextNode(" · nível atual "));
    sub.appendChild(h("b", { style: { color: LEVEL_COLOR[e.level] } }, `${e.level} (${e.levelLabel})`));
  } else {
    sub.appendChild(document.createTextNode(" · "));
    sub.appendChild(h("b", { style: { color: C.down } }, "abaixo da meta"));
  }
  if (e.belowCut) {
    sub.appendChild(document.createTextNode(" · "));
    sub.appendChild(h("b", { style: { color: C.down } }, `⚠ abaixo da linha de corte (${fmtPct(e.cut)}) — prioridade máxima`));
  }
  card.appendChild(sub);

  // trilha de patamares
  const tierGrid = h("div", { class: "grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-2" });
  tiers.forEach((t) => {
    const reached = valor != null && valor >= t.value;
    const gap = valor != null ? Math.round((t.value - valor) * 100) / 100 : null;
    const box = h("div", { class: "rounded-xl p-3", style: { border: `1px solid ${reached ? LEVEL_COLOR[t.key] : C.border}`, background: reached ? LEVEL_SOFT[t.key] : "#fff" } });
    const top = h("div", { class: "flex items-center justify-between" });
    top.appendChild(h("span", { class: "text-xs font-bold", style: { color: LEVEL_COLOR[t.key] } }, `${t.key} · ${t.label}`));
    if (reached) top.appendChild(icon("Check", { size: 14, color: LEVEL_COLOR[t.key] }));
    box.appendChild(top);
    box.appendChild(h("div", { class: "mt-1 text-lg font-extrabold tabular-nums", style: { fontFamily: FONT_HEAD, color: C.ink } }, fmtPct(t.value)));
    const meta2 = h("div", { class: "text-[11px] mt-0.5", style: { color: C.muted } });
    meta2.appendChild(document.createTextNode(t.prem != null ? fmtBRL(t.prem) : "—"));
    if (valor != null) {
      if (reached) { meta2.appendChild(document.createTextNode(" · ")); meta2.appendChild(h("span", { style: { color: LEVEL_COLOR[t.key] } }, "atingido")); }
      else { meta2.appendChild(document.createTextNode(" · faltam ")); meta2.appendChild(h("b", { style: { color: C.down } }, `${gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`)); }
    }
    box.appendChild(meta2);
    tierGrid.appendChild(box);
  });
  card.appendChild(tierGrid);

  // legenda + gráfico
  const chartWrap = h("div", { class: "mt-4" });
  const legend = h("div", { class: "text-xs mb-3 flex flex-wrap items-center gap-x-4 gap-y-1", style: { color: C.muted } });
  legend.appendChild(h("span", { class: "inline-flex items-center gap-1.5" },
    h("span", { class: "inline-block w-5 h-0.5", style: { background: C.accent } }), " Resultado"));
  tiers.forEach((t) => {
    legend.appendChild(h("span", { class: "inline-flex items-center gap-1.5" },
      h("span", { class: "inline-block w-5", style: { borderTop: `2px ${t.key === "G3" ? "solid" : "dashed"} ${LEVEL_COLOR[t.key]}` } }),
      `${t.key} ${t.label}${t.key === "G3" ? " (destaque)" : ""}`));
  });
  if (e.cut != null) {
    legend.appendChild(h("span", { class: "inline-flex items-center gap-1.5" },
      h("span", { class: "inline-block w-5", style: { borderTop: `2px dotted ${C.down}` } }), " Corte G6"));
  }
  chartWrap.appendChild(legend);
  chartWrap.appendChild(MetaTierChart({ chartData, tiers, cut: e.cut }));
  card.appendChild(chartWrap);

  return card;
}

/* ---------- MetaTierChart (Chart.js + rótulos laterais com anti-colisão) ---------- */
/* Reproduz o gráfico recharts: eixo Y dinâmico, linhas de patamar (G4/G3/G2/G1)
   e corte (G6), linha de resultado verde, rótulos à direita com anti-colisão. */
function MetaTierChart({ chartData, tiers, cut }) {
  const vals = chartData.map((d) => d.valor).filter((v) => v != null);
  const marks = [...tiers.map((t) => t.value), ...(cut != null ? [cut] : [])];
  const all = [...vals, ...marks];

  let lo = 0, hi = 100;
  if (all.length) {
    const mn = Math.min(...all), mx = Math.max(...all);
    const pad = Math.max((mx - mn) * 0.18, 4);
    lo = Math.max(0, Math.floor((mn - pad) / 5) * 5);
    hi = Math.min(100, Math.ceil((mx + pad) / 5) * 5);
    if (hi - lo < 12) { hi = Math.min(100, lo + 12); lo = Math.max(0, hi - 12); }
  }
  const span = hi - lo || 1;

  const refs = [
    ...tiers.map((t) => ({ key: t.key, label: t.key, value: t.value, color: LEVEL_COLOR[t.key], dash: t.key === "G3" ? [] : [6, 4], w: t.key === "G3" ? 2.5 : 1.5 })),
    ...(cut != null ? [{ key: "G6", label: "Corte", value: cut, color: C.down, dash: [2, 3], w: 1.5 }] : []),
  ].filter((r) => r.value >= lo && r.value <= hi).sort((a, b) => b.value - a.value);

  const H = 320, padTop = 12, padBot = 28, plotH = H - padTop - padBot;
  const GUTTER = 104;
  const yOf = (v) => padTop + (1 - (v - lo) / span) * plotH;
  const minGap = 18;
  const labelY = refs.map((r) => yOf(r.value));
  for (let i = 1; i < labelY.length; i++) {
    if (labelY[i] - labelY[i - 1] < minGap) labelY[i] = labelY[i - 1] + minGap;
  }
  for (let i = labelY.length - 1; i > 0; i--) {
    if (labelY[i] > padTop + plotH) labelY[i] = padTop + plotH;
    if (labelY[i] - labelY[i - 1] < minGap) labelY[i - 1] = labelY[i] - minGap;
  }

  const outer = h("div", { class: "relative", style: { width: "100%" } });
  const inner = h("div", { style: { width: "100%", height: H + "px" } });
  const canvas = h("canvas", {});
  inner.appendChild(canvas);
  outer.appendChild(inner);

  // plugin para desenhar as ReferenceLines como anotações
  const refLinePlugin = {
    id: "gopRefLines",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const yScale = scales.y;
      refs.forEach((r) => {
        const yPix = yScale.getPixelForValue(r.value);
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash(r.dash);
        ctx.lineWidth = r.w;
        ctx.strokeStyle = r.color;
        ctx.moveTo(chartArea.left, yPix);
        ctx.lineTo(chartArea.right, yPix);
        ctx.stroke();
        ctx.restore();
      });
    },
  };

  // monta o gráfico após inserir no DOM (precisa de dimensões)
  requestAnimationFrame(() => {
    if (!canvas.isConnected) return;
    new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: chartData.map((d) => d.mes),
        datasets: [{
          data: chartData.map((d) => d.valor),
          borderColor: C.accent,
          backgroundColor: C.accent,
          borderWidth: 2.75,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: C.accent,
          pointBorderWidth: 0,
          spanGaps: true,        // connectNulls
          tension: 0.4,          // type="monotone" (curva suave)
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: padTop, right: GUTTER, bottom: 4, left: 0 } },
        scales: {
          x: {
            grid: { display: false, drawBorder: true, color: C.border },
            border: { color: C.border },
            ticks: { color: C.muted, font: { size: 12, family: "Inter" } },
          },
          y: {
            min: lo, max: hi,
            grid: { color: C.border, drawBorder: false, borderDash: [3, 3] },
            border: { display: false },
            ticks: { color: C.muted, font: { size: 12, family: "Inter" }, callback: (v) => v + "%" },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#fff",
            titleColor: C.ink,
            bodyColor: C.ink,
            borderColor: C.border,
            borderWidth: 1,
            cornerRadius: 10,
            padding: 10,
            titleFont: { family: "Inter", weight: "600", size: 13 },
            bodyFont: { family: "Inter", size: 13 },
            displayColors: false,
            callbacks: {
              label: (item) => `Resultado: ${fmtPct(item.parsed.y)}`,
            },
          },
        },
      },
      plugins: [refLinePlugin],
    });
  });

  // rótulos laterais (no gutter reservado à direita)
  const labelBox = h("div", { class: "absolute top-0 h-full pointer-events-none", style: { right: 0, width: GUTTER + "px" } });
  refs.forEach((r, i) => {
    const borderStyle = r.dash.length === 0 ? "solid" : r.key === "G6" ? "dotted" : "dashed";
    const row = h("div", { class: "absolute flex items-center gap-1 whitespace-nowrap", style: { top: (labelY[i] - 9) + "px", left: 0 } });
    row.appendChild(h("span", { class: "inline-block", style: { width: "10px", borderTop: `2px ${borderStyle} ${r.color}` } }));
    row.appendChild(h("span", {
      class: "text-[10px] font-bold px-1 py-0.5 rounded",
      style: { background: r.key === "G6" ? C.downSoft : (LEVEL_SOFT[r.key] || C.flatSoft), color: r.color },
    }, `${r.label} ${fmtPct(r.value)}`));
    labelBox.appendChild(row);
  });
  outer.appendChild(labelBox);

  return outer;
}

/* ---------- Comparativo mês a mês ---------- */
function buildComparativo({ db, c, cms, rows, profMetas, prof, extraMetas, lui, toggleMeta, setShowExtra }) {
  const card = Card({ class: "mb-5 overflow-hidden" });

  const header = h("div", { class: "flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3" });
  const hl = h("div", {});
  hl.appendChild(h("div", { class: "font-bold", style: { fontFamily: FONT_HEAD } }, "Comparativo mês a mês"));
  hl.appendChild(h("div", { class: "text-xs mt-0.5", style: { color: C.muted } }, "Clique em um indicador para ver o gráfico de evolução. Células verdes indicam meta atingida."));
  header.appendChild(hl);
  if (extraMetas.length > 0) {
    const lab = h("label", { class: "flex items-center gap-1.5 text-xs cursor-pointer", style: { color: C.muted } });
    lab.appendChild(h("input", { type: "checkbox", checked: lui.showExtra, onChange: (e) => setShowExtra(e.target.checked) }));
    lab.appendChild(document.createTextNode(` mostrar indicadores fora do perfil (${extraMetas.length})`));
    header.appendChild(lab);
  }
  card.appendChild(header);

  if (!cms.length) {
    card.appendChild(h("div", { class: "px-5 pb-6 text-sm", style: { color: C.muted } }, "Nenhum dado importado para este colaborador ainda."));
    return card;
  }
  if (!rows.length) {
    card.appendChild(h("div", { class: "px-5 pb-6 text-sm", style: { color: C.muted } }, "O perfil deste colaborador não possui metas configuradas. Ajuste em Administração → Perfis."));
    return card;
  }

  const scroller = h("div", { class: "overflow-x-auto" });
  const table = h("table", { class: "w-full text-sm", style: { borderCollapse: "collapse" } });
  const thead = h("thead", {});
  const htr = h("tr", { style: { background: "#F7F9FA" } });
  htr.appendChild(h("th", { class: "text-left px-5 py-2.5 font-semibold text-xs uppercase tracking-wide whitespace-nowrap", style: { color: C.muted } }, "Indicador"));
  htr.appendChild(h("th", { class: "text-right px-3 py-2.5 font-semibold text-xs uppercase tracking-wide whitespace-nowrap", style: { color: C.muted } }, "Alvo"));
  cms.forEach((ym) => htr.appendChild(h("th", { class: "text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wide whitespace-nowrap", style: { color: C.muted } }, ymLabel(ym))));
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = h("tbody", {});
  rows.forEach((m) => {
    const isExtra = !profMetas.includes(m);
    const cfg = prof && prof.metas[m];
    const alvo = alvoOf(cfg);
    const sel = lui.selMeta === m;
    const tr = h("tr", {
      class: "cursor-pointer",
      style: { borderTop: `1px solid ${C.border}`, background: sel ? C.accentSoft : "transparent" },
      onClick: () => toggleMeta(m),
    });
    const nameTd = h("td", { class: "px-5 py-3 font-semibold whitespace-nowrap" });
    const nameSpan = h("span", { class: "inline-flex items-center gap-1.5" });
    nameSpan.appendChild(h("span", { class: "w-1.5 h-1.5 rounded-full", style: { background: sel ? C.accent : C.flat } }));
    nameSpan.appendChild(document.createTextNode(m));
    if (isExtra) nameSpan.appendChild(h("span", { class: "text-[10px] font-medium px-1.5 py-0.5 rounded-full", style: { background: C.flatSoft, color: C.muted } }, "fora do perfil"));
    nameTd.appendChild(nameSpan);
    tr.appendChild(nameTd);
    tr.appendChild(h("td", { class: "px-3 py-3 text-right tabular-nums whitespace-nowrap", style: { color: C.muted } }, alvo != null ? fmtPct(alvo) : "—"));

    cms.forEach((ym, i) => {
      const v = db.monthly[ym].byMat[c.matricula].valores[m];
      let prev = null;
      for (let j = i - 1; j >= 0; j--) {
        const pv = db.monthly[cms[j]].byMat[c.matricula].valores[m];
        if (pv != null) { prev = pv; break; }
      }
      const d = v != null && prev != null ? v - prev : null;
      const cfgMes = profForMonth(db, c, ym) && profForMonth(db, c, ym).metas[m];
      const alvoMes = alvoOf(cfgMes);
      const ok = v != null && alvoMes != null ? v >= alvoMes : null;
      const td = h("td", {
        class: "px-4 py-2.5 text-right whitespace-nowrap",
        style: { background: ok === true ? C.okBg : ok === false ? C.badBg : "transparent" },
      });
      td.appendChild(h("div", { class: "font-bold tabular-nums", style: { color: ok === false ? C.down : C.ink } }, fmtPct(v)));
      const dWrap = h("div", { class: "mt-0.5 flex justify-end" });
      const deltaEl = Delta(d);
      if (deltaEl) dWrap.appendChild(deltaEl);
      td.appendChild(dWrap);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroller.appendChild(table);
  card.appendChild(scroller);
  return card;
}

/* ============================== IMPORTAÇÃO ============================== */
function viewImport(ctx) {
  const { db } = ctx;
  const now = new Date();
  // estado persistente da importação (substitui useState de ImportView)
  if (!STATE.ui.import) {
    STATE.ui.import = { mes: now.getMonth() + 1, ano: now.getFullYear(), file: null, parsed: null, err: null, createMap: {}, doneMsg: null };
  }
  const s = STATE.ui.import;

  const ym = `${s.ano}-${String(s.mes).padStart(2, "0")}`;
  const exists = !!db.monthly[ym];
  const matSet = new Set(db.collaborators.map((c) => c.matricula));

  async function handleFile(f) {
    s.file = f; s.err = null; s.parsed = null; s.doneMsg = null; rerender();
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      let hIdx = -1;
      for (let i = 0; i < Math.min(grid.length, 15); i++) {
        if ((grid[i] || []).some((cell) => strip(cell) === "matricula")) { hIdx = i; break; }
      }
      if (hIdx < 0) throw new Error("Não encontrei a coluna “Matricula” na planilha. Verifique se o arquivo segue o modelo de exportação.");
      const header = grid[hIdx];
      const col = { mat: -1, agente: -1, perfil: -1, prem: -1, metas: {} };
      header.forEach((hh, i) => {
        const ss = strip(hh);
        if (ss === "matricula") col.mat = i;
        else if (["agente", "nome", "colaborador"].includes(ss)) col.agente = i;
        else if (ss.includes("perfil")) col.perfil = i;
        else if (ss.includes("premiac")) col.prem = i;
        else { const cm = canonMeta(hh); if (cm) col.metas[i] = cm; }
      });
      const rows = [];
      for (let i = hIdx + 1; i < grid.length; i++) {
        const r = grid[i] || [];
        const rawMat = r[col.mat];
        const agente = col.agente >= 0 ? String(r[col.agente] ?? "").trim() : "";
        if (strip(agente) === "total") continue;
        if (rawMat == null || String(rawMat).trim() === "") continue;
        const mat = String(parseInt(rawMat, 10));
        if (!/^\d+$/.test(mat)) continue;
        const valores = {};
        Object.entries(col.metas).forEach(([i2, mName]) => {
          let v = r[i2];
          if (v == null || v === "") return;
          if (typeof v === "string") v = parseFloat(v.replace("%", "").replace(",", "."));
          if (isNaN(v)) return;
          if (v <= 1.5) v = v * 100;
          v = Number(v.toPrecision(12));
          valores[mName] = v;
        });
        let prem = col.prem >= 0 ? r[col.prem] : null;
        if (typeof prem === "string") prem = parseFloat(prem.replace(/[R$\s.]/g, "").replace(",", "."));
        if (prem != null && isNaN(prem)) prem = null;
        const perfilRaw = col.perfil >= 0 ? String(r[col.perfil] ?? "").trim() : "";
        rows.push({ mat, perfilRaw, valores, premiacao: prem });
      }
      if (!rows.length) throw new Error("Nenhuma linha de colaborador válida foi encontrada no arquivo.");
      const unknown = rows.filter((r) => !matSet.has(r.mat));
      const cm = {}; unknown.forEach((u) => { cm[u.mat] = true; });
      s.createMap = cm;
      s.parsed = { rows, unknown };
      rerender();
    } catch (e) { s.err = e.message || String(e); rerender(); }
  }

  function confirmImport() {
    const parsed = s.parsed, createMap = s.createMap, fileName = s.file.name;
    update((d) => {
      const pByName = {}; d.profiles.forEach((p) => { pByName[strip(p.name)] = p; });
      let outros = d.profiles.find((p) => strip(p.name) === "outros");
      const ensureOutros = () => { if (!outros) { outros = { id: "p_" + uid(), name: "Outros", metas: {} }; d.profiles.push(outros); } return outros.id; };
      const byMat = {};
      parsed.rows.forEach((r) => {
        const perfilDaPlanilha = r.perfilRaw && pByName[strip(r.perfilRaw)] ? pByName[strip(r.perfilRaw)].id : null;
        let known = d.collaborators.find((c) => c.matricula === r.mat);
        if (!known) {
          if (!createMap[r.mat]) return;
          const pid = perfilDaPlanilha || ensureOutros();
          known = { id: "c_" + uid(), matricula: r.mat, perfilId: pid, supervisorId: null };
          d.collaborators.push(known);
        }
        const perfilMes = perfilDaPlanilha || known.perfilId || ensureOutros();
        byMat[r.mat] = { valores: r.valores, premiacao: r.premiacao, perfilId: perfilMes };
      });
      d.monthly[ym] = { byMat, importedAt: new Date().toISOString(), arquivo: fileName };
      return d;
    });
    const total = parsed.rows.filter((r) => matSet.has(r.mat) || createMap[r.mat]).length;
    s.doneMsg = `Importação concluída: ${total} colaborador(es) lançado(s) em ${ymLabelFull(ym)}.`;
    s.parsed = null; s.file = null;
    rerender();
  }

  const knownCount = s.parsed ? s.parsed.rows.length - s.parsed.unknown.length : 0;
  const willCreate = s.parsed ? s.parsed.unknown.filter((u) => s.createMap[u.mat]).length : 0;

  const wrap = h("div", { class: "max-w-3xl" });
  wrap.appendChild(h("h1", { class: "text-2xl font-extrabold tracking-tight mb-1", style: { fontFamily: FONT_HEAD } }, "Importar planilha mensal"));
  wrap.appendChild(h("p", { class: "text-sm mb-6", style: { color: C.muted } },
    "Selecione o mês e o ano de referência e envie o arquivo .xlsx exportado. Cada linha será vinculada ao colaborador pela matrícula."));

  const cfgCard = Card({ class: "p-5 mb-4" });
  const grid = h("div", { class: "grid grid-cols-2 gap-3 mb-4" });
  const mesBox = h("div", {});
  mesBox.appendChild(Label("Mês"));
  mesBox.appendChild(Select({ value: String(s.mes), onChange: (e) => { s.mes = +e.target.value; rerender(); } },
    MESES_FULL.map((m, i) => Opt(String(i + 1), m, s.mes === i + 1))));
  grid.appendChild(mesBox);
  const anoBox = h("div", {});
  anoBox.appendChild(Label("Ano"));
  anoBox.appendChild(Select({ value: String(s.ano), onChange: (e) => { s.ano = +e.target.value; rerender(); } },
    Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map((y) => Opt(String(y), String(y), s.ano === y))));
  grid.appendChild(anoBox);
  cfgCard.appendChild(grid);

  if (exists) {
    const warn = h("div", { class: "mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm", style: { background: C.goldSoft, color: C.gold, border: "1px solid #EAD9AE" } });
    warn.appendChild(icon("AlertTriangle", { size: 16, color: C.gold, cls: "mt-0.5 shrink-0" }));
    const sp = h("span", {});
    sp.appendChild(h("b", {}, ymLabelFull(ym)));
    sp.appendChild(document.createTextNode(` já possui dados importados (${Object.keys(db.monthly[ym].byMat).length} colaboradores). Uma nova importação `));
    sp.appendChild(h("b", {}, "sobrescreve"));
    sp.appendChild(document.createTextNode(" os dados deste mês."));
    warn.appendChild(sp);
    cfgCard.appendChild(warn);
  }

  // dropzone
  const drop = h("label", {
    class: "flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-9 cursor-pointer text-center",
    style: { border: `2px dashed ${s.file ? C.accent : C.border}`, background: s.file ? C.accentSoft : "#FAFBFC" },
  });
  drop.appendChild(icon("FileSpreadsheet", { size: 26, color: s.file ? C.accentInk : C.muted }));
  drop.appendChild(h("div", { class: "text-sm font-semibold" }, s.file ? s.file.name : "Clique para selecionar o arquivo .xlsx"));
  drop.appendChild(h("div", { class: "text-xs", style: { color: C.muted } }, "Formato esperado: colunas Agente, Perfil Considerado, Matricula e indicadores"));
  drop.appendChild(h("input", {
    type: "file", accept: ".xlsx,.xls,.csv", class: "file-hidden",
    onChange: (e) => { if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]); },
  }));
  cfgCard.appendChild(drop);

  if (s.err) {
    cfgCard.appendChild(h("div", { class: "mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm", style: { background: C.downSoft, color: C.down } },
      icon("AlertTriangle", { size: 16, color: C.down, cls: "mt-0.5 shrink-0" }), " " + s.err));
  }
  if (s.doneMsg) {
    const done = h("div", { class: "mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm", style: { background: C.upSoft, color: C.up } });
    done.appendChild(icon("Check", { size: 16, color: C.up, cls: "mt-0.5 shrink-0" }));
    const sp = h("span", {});
    sp.appendChild(document.createTextNode(s.doneMsg + " "));
    sp.appendChild(h("button", { class: "underline font-semibold", onClick: () => setRoute({ view: "home" }) }, "Ver painel"));
    done.appendChild(sp);
    cfgCard.appendChild(done);
  }
  wrap.appendChild(cfgCard);

  // pré-visualização
  if (s.parsed) {
    const pv = Card({ class: "p-5" });
    pv.appendChild(h("div", { class: "font-bold mb-3", style: { fontFamily: FONT_HEAD } }, "Pré-visualização da importação"));
    const stats = h("div", { class: "grid grid-cols-3 gap-3 mb-4" });
    [
      { lab: "Linhas lidas", val: s.parsed.rows.length },
      { lab: "Matrículas reconhecidas", val: knownCount },
      { lab: "Não cadastradas", val: s.parsed.unknown.length },
    ].forEach((k) => {
      stats.appendChild(h("div", { class: "rounded-xl px-3 py-2.5", style: { background: "#F7F9FA", border: `1px solid ${C.border}` } },
        h("div", { class: "text-[11px] font-semibold uppercase tracking-wide", style: { color: C.muted } }, k.lab),
        h("div", { class: "text-lg font-extrabold tabular-nums", style: { fontFamily: FONT_HEAD } }, String(k.val))));
    });
    pv.appendChild(stats);

    if (s.parsed.unknown.length > 0) {
      const block = h("div", { class: "mb-4" });
      const bh = h("div", { class: "text-sm font-semibold mb-2 flex items-center gap-1.5" });
      bh.appendChild(icon("AlertTriangle", { size: 14, color: C.gold }));
      bh.appendChild(document.createTextNode(" Colaboradores não cadastrados"));
      block.appendChild(bh);
      block.appendChild(h("div", { class: "text-xs mb-2", style: { color: C.muted } },
        "Marque para criar automaticamente (o perfil indicado na planilha será usado quando existir). Linhas desmarcadas serão ignoradas."));
      const list = h("div", { class: "flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1" });
      s.parsed.unknown.forEach((u) => {
        const lab = h("label", {
          class: "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer",
          style: { border: `1px solid ${C.border}`, background: s.createMap[u.mat] ? C.accentSoft : "#fff" },
        });
        lab.appendChild(h("input", {
          type: "checkbox", checked: !!s.createMap[u.mat],
          onChange: (e) => { s.createMap = Object.assign({}, s.createMap, { [u.mat]: e.target.checked }); rerender(); },
        }));
        lab.appendChild(h("span", { class: "font-semibold tabular-nums" }, "Matrícula " + u.mat));
        lab.appendChild(h("span", { class: "flex-1 truncate text-xs", style: { color: C.muted } }, u.perfilRaw ? `perfil: ${u.perfilRaw}` : "perfil: Outros"));
        list.appendChild(lab);
      });
      block.appendChild(list);
      pv.appendChild(block);
    }

    const footer = h("div", { class: "flex items-center justify-between gap-3 flex-wrap" });
    const ftxt = h("div", { class: "text-xs", style: { color: C.muted } });
    ftxt.appendChild(document.createTextNode("Serão lançados "));
    ftxt.appendChild(h("b", { style: { color: C.ink } }, String(knownCount + willCreate)));
    ftxt.appendChild(document.createTextNode(" colaboradores em "));
    ftxt.appendChild(h("b", { style: { color: C.ink } }, ymLabelFull(ym)));
    ftxt.appendChild(document.createTextNode(willCreate ? ` (${willCreate} novos)` : ""));
    footer.appendChild(ftxt);
    footer.appendChild(Btn({ children: [icon("Upload", { size: 15 }), " Importar planilha"], onClick: confirmImport }));
    pv.appendChild(footer);
    wrap.appendChild(pv);
  }

  return wrap;
}

/* ============================== ADMINISTRAÇÃO ============================== */
function viewAdmin(ctx) {
  const { db, profById, supById, months } = ctx;
  const au = STATE.ui.admin;
  const tabs = [
    { key: "collabs", label: "Colaboradores", icon: "Users" },
    { key: "sups", label: "Supervisores", icon: "UserCog" },
    { key: "profiles", label: "Perfis de metas", icon: "Target" },
    { key: "history", label: "Histórico de importações", icon: "History" },
  ];
  const wrap = h("div", {});
  wrap.appendChild(h("h1", { class: "text-2xl font-extrabold tracking-tight mb-4", style: { fontFamily: FONT_HEAD } }, "Administração"));
  const tabRow = h("div", { class: "flex gap-1.5 mb-5 flex-wrap" });
  tabs.forEach((t) => {
    tabRow.appendChild(h("button", {
      class: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium",
      style: { background: au.tab === t.key ? C.sidebar : C.surface, color: au.tab === t.key ? "#fff" : C.muted, border: `1px solid ${au.tab === t.key ? C.sidebar : C.border}` },
      onClick: () => { au.tab = t.key; rerender(); },
    }, icon(t.icon, { size: 15, color: au.tab === t.key ? "#fff" : C.muted }), " " + t.label));
  });
  wrap.appendChild(tabRow);

  if (au.tab === "collabs") wrap.appendChild(adminCollabs({ db, profById, supById }));
  else if (au.tab === "sups") wrap.appendChild(adminSups({ db, profById }));
  else if (au.tab === "profiles") wrap.appendChild(adminProfiles({ db }));
  else if (au.tab === "history") wrap.appendChild(adminHistory({ db, months }));
  return wrap;
}

/* ---------- Colaboradores ---------- */
function adminCollabs({ db, profById, supById }) {
  const au = STATE.ui.admin;
  const list = db.collaborators
    .filter((c) => { const t = strip(au.collabsQ); return !t || c.matricula.includes(t); })
    .sort((a, b) => (+a.matricula) - (+b.matricula));

  function remove(c) {
    askConfirm(`Excluir a matrícula ${c.matricula}? Os dados mensais importados desta matrícula serão mantidos no histórico, mas o colaborador sai do painel.`,
      () => update((d) => { d.collaborators = d.collaborators.filter((x) => x.id !== c.id); return d; }));
  }

  const card = Card({ class: "overflow-hidden" });
  const head = h("div", { class: "flex flex-wrap items-center justify-between gap-3 px-5 py-4", style: { borderBottom: `1px solid ${C.border}` } });
  const searchBox = h("div", { class: "relative flex-1 min-w-200 max-w-sm" });
  searchBox.appendChild(icon("Search", { size: 15, color: C.muted, cls: "absolute left-3 top-1/2 -translate-y-1/2" }));
  searchBox.appendChild(Input({
    placeholder: "Buscar por matrícula…", value: au.collabsQ, style: { paddingLeft: "34px" },
    onInput: (e) => { au.collabsQ = e.target.value.replace(/\D/g, ""); e.target.value = au.collabsQ; rerenderAdminCollabsList(); },
  }));
  head.appendChild(searchBox);
  head.appendChild(Btn({ children: [icon("Plus", { size: 15 }), " Adicionar colaborador"], onClick: () => openCollabForm(db, {}) }));
  card.appendChild(head);

  const scroller = h("div", { class: "overflow-x-auto" });
  const listHost = h("div", {});
  scroller.appendChild(listHost);
  card.appendChild(scroller);

  function buildTable() {
    const filtered = db.collaborators
      .filter((c) => { const t = strip(au.collabsQ); return !t || c.matricula.includes(t); })
      .sort((a, b) => (+a.matricula) - (+b.matricula));
    listHost.innerHTML = "";
    const table = h("table", { class: "w-full text-sm" });
    const thead = h("thead", {});
    const tr = h("tr", { style: { background: "#F7F9FA" } });
    ["Matrícula", "Perfil", "Supervisor", ""].forEach((hh, i) => {
      tr.appendChild(h("th", { class: `px-5 py-2.5 text-xs font-semibold uppercase tracking-wide ${i >= 3 ? "text-right" : "text-left"}`, style: { color: C.muted } }, hh));
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    const tbody = h("tbody", {});
    filtered.forEach((c) => {
      const row = h("tr", { style: { borderTop: `1px solid ${C.border}` } });
      const matTd = h("td", { class: "px-5 py-3 font-semibold tabular-nums" });
      matTd.appendChild(h("button", { class: "hover:underline text-left", style: { color: C.accentInk }, onClick: () => setRoute({ view: "collab", id: c.id }) }, c.matricula));
      row.appendChild(matTd);
      row.appendChild(h("td", { class: "px-5 py-3" }, (profById[c.perfilId] && profById[c.perfilId].name) || h("span", { style: { color: C.muted } }, "—")));
      row.appendChild(h("td", { class: "px-5 py-3" }, c.supervisorId ? (supById[c.supervisorId] && supById[c.supervisorId].name) : h("span", { style: { color: C.muted } }, "não definido")));
      const actTd = h("td", { class: "px-5 py-3 text-right whitespace-nowrap" });
      actTd.appendChild(h("button", { class: "p-1.5 rounded hover:bg-gray-100 mr-1", onClick: () => openCollabForm(db, c) }, icon("Pencil", { size: 15, color: C.muted })));
      actTd.appendChild(h("button", { class: "p-1.5 rounded hover:bg-gray-100", onClick: () => remove(c) }, icon("Trash2", { size: 15, color: C.down })));
      row.appendChild(actTd);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    listHost.appendChild(table);
  }
  window.rerenderAdminCollabsList = buildTable; // exposto p/ busca incremental
  buildTable();

  return card;
}

function openCollabForm(db, initial) {
  const isNew = !initial.id;
  const st = { mat: initial.matricula || "", perfilId: initial.perfilId || "", supId: initial.supervisorId || "", err: null };
  openModal({
    title: isNew ? "Adicionar colaborador" : "Editar colaborador",
    build: (close) => {
      const body = h("div", { class: "flex flex-col gap-3.5" });
      const errBox = h("div", {});
      function showErr(m) { errBox.innerHTML = ""; if (m) errBox.appendChild(h("div", { class: "text-sm", style: { color: C.down } }, m)); }

      const matBox = h("div", {});
      matBox.appendChild(Label("Matrícula (3 dígitos)"));
      matBox.appendChild(Input({ value: st.mat, placeholder: "000", onInput: (e) => { st.mat = e.target.value.replace(/\D/g, "").slice(0, 3); e.target.value = st.mat; } }));
      body.appendChild(matBox);

      const pBox = h("div", {});
      pBox.appendChild(Label("Perfil de metas"));
      pBox.appendChild(Select({ value: st.perfilId, onChange: (e) => { st.perfilId = e.target.value; } },
        [Opt("", "— sem perfil —", st.perfilId === ""), ...db.profiles.map((p) => Opt(p.id, p.name, st.perfilId === p.id))]));
      body.appendChild(pBox);

      const sBox = h("div", {});
      sBox.appendChild(Label("Supervisor"));
      sBox.appendChild(Select({ value: st.supId, onChange: (e) => { st.supId = e.target.value; } },
        [Opt("", "— não definido —", st.supId === ""), ...db.supervisors.map((sp) => Opt(sp.id, sp.name, st.supId === sp.id))]));
      body.appendChild(sBox);

      body.appendChild(errBox);

      const actions = h("div", { class: "flex justify-end gap-2 mt-1" });
      actions.appendChild(Btn({ kind: "ghost", children: ["Cancelar"], onClick: () => close() }));
      actions.appendChild(Btn({
        children: [icon("Check", { size: 15 }), " Salvar"],
        onClick: () => {
          const m = st.mat.trim();
          if (!/^\d{1,3}$/.test(m)) return showErr("A matrícula deve ter até 3 dígitos numéricos.");
          if (db.collaborators.some((c) => c.matricula === m && c.id !== initial.id)) return showErr(`A matrícula ${m} já está em uso.`);
          update((d) => {
            if (isNew) d.collaborators.push({ id: "c_" + uid(), matricula: m, perfilId: st.perfilId || null, supervisorId: st.supId || null });
            else { const c = d.collaborators.find((x) => x.id === initial.id); Object.assign(c, { matricula: m, perfilId: st.perfilId || null, supervisorId: st.supId || null }); }
            return d;
          });
          close();
        },
      }));
      body.appendChild(actions);
      return body;
    },
  });
}

/* ---------- Supervisores ---------- */
function adminSups({ db, profById }) {
  function saveSup(name, editId) {
    if (!name.trim()) return;
    update((d) => {
      if (editId) { const sp = d.supervisors.find((x) => x.id === editId); sp.name = name.trim(); }
      else d.supervisors.push({ id: "s_" + uid(), name: name.trim() });
      return d;
    });
  }
  function removeSup(sp) {
    askConfirm(`Excluir o supervisor "${sp.name}"? A equipe dele ficará sem supervisor definido.`, () =>
      update((d) => {
        d.supervisors = d.supervisors.filter((x) => x.id !== sp.id);
        d.collaborators.forEach((c) => { if (c.supervisorId === sp.id) c.supervisorId = null; });
        return d;
      }));
  }
  function assign(cid, sid) {
    update((d) => { const c = d.collaborators.find((x) => x.id === cid); c.supervisorId = sid || null; return d; });
  }
  function openSupForm(sup) {
    const st = { name: sup && sup.name ? sup.name : "" };
    openModal({
      title: sup && sup.id ? "Editar supervisor" : "Cadastrar supervisor",
      build: (close) => {
        const body = h("div", { class: "flex flex-col gap-3.5" });
        const box = h("div", {});
        box.appendChild(Label("Nome do supervisor"));
        box.appendChild(Input({ value: st.name, placeholder: "Ex.: Ana Souza", onInput: (e) => { st.name = e.target.value; } }));
        body.appendChild(box);
        const actions = h("div", { class: "flex justify-end gap-2" });
        actions.appendChild(Btn({ kind: "ghost", children: ["Cancelar"], onClick: () => close() }));
        actions.appendChild(Btn({ children: [icon("Check", { size: 15 }), " Salvar"], onClick: () => { saveSup(st.name, sup && sup.id); close(); } }));
        body.appendChild(actions);
        return body;
      },
    });
  }

  const groups = [
    ...db.supervisors.map((sp) => ({ sup: sp, members: db.collaborators.filter((c) => c.supervisorId === sp.id) })),
    { sup: null, members: db.collaborators.filter((c) => !c.supervisorId) },
  ];

  const wrap = h("div", {});
  const top = h("div", { class: "flex justify-end mb-4" });
  top.appendChild(Btn({ children: [icon("Plus", { size: 15 }), " Cadastrar supervisor"], onClick: () => openSupForm({}) }));
  wrap.appendChild(top);

  const grid = h("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-4" });
  groups.forEach(({ sup, members }) => {
    const card = Card({ class: "p-4" });
    const ch = h("div", { class: "flex items-center justify-between mb-3" });
    const title = h("div", { class: "font-bold flex items-center gap-2", style: { fontFamily: FONT_HEAD } });
    title.appendChild(icon("UserCog", { size: 16, color: sup ? C.accentInk : C.muted }));
    title.appendChild(document.createTextNode(sup ? sup.name : "Sem supervisor definido"));
    title.appendChild(h("span", { class: "text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums", style: { background: C.flatSoft, color: C.muted } }, String(members.length)));
    ch.appendChild(title);
    if (sup) {
      const actions = h("div", { class: "flex gap-1" });
      actions.appendChild(h("button", { class: "p-1.5 rounded hover:bg-gray-100", onClick: () => openSupForm(sup) }, icon("Pencil", { size: 14, color: C.muted })));
      actions.appendChild(h("button", { class: "p-1.5 rounded hover:bg-gray-100", onClick: () => removeSup(sup) }, icon("Trash2", { size: 14, color: C.down })));
      ch.appendChild(actions);
    }
    card.appendChild(ch);

    if (members.length === 0) {
      card.appendChild(h("div", { class: "text-sm py-3", style: { color: C.muted } }, `Nenhum colaborador ${sup ? "nesta equipe" : "pendente"}.`));
    } else {
      const memList = h("div", { class: "flex flex-col gap-1.5" });
      members.slice().sort((a, b) => (+a.matricula) - (+b.matricula)).forEach((c) => {
        const row = h("div", { class: "flex items-center gap-2.5 rounded-lg px-3 py-2", style: { border: `1px solid ${C.border}` } });
        row.appendChild(MatBadge(c.matricula, 28));
        const info = h("div", { class: "flex-1 min-w-0" });
        info.appendChild(h("div", { class: "text-sm font-semibold truncate" }, "Matrícula " + c.matricula));
        info.appendChild(h("div", { class: "text-[11px] truncate", style: { color: C.muted } }, (profById[c.perfilId] && profById[c.perfilId].name) || "sem perfil"));
        row.appendChild(info);
        const sel = Select({
          value: c.supervisorId || "",
          style: { width: "150px", padding: "4px 8px", fontSize: "12px" },
          onChange: (e) => assign(c.id, e.target.value),
        }, [Opt("", "mover para…", false), ...db.supervisors.map((sp) => Opt(sp.id, sp.name, c.supervisorId === sp.id))]);
        sel.classList.remove("w-full");
        row.appendChild(sel);
        memList.appendChild(row);
      });
      card.appendChild(memList);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
}

/* ---------- Perfis ---------- */
function adminProfiles({ db }) {
  const usage = {}; db.collaborators.forEach((c) => { if (c.perfilId) usage[c.perfilId] = (usage[c.perfilId] || 0) + 1; });

  function remove(p) {
    if (usage[p.id]) { askConfirm(`O perfil "${p.name}" está em uso por ${usage[p.id]} colaborador(es). Reatribua-os antes de excluir.`, null); return; }
    askConfirm(`Excluir o perfil "${p.name}"?`, () => update((d) => { d.profiles = d.profiles.filter((x) => x.id !== p.id); return d; }));
  }

  const wrap = h("div", {});
  const top = h("div", { class: "flex justify-end mb-4" });
  top.appendChild(Btn({ children: [icon("Plus", { size: 15 }), " Adicionar perfil"], onClick: () => openProfileForm(db, {}) }));
  wrap.appendChild(top);

  const grid = h("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" });
  db.profiles.forEach((p) => {
    const metas = Object.keys(p.metas);
    const card = Card({ class: "p-4" });
    const head = h("div", { class: "flex items-start justify-between gap-2 mb-2.5" });
    const hl = h("div", {});
    hl.appendChild(h("div", { class: "font-bold", style: { fontFamily: FONT_HEAD } }, p.name));
    hl.appendChild(h("div", { class: "text-xs mt-0.5", style: { color: C.muted } }, `${metas.length} meta(s) · ${usage[p.id] || 0} colaborador(es)`));
    head.appendChild(hl);
    const actions = h("div", { class: "flex gap-1 shrink-0" });
    actions.appendChild(h("button", { class: "p-1.5 rounded hover:bg-gray-100", onClick: () => openProfileForm(db, p) }, icon("Pencil", { size: 14, color: C.muted })));
    actions.appendChild(h("button", { class: "p-1.5 rounded hover:bg-gray-100", onClick: () => remove(p) }, icon("Trash2", { size: 14, color: C.down })));
    head.appendChild(actions);
    card.appendChild(head);

    const chips = h("div", { class: "flex flex-wrap gap-1.5" });
    if (metas.length) {
      metas.forEach((m) => {
        const cfg = p.metas[m];
        const detail = `${cfg.g4 != null ? `G4 ${fmtPct(cfg.g4)} · ` : ""}G3 ${fmtPct(cfg.g3)}${cfg.g2 != null ? ` · G2 ${fmtPct(cfg.g2)}` : ""}${cfg.g1 != null ? ` · G1 ${fmtPct(cfg.g1)}` : ""}`;
        chips.appendChild(h("span", { class: "text-[11px] font-semibold px-2 py-1 rounded-full", style: { background: C.accentSoft, color: C.accentInk } },
          m + " ", h("span", { style: { opacity: 0.7 } }, detail)));
      });
    } else {
      chips.appendChild(h("span", { class: "text-xs", style: { color: C.muted } }, "Nenhuma meta configurada."));
    }
    card.appendChild(chips);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
}

function openProfileForm(db, initial) {
  const isNew = !initial.id;
  const st = { name: initial.name || "", metas: {} };
  META_CANON.forEach((mn) => {
    const ex = initial.metas && initial.metas[mn];
    const def = META_TIERS_DEFAULT[mn] || { g3: 90, g2: 95, g1: 100 };
    st.metas[mn] = {
      on: !!ex,
      g6: (ex && ex.g6) ?? def.g6 ?? "",
      g4: (ex && ex.g4) ?? def.g4 ?? "",
      g3: (ex && ex.g3) ?? (ex && ex.alvo) ?? def.g3,
      g2: (ex && ex.g2) ?? def.g2 ?? "",
      g1: (ex && ex.g1) ?? def.g1 ?? "",
      valG4: (ex && ex.valG4) ?? "", valG3: (ex && ex.valG3) ?? "", valG2: (ex && ex.valG2) ?? "", valG1: (ex && ex.valG1) ?? "",
    };
  });
  const numOrNull = (v) => v === "" || v == null ? null : Number(v);
  const numCls = "w-14 rounded px-1.5 py-1 text-xs text-right tabular-nums outline-none";

  openModal({
    title: isNew ? "Adicionar perfil" : "Editar perfil",
    wide: true,
    build: (close) => {
      const body = h("div", { class: "flex flex-col gap-4" });
      const errBox = h("div", {});
      function showErr(m) { errBox.innerHTML = ""; if (m) errBox.appendChild(h("div", { class: "text-sm", style: { color: C.down } }, m)); }

      const nameBox = h("div", {});
      nameBox.appendChild(Label("Nome do perfil"));
      nameBox.appendChild(Input({ value: st.name, placeholder: "Ex.: Analistas Noturno", onInput: (e) => { st.name = e.target.value; } }));
      body.appendChild(nameBox);

      const metasSection = h("div", {});
      metasSection.appendChild(Label("Metas, patamares (%) e premiação (R$)"));
      metasSection.appendChild(h("div", { class: "text-[11px] mb-2", style: { color: C.muted } },
        "Corte (G6) = mínimo aceitável · G4 = abaixo da meta (premiado) · G3 = Meta · G2 = Superação · G1 = Alta Performance. Deixe um campo em branco se não se aplica."));
      const rowsWrap = h("div", { class: "flex flex-col gap-2" });

      META_CANON.forEach((mn) => {
        const x = st.metas[mn];
        const rowBox = h("div", { class: "rounded-lg px-3 py-2", style: { border: `1px solid ${x.on ? C.accent : C.border}`, background: x.on ? C.accentSoft : "#fff" } });

        const lab = h("label", { class: "flex items-center gap-2.5 cursor-pointer" });
        const cb = h("input", { type: "checkbox", checked: x.on, onChange: (e) => { x.on = e.target.checked; rebuildRow(); } });
        lab.appendChild(cb);
        lab.appendChild(h("span", { class: "flex-1 text-sm font-medium" }, mn));
        const cutWrap = h("span", { class: "flex items-center gap-1 text-[11px]", style: { color: C.down } });
        lab.appendChild(cutWrap);
        rowBox.appendChild(lab);

        const detailHost = h("div", {});
        rowBox.appendChild(detailHost);

        function rebuildRow() {
          rowBox.style.border = `1px solid ${x.on ? C.accent : C.border}`;
          rowBox.style.background = x.on ? C.accentSoft : "#fff";
          // corte
          cutWrap.innerHTML = "";
          if (x.on) {
            cutWrap.appendChild(document.createTextNode("Corte"));
            const cutInput = h("input", { type: "number", min: "0", max: "100", step: "0.5", value: x.g6, placeholder: "—", class: numCls, style: { border: `1px solid ${C.down}55` }, onInput: (e) => { x.g6 = e.target.value; } });
            cutWrap.appendChild(cutInput);
            cutWrap.appendChild(h("span", { style: { color: C.muted } }, "%"));
          }
          // patamares
          detailHost.innerHTML = "";
          if (x.on) {
            const tg = h("div", { class: "mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2" });
            [["G4", "g4", "valG4", LEVEL_COLOR.G4], ["G3", "g3", "valG3", C.gold], ["G2", "g2", "valG2", C.accent], ["G1", "g1", "valG1", C.up]].forEach(([labTxt, kPct, kVal, col]) => {
              const box = h("div", { class: "rounded-md px-2 py-1.5", style: { background: "#fff", border: `1px solid ${C.border}` } });
              box.appendChild(h("div", { class: "text-[10px] font-bold mb-1", style: { color: col } }, labTxt + (labTxt === "G4" ? " (abaixo)" : "")));
              const r1 = h("div", { class: "flex items-center gap-1" });
              r1.appendChild(h("input", { type: "number", min: "0", max: "100", step: "0.5", value: x[kPct], placeholder: "%", class: numCls, style: { border: `1px solid ${C.border}` }, onInput: (e) => { x[kPct] = e.target.value; } }));
              r1.appendChild(h("span", { class: "text-[10px]", style: { color: C.muted } }, "%"));
              box.appendChild(r1);
              const r2 = h("div", { class: "flex items-center gap-1 mt-1" });
              r2.appendChild(h("span", { class: "text-[10px]", style: { color: C.muted } }, "R$"));
              r2.appendChild(h("input", { type: "number", min: "0", step: "0.5", value: x[kVal], placeholder: "—", class: numCls, style: { border: `1px solid ${C.border}` }, onInput: (e) => { x[kVal] = e.target.value; } }));
              box.appendChild(r2);
              tg.appendChild(box);
            });
            detailHost.appendChild(tg);
          }
        }
        rebuildRow();
        rowsWrap.appendChild(rowBox);
      });
      metasSection.appendChild(rowsWrap);
      body.appendChild(metasSection);

      body.appendChild(errBox);
      const actions = h("div", { class: "flex justify-end gap-2" });
      actions.appendChild(Btn({ kind: "ghost", children: ["Cancelar"], onClick: () => close() }));
      actions.appendChild(Btn({
        children: [icon("Check", { size: 15 }), " Salvar perfil"],
        onClick: () => {
          if (!st.name.trim()) return showErr("Informe o nome do perfil.");
          if (db.profiles.some((p) => strip(p.name) === strip(st.name) && p.id !== initial.id)) return showErr("Já existe um perfil com este nome.");
          const out = {};
          META_CANON.forEach((mn) => {
            const x = st.metas[mn];
            if (!x.on) return;
            out[mn] = {
              g6: numOrNull(x.g6), g4: numOrNull(x.g4),
              g3: Number(x.g3) || 0, g2: numOrNull(x.g2), g1: numOrNull(x.g1),
              valG4: numOrNull(x.valG4), valG3: numOrNull(x.valG3), valG2: numOrNull(x.valG2), valG1: numOrNull(x.valG1),
              peso: (initial.metas && initial.metas[mn] && initial.metas[mn].peso) ?? null,
            };
          });
          update((d) => {
            if (isNew) d.profiles.push({ id: "p_" + uid(), name: st.name.trim(), metas: out });
            else { const p = d.profiles.find((x) => x.id === initial.id); p.name = st.name.trim(); p.metas = out; }
            return d;
          });
          close();
        },
      }));
      body.appendChild(actions);
      return body;
    },
  });
}

/* ---------- Histórico ---------- */
function adminHistory({ db, months }) {
  function removeMonth(ym) {
    askConfirm(`Excluir todos os dados de ${ymLabelFull(ym)}? Esta ação não pode ser desfeita.`, () =>
      update((d) => { delete d.monthly[ym]; return d; }));
  }
  if (!months.length) {
    const card = Card({ class: "p-10 text-center text-sm", style: { color: C.muted } });
    card.appendChild(document.createTextNode("Nenhum mês importado ainda. Use a aba "));
    card.appendChild(h("b", {}, "Importar planilha"));
    card.appendChild(document.createTextNode(" para lançar o primeiro mês."));
    return card;
  }
  const card = Card({ class: "overflow-hidden" });
  const table = h("table", { class: "w-full text-sm" });
  const thead = h("thead", {});
  const tr = h("tr", { style: { background: "#F7F9FA" } });
  ["Competência", "Colaboradores lançados", "Arquivo", "Importado em", ""].forEach((hh, i) => {
    tr.appendChild(h("th", { class: `px-5 py-2.5 text-xs font-semibold uppercase tracking-wide ${i >= 4 ? "text-right" : "text-left"}`, style: { color: C.muted } }, hh));
  });
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = h("tbody", {});
  [...months].reverse().forEach((ym) => {
    const m = db.monthly[ym];
    const row = h("tr", { style: { borderTop: `1px solid ${C.border}` } });
    row.appendChild(h("td", { class: "px-5 py-3 font-bold", style: { fontFamily: FONT_HEAD } }, ymLabelFull(ym)));
    row.appendChild(h("td", { class: "px-5 py-3 tabular-nums" }, String(Object.keys(m.byMat).length)));
    row.appendChild(h("td", { class: "px-5 py-3 text-xs", style: { color: C.muted } }, m.arquivo || "—"));
    row.appendChild(h("td", { class: "px-5 py-3 text-xs tabular-nums", style: { color: C.muted } }, m.importedAt ? new Date(m.importedAt).toLocaleString("pt-BR") : "—"));
    const actTd = h("td", { class: "px-5 py-3 text-right" });
    actTd.appendChild(h("button", { class: "p-1.5 rounded hover:bg-gray-100", title: "Excluir mês", onClick: () => removeMonth(ym) }, icon("Trash2", { size: 15, color: C.down })));
    row.appendChild(actTd);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  card.appendChild(h("div", { class: "px-5 py-3 text-xs", style: { color: C.muted, borderTop: `1px solid ${C.border}` } },
    "Para sobrescrever um mês já lançado, basta importar uma nova planilha selecionando a mesma competência."));
  return card;
}

/* ============================== INIT ============================== */
function init() {
  if (!document.getElementById("modal-root")) {
    const mr = h("div", { id: "modal-root" });
    document.body.appendChild(mr);
  }
  loadDb();        // equivalente ao 1º useEffect (carrega + migra)
  rerender();      // primeira renderização
  // fecha modal com ESC
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
