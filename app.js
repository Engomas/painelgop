"use strict";
// ============ Globais (carregados via <script> no index.html) ============
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } = Recharts;
const XLSX = window.XLSX;
const { LayoutDashboard, Upload, Settings, Search, ChevronLeft, TrendingUp, TrendingDown, Minus, Plus, Pencil, Trash2, Award, FileSpreadsheet, AlertTriangle, Check, X, Users, Target, History, UserCog, CalendarDays, ChevronRight, Save, Download, } = window.Icons;
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
const strip = (s) => String(s !== null && s !== void 0 ? s : "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const ymLabel = (ym) => { const [y, m] = ym.split("-"); return `${MESES[+m - 1]}/${y}`; };
const ymLabelFull = (ym) => { const [y, m] = ym.split("-"); return `${MESES_FULL[+m - 1]} de ${y}`; };
const fmtPct = (v) => v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const fmtBRL = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const META_CANON = ["Tabulação", "CSAT", "CSAT Resposta", "ABS", "Monitoria", "Eficiencia", "Tempo resposta", "AF SLA 2 dias", "Assertividade", "Fechamento SLA 2 dias", "Tempo Produtivo", "Faturamento 2 dias"];
const META_ALIAS = {};
META_CANON.forEach((m) => { META_ALIAS[strip(m)] = m; });
Object.assign(META_ALIAS, { "eficiência": "Eficiencia", "af sla 2 dias": "AF SLA 2 dias", "fechamento sla 2 dias": "Fechamento SLA 2 dias" });
const canonMeta = (h) => META_ALIAS[strip(h)] || null;
/* ============================== SEED ============================== */
const SEED_PROFILES = {
    "Analista Conferencia": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 13.5, valG3: 27, valG2: 40.5, valG1: 54, peso: 0.09 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 13.5, valG3: 27, valG2: 40.5, valG1: 54, peso: 0.09 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.1 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.1 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 22.5, valG3: 45, valG2: 67.5, valG1: 90, peso: 0.15 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 13.5, valG3: 27, valG2: 40.5, valG1: 54, peso: 0.09 }, "Faturamento 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 19.5, valG3: 39, valG2: 58.5, valG1: 78, peso: 0.13 }, "Assertividade": { g6: 80, g4: 93, g3: 95, g2: 97, g1: 100, valG4: 19.5, valG3: 39, valG2: 58.5, valG1: 78, peso: 0.13 } },
    "Analista Gilberto": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 25.5, valG3: 51, valG2: 76.5, valG1: 102, peso: 0.17 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 25.5, valG3: 51, valG2: 76.5, valG1: 102, peso: 0.17 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 27, valG3: 54, valG2: 81, valG1: 108, peso: 0.18 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 } },
    "Analista_Conferencia_sem_asser_Fat": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 22.5, valG3: 45, valG2: 67.5, valG1: 90, peso: 0.15 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 19.5, valG3: 39, valG2: 58.5, valG1: 78, peso: 0.13 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 21, valG3: 42, valG2: 63, valG1: 84, peso: 0.14 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 30, valG3: 60, valG2: 90, valG1: 120, peso: 0.2 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 21, valG3: 42, valG2: 63, valG1: 84, peso: 0.14 } },
    "Analista_Conferencia_sem_assertividade": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 19.5, valG3: 39, valG2: 58.5, valG1: 78, peso: 0.13 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 19.5, valG3: 39, valG2: 58.5, valG1: 78, peso: 0.13 }, "Faturamento 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 24, valG3: 48, valG2: 72, valG1: 96, peso: 0.16 } },
    "Analistas Diurno": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 25.5, valG3: 51, valG2: 76.5, valG1: 102, peso: 0.17 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 25.5, valG3: 51, valG2: 76.5, valG1: 102, peso: 0.17 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 27, valG3: 54, valG2: 81, valG1: 108, peso: 0.18 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.12 } },
    "Analistas Noturno": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 }, "AF SLA 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 25.5, valG3: 51, valG2: 76.5, valG1: 102, peso: 0.17 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 25.5, valG3: 51, valG2: 76.5, valG1: 102, peso: 0.17 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 16.5, valG3: 33, valG2: 49.5, valG1: 66, peso: 0.11 } },
    "Assistente Apoio": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.2 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.2 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.2 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.2 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.2 } },
    "Assistente Diurno": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "AF SLA 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 25, valG3: 50, valG2: 75, valG1: 100, peso: 0.25 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 } },
    "Assistente Noturno": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 10, valG3: 20, valG2: 30, valG1: 40, peso: 0.1 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 10, valG3: 20, valG2: 30, valG1: 40, peso: 0.1 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 10, valG3: 20, valG2: 30, valG1: 40, peso: 0.1 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 10, valG3: 20, valG2: 30, valG1: 40, peso: 0.1 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 10, valG3: 20, valG2: 30, valG1: 40, peso: 0.1 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.2 }, "AF SLA 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.2 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 10, valG3: 20, valG2: 30, valG1: 40, peso: 0.1 } },
    "Backoffice": { "Fechamento SLA 2 dias": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 23, valG3: 46, valG2: 69, valG1: 92, peso: 0.23 }, "Assertividade": { g6: 80, g4: 93, g3: 95, g2: 97, g1: 100, valG4: 23, valG3: 46, valG2: 69, valG1: 92, peso: 0.23 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.18 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.18 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.18 } },
    "Backoffice_sem_assertividade": { "Fechamento SLA 2 dias": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 23, valG3: 46, valG2: 69, valG1: 92, peso: 0.23 }, "Assertividade": { g6: 80, g4: 93, g3: 95, g2: 97, g1: 100, valG4: 23, valG3: 46, valG2: 69, valG1: 92, peso: 0.23 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.18 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.18 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 18, valG3: 36, valG2: 54, valG1: 72, peso: 0.18 } },
    "Supervisores": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 17.5, valG3: 35, valG2: 52.5, valG1: 70, peso: 0.07 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 17.5, valG3: 35, valG2: 52.5, valG1: 70, peso: 0.07 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 17.5, valG3: 35, valG2: 52.5, valG1: 70, peso: 0.07 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 17.5, valG3: 35, valG2: 52.5, valG1: 70, peso: 0.07 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 17.5, valG3: 35, valG2: 52.5, valG1: 70, peso: 0.07 }, "AF SLA 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 25, valG3: 50, valG2: 75, valG1: 100, peso: 0.1 }, "Faturamento 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 25, valG3: 50, valG2: 75, valG1: 100, peso: 0.1 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 37.5, valG3: 75, valG2: 112.5, valG1: 150, peso: 0.15 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 25, valG3: 50, valG2: 75, valG1: 100, peso: 0.1 }, "Fechamento SLA 2 dias": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 25, valG3: 50, valG2: 75, valG1: 100, peso: 0.1 }, "Assertividade": { g6: 80, g4: 93, g3: 95, g2: 97, g1: 100, valG4: 25, valG3: 50, valG2: 75, valG1: 100, peso: 0.1 } },
    "Supervisores_sem_Ass_Fat": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 22.5, valG3: 45, valG2: 67.5, valG1: 90, peso: 0.09 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 22.5, valG3: 45, valG2: 67.5, valG1: 90, peso: 0.09 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 22.5, valG3: 45, valG2: 67.5, valG1: 90, peso: 0.09 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 22.5, valG3: 45, valG2: 67.5, valG1: 90, peso: 0.09 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 22.5, valG3: 45, valG2: 67.5, valG1: 90, peso: 0.09 }, "AF SLA 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 37.5, valG3: 75, valG2: 112.5, valG1: 150, peso: 0.15 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 35, valG3: 70, valG2: 105, valG1: 140, peso: 0.14 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 30, valG3: 60, valG2: 90, valG1: 120, peso: 0.12 }, "Fechamento SLA 2 dias": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 35, valG3: 70, valG2: 105, valG1: 140, peso: 0.14 } },
    "Supervisores_sem_assertividade": { "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.08 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.08 }, "Eficiencia": { g6: 50, g4: 65, g3: 70, g2: 77, g1: 84, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.08 }, "Monitoria": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.08 }, "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 20, valG3: 40, valG2: 60, valG1: 80, peso: 0.08 }, "AF SLA 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 27.5, valG3: 55, valG2: 82.5, valG1: 110, peso: 0.11 }, "Faturamento 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 27.5, valG3: 55, valG2: 82.5, valG1: 110, peso: 0.11 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 40, valG3: 80, valG2: 120, valG1: 160, peso: 0.16 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 27.5, valG3: 55, valG2: 82.5, valG1: 110, peso: 0.11 }, "Fechamento SLA 2 dias": { g6: 75, g4: 85, g3: 90, g2: 95, g1: 100, valG4: 27.5, valG3: 55, valG2: 82.5, valG1: 110, peso: 0.11 } },
    "Novato(a)": { "Tabulação": { g6: 75, g4: 85, g3: 90, g2: 98, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "CSAT Resposta": { g6: 25, g4: 35, g3: 40, g2: 50, g1: 60, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "CSAT": { g6: 80, g4: 90, g3: 95, g2: 98, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "Tempo resposta": { g6: 40, g4: 55, g3: 60, g2: 65, g1: 70, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "AF SLA 2 dias": { g6: 85, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "Tempo Produtivo": { g6: 70, g4: 80, g3: 85, g2: 95, g1: 100, valG4: 15, valG3: 30, valG2: 45, valG1: 60, peso: 0.15 }, "Faturamento 2 dias": { g6: 80, g4: 90, g3: 95, g2: 97, g1: 100, valG4: 10, valG3: 20, valG2: 30, valG1: 40, peso: 0.1 } },
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
    const pByName = {};
    profiles.forEach((p) => { pByName[strip(p.name)] = p.id; });
    const supervisors = [
        { id: "s_" + uid(), name: "Supervisor 1" },
        { id: "s_" + uid(), name: "Supervisor 2" },
    ];
    const collaborators = SEED_COLLABS.map(([mat, perfil]) => ({
        id: "c_" + uid(), matricula: mat, perfilId: pByName[strip(perfil)] || null, supervisorId: null,
    }));
    const byMat = {};
    Object.entries(SEED_JUNE).forEach(([mat, d]) => { byMat[mat] = { valores: d.v, premiacao: d.p }; });
    return {
        version: 5, metas: [...META_CANON], profiles, supervisors, collaborators,
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
/* ============================== UI PRIMITIVES ============================== */
const Card = ({ children, className = "", style = {} }) => (React.createElement("div", { className: `rounded-2xl ${className}`, style: { background: C.surface, border: `1px solid ${C.border}`, ...style } }, children));
const Btn = ({ children, onClick, kind = "primary", small, disabled, className = "" }) => {
    const base = { primary: { background: C.accent, color: "#fff", border: "1px solid transparent" },
        ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.border}` },
        danger: { background: "transparent", color: C.down, border: `1px solid ${C.downSoft}` },
        dark: { background: C.sidebar, color: "#fff", border: "1px solid transparent" } }[kind];
    return (React.createElement("button", { onClick: onClick, disabled: disabled, className: `inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity ${small ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-85"} ${className}`, style: { ...base, fontFamily: FONT_BODY } }, children));
};
const Input = (props) => (React.createElement("input", { ...props, className: `w-full rounded-lg px-3 py-2 text-sm outline-none ${props.className || ""}`, style: { border: `1px solid ${C.border}`, background: "#fff", color: C.ink, fontFamily: FONT_BODY, ...props.style } }));
const Select = ({ children, ...props }) => (React.createElement("select", { ...props, className: `w-full rounded-lg px-3 py-2 text-sm outline-none ${props.className || ""}`, style: { border: `1px solid ${C.border}`, background: "#fff", color: C.ink, fontFamily: FONT_BODY, ...props.style } }, children));
const Label = ({ children }) => (React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide mb-1", style: { color: C.muted } }, children));
const Modal = ({ title, onClose, children, wide }) => (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", style: { background: "rgba(11,34,47,0.45)" }, onClick: onClose },
    React.createElement("div", { className: `w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl overflow-hidden max-h-[90vh] flex flex-col`, style: { background: C.surface }, onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "flex items-center justify-between px-5 py-4", style: { borderBottom: `1px solid ${C.border}` } },
            React.createElement("div", { className: "font-bold text-base", style: { fontFamily: FONT_HEAD, color: C.ink } }, title),
            React.createElement("button", { onClick: onClose, className: "p-1 rounded hover:bg-gray-100" },
                React.createElement(X, { size: 18, color: C.muted }))),
        React.createElement("div", { className: "p-5 overflow-y-auto" }, children))));
function useConfirm() {
    const [c, setC] = useState(null);
    const ask = (message, onYes) => setC({ message, onYes });
    const node = c ? (React.createElement(Modal, { title: c.onYes ? "Confirmar ação" : "Aviso", onClose: () => setC(null) },
        React.createElement("div", { className: "text-sm leading-relaxed mb-5", style: { color: C.ink } }, c.message),
        React.createElement("div", { className: "flex justify-end gap-2" }, c.onYes ? (React.createElement(React.Fragment, null,
            React.createElement(Btn, { kind: "ghost", onClick: () => setC(null) }, "Cancelar"),
            React.createElement(Btn, { kind: "danger", onClick: () => { const fn = c.onYes; setC(null); fn(); } },
                React.createElement(Trash2, { size: 14 }),
                " Confirmar"))) : (React.createElement(Btn, { onClick: () => setC(null) }, "Entendi"))))) : null;
    return [ask, node];
}
const Delta = ({ d }) => {
    if (d == null)
        return null;
    if (Math.abs(d) < 0.05)
        return (React.createElement("span", { className: "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full", style: { background: C.flatSoft, color: C.flat } },
            React.createElement(Minus, { size: 11 }),
            " est\u00E1vel"));
    const up = d > 0;
    return (React.createElement("span", { className: "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full", style: { background: up ? C.upSoft : C.downSoft, color: up ? C.up : C.down } },
        up ? React.createElement(TrendingUp, { size: 11 }) : React.createElement(TrendingDown, { size: 11 }),
        up ? "+" : "",
        d.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
        " pp"));
};
const MatBadge = ({ mat, size = 40 }) => (React.createElement("div", { className: "rounded-xl flex items-center justify-center font-bold shrink-0 tabular-nums", style: { width: size, height: size, background: C.accentSoft, color: C.accentInk, fontSize: size * 0.34, fontFamily: FONT_HEAD } }, mat));
const Ring = ({ pct, size = 64 }) => {
    const r = (size - 8) / 2, circ = 2 * Math.PI * r;
    const color = pct >= 70 ? C.up : pct >= 40 ? C.gold : C.down;
    return (React.createElement("div", { className: "relative shrink-0", style: { width: size, height: size } },
        React.createElement("svg", { width: size, height: size },
            React.createElement("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: C.flatSoft, strokeWidth: "7" }),
            React.createElement("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: color, strokeWidth: "7", strokeLinecap: "round", strokeDasharray: `${(pct / 100) * circ} ${circ}`, transform: `rotate(-90 ${size / 2} ${size / 2})` })),
        React.createElement("div", { className: "absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums", style: { color: C.ink, fontFamily: FONT_HEAD } },
            Math.round(pct),
            "%")));
};
const MonthPicker = ({ months, value, onChange, lastMonth }) => {
    if (!months.length)
        return null;
    const idx = months.indexOf(value);
    const go = (d) => { const n = idx + d; if (n >= 0 && n < months.length)
        onChange(months[n]); };
    return (React.createElement("div", { className: "flex items-center gap-1.5" },
        React.createElement(CalendarDays, { size: 15, color: C.muted, className: "shrink-0" }),
        React.createElement("button", { onClick: () => go(-1), disabled: idx <= 0, className: "p-1.5 rounded-lg disabled:opacity-30", style: { border: `1px solid ${C.border}`, background: "#fff" }, "aria-label": "M\u00EAs anterior" },
            React.createElement(ChevronLeft, { size: 15, color: C.ink })),
        React.createElement("select", { value: value || "", onChange: (e) => onChange(e.target.value), className: "rounded-lg px-3 py-1.5 text-sm font-semibold outline-none", style: { border: `1px solid ${C.border}`, background: "#fff", color: C.ink, fontFamily: FONT_BODY } }, months.map((ym) => (React.createElement("option", { key: ym, value: ym },
            ymLabelFull(ym),
            ym === lastMonth ? " (último)" : "")))),
        React.createElement("button", { onClick: () => go(1), disabled: idx >= months.length - 1, className: "p-1.5 rounded-lg disabled:opacity-30", style: { border: `1px solid ${C.border}`, background: "#fff" }, "aria-label": "Pr\u00F3ximo m\u00EAs" },
            React.createElement(ChevronRight, { size: 15, color: C.ink }))));
};
/* ============================== APP ============================== */
function PainelGOP() {
    const [db, setDb] = useState(null);
    const [storageOk, setStorageOk] = useState(true);
    const [route, setRoute] = useState({ view: "home" });
    const [saving, setSaving] = useState(false);
    const [selMonth, setSelMonth] = useState(null); // mês de referência selecionado
    const loaded = useRef(false);
    const saveTimer = useRef(null);
    useEffect(() => {
        (async () => {
            let data = null;
            try {
                const raw = window.localStorage.getItem("gop:data");
                if (raw)
                    data = JSON.parse(raw);
            }
            catch (e) {
                setStorageOk(false);
            }
            if (!data)
                data = buildSeed();
            else {
                const v = data.version || 1;
                if (v < 2) {
                    (data.profiles || []).forEach((p) => {
                        const m = p.metas || {};
                        if (m.CSAT && m.CSAT.alvo === 40)
                            m.CSAT.alvo = 95;
                        if (m["CSAT Resposta"] && m["CSAT Resposta"].alvo === 95)
                            m["CSAT Resposta"].alvo = 40;
                    });
                    (data.collaborators || []).forEach((c) => { delete c.nome; });
                }
                if (v < 3) {
                    // Migração v2→v3: expande cada meta {alvo} para os 3 patamares {g3,g2,g1} + valores.
                    // Tenta casar com a planilha oficial pelo nome do perfil; senão, deriva dos patamares padrão.
                    (data.profiles || []).forEach((p) => {
                        const ref = SEED_PROFILES[p.name] || {};
                        const out = {};
                        Object.entries(p.metas || {}).forEach(([m, cfg]) => {
                            var _a, _b;
                            if (cfg && cfg.g3 != null) {
                                out[m] = cfg;
                                return;
                            } // já migrado
                            if (ref[m]) {
                                out[m] = { ...ref[m] };
                                return;
                            }
                            const t = META_TIERS_DEFAULT[m] || { g3: (_a = cfg === null || cfg === void 0 ? void 0 : cfg.alvo) !== null && _a !== void 0 ? _a : 90, g2: null, g1: null };
                            const g3 = (_b = cfg === null || cfg === void 0 ? void 0 : cfg.alvo) !== null && _b !== void 0 ? _b : t.g3;
                            out[m] = { g3, g2: t.g2, g1: t.g1, valG3: null, valG2: null, valG1: null, peso: null };
                        });
                        p.metas = out;
                    });
                }
                if (v < 4) {
                    // Migração v3→v4: adiciona a linha de corte (G6) onde faltar.
                    (data.profiles || []).forEach((p) => {
                        const ref = SEED_PROFILES[p.name] || {};
                        Object.entries(p.metas || {}).forEach(([m, cfg]) => {
                            var _a, _b, _c, _d;
                            if (cfg.g6 != null)
                                return;
                            cfg.g6 = (_d = (_b = (_a = ref[m]) === null || _a === void 0 ? void 0 : _a.g6) !== null && _b !== void 0 ? _b : (_c = META_TIERS_DEFAULT[m]) === null || _c === void 0 ? void 0 : _c.g6) !== null && _d !== void 0 ? _d : null;
                        });
                    });
                }
                if (v < 5) {
                    // Migração v4→v5: adiciona o nível G4 (abaixo da meta, mas premiado) e seu valor.
                    (data.profiles || []).forEach((p) => {
                        const ref = SEED_PROFILES[p.name] || {};
                        Object.entries(p.metas || {}).forEach(([m, cfg]) => {
                            var _a, _b, _c, _d, _e, _f;
                            if (cfg.g4 == null)
                                cfg.g4 = (_d = (_b = (_a = ref[m]) === null || _a === void 0 ? void 0 : _a.g4) !== null && _b !== void 0 ? _b : (_c = META_TIERS_DEFAULT[m]) === null || _c === void 0 ? void 0 : _c.g4) !== null && _d !== void 0 ? _d : null;
                            if (cfg.valG4 == null)
                                cfg.valG4 = (_f = (_e = ref[m]) === null || _e === void 0 ? void 0 : _e.valG4) !== null && _f !== void 0 ? _f : (cfg.valG3 != null ? Math.round(cfg.valG3 * 50) / 100 : null);
                        });
                    });
                }
                data.version = 5;
            }
            setDb(data);
            loaded.current = true;
        })();
    }, []);
    useEffect(() => {
        if (!db || !loaded.current)
            return;
        if (saveTimer.current)
            clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                setSaving(true);
                window.localStorage.setItem("gop:data", JSON.stringify(db));
            }
            catch (e) {
                setStorageOk(false);
            }
            finally {
                setTimeout(() => setSaving(false), 400);
            }
        }, 500);
        return () => saveTimer.current && clearTimeout(saveTimer.current);
    }, [db]);
    const update = useCallback((fn) => setDb((prev) => fn(structuredClone(prev))), []);
    // Mantém o mês selecionado válido: por padrão, o último mês lançado.
    useEffect(() => {
        if (!db)
            return;
        const ms = Object.keys(db.monthly).sort();
        if (!ms.length) {
            if (selMonth !== null)
                setSelMonth(null);
            return;
        }
        if (!selMonth || !db.monthly[selMonth])
            setSelMonth(ms[ms.length - 1]);
    }, [db, selMonth]);
    if (!db)
        return (React.createElement("div", { className: "min-h-screen flex items-center justify-center", style: { background: C.bg } },
            React.createElement("div", { className: "text-sm", style: { color: C.muted, fontFamily: FONT_BODY } }, "Carregando painel\u2026")));
    const profById = Object.fromEntries(db.profiles.map((p) => [p.id, p]));
    const supById = Object.fromEntries(db.supervisors.map((s) => [s.id, s]));
    const months = Object.keys(db.monthly).sort();
    const lastMonth = months[months.length - 1] || null;
    const nav = [
        { key: "home", label: "Visão geral", icon: LayoutDashboard },
        { key: "import", label: "Importar planilha", icon: Upload },
        { key: "admin", label: "Administração", icon: Settings },
    ];
    const activeKey = route.view === "collab" ? "home" : route.view;
    return (React.createElement("div", { className: "min-h-screen flex flex-col md:flex-row", style: { background: C.bg, fontFamily: FONT_BODY, color: C.ink } },
        React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 8px; width: 8px; } ::-webkit-scrollbar-thumb { background:#C6CFD8; border-radius:8px; }
        button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 1px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `),
        React.createElement("aside", { className: "hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen", style: { background: C.sidebar } },
            React.createElement("div", { className: "px-5 pt-6 pb-5" },
                React.createElement("div", { className: "flex items-center gap-2.5" },
                    React.createElement("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: C.accent } },
                        React.createElement(Target, { size: 18, color: "#fff" })),
                    React.createElement("div", null,
                        React.createElement("div", { className: "text-white font-extrabold leading-none text-lg tracking-tight", style: { fontFamily: FONT_HEAD } }, "GOP"),
                        React.createElement("div", { className: "text-[11px] mt-0.5", style: { color: "#7FA3B3" } }, "Gest\u00E3o de Metas")))),
            React.createElement("nav", { className: "px-3 flex flex-col gap-1" }, nav.map((n) => (React.createElement("button", { key: n.key, onClick: () => setRoute({ view: n.key }), className: "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors", style: { background: activeKey === n.key ? C.sidebarHi : "transparent", color: activeKey === n.key ? "#fff" : "#9FB8C4" } },
                React.createElement(n.icon, { size: 17 }),
                " ",
                n.label)))),
            React.createElement("div", { className: "mt-auto px-5 pb-5 text-[11px] leading-relaxed", style: { color: "#5E7E8E" } },
                lastMonth ? React.createElement(React.Fragment, null,
                    "\u00DAltimo m\u00EAs lan\u00E7ado",
                    React.createElement("br", null),
                    React.createElement("span", { className: "text-white font-semibold" }, ymLabelFull(lastMonth))) : "Nenhum mês importado",
                React.createElement("div", { className: "mt-2 flex items-center gap-1.5" }, saving ? React.createElement(React.Fragment, null,
                    React.createElement(Save, { size: 11 }),
                    " salvando\u2026") : storageOk ? React.createElement(React.Fragment, null,
                    React.createElement(Check, { size: 11, color: C.accent }),
                    " dados salvos") : React.createElement(React.Fragment, null,
                    React.createElement(AlertTriangle, { size: 11, color: "#E2B33C" }),
                    " sem persist\u00EAncia")),
                React.createElement("div", { className: "mt-2 pt-2", style: { borderTop: "1px solid #1C3A4B" } },
                    "Vers\u00E3o ",
                    React.createElement("span", { className: "font-semibold", style: { color: "#9FB8C4" } }, APP_VERSION)))),
        React.createElement("div", { className: "md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3", style: { background: C.sidebar } },
            React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center", style: { background: C.accent } },
                    React.createElement(Target, { size: 15, color: "#fff" })),
                React.createElement("span", { className: "text-white font-extrabold tracking-tight", style: { fontFamily: FONT_HEAD } }, "GOP"),
                React.createElement("span", { className: "text-[10px]", style: { color: "#5E7E8E" } },
                    "v",
                    APP_VERSION)),
            React.createElement("div", { className: "flex gap-1" }, nav.map((n) => (React.createElement("button", { key: n.key, onClick: () => setRoute({ view: n.key }), className: "p-2.5 rounded-lg", style: { background: activeKey === n.key ? C.sidebarHi : "transparent" } },
                React.createElement(n.icon, { size: 18, color: activeKey === n.key ? "#fff" : "#9FB8C4" })))))),
        React.createElement("main", { className: "flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8 max-w-[1200px] w-full mx-auto" },
            !storageOk && (React.createElement("div", { className: "mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm", style: { background: C.goldSoft, color: C.gold, border: `1px solid #EAD9AE` } },
                React.createElement(AlertTriangle, { size: 16, className: "mt-0.5 shrink-0" }),
                "Armazenamento persistente indispon\u00EDvel neste ambiente \u2014 os dados ficam apenas nesta sess\u00E3o.")),
            route.view === "home" && React.createElement(Home, { db: db, profById: profById, supById: supById, months: months, lastMonth: lastMonth, selMonth: selMonth, setSelMonth: setSelMonth, open: (id) => setRoute({ view: "collab", id }), goImport: () => setRoute({ view: "import" }) }),
            route.view === "collab" && React.createElement(CollabDetail, { db: db, id: route.id, profById: profById, supById: supById, months: months, selMonth: selMonth, setSelMonth: setSelMonth, back: () => setRoute({ view: "home" }) }),
            route.view === "import" && React.createElement(ImportView, { db: db, update: update, profById: profById, done: () => setRoute({ view: "home" }) }),
            route.view === "admin" && React.createElement(Admin, { db: db, update: update, profById: profById, supById: supById, months: months, openCollab: (id) => setRoute({ view: "collab", id }) }))));
}
/* ============================== HELPERS DE DADOS ============================== */
function collabMonths(db, mat) {
    return Object.keys(db.monthly).filter((ym) => db.monthly[ym].byMat[mat]).sort();
}
// Compatibilidade: o alvo de uma meta é o G3.
const alvoOf = (cfg) => { var _a, _b; return cfg ? ((_b = (_a = cfg.g3) !== null && _a !== void 0 ? _a : cfg.alvo) !== null && _b !== void 0 ? _b : null) : null; };
// Define os níveis premiados de uma meta em ordem crescente, ignorando os ausentes.
// G4 (abaixo da meta, mas premiado) → G3 (meta) → G2 (superação) → G1 (alta performance).
function tiersOf(cfg) {
    if (!cfg)
        return [];
    const out = [];
    if (cfg.g4 != null)
        out.push({ key: "G4", label: "Abaixo da Meta", value: cfg.g4, prem: cfg.valG4 });
    if (cfg.g3 != null)
        out.push({ key: "G3", label: "Meta", value: cfg.g3, prem: cfg.valG3 });
    if (cfg.g2 != null)
        out.push({ key: "G2", label: "Superação", value: cfg.g2, prem: cfg.valG2 });
    if (cfg.g1 != null)
        out.push({ key: "G1", label: "Alta Performance", value: cfg.g1, prem: cfg.valG1 });
    return out;
}
// Avalia o desempenho de uma meta: nível atingido, premiação, próximo nível, gap e situação de corte (G6).
function evalMeta(cfg, v) {
    var _a, _b;
    const tiers = tiersOf(cfg);
    const g3 = alvoOf(cfg);
    const cut = (_a = cfg === null || cfg === void 0 ? void 0 : cfg.g6) !== null && _a !== void 0 ? _a : null; // linha de corte
    if (v == null || !tiers.length)
        return { value: v, level: null, levelLabel: null, prem: 0, hitG3: false, next: null, gap: null, tiers, g3, cut, belowCut: false, gapCut: null };
    let level = null, prem = 0;
    for (const t of tiers) {
        if (v >= t.value) {
            level = t;
            prem = (_b = t.prem) !== null && _b !== void 0 ? _b : 0;
        }
    }
    const next = tiers.find((t) => v < t.value) || null;
    const gap = next ? Math.round((next.value - v) * 100) / 100 : null;
    const belowCut = cut != null && v < cut;
    const gapCut = cut != null ? Math.round((cut - v) * 100) / 100 : null;
    return { value: v, level: (level === null || level === void 0 ? void 0 : level.key) || null, levelLabel: (level === null || level === void 0 ? void 0 : level.label) || null, prem, hitG3: g3 != null && v >= g3, next, gap, tiers, g3, cut, belowCut, gapCut };
}
const LEVEL_COLOR = { G1: "#1B8C4C", G2: "#0E8A7B", G3: "#A97A1E", G4: "#C7791F" };
const LEVEL_SOFT = { G1: "#E5F4EA", G2: "#E1F1EE", G3: "#FBF2DE", G4: "#FBEDDB" };
function scoreFor(db, collab, prof, ym) {
    var _a;
    if (!prof || !ym)
        return null;
    const rec = (_a = db.monthly[ym]) === null || _a === void 0 ? void 0 : _a.byMat[collab.matricula];
    if (!rec)
        return null;
    const metas = Object.keys(prof.metas);
    if (!metas.length)
        return null;
    let hit = 0, counted = 0, prem = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, belowCut = 0;
    metas.forEach((m) => {
        const v = rec.valores[m];
        if (v == null)
            return;
        counted++;
        const e = evalMeta(prof.metas[m], v);
        if (e.hitG3)
            hit++;
        if (e.belowCut)
            belowCut++;
        prem += e.prem || 0;
        if (e.level === "G1")
            g1++;
        else if (e.level === "G2")
            g2++;
        else if (e.level === "G3")
            g3++;
        else if (e.level === "G4")
            g4++;
    });
    return counted ? { pct: (hit / counted) * 100, hit, counted, total: metas.length, prem, g1, g2, g3, g4, belowCut } : null;
}
/* ============================== GERAÇÃO DE PPT (self-contained) ==============================
   Gera um .pptx (OOXML) sem bibliotecas externas: monta o XML dos slides e empacota num ZIP
   "store" (sem compressão) com CRC32 calculado manualmente. Não depende de CDN nem de CSP. */
const _CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++)
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();
function _crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++)
    c = _CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
const _enc = (s) => new TextEncoder().encode(s);
function _zipStore(files) {
    const chunks = [], central = [];
    let offset = 0;
    const u16 = (n) => [n & 0xff, (n >>> 8) & 0xff];
    const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
    for (const f of files) {
        const name = _enc(f.name), crc = _crc32(f.data), size = f.data.length;
        const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)]);
        chunks.push(local, name, f.data);
        central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
        offset += local.length + name.length + f.data.length;
    }
    const cStart = offset;
    let cSize = 0;
    for (const c of central) {
        chunks.push(c);
        cSize += c.length;
    }
    chunks.push(new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(central.length / 2), ...u16(central.length / 2), ...u32(cSize), ...u32(cStart), ...u16(0)]));
    let total = 0;
    chunks.forEach((c) => (total += c.length));
    const out = new Uint8Array(total);
    let p = 0;
    chunks.forEach((c) => { out.set(c, p); p += c.length; });
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
        if (it.next && it.ganho > 0)
            arr.push(_txt(x + 0.2, y + 1.2, 3.5, 0.3, [{ text: `+${C2.brl(it.ganho)} ao atingir ${it.next.label}`, size: 11, bold: true, color: C2.GOLD }], { valign: "middle" }));
    }
    else if (it.next) {
        arr.push(_txt(x + 0.2, y + 0.92, 3.5, 0.3, [{ text: `Faltam ${it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`, size: 11, bold: true, color: it.hitG3 ? C2.ACCINK : C2.DOWN }], { valign: "middle" }));
        if (it.ganho > 0)
            arr.push(_txt(x + 0.2, y + 1.2, 3.5, 0.3, [{ text: `+${C2.brl(it.ganho)} ao atingir ${it.next.label}`, size: 11, bold: true, color: C2.GOLD }], { valign: "middle" }));
    }
}
function _slideXml(shapes, bg) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${bg ? `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>` : ""}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes.join("")}</p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sld>`;
}
async function gerarPpt({ db, c, prof, supById, cms, refYm, score, prem, profMetas }) {
    var _a, _b;
    _spId = 1;
    const W = 13.333, H = 7.5;
    const INK = "15212C", MUTED = "65748A", ACC = "0E8A7B", ACCINK = "0A6B60";
    const UP = "1B8C4C", DOWN = "D24343", FLAT = "8A97A5", GOLD = "A97A1E", LINE = "E1E6EB", DARK = "0B222F";
    const supName = c.supervisorId ? (((_a = supById[c.supervisorId]) === null || _a === void 0 ? void 0 : _a.name) || "") : "não definido";
    const fmt = (v) => v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
    const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const monthLabel = (ym) => { const [y, m] = ym.split("-"); return `${MESES_FULL[+m - 1]}/${y}`; };
    const rec = refYm ? (_b = db.monthly[refYm]) === null || _b === void 0 ? void 0 : _b.byMat[c.matricula] : null;
    /* ---------- Slide 1: capa ---------- */
    const sh1 = [
        _rect(0, 0, 0.35, H, ACC),
        _txt(0.9, 2.2, 11, 0.5, [{ text: "ACOMPANHAMENTO DE METAS", size: 18, color: "7FA3B3" }]),
        _txt(0.9, 2.75, 11.5, 1.1, [{ text: `Matrícula ${c.matricula}`, size: 54, bold: true, color: "FFFFFF" }]),
        _txt(0.9, 4.05, 11.5, 0.5, [
            { text: "Perfil  ", size: 16, color: "7FA3B3" }, { text: `${(prof === null || prof === void 0 ? void 0 : prof.name) || "—"}      `, size: 16, bold: true, color: "FFFFFF" },
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
        var _a, _b;
        const cfg = prof.metas[m];
        const e = evalMeta(cfg, rec ? rec.valores[m] : null);
        const ganho = e.next ? ((_a = e.next.prem) !== null && _a !== void 0 ? _a : 0) - ((_b = e.prem) !== null && _b !== void 0 ? _b : 0) : 0;
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
    const colX = [];
    let acc = tX;
    cols.forEach((w) => { colX.push(acc); acc += w; });
    const headLabels = ["Indicador", "Corte", "Meta (G3)", "Resultado", "Nível", "Premiação"];
    sh2.push(_rect(tX, tY, tW, rowH, ACCINK));
    headLabels.forEach((t, i) => sh2.push(_txt(colX[i], tY, cols[i], rowH, [{ text: t, size: 11, bold: true, color: "FFFFFF" }], { align: i === 0 ? "left" : "center", valign: "middle" })));
    tY += rowH;
    if (profMetas.length) {
        analysis.forEach((it, idx) => {
            const lvl = it.level, lvlTxt = it.belowCut ? "Abaixo corte" : lvl ? `${lvl} · ${it.levelLabel}` : (it.value == null ? "—" : "Abaixo");
            if (idx % 2 === 1)
                sh2.push(_rect(tX, tY, tW, rowH, "F7F9FA"));
            if (it.belowCut)
                sh2.push(_rect(tX, tY, tW, rowH, "FBE9E9"));
            sh2.push(_rect(colX[4], tY, cols[4], rowH, it.belowCut ? "FBE9E9" : tierSoft(lvl)));
            sh2.push(_txt(colX[0], tY, cols[0], rowH, [{ text: it.meta, size: 11, color: INK }], { align: "left", valign: "middle" }));
            sh2.push(_txt(colX[1], tY, cols[1], rowH, [{ text: it.cut != null ? fmt(it.cut) : "—", size: 11, color: DOWN }], { align: "center", valign: "middle" }));
            sh2.push(_txt(colX[2], tY, cols[2], rowH, [{ text: it.g3 != null ? fmt(it.g3) : "—", size: 11, color: MUTED }], { align: "center", valign: "middle" }));
            sh2.push(_txt(colX[3], tY, cols[3], rowH, [{ text: fmt(it.value), size: 11, bold: true, color: it.belowCut ? DOWN : it.hitG3 ? INK : it.value == null ? MUTED : DOWN }], { align: "center", valign: "middle" }));
            sh2.push(_txt(colX[4], tY, cols[4], rowH, [{ text: lvlTxt, size: 10, bold: true, color: it.belowCut ? DOWN : tierColor(lvl) }], { align: "center", valign: "middle" }));
            sh2.push(_txt(colX[5], tY, cols[5], rowH, [{ text: it.prem > 0 ? brl(it.prem) : "—", size: 11, bold: it.prem > 0, color: it.prem > 0 ? GOLD : MUTED }], { align: "center", valign: "middle" }));
            tY += rowH;
        });
    }
    else {
        sh2.push(_txt(tX, tY + 0.1, 12, 0.5, [{ text: "O perfil deste colaborador não possui metas configuradas.", size: 13, italic: true, color: MUTED }]));
    }
    /* ---------- Slide 3: detalhamento e prioridades ---------- */
    const comDados = analysis.filter((it) => it.value != null);
    const naoBatendo = comDados.filter((it) => !it.hitG3);
    const abaixoCorte = comDados.filter((it) => it.belowCut);
    const rankP = (it) => it.belowCut ? 0 : !it.hitG3 ? 1 : 2;
    const prioridade = comDados.filter((it) => it.next || it.belowCut)
        .map((it) => ({ ...it, sc: (it.ganho || 1) / Math.max(it.gap || 0.5, 0.5) }))
        .sort((a, b) => { const ra = rankP(a), rb = rankP(b); if (ra !== rb)
        return ra - rb; if (ra === 0)
        return (b.gapCut || 0) - (a.gapCut || 0); return b.sc - a.sc; });
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
    }
    else {
        shD.push(_txt(0.6, 2.0, 12, 0.5, [{ text: "Todas as metas com dados já estão no nível máximo (G1). 🎯", size: 13, italic: true, color: MUTED }]));
    }
    // lista "abaixo da meta"
    let dY = 3.95;
    shD.push(_txt(0.6, dY, 12, 0.35, [{ text: `ABAIXO DA META (${naoBatendo.length})`, size: 11, bold: true, color: DOWN }]));
    dY += 0.45;
    if (naoBatendo.length) {
        naoBatendo.slice(0, 6).forEach((it, idx) => {
            if (idx % 2 === 1)
                shD.push(_rect(0.6, dY, 12.13, 0.4, "F7F9FA"));
            if (it.belowCut)
                shD.push(_rect(0.6, dY, 12.13, 0.4, "FBE9E9"));
            shD.push(_txt(0.7, dY, 4.0, 0.4, [{ text: it.belowCut ? `⚠ ${it.meta}` : it.meta, size: 11, bold: it.belowCut, color: it.belowCut ? DOWN : INK }], { align: "left", valign: "middle" }));
            shD.push(_txt(4.8, dY, 2.6, 0.4, [{ text: `atual ${fmt(it.value)}${it.cut != null ? ` (corte ${fmt(it.cut)})` : ""}`, size: 11, bold: true, color: DOWN }], { align: "left", valign: "middle" }));
            shD.push(_txt(7.5, dY, 5.2, 0.4, [{ text: it.next ? `faltam ${it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp para ${it.next.key} (${fmt(it.next.value)})${it.ganho > 0 ? ` -> +${brl(it.ganho)}` : ""}` : "", size: 11, color: MUTED }], { align: "left", valign: "middle" }));
            dY += 0.4;
        });
    }
    else {
        shD.push(_txt(0.7, dY, 12, 0.4, [{ text: "Nenhuma — todas as metas com dados foram atingidas. 🎯", size: 12, italic: true, color: UP }], { valign: "middle" }));
    }
    /* ---------- Slide 3: evolução mês a mês ---------- */
    const sh3 = [
        _txt(0.6, 0.45, 12, 0.6, [{ text: "Evolução mês a mês", size: 30, bold: true, color: INK }]),
        _rect(0.6, 1.18, 12.13, 0.02, LINE),
    ];
    if (cms.length && profMetas.length) {
        const mc = cms.slice(-7);
        const labW = 3.1, alvoW = 1.0, eachW = (12.13 - labW - alvoW) / mc.length, eRowH = 0.4;
        let eY = 1.4;
        const firstMonthX = 0.6 + labW + alvoW;
        const eColX = [];
        for (let i = 0; i < mc.length; i++)
            eColX.push(firstMonthX + i * eachW);
        // header: Indicador | Alvo | meses...
        sh3.push(_rect(0.6, eY, 12.13, eRowH, ACCINK));
        sh3.push(_txt(0.6, eY, labW, eRowH, [{ text: "Indicador", size: 11, bold: true, color: "FFFFFF" }], { align: "left", valign: "middle" }));
        sh3.push(_txt(0.6 + labW, eY, alvoW, eRowH, [{ text: "Meta G3", size: 11, bold: true, color: "FFFFFF" }], { align: "center", valign: "middle" }));
        mc.forEach((ym, i) => { const [y, m] = ym.split("-"); sh3.push(_txt(eColX[i], eY, eachW, eRowH, [{ text: `${MESES[+m - 1]}/${String(y).slice(2)}`, size: 11, bold: true, color: "FFFFFF" }], { align: "center", valign: "middle" })); });
        eY += eRowH;
        profMetas.forEach((meta, idx) => {
            const alvo = alvoOf(prof.metas[meta]);
            if (idx % 2 === 1)
                sh3.push(_rect(0.6, eY, 12.13, eRowH, "F7F9FA"));
            sh3.push(_txt(0.6, eY, labW, eRowH, [{ text: meta, size: 11, color: INK }], { align: "left", valign: "middle" }));
            sh3.push(_txt(0.6 + labW, eY, alvoW, eRowH, [{ text: alvo != null ? fmt(alvo) : "—", size: 11, bold: true, color: ACCINK }], { align: "center", valign: "middle" }));
            let prev = null;
            mc.forEach((ym, i) => {
                var _a;
                const v = (_a = db.monthly[ym].byMat[c.matricula]) === null || _a === void 0 ? void 0 : _a.valores[meta];
                let arrow = "", acol = INK;
                if (v != null && prev != null) {
                    const d = v - prev;
                    if (Math.abs(d) < 0.05) {
                        arrow = " =";
                        acol = FLAT;
                    }
                    else if (d > 0) {
                        arrow = " ▲";
                        acol = UP;
                    }
                    else {
                        arrow = " ▼";
                        acol = DOWN;
                    }
                }
                const ok = v != null && alvo != null ? v >= alvo : null;
                if (ok != null)
                    sh3.push(_rect(eColX[i], eY, eachW, eRowH, ok ? "F0F8F4" : "FCF1F0"));
                sh3.push(_txt(eColX[i], eY, eachW, eRowH, [{ text: v == null ? "—" : `${fmt(v)}${arrow}`, size: 10, bold: true, color: ok === false ? DOWN : acol === FLAT ? INK : acol }], { align: "center", valign: "middle" }));
                if (v != null)
                    prev = v;
            });
            eY += eRowH;
        });
        sh3.push(_txt(0.6, 7.0, 12, 0.35, [{ text: "Meta G3 = alvo do perfil (há ainda G2 superação e G1 alta performance)   ·   ▲ aumento  ▼ queda  = estável  ·  verde = meta atingida", size: 10, italic: true, color: MUTED }]));
    }
    else {
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
    a.href = url;
    a.download = `Apresentacao_Matricula_${c.matricula}_${refYm || "sem-mes"}.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
/* ============================== HOME ============================== */
function Home({ db, profById, supById, months, lastMonth, selMonth, setSelMonth, open, goImport }) {
    const [q, setQ] = useState("");
    const [fSup, setFSup] = useState("");
    const [fProf, setFProf] = useState("");
    const refMonth = selMonth && db.monthly[selMonth] ? selMonth : lastMonth;
    const list = useMemo(() => {
        return db.collaborators
            .filter((c) => {
            const t = strip(q);
            if (t && !c.matricula.includes(t))
                return false;
            if (fSup === "none" && c.supervisorId)
                return false;
            if (fSup && fSup !== "none" && c.supervisorId !== fSup)
                return false;
            if (fProf && c.perfilId !== fProf)
                return false;
            return true;
        })
            .sort((a, b) => (+a.matricula) - (+b.matricula));
    }, [db, q, fSup, fProf]);
    const stats = useMemo(() => {
        if (!refMonth)
            return null;
        let hit = 0, counted = 0, prem = 0, withData = 0;
        db.collaborators.forEach((c) => {
            var _a;
            const s = scoreFor(db, c, profById[c.perfilId], refMonth);
            const rec = (_a = db.monthly[refMonth]) === null || _a === void 0 ? void 0 : _a.byMat[c.matricula];
            if (rec)
                withData++;
            if (rec === null || rec === void 0 ? void 0 : rec.premiacao)
                prem += rec.premiacao;
            if (s) {
                hit += s.hit;
                counted += s.counted;
            }
        });
        return { atingimento: counted ? (hit / counted) * 100 : 0, prem, withData };
    }, [db, refMonth, profById]);
    return (React.createElement("div", null,
        React.createElement("div", { className: "flex flex-wrap items-end justify-between gap-3 mb-5" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-2xl md:text-[28px] font-extrabold tracking-tight", style: { fontFamily: FONT_HEAD } }, "Acompanhamento de metas"),
                React.createElement("p", { className: "text-sm mt-1", style: { color: C.muted } }, refMonth ? React.createElement(React.Fragment, null,
                    "Exibindo resultados de ",
                    React.createElement("b", { style: { color: C.ink } }, ymLabelFull(refMonth))) : "Importe a primeira planilha para começar.")),
            React.createElement(Btn, { onClick: goImport },
                React.createElement(Upload, { size: 15 }),
                " Importar m\u00EAs")),
        refMonth && (React.createElement(Card, { className: "p-3 md:px-4 mb-4 flex flex-wrap items-center justify-between gap-2" },
            React.createElement("div", { className: "text-sm font-semibold", style: { color: C.ink } }, "M\u00EAs de refer\u00EAncia"),
            React.createElement(MonthPicker, { months: months, value: refMonth, onChange: setSelMonth, lastMonth: lastMonth }))),
        React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" }, [
            { lab: "Colaboradores", val: db.collaborators.length, icon: Users },
            { lab: refMonth ? `Com dados · ${ymLabel(refMonth)}` : "Com dados", val: stats ? `${stats.withData}/${db.collaborators.length}` : "—", icon: CalendarDays },
            { lab: refMonth ? `Atingimento · ${ymLabel(refMonth)}` : "Atingimento", val: stats ? fmtPct(stats.atingimento) : "—", icon: Target },
            { lab: refMonth ? `Premiação · ${ymLabel(refMonth)}` : "Premiação", val: stats ? fmtBRL(stats.prem) : "—", icon: Award },
        ].map((k, i) => (React.createElement(Card, { key: i, className: "p-4" },
            React.createElement("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide", style: { color: C.muted } },
                React.createElement(k.icon, { size: 13 }),
                " ",
                k.lab),
            React.createElement("div", { className: "mt-2 text-xl md:text-2xl font-extrabold tabular-nums", style: { fontFamily: FONT_HEAD } }, k.val))))),
        React.createElement(Card, { className: "p-3 md:p-4 mb-4" },
            React.createElement("div", { className: "flex flex-col md:flex-row gap-2.5" },
                React.createElement("div", { className: "relative flex-1" },
                    React.createElement(Search, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2", color: C.muted }),
                    React.createElement(Input, { placeholder: "Buscar por matr\u00EDcula\u2026", value: q, onChange: (e) => setQ(e.target.value.replace(/\D/g, "")), style: { paddingLeft: 34 } })),
                React.createElement(Select, { value: fSup, onChange: (e) => setFSup(e.target.value), style: { maxWidth: 220 } },
                    React.createElement("option", { value: "" }, "Todos os supervisores"),
                    db.supervisors.map((s) => React.createElement("option", { key: s.id, value: s.id }, s.name)),
                    React.createElement("option", { value: "none" }, "Sem supervisor definido")),
                React.createElement(Select, { value: fProf, onChange: (e) => setFProf(e.target.value), style: { maxWidth: 260 } },
                    React.createElement("option", { value: "" }, "Todos os perfis"),
                    db.profiles.map((p) => React.createElement("option", { key: p.id, value: p.id }, p.name))))),
        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" }, list.map((c) => {
            var _a, _b, _c;
            const prof = profById[c.perfilId];
            const hasMonth = refMonth && ((_a = db.monthly[refMonth]) === null || _a === void 0 ? void 0 : _a.byMat[c.matricula]);
            const s = hasMonth ? scoreFor(db, c, prof, refMonth) : null;
            const prem = hasMonth ? (_b = db.monthly[refMonth].byMat[c.matricula]) === null || _b === void 0 ? void 0 : _b.premiacao : null;
            return (React.createElement("button", { key: c.id, onClick: () => open(c.id), className: "text-left group" },
                React.createElement(Card, { className: "p-4 h-full transition-shadow group-hover:shadow-md" },
                    React.createElement("div", { className: "flex items-start gap-3" },
                        React.createElement(MatBadge, { mat: c.matricula }),
                        React.createElement("div", { className: "min-w-0 flex-1" },
                            React.createElement("div", { className: "flex items-center justify-between gap-2" },
                                React.createElement("div", { className: "font-bold truncate", style: { fontFamily: FONT_HEAD } },
                                    "Matr\u00EDcula ",
                                    c.matricula),
                                React.createElement(ChevronRight, { size: 15, color: C.muted, className: "shrink-0" })),
                            React.createElement("div", { className: "text-xs mt-0.5 flex flex-wrap items-center gap-1.5", style: { color: C.muted } },
                                React.createElement("span", { className: "truncate" }, (prof === null || prof === void 0 ? void 0 : prof.name) || "Sem perfil")),
                            React.createElement("div", { className: "text-[11px] mt-1", style: { color: C.muted } }, c.supervisorId ? (_c = supById[c.supervisorId]) === null || _c === void 0 ? void 0 : _c.name : "Sem supervisor definido"))),
                    React.createElement("div", { className: "mt-3 pt-3 flex items-center justify-between gap-2", style: { borderTop: `1px dashed ${C.border}` } },
                        s ? (React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("div", { className: "h-1.5 w-20 rounded-full overflow-hidden", style: { background: C.flatSoft } },
                                React.createElement("div", { className: "h-full rounded-full", style: { width: `${s.pct}%`, background: s.pct >= 70 ? C.up : s.pct >= 40 ? C.gold : C.down } })),
                            React.createElement("span", { className: "text-xs font-semibold tabular-nums" },
                                s.hit,
                                "/",
                                s.counted,
                                " metas"))) : (React.createElement("span", { className: "text-xs", style: { color: C.muted } },
                            "Sem dados em ",
                            refMonth ? ymLabel(refMonth) : "—")),
                        prem ? React.createElement("span", { className: "text-xs font-bold tabular-nums", style: { color: C.gold } }, fmtBRL(prem)) : null))));
        })),
        !list.length && (React.createElement(Card, { className: "p-10 text-center text-sm", style: { color: C.muted } }, "Nenhum colaborador encontrado com os filtros atuais."))));
}
/* ============================== COLABORADOR ============================== */
function CollabDetail({ db, id, profById, supById, months, selMonth, setSelMonth, back }) {
    var _a, _b, _c, _d;
    const c = db.collaborators.find((x) => x.id === id);
    const [selMeta, setSelMeta] = useState(null);
    const [showExtra, setShowExtra] = useState(false);
    const [pptState, setPptState] = useState("idle"); // idle | loading | error
    const prof = c ? profById[c.perfilId] : null;
    const cms = c ? collabMonths(db, c.matricula) : [];
    const profMetas = prof ? Object.keys(prof.metas) : [];
    const extraMetas = useMemo(() => {
        if (!c)
            return [];
        const set = new Set();
        cms.forEach((ym) => Object.keys(db.monthly[ym].byMat[c.matricula].valores).forEach((m) => set.add(m)));
        return [...set].filter((m) => !profMetas.includes(m));
    }, [db, c, cms.join("|"), profMetas.join("|")]);
    if (!c)
        return React.createElement("div", null,
            "Colaborador n\u00E3o encontrado. ",
            React.createElement(Btn, { small: true, onClick: back }, "Voltar"));
    const lastYm = cms[cms.length - 1];
    // Mês de referência: o selecionado globalmente. Se o colaborador não tiver dado nesse mês,
    // o resumo indica ausência de dados (mas o comparativo abaixo continua mostrando tudo).
    const refYm = selMonth && db.monthly[selMonth] ? selMonth : lastYm;
    const hasRef = refYm && ((_a = db.monthly[refYm]) === null || _a === void 0 ? void 0 : _a.byMat[c.matricula]);
    const score = hasRef ? scoreFor(db, c, prof, refYm) : null;
    const prem = hasRef ? (_b = db.monthly[refYm].byMat[c.matricula]) === null || _b === void 0 ? void 0 : _b.premiacao : null;
    const rows = showExtra ? [...profMetas, ...extraMetas] : profMetas;
    const chartData = selMeta ? cms.map((ym) => {
        var _a;
        return ({
            mes: ymLabel(ym), valor: (_a = db.monthly[ym].byMat[c.matricula].valores[selMeta]) !== null && _a !== void 0 ? _a : null,
        });
    }) : [];
    const selCfg = selMeta && (prof === null || prof === void 0 ? void 0 : prof.metas[selMeta]) ? prof.metas[selMeta] : null;
    const selTiers = selCfg ? tiersOf(selCfg) : [];
    // Detalhamento das metas no mês de referência: o que bateu, o que não, e prioridades.
    const monthAnalysis = useMemo(() => {
        if (!hasRef || !profMetas.length)
            return null;
        const recRef = db.monthly[refYm].byMat[c.matricula];
        const items = profMetas.map((m) => {
            var _a, _b;
            const cfg = prof.metas[m];
            const e = evalMeta(cfg, recRef.valores[m]);
            const ganho = e.next ? ((_a = e.next.prem) !== null && _a !== void 0 ? _a : 0) - ((_b = e.prem) !== null && _b !== void 0 ? _b : 0) : 0;
            return { meta: m, cfg, ...e, ganho };
        });
        const comDados = items.filter((it) => it.value != null);
        const semDados = items.filter((it) => it.value == null);
        const batendo = comDados.filter((it) => it.hitG3);
        const naoBatendo = comDados.filter((it) => !it.hitG3);
        const abaixoCorte = comDados.filter((it) => it.belowCut);
        // Prioridade: abaixo do corte (G6) primeiro — risco de zerar a meta —, depois abaixo da meta (G3),
        // por fim quem já bateu mas pode subir de nível. Dentro de cada faixa, maior ganho por esforço.
        const rank = (it) => it.belowCut ? 0 : !it.hitG3 ? 1 : 2;
        const prioridade = comDados
            .filter((it) => it.next || it.belowCut)
            .map((it) => ({ ...it, score: (it.ganho || 1) / Math.max(it.gap || 0.5, 0.5) }))
            .sort((a, b) => {
            const ra = rank(a), rb = rank(b);
            if (ra !== rb)
                return ra - rb;
            // dentro de "abaixo do corte", quem está mais distante do corte é mais crítico
            if (ra === 0)
                return (b.gapCut || 0) - (a.gapCut || 0);
            return b.score - a.score;
        });
        // Metas fora do perfil (informativo, não contam para meta/priorização)
        const foraItems = (showExtra ? extraMetas : []).map((m) => {
            var _a;
            return ({
                meta: m, value: (_a = recRef.valores[m]) !== null && _a !== void 0 ? _a : null,
            });
        }).filter((it) => it.value != null);
        return { items, batendo, naoBatendo, abaixoCorte, semDados, prioridade, foraItems };
    }, [db, c, refYm, hasRef, prof, profMetas.join("|"), showExtra, extraMetas.join("|")]);
    async function downloadPpt() {
        setPptState("loading");
        try {
            await gerarPpt({ db, c, prof, supById, cms, refYm, score, prem, profMetas });
            setPptState("idle");
        }
        catch (e) {
            console.error(e);
            setPptState("error");
        }
    }
    return (React.createElement("div", null,
        React.createElement("button", { onClick: back, className: "flex items-center gap-1 text-sm font-medium mb-4 hover:underline", style: { color: C.accentInk } },
            React.createElement(ChevronLeft, { size: 16 }),
            " Voltar para a lista"),
        React.createElement(Card, { className: "p-5 mb-5" },
            React.createElement("div", { className: "flex flex-wrap items-center gap-4 md:gap-6" },
                React.createElement(MatBadge, { mat: c.matricula, size: 56 }),
                React.createElement("div", { className: "min-w-0 flex-1" },
                    React.createElement("h2", { className: "text-xl md:text-2xl font-extrabold tracking-tight", style: { fontFamily: FONT_HEAD } },
                        "Matr\u00EDcula ",
                        c.matricula),
                    React.createElement("div", { className: "flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm", style: { color: C.muted } },
                        React.createElement("span", null,
                            "Perfil ",
                            React.createElement("b", { style: { color: C.ink } }, (prof === null || prof === void 0 ? void 0 : prof.name) || "—")),
                        React.createElement("span", null,
                            "Supervisor ",
                            React.createElement("b", { style: { color: C.ink } }, c.supervisorId ? (_c = supById[c.supervisorId]) === null || _c === void 0 ? void 0 : _c.name : "não definido")),
                        React.createElement("span", null,
                            "\u00DAltimo m\u00EAs lan\u00E7ado ",
                            React.createElement("b", { style: { color: C.ink } }, lastYm ? ymLabelFull(lastYm) : "—")))),
                React.createElement("div", { className: "flex items-center gap-5" },
                    prem != null && prem > 0 && (React.createElement("div", { className: "text-right" },
                        React.createElement("div", { className: "text-[11px] font-semibold uppercase tracking-wide", style: { color: C.gold } },
                            "Premia\u00E7\u00E3o ",
                            ymLabel(refYm)),
                        React.createElement("div", { className: "text-lg font-extrabold tabular-nums", style: { color: C.gold, fontFamily: FONT_HEAD } }, fmtBRL(prem)))),
                    score && (React.createElement("div", { className: "flex items-center gap-2.5" },
                        React.createElement(Ring, { pct: score.pct }),
                        React.createElement("div", { className: "text-xs leading-tight", style: { color: C.muted } },
                            React.createElement("b", { style: { color: C.ink } },
                                score.hit,
                                " de ",
                                score.counted),
                            " metas",
                            React.createElement("br", null),
                            "atingidas em ",
                            ymLabel(refYm)))))),
            months.length > 0 && (React.createElement("div", { className: "mt-4 pt-4 flex flex-wrap items-center justify-between gap-2", style: { borderTop: `1px dashed ${C.border}` } },
                React.createElement("div", { className: "text-sm font-semibold", style: { color: C.ink } },
                    "M\u00EAs de refer\u00EAncia",
                    React.createElement("span", { className: "font-normal ml-1", style: { color: C.muted } }, "\u00B7 define o resultado exibido e a apresenta\u00E7\u00E3o")),
                React.createElement(MonthPicker, { months: months, value: refYm, onChange: setSelMonth, lastMonth: lastYm }))),
            !hasRef && refYm && (React.createElement("div", { className: "mt-2 text-xs flex items-center gap-1.5", style: { color: C.gold } },
                React.createElement(AlertTriangle, { size: 13 }),
                " Esta matr\u00EDcula n\u00E3o possui dados em ",
                ymLabelFull(refYm),
                ". O comparativo abaixo mostra os meses dispon\u00EDveis.")),
            React.createElement("div", { className: "mt-4 pt-4 flex flex-wrap items-center justify-between gap-2", style: { borderTop: `1px dashed ${C.border}` } },
                React.createElement("div", { className: "text-xs", style: { color: C.muted } },
                    "Gere uma apresenta\u00E7\u00E3o (.pptx) com a evolu\u00E7\u00E3o m\u00EAs a m\u00EAs e os resultados de ",
                    refYm ? ymLabelFull(refYm) : "—",
                    "."),
                React.createElement(Btn, { kind: "dark", onClick: downloadPpt, disabled: pptState === "loading" || !cms.length }, pptState === "loading" ? React.createElement(React.Fragment, null,
                    React.createElement(Save, { size: 15, className: "animate-spin" }),
                    " Gerando\u2026") : React.createElement(React.Fragment, null,
                    React.createElement(Download, { size: 15 }),
                    " Baixar apresenta\u00E7\u00E3o (PPT)"))),
            pptState === "error" && (React.createElement("div", { className: "mt-2 text-xs flex items-center gap-1.5", style: { color: C.down } },
                React.createElement(AlertTriangle, { size: 13 }),
                " N\u00E3o foi poss\u00EDvel gerar o arquivo. Tente novamente.")),
            !cms.length && (React.createElement("div", { className: "mt-2 text-xs", style: { color: C.muted } }, "Importe ao menos um m\u00EAs para habilitar a gera\u00E7\u00E3o da apresenta\u00E7\u00E3o."))),
        monthAnalysis && (React.createElement(Card, { className: "mb-5 p-5" },
            React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-4" },
                React.createElement("div", null,
                    React.createElement("div", { className: "font-bold", style: { fontFamily: FONT_HEAD } },
                        "Detalhamento de ",
                        ymLabelFull(refYm)),
                    React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, "Situa\u00E7\u00E3o por meta, premia\u00E7\u00E3o acumulada e onde focar. Clique em uma meta para ver os patamares.")),
                React.createElement("div", { className: "flex items-center gap-3" },
                    extraMetas.length > 0 && (React.createElement("label", { className: "flex items-center gap-1.5 text-xs cursor-pointer", style: { color: C.muted } },
                        React.createElement("input", { type: "checkbox", checked: showExtra, onChange: (e) => setShowExtra(e.target.checked) }),
                        "indicadores fora do perfil (",
                        extraMetas.length,
                        ")")),
                    score && (React.createElement("div", { className: "flex items-center gap-1.5 text-xs" }, [["G1", score.g1], ["G2", score.g2], ["G3", score.g3], ["G4", score.g4]].map(([k, n]) => (React.createElement("span", { key: k, className: "inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold", style: { background: LEVEL_SOFT[k], color: LEVEL_COLOR[k] } },
                        k,
                        " ",
                        React.createElement("b", { className: "tabular-nums" }, n)))))))),
            monthAnalysis.abaixoCorte.length > 0 && (React.createElement("div", { className: "flex items-start gap-2 mb-4 p-3 rounded-xl text-sm", style: { background: C.downSoft, color: C.down, border: `1px solid ${C.down}33` } },
                React.createElement(AlertTriangle, { size: 16, className: "mt-0.5 shrink-0" }),
                React.createElement("span", null,
                    React.createElement("b", null,
                        monthAnalysis.abaixoCorte.length,
                        " meta(s) abaixo da linha de corte"),
                    " \u2014 aten\u00E7\u00E3o m\u00E1xima: ",
                    monthAnalysis.abaixoCorte.map((it) => `${it.meta} (${fmtPct(it.value)} < corte ${fmtPct(it.cut)})`).join(", "),
                    "."))),
            score && (React.createElement("div", { className: "flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 p-3 rounded-xl", style: { background: C.goldSoft } },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-[11px] font-semibold uppercase tracking-wide", style: { color: C.gold } }, "Premia\u00E7\u00E3o estimada no m\u00EAs"),
                    React.createElement("div", { className: "text-xl font-extrabold tabular-nums", style: { color: C.gold, fontFamily: FONT_HEAD } }, fmtBRL(score.prem))),
                React.createElement("div", { className: "text-xs", style: { color: C.ink } },
                    score.hit,
                    " de ",
                    score.counted,
                    " metas no n\u00EDvel Meta (G3) ou acima",
                    monthAnalysis.prioridade.length > 0 && (() => {
                        const ganhoTotal = monthAnalysis.prioridade.reduce((s, it) => s + (it.ganho || 0), 0);
                        return ganhoTotal > 0 ? React.createElement(React.Fragment, null,
                            " \u00B7 at\u00E9 ",
                            React.createElement("b", { style: { color: C.gold } }, fmtBRL(ganhoTotal)),
                            " a mais alcan\u00E7ando o pr\u00F3ximo n\u00EDvel de cada meta") : null;
                    })()))),
            monthAnalysis.prioridade.length > 0 && (React.createElement("div", { className: "mb-5" },
                React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5", style: { color: C.muted } },
                    React.createElement(Award, { size: 13, color: C.down }),
                    " Prioridades \u2014 abaixo do corte primeiro, depois maior retorno por esfor\u00E7o"),
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" }, monthAnalysis.prioridade.slice(0, 3).map((it, i) => {
                    const crit = it.belowCut;
                    return (React.createElement("button", { key: it.meta, onClick: () => setSelMeta(selMeta === it.meta ? null : it.meta), className: "text-left rounded-xl p-3 transition-shadow hover:shadow-md", style: { border: `1px solid ${crit ? C.down : i === 0 ? C.gold : C.border}`, background: crit ? C.downSoft : i === 0 ? C.goldSoft : "#fff" } },
                        React.createElement("div", { className: "flex items-center justify-between gap-2" },
                            React.createElement("span", { className: "font-bold text-sm", style: { fontFamily: FONT_HEAD } }, it.meta),
                            crit
                                ? React.createElement("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: C.down, color: "#fff" } }, "ABAIXO DO CORTE")
                                : React.createElement("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: C.flatSoft, color: C.muted } },
                                    "#",
                                    i + 1)),
                        React.createElement("div", { className: "text-xs mt-1.5", style: { color: C.muted } },
                            "Atual ",
                            React.createElement("b", { className: "tabular-nums", style: { color: C.ink } }, fmtPct(it.value)),
                            crit
                                ? React.createElement(React.Fragment, null,
                                    " \u00B7 ",
                                    React.createElement("b", { className: "tabular-nums", style: { color: C.down } },
                                        it.gapCut.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
                                        " pp"),
                                    " abaixo do corte (",
                                    fmtPct(it.cut),
                                    ")")
                                : it.next && React.createElement(React.Fragment, null,
                                    " \u00B7 faltam ",
                                    React.createElement("b", { className: "tabular-nums", style: { color: it.hitG3 ? C.accentInk : C.down } },
                                        it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
                                        " pp"),
                                    " p/ ",
                                    it.next.key)),
                        it.next && it.ganho > 0 && (React.createElement("div", { className: "text-xs mt-1 font-semibold", style: { color: C.gold } },
                            "+",
                            fmtBRL(it.ganho),
                            " ao atingir ",
                            it.next.label))));
                })))),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5", style: { color: C.up } },
                        React.createElement(Check, { size: 13 }),
                        " Batendo a meta (",
                        monthAnalysis.batendo.length,
                        ")"),
                    React.createElement("div", { className: "flex flex-col gap-1.5" }, monthAnalysis.batendo.length ? monthAnalysis.batendo.map((it) => (React.createElement(MetaRow, { key: it.meta, it: it, onClick: () => setSelMeta(selMeta === it.meta ? null : it.meta), active: selMeta === it.meta }))) : React.createElement("div", { className: "text-xs py-2", style: { color: C.muted } }, "Nenhuma meta atingida neste m\u00EAs."))),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5", style: { color: C.down } },
                        React.createElement(X, { size: 13 }),
                        " Abaixo da meta (",
                        monthAnalysis.naoBatendo.length,
                        ")"),
                    React.createElement("div", { className: "flex flex-col gap-1.5" }, monthAnalysis.naoBatendo.length ? monthAnalysis.naoBatendo.map((it) => (React.createElement(MetaRow, { key: it.meta, it: it, onClick: () => setSelMeta(selMeta === it.meta ? null : it.meta), active: selMeta === it.meta }))) : React.createElement("div", { className: "text-xs py-2", style: { color: C.muted } }, "Todas as metas com dados foram atingidas. \uD83C\uDFAF")))),
            monthAnalysis.semDados.length > 0 && (React.createElement("div", { className: "text-xs mt-3 pt-3", style: { color: C.muted, borderTop: `1px dashed ${C.border}` } },
                "Sem dados em ",
                ymLabel(refYm),
                ": ",
                monthAnalysis.semDados.map((it) => it.meta).join(", "),
                ".")),
            showExtra && monthAnalysis.foraItems.length > 0 && (React.createElement("div", { className: "mt-4 pt-4", style: { borderTop: `1px dashed ${C.border}` } },
                React.createElement("div", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: C.muted } },
                    "Indicadores fora do perfil ",
                    React.createElement("span", { className: "font-normal normal-case" }, "\u00B7 n\u00E3o exigidos, apenas informativo")),
                React.createElement("div", { className: "flex flex-wrap gap-1.5" }, monthAnalysis.foraItems.map((it) => (React.createElement("span", { key: it.meta, className: "text-xs px-2.5 py-1 rounded-full tabular-nums", style: { background: C.flatSoft, color: C.muted } },
                    it.meta,
                    " ",
                    React.createElement("b", { style: { color: C.ink } }, fmtPct(it.value)))))))))),
        selMeta && selCfg && (React.createElement(MetaDetailCard, { meta: selMeta, cfg: selCfg, tiers: selTiers, chartData: chartData, valor: hasRef ? (_d = db.monthly[refYm].byMat[c.matricula]) === null || _d === void 0 ? void 0 : _d.valores[selMeta] : null, refYm: refYm, onClose: () => setSelMeta(null) })),
        React.createElement(Card, { className: "mb-5 overflow-hidden" },
            React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3" },
                React.createElement("div", null,
                    React.createElement("div", { className: "font-bold", style: { fontFamily: FONT_HEAD } }, "Comparativo m\u00EAs a m\u00EAs"),
                    React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, "Clique em um indicador para ver o gr\u00E1fico de evolu\u00E7\u00E3o. C\u00E9lulas verdes indicam meta atingida.")),
                extraMetas.length > 0 && (React.createElement("label", { className: "flex items-center gap-1.5 text-xs cursor-pointer", style: { color: C.muted } },
                    React.createElement("input", { type: "checkbox", checked: showExtra, onChange: (e) => setShowExtra(e.target.checked) }),
                    "mostrar indicadores fora do perfil (",
                    extraMetas.length,
                    ")"))),
            !cms.length ? (React.createElement("div", { className: "px-5 pb-6 text-sm", style: { color: C.muted } }, "Nenhum dado importado para este colaborador ainda.")) : !rows.length ? (React.createElement("div", { className: "px-5 pb-6 text-sm", style: { color: C.muted } }, "O perfil deste colaborador n\u00E3o possui metas configuradas. Ajuste em Administra\u00E7\u00E3o \u2192 Perfis.")) : (React.createElement("div", { className: "overflow-x-auto" },
                React.createElement("table", { className: "w-full text-sm", style: { borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#F7F9FA" } },
                            React.createElement("th", { className: "text-left px-5 py-2.5 font-semibold text-xs uppercase tracking-wide whitespace-nowrap", style: { color: C.muted } }, "Indicador"),
                            React.createElement("th", { className: "text-right px-3 py-2.5 font-semibold text-xs uppercase tracking-wide whitespace-nowrap", style: { color: C.muted } }, "Alvo"),
                            cms.map((ym) => (React.createElement("th", { key: ym, className: "text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wide whitespace-nowrap", style: { color: C.muted } }, ymLabel(ym)))))),
                    React.createElement("tbody", null, rows.map((m) => {
                        const isExtra = !profMetas.includes(m);
                        const cfg = prof === null || prof === void 0 ? void 0 : prof.metas[m];
                        const alvo = alvoOf(cfg);
                        const sel = selMeta === m;
                        return (React.createElement("tr", { key: m, onClick: () => setSelMeta(sel ? null : m), className: "cursor-pointer", style: { borderTop: `1px solid ${C.border}`, background: sel ? C.accentSoft : "transparent" } },
                            React.createElement("td", { className: "px-5 py-3 font-semibold whitespace-nowrap" },
                                React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                                    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full", style: { background: sel ? C.accent : C.flat } }),
                                    m,
                                    isExtra && React.createElement("span", { className: "text-[10px] font-medium px-1.5 py-0.5 rounded-full", style: { background: C.flatSoft, color: C.muted } }, "fora do perfil"))),
                            React.createElement("td", { className: "px-3 py-3 text-right tabular-nums whitespace-nowrap", style: { color: C.muted } }, alvo != null ? fmtPct(alvo) : "—"),
                            cms.map((ym, i) => {
                                const v = db.monthly[ym].byMat[c.matricula].valores[m];
                                let prev = null;
                                for (let j = i - 1; j >= 0; j--) {
                                    const pv = db.monthly[cms[j]].byMat[c.matricula].valores[m];
                                    if (pv != null) {
                                        prev = pv;
                                        break;
                                    }
                                }
                                const d = v != null && prev != null ? v - prev : null;
                                const ok = v != null && alvo != null ? v >= alvo : null;
                                return (React.createElement("td", { key: ym, className: "px-4 py-2.5 text-right whitespace-nowrap", style: { background: ok === true ? C.okBg : ok === false ? C.badBg : "transparent" } },
                                    React.createElement("div", { className: "font-bold tabular-nums", style: { color: ok === false ? C.down : C.ink } }, fmtPct(v)),
                                    React.createElement("div", { className: "mt-0.5 flex justify-end" },
                                        React.createElement(Delta, { d: d }))));
                            })));
                    }))))))));
}
/* Linha compacta de meta no detalhamento (situação + nível + gap) */
function MetaRow({ it, onClick, active }) {
    const col = it.hitG3 ? (it.level === "G1" ? LEVEL_COLOR.G1 : it.level === "G2" ? LEVEL_COLOR.G2 : LEVEL_COLOR.G3) : C.down;
    return (React.createElement("button", { onClick: onClick, className: "w-full text-left rounded-lg px-3 py-2 transition-colors", style: { border: `1px solid ${active ? C.accent : it.belowCut ? C.down : C.border}`, background: active ? C.accentSoft : it.belowCut ? C.downSoft : "#fff" } },
        React.createElement("div", { className: "flex items-center justify-between gap-2" },
            React.createElement("span", { className: "font-semibold text-sm truncate" }, it.meta),
            React.createElement("span", { className: "flex items-center gap-1.5 shrink-0" },
                it.belowCut && React.createElement("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: C.down, color: "#fff" } }, "CORTE"),
                it.level && React.createElement("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded-full", style: { background: LEVEL_SOFT[it.level], color: LEVEL_COLOR[it.level] } }, it.level),
                React.createElement("span", { className: "font-bold tabular-nums text-sm", style: { color: col } }, fmtPct(it.value)))),
        React.createElement("div", { className: "text-[11px] mt-0.5 flex items-center justify-between gap-2", style: { color: C.muted } },
            React.createElement("span", null,
                it.belowCut ? React.createElement("span", { style: { color: C.down, fontWeight: 600 } },
                    "Abaixo do corte (",
                    fmtPct(it.cut),
                    ")") : it.levelLabel ? `Nível: ${it.levelLabel}` : "Abaixo da meta",
                it.prem > 0 && React.createElement(React.Fragment, null,
                    " \u00B7 ",
                    fmtBRL(it.prem))),
            it.next && React.createElement("span", null,
                "faltam ",
                React.createElement("b", { style: { color: it.hitG3 ? C.accentInk : C.down } },
                    it.gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
                    " pp"),
                " p/ ",
                it.next.key))));
}
/* Cartão de detalhe da meta: patamares G3/G2/G1, gaps e gráfico de evolução */
function MetaDetailCard({ meta, cfg, tiers, valor, refYm, onClose, chartData }) {
    const e = evalMeta(cfg, valor);
    return (React.createElement(Card, { className: "mb-5 p-5" },
        React.createElement("div", { className: "flex items-center justify-between mb-1" },
            React.createElement("div", { className: "font-bold flex items-center gap-2", style: { fontFamily: FONT_HEAD } },
                React.createElement(Award, { size: 16, color: C.gold }),
                " Patamares \u00B7 ",
                meta),
            React.createElement("button", { onClick: onClose, className: "text-xs flex items-center gap-1", style: { color: C.muted } },
                React.createElement(X, { size: 13 }),
                " fechar")),
        React.createElement("div", { className: "text-xs mb-4", style: { color: C.muted } },
            "Resultado em ",
            ymLabelFull(refYm),
            ": ",
            React.createElement("b", { className: "tabular-nums", style: { color: C.ink } }, fmtPct(valor)),
            e.level ? React.createElement(React.Fragment, null,
                " \u00B7 n\u00EDvel atual ",
                React.createElement("b", { style: { color: LEVEL_COLOR[e.level] } },
                    e.level,
                    " (",
                    e.levelLabel,
                    ")")) : React.createElement(React.Fragment, null,
                " \u00B7 ",
                React.createElement("b", { style: { color: C.down } }, "abaixo da meta")),
            e.belowCut && React.createElement(React.Fragment, null,
                " \u00B7 ",
                React.createElement("b", { style: { color: C.down } },
                    "\u26A0 abaixo da linha de corte (",
                    fmtPct(e.cut),
                    ") \u2014 prioridade m\u00E1xima"))),
        React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-2" }, tiers.map((t) => {
            const reached = valor != null && valor >= t.value;
            const gap = valor != null ? Math.round((t.value - valor) * 100) / 100 : null;
            return (React.createElement("div", { key: t.key, className: "rounded-xl p-3", style: { border: `1px solid ${reached ? LEVEL_COLOR[t.key] : C.border}`, background: reached ? LEVEL_SOFT[t.key] : "#fff" } },
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("span", { className: "text-xs font-bold", style: { color: LEVEL_COLOR[t.key] } },
                        t.key,
                        " \u00B7 ",
                        t.label),
                    reached && React.createElement(Check, { size: 14, color: LEVEL_COLOR[t.key] })),
                React.createElement("div", { className: "mt-1 text-lg font-extrabold tabular-nums", style: { fontFamily: FONT_HEAD, color: C.ink } }, fmtPct(t.value)),
                React.createElement("div", { className: "text-[11px] mt-0.5", style: { color: C.muted } },
                    t.prem != null ? fmtBRL(t.prem) : "—",
                    valor != null && (reached
                        ? React.createElement(React.Fragment, null,
                            " \u00B7 ",
                            React.createElement("span", { style: { color: LEVEL_COLOR[t.key] } }, "atingido"))
                        : React.createElement(React.Fragment, null,
                            " \u00B7 faltam ",
                            React.createElement("b", { style: { color: C.down } },
                                gap.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
                                " pp"))))));
        })),
        React.createElement("div", { className: "mt-4" },
            React.createElement("div", { className: "text-xs mb-3 flex flex-wrap items-center gap-x-4 gap-y-1", style: { color: C.muted } },
                React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                    React.createElement("span", { className: "inline-block w-5 h-0.5", style: { background: C.accent } }),
                    " Resultado"),
                tiers.map((t) => (React.createElement("span", { key: t.key, className: "inline-flex items-center gap-1.5" },
                    React.createElement("span", { className: "inline-block w-5", style: { borderTop: `2px ${t.key === "G3" ? "solid" : "dashed"} ${LEVEL_COLOR[t.key]}` } }),
                    t.key,
                    " ",
                    t.label,
                    t.key === "G3" ? " (destaque)" : ""))),
                e.cut != null && React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                    React.createElement("span", { className: "inline-block w-5", style: { borderTop: `2px dotted ${C.down}` } }),
                    " Corte G6")),
            React.createElement(MetaTierChart, { chartData: chartData, tiers: tiers, cut: e.cut }))));
}
/* Gráfico de evolução com eixo Y dinâmico (zoom na faixa relevante) e rótulos de patamar
   posicionados à direita com anti-colisão, evitando que linhas próximas fiquem emboladas. */
function MetaTierChart({ chartData, tiers, cut }) {
    const vals = chartData.map((d) => d.valor).filter((v) => v != null);
    const marks = [...tiers.map((t) => t.value), ...(cut != null ? [cut] : [])];
    const all = [...vals, ...marks];
    // Domínio com folga: foca na faixa onde estão os dados e patamares, em vez de 0–100 fixo.
    let lo = 0, hi = 100;
    if (all.length) {
        const mn = Math.min(...all), mx = Math.max(...all);
        const pad = Math.max((mx - mn) * 0.18, 4);
        lo = Math.max(0, Math.floor((mn - pad) / 5) * 5);
        hi = Math.min(100, Math.ceil((mx + pad) / 5) * 5);
        if (hi - lo < 12) {
            hi = Math.min(100, lo + 12);
            lo = Math.max(0, hi - 12);
        }
    }
    const span = hi - lo || 1;
    // Linhas de referência (patamares + corte), ordenadas por valor desc para empilhar rótulos.
    const refs = [
        ...tiers.map((t) => ({ key: t.key, label: t.key, value: t.value, color: LEVEL_COLOR[t.key], dash: t.key === "G3" ? "0" : "6 4", w: t.key === "G3" ? 2.5 : 1.5 })),
        ...(cut != null ? [{ key: "G6", label: "Corte", value: cut, color: C.down, dash: "2 3", w: 1.5 }] : []),
    ].filter((r) => r.value >= lo && r.value <= hi).sort((a, b) => b.value - a.value);
    // Anti-colisão dos rótulos à direita: distribui verticalmente quando muito próximos.
    const H = 320, padTop = 12, padBot = 28, plotH = H - padTop - padBot;
    const GUTTER = 104; // espaço reservado à direita para os rótulos de patamar
    const yOf = (v) => padTop + (1 - (v - lo) / span) * plotH;
    const minGap = 18;
    const labelY = refs.map((r) => yOf(r.value));
    for (let i = 1; i < labelY.length; i++) {
        if (labelY[i] - labelY[i - 1] < minGap)
            labelY[i] = labelY[i - 1] + minGap;
    }
    for (let i = labelY.length - 1; i > 0; i--) {
        if (labelY[i] > padTop + plotH)
            labelY[i] = padTop + plotH;
        if (labelY[i] - labelY[i - 1] < minGap)
            labelY[i - 1] = labelY[i] - minGap;
    }
    return (React.createElement("div", { className: "relative", style: { width: "100%" } },
        React.createElement("div", { style: { width: "100%", height: H } },
            React.createElement(ResponsiveContainer, null,
                React.createElement(LineChart, { data: chartData, margin: { top: padTop, right: GUTTER, bottom: 4, left: -8 } },
                    React.createElement(CartesianGrid, { stroke: C.border, strokeDasharray: "3 3", vertical: false }),
                    React.createElement(XAxis, { dataKey: "mes", tick: { fontSize: 12, fill: C.muted, fontFamily: FONT_BODY }, axisLine: { stroke: C.border }, tickLine: false }),
                    React.createElement(YAxis, { domain: [lo, hi], tick: { fontSize: 12, fill: C.muted, fontFamily: FONT_BODY }, axisLine: false, tickLine: false, tickFormatter: (v) => `${v}%`, width: 44 }),
                    React.createElement(Tooltip, { formatter: (v) => [fmtPct(v), "Resultado"], labelStyle: { fontFamily: FONT_BODY, fontWeight: 600 }, contentStyle: { borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 } }),
                    refs.map((r) => (React.createElement(ReferenceLine, { key: r.key, y: r.value, stroke: r.color, strokeDasharray: r.dash, strokeWidth: r.w, ifOverflow: "extendDomain" }))),
                    React.createElement(Line, { type: "monotone", dataKey: "valor", stroke: C.accent, strokeWidth: 2.75, connectNulls: true, dot: { r: 4, fill: C.accent, strokeWidth: 0 }, activeDot: { r: 6 } })))),
        React.createElement("div", { className: "absolute top-0 h-full pointer-events-none", style: { right: 0, width: GUTTER } }, refs.map((r, i) => (React.createElement("div", { key: r.key, className: "absolute flex items-center gap-1 whitespace-nowrap", style: { top: labelY[i] - 9, left: 0 } },
            React.createElement("span", { className: "inline-block", style: { width: 10, borderTop: `2px ${r.dash === "0" ? "solid" : r.key === "G6" ? "dotted" : "dashed"} ${r.color}` } }),
            React.createElement("span", { className: "text-[10px] font-bold px-1 py-0.5 rounded", style: { background: r.key === "G6" ? C.downSoft : LEVEL_SOFT[r.key] || C.flatSoft, color: r.color } },
                r.label,
                " ",
                fmtPct(r.value))))))));
}
/* ============================== IMPORTAÇÃO ============================== */
function ImportView({ db, update, profById, done }) {
    const now = new Date();
    const [mes, setMes] = useState(now.getMonth() + 1);
    const [ano, setAno] = useState(now.getFullYear());
    const [file, setFile] = useState(null);
    const [parsed, setParsed] = useState(null);
    const [err, setErr] = useState(null);
    const [createMap, setCreateMap] = useState({});
    const [doneMsg, setDoneMsg] = useState(null);
    const inputRef = useRef(null);
    const ym = `${ano}-${String(mes).padStart(2, "0")}`;
    const exists = !!db.monthly[ym];
    const matSet = new Set(db.collaborators.map((c) => c.matricula));
    const profByName = {};
    db.profiles.forEach((p) => { profByName[strip(p.name)] = p; });
    async function handleFile(f) {
        var _a, _b;
        setFile(f);
        setErr(null);
        setParsed(null);
        setDoneMsg(null);
        try {
            const buf = await f.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
            let hIdx = -1;
            for (let i = 0; i < Math.min(grid.length, 15); i++) {
                if ((grid[i] || []).some((cell) => strip(cell) === "matricula")) {
                    hIdx = i;
                    break;
                }
            }
            if (hIdx < 0)
                throw new Error("Não encontrei a coluna “Matricula” na planilha. Verifique se o arquivo segue o modelo de exportação.");
            const header = grid[hIdx];
            const col = { mat: -1, agente: -1, perfil: -1, prem: -1, metas: {} };
            header.forEach((h, i) => {
                const s = strip(h);
                if (s === "matricula")
                    col.mat = i;
                else if (["agente", "nome", "colaborador"].includes(s))
                    col.agente = i;
                else if (s.includes("perfil"))
                    col.perfil = i;
                else if (s.includes("premiac"))
                    col.prem = i;
                else {
                    const cm = canonMeta(h);
                    if (cm)
                        col.metas[i] = cm;
                }
            });
            const rows = [];
            for (let i = hIdx + 1; i < grid.length; i++) {
                const r = grid[i] || [];
                const rawMat = r[col.mat];
                const agente = col.agente >= 0 ? String((_a = r[col.agente]) !== null && _a !== void 0 ? _a : "").trim() : "";
                if (strip(agente) === "total")
                    continue; // ignora a linha de totais
                if (rawMat == null || String(rawMat).trim() === "")
                    continue;
                const mat = String(parseInt(rawMat, 10));
                if (!/^\d+$/.test(mat))
                    continue;
                const valores = {};
                Object.entries(col.metas).forEach(([i2, mName]) => {
                    let v = r[i2];
                    if (v == null || v === "")
                        return;
                    if (typeof v === "string")
                        v = parseFloat(v.replace("%", "").replace(",", "."));
                    if (isNaN(v))
                        return;
                    if (v <= 1.5)
                        v = v * 100; // planilha às vezes traz fração (0,8776) em vez de 87,76
                    // Preserva o valor exatamente como enviado, removendo apenas ruído de ponto flutuante
                    // gerado pela multiplicação (ex.: 87.76000000000001 -> 87.76). Mantém todas as casas reais.
                    v = Number(v.toPrecision(12));
                    valores[mName] = v;
                });
                let prem = col.prem >= 0 ? r[col.prem] : null;
                if (typeof prem === "string")
                    prem = parseFloat(prem.replace(/[R$\s.]/g, "").replace(",", "."));
                if (prem != null && isNaN(prem))
                    prem = null;
                const perfilRaw = col.perfil >= 0 ? String((_b = r[col.perfil]) !== null && _b !== void 0 ? _b : "").trim() : "";
                rows.push({ mat, perfilRaw, valores, premiacao: prem }); // nome NÃO é armazenado (anonimizado)
            }
            if (!rows.length)
                throw new Error("Nenhuma linha de colaborador válida foi encontrada no arquivo.");
            const unknown = rows.filter((r) => !matSet.has(r.mat));
            const cm = {};
            unknown.forEach((u) => { cm[u.mat] = true; });
            setCreateMap(cm);
            setParsed({ rows, unknown });
        }
        catch (e) {
            setErr(e.message || String(e));
        }
    }
    function confirmImport() {
        update((d) => {
            const pByName = {};
            d.profiles.forEach((p) => { pByName[strip(p.name)] = p; });
            let outros = d.profiles.find((p) => strip(p.name) === "outros");
            const byMat = {};
            parsed.rows.forEach((r) => {
                const known = d.collaborators.find((c) => c.matricula === r.mat);
                if (!known) {
                    if (!createMap[r.mat])
                        return; // ignorar não cadastrado
                    let pid = r.perfilRaw && pByName[strip(r.perfilRaw)] ? pByName[strip(r.perfilRaw)].id : null;
                    if (!pid) {
                        if (!outros) {
                            outros = { id: "p_" + uid(), name: "Outros", metas: {} };
                            d.profiles.push(outros);
                        }
                        pid = outros.id;
                    }
                    d.collaborators.push({ id: "c_" + uid(), matricula: r.mat, perfilId: pid, supervisorId: null });
                }
                byMat[r.mat] = { valores: r.valores, premiacao: r.premiacao };
            });
            d.monthly[ym] = { byMat, importedAt: new Date().toISOString(), arquivo: file.name };
            return d;
        });
        const total = parsed.rows.filter((r) => matSet.has(r.mat) || createMap[r.mat]).length;
        setDoneMsg(`Importação concluída: ${total} colaborador(es) lançado(s) em ${ymLabelFull(ym)}.`);
        setParsed(null);
        setFile(null);
        if (inputRef.current)
            inputRef.current.value = "";
    }
    const knownCount = parsed ? parsed.rows.length - parsed.unknown.length : 0;
    const willCreate = parsed ? parsed.unknown.filter((u) => createMap[u.mat]).length : 0;
    return (React.createElement("div", { className: "max-w-3xl" },
        React.createElement("h1", { className: "text-2xl font-extrabold tracking-tight mb-1", style: { fontFamily: FONT_HEAD } }, "Importar planilha mensal"),
        React.createElement("p", { className: "text-sm mb-6", style: { color: C.muted } }, "Selecione o m\u00EAs e o ano de refer\u00EAncia e envie o arquivo .xlsx exportado. Cada linha ser\u00E1 vinculada ao colaborador pela matr\u00EDcula."),
        React.createElement(Card, { className: "p-5 mb-4" },
            React.createElement("div", { className: "grid grid-cols-2 gap-3 mb-4" },
                React.createElement("div", null,
                    React.createElement(Label, null, "M\u00EAs"),
                    React.createElement(Select, { value: mes, onChange: (e) => setMes(+e.target.value) }, MESES_FULL.map((m, i) => React.createElement("option", { key: i, value: i + 1 }, m)))),
                React.createElement("div", null,
                    React.createElement(Label, null, "Ano"),
                    React.createElement(Select, { value: ano, onChange: (e) => setAno(+e.target.value) }, Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map((y) => React.createElement("option", { key: y, value: y }, y))))),
            exists && (React.createElement("div", { className: "mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm", style: { background: C.goldSoft, color: C.gold, border: "1px solid #EAD9AE" } },
                React.createElement(AlertTriangle, { size: 16, className: "mt-0.5 shrink-0" }),
                React.createElement("span", null,
                    React.createElement("b", null, ymLabelFull(ym)),
                    " j\u00E1 possui dados importados (",
                    Object.keys(db.monthly[ym].byMat).length,
                    " colaboradores). Uma nova importa\u00E7\u00E3o ",
                    React.createElement("b", null, "sobrescreve"),
                    " os dados deste m\u00EAs."))),
            React.createElement("label", { className: "flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-9 cursor-pointer text-center", style: { border: `2px dashed ${file ? C.accent : C.border}`, background: file ? C.accentSoft : "#FAFBFC" } },
                React.createElement(FileSpreadsheet, { size: 26, color: file ? C.accentInk : C.muted }),
                React.createElement("div", { className: "text-sm font-semibold" }, file ? file.name : "Clique para selecionar o arquivo .xlsx"),
                React.createElement("div", { className: "text-xs", style: { color: C.muted } }, "Formato esperado: colunas Agente, Perfil Considerado, Matricula e indicadores"),
                React.createElement("input", { ref: inputRef, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: (e) => { var _a; return ((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) && handleFile(e.target.files[0]); } })),
            err && (React.createElement("div", { className: "mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm", style: { background: C.downSoft, color: C.down } },
                React.createElement(AlertTriangle, { size: 16, className: "mt-0.5 shrink-0" }),
                " ",
                err)),
            doneMsg && (React.createElement("div", { className: "mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm", style: { background: C.upSoft, color: C.up } },
                React.createElement(Check, { size: 16, className: "mt-0.5 shrink-0" }),
                React.createElement("span", null,
                    doneMsg,
                    " ",
                    React.createElement("button", { onClick: done, className: "underline font-semibold" }, "Ver painel"))))),
        parsed && (React.createElement(Card, { className: "p-5" },
            React.createElement("div", { className: "font-bold mb-3", style: { fontFamily: FONT_HEAD } }, "Pr\u00E9-visualiza\u00E7\u00E3o da importa\u00E7\u00E3o"),
            React.createElement("div", { className: "grid grid-cols-3 gap-3 mb-4" }, [
                { lab: "Linhas lidas", val: parsed.rows.length },
                { lab: "Matrículas reconhecidas", val: knownCount },
                { lab: "Não cadastradas", val: parsed.unknown.length },
            ].map((k, i) => (React.createElement("div", { key: i, className: "rounded-xl px-3 py-2.5", style: { background: "#F7F9FA", border: `1px solid ${C.border}` } },
                React.createElement("div", { className: "text-[11px] font-semibold uppercase tracking-wide", style: { color: C.muted } }, k.lab),
                React.createElement("div", { className: "text-lg font-extrabold tabular-nums", style: { fontFamily: FONT_HEAD } }, k.val))))),
            parsed.unknown.length > 0 && (React.createElement("div", { className: "mb-4" },
                React.createElement("div", { className: "text-sm font-semibold mb-2 flex items-center gap-1.5" },
                    React.createElement(AlertTriangle, { size: 14, color: C.gold }),
                    " Colaboradores n\u00E3o cadastrados"),
                React.createElement("div", { className: "text-xs mb-2", style: { color: C.muted } }, "Marque para criar automaticamente (o perfil indicado na planilha ser\u00E1 usado quando existir). Linhas desmarcadas ser\u00E3o ignoradas."),
                React.createElement("div", { className: "flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1" }, parsed.unknown.map((u) => (React.createElement("label", { key: u.mat, className: "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer", style: { border: `1px solid ${C.border}`, background: createMap[u.mat] ? C.accentSoft : "#fff" } },
                    React.createElement("input", { type: "checkbox", checked: !!createMap[u.mat], onChange: (e) => setCreateMap({ ...createMap, [u.mat]: e.target.checked }) }),
                    React.createElement("span", { className: "font-semibold tabular-nums" },
                        "Matr\u00EDcula ",
                        u.mat),
                    React.createElement("span", { className: "flex-1 truncate text-xs", style: { color: C.muted } }, u.perfilRaw ? `perfil: ${u.perfilRaw}` : "perfil: Outros"))))))),
            React.createElement("div", { className: "flex items-center justify-between gap-3 flex-wrap" },
                React.createElement("div", { className: "text-xs", style: { color: C.muted } },
                    "Ser\u00E3o lan\u00E7ados ",
                    React.createElement("b", { style: { color: C.ink } }, knownCount + willCreate),
                    " colaboradores em ",
                    React.createElement("b", { style: { color: C.ink } }, ymLabelFull(ym)),
                    willCreate ? ` (${willCreate} novos)` : "",
                    "."),
                React.createElement(Btn, { onClick: confirmImport },
                    React.createElement(Upload, { size: 15 }),
                    " Importar planilha"))))));
}
/* ============================== ADMINISTRAÇÃO ============================== */
function Admin({ db, update, profById, supById, months, openCollab }) {
    const [tab, setTab] = useState("collabs");
    const tabs = [
        { key: "collabs", label: "Colaboradores", icon: Users },
        { key: "sups", label: "Supervisores", icon: UserCog },
        { key: "profiles", label: "Perfis de metas", icon: Target },
        { key: "history", label: "Histórico de importações", icon: History },
    ];
    return (React.createElement("div", null,
        React.createElement("h1", { className: "text-2xl font-extrabold tracking-tight mb-4", style: { fontFamily: FONT_HEAD } }, "Administra\u00E7\u00E3o"),
        React.createElement("div", { className: "flex gap-1.5 mb-5 flex-wrap" }, tabs.map((t) => (React.createElement("button", { key: t.key, onClick: () => setTab(t.key), className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium", style: { background: tab === t.key ? C.sidebar : C.surface, color: tab === t.key ? "#fff" : C.muted, border: `1px solid ${tab === t.key ? C.sidebar : C.border}` } },
            React.createElement(t.icon, { size: 15 }),
            " ",
            t.label)))),
        tab === "collabs" && React.createElement(AdminCollabs, { db: db, update: update, profById: profById, supById: supById, openCollab: openCollab }),
        tab === "sups" && React.createElement(AdminSups, { db: db, update: update, profById: profById }),
        tab === "profiles" && React.createElement(AdminProfiles, { db: db, update: update }),
        tab === "history" && React.createElement(AdminHistory, { db: db, update: update, months: months })));
}
/* ---------- Colaboradores ---------- */
function AdminCollabs({ db, update, profById, supById, openCollab }) {
    const [edit, setEdit] = useState(null); // {id?|null para novo}
    const [q, setQ] = useState("");
    const [ask, confirmNode] = useConfirm();
    const list = db.collaborators
        .filter((c) => { const t = strip(q); return !t || c.matricula.includes(t); })
        .sort((a, b) => (+a.matricula) - (+b.matricula));
    function remove(c) {
        ask(`Excluir a matrícula ${c.matricula}? Os dados mensais importados desta matrícula serão mantidos no histórico, mas o colaborador sai do painel.`, () => update((d) => { d.collaborators = d.collaborators.filter((x) => x.id !== c.id); return d; }));
    }
    return (React.createElement(Card, { className: "overflow-hidden" },
        React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 px-5 py-4", style: { borderBottom: `1px solid ${C.border}` } },
            React.createElement("div", { className: "relative flex-1 min-w-[200px] max-w-sm" },
                React.createElement(Search, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2", color: C.muted }),
                React.createElement(Input, { placeholder: "Buscar por matr\u00EDcula\u2026", value: q, onChange: (e) => setQ(e.target.value.replace(/\D/g, "")), style: { paddingLeft: 34 } })),
            React.createElement(Btn, { onClick: () => setEdit({}) },
                React.createElement(Plus, { size: 15 }),
                " Adicionar colaborador")),
        React.createElement("div", { className: "overflow-x-auto" },
            React.createElement("table", { className: "w-full text-sm" },
                React.createElement("thead", null,
                    React.createElement("tr", { style: { background: "#F7F9FA" } }, ["Matrícula", "Perfil", "Supervisor", ""].map((h, i) => (React.createElement("th", { key: i, className: `px-5 py-2.5 text-xs font-semibold uppercase tracking-wide ${i >= 3 ? "text-right" : "text-left"}`, style: { color: C.muted } }, h))))),
                React.createElement("tbody", null, list.map((c) => {
                    var _a, _b;
                    return (React.createElement("tr", { key: c.id, style: { borderTop: `1px solid ${C.border}` } },
                        React.createElement("td", { className: "px-5 py-3 font-semibold tabular-nums" },
                            React.createElement("button", { onClick: () => openCollab(c.id), className: "hover:underline text-left", style: { color: C.accentInk } }, c.matricula)),
                        React.createElement("td", { className: "px-5 py-3" }, ((_a = profById[c.perfilId]) === null || _a === void 0 ? void 0 : _a.name) || React.createElement("span", { style: { color: C.muted } }, "\u2014")),
                        React.createElement("td", { className: "px-5 py-3" }, c.supervisorId ? (_b = supById[c.supervisorId]) === null || _b === void 0 ? void 0 : _b.name : React.createElement("span", { style: { color: C.muted } }, "n\u00E3o definido")),
                        React.createElement("td", { className: "px-5 py-3 text-right whitespace-nowrap" },
                            React.createElement("button", { onClick: () => setEdit(c), className: "p-1.5 rounded hover:bg-gray-100 mr-1" },
                                React.createElement(Pencil, { size: 15, color: C.muted })),
                            React.createElement("button", { onClick: () => remove(c), className: "p-1.5 rounded hover:bg-gray-100" },
                                React.createElement(Trash2, { size: 15, color: C.down })))));
                })))),
        edit !== null && React.createElement(CollabForm, { db: db, initial: edit, onClose: () => setEdit(null), update: update }),
        confirmNode));
}
function CollabForm({ db, initial, onClose, update }) {
    const isNew = !initial.id;
    const [mat, setMat] = useState(initial.matricula || "");
    const [perfilId, setPerfilId] = useState(initial.perfilId || "");
    const [supId, setSupId] = useState(initial.supervisorId || "");
    const [err, setErr] = useState(null);
    function save() {
        const m = mat.trim();
        if (!/^\d{1,3}$/.test(m))
            return setErr("A matrícula deve ter até 3 dígitos numéricos.");
        if (db.collaborators.some((c) => c.matricula === m && c.id !== initial.id))
            return setErr(`A matrícula ${m} já está em uso.`);
        update((d) => {
            if (isNew)
                d.collaborators.push({ id: "c_" + uid(), matricula: m, perfilId: perfilId || null, supervisorId: supId || null });
            else {
                const c = d.collaborators.find((x) => x.id === initial.id);
                Object.assign(c, { matricula: m, perfilId: perfilId || null, supervisorId: supId || null });
            }
            return d;
        });
        onClose();
    }
    return (React.createElement(Modal, { title: isNew ? "Adicionar colaborador" : "Editar colaborador", onClose: onClose },
        React.createElement("div", { className: "flex flex-col gap-3.5" },
            React.createElement("div", null,
                React.createElement(Label, null, "Matr\u00EDcula (3 d\u00EDgitos)"),
                React.createElement(Input, { value: mat, onChange: (e) => setMat(e.target.value.replace(/\D/g, "").slice(0, 3)), placeholder: "000" })),
            React.createElement("div", null,
                React.createElement(Label, null, "Perfil de metas"),
                React.createElement(Select, { value: perfilId, onChange: (e) => setPerfilId(e.target.value) },
                    React.createElement("option", { value: "" }, "\u2014 sem perfil \u2014"),
                    db.profiles.map((p) => React.createElement("option", { key: p.id, value: p.id }, p.name)))),
            React.createElement("div", null,
                React.createElement(Label, null, "Supervisor"),
                React.createElement(Select, { value: supId, onChange: (e) => setSupId(e.target.value) },
                    React.createElement("option", { value: "" }, "\u2014 n\u00E3o definido \u2014"),
                    db.supervisors.map((s) => React.createElement("option", { key: s.id, value: s.id }, s.name)))),
            err && React.createElement("div", { className: "text-sm", style: { color: C.down } }, err),
            React.createElement("div", { className: "flex justify-end gap-2 mt-1" },
                React.createElement(Btn, { kind: "ghost", onClick: onClose }, "Cancelar"),
                React.createElement(Btn, { onClick: save },
                    React.createElement(Check, { size: 15 }),
                    " Salvar")))));
}
/* ---------- Supervisores ---------- */
function AdminSups({ db, update, profById }) {
    const [edit, setEdit] = useState(null);
    const [name, setName] = useState("");
    const [ask, confirmNode] = useConfirm();
    function saveSup() {
        if (!name.trim())
            return;
        update((d) => {
            if (edit === null || edit === void 0 ? void 0 : edit.id) {
                const s = d.supervisors.find((x) => x.id === edit.id);
                s.name = name.trim();
            }
            else
                d.supervisors.push({ id: "s_" + uid(), name: name.trim() });
            return d;
        });
        setEdit(null);
        setName("");
    }
    function removeSup(s) {
        ask(`Excluir o supervisor "${s.name}"? A equipe dele ficará sem supervisor definido.`, () => update((d) => {
            d.supervisors = d.supervisors.filter((x) => x.id !== s.id);
            d.collaborators.forEach((c) => { if (c.supervisorId === s.id)
                c.supervisorId = null; });
            return d;
        }));
    }
    function assign(cid, sid) {
        update((d) => { const c = d.collaborators.find((x) => x.id === cid); c.supervisorId = sid || null; return d; });
    }
    const groups = [...db.supervisors.map((s) => ({ sup: s, members: db.collaborators.filter((c) => c.supervisorId === s.id) })),
        { sup: null, members: db.collaborators.filter((c) => !c.supervisorId) }];
    return (React.createElement("div", null,
        React.createElement("div", { className: "flex justify-end mb-4" },
            React.createElement(Btn, { onClick: () => { setEdit({}); setName(""); } },
                React.createElement(Plus, { size: 15 }),
                " Cadastrar supervisor")),
        React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" }, groups.map(({ sup, members }, gi) => (React.createElement(Card, { key: (sup === null || sup === void 0 ? void 0 : sup.id) || "none", className: "p-4" },
            React.createElement("div", { className: "flex items-center justify-between mb-3" },
                React.createElement("div", { className: "font-bold flex items-center gap-2", style: { fontFamily: FONT_HEAD } },
                    React.createElement(UserCog, { size: 16, color: sup ? C.accentInk : C.muted }),
                    sup ? sup.name : "Sem supervisor definido",
                    React.createElement("span", { className: "text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums", style: { background: C.flatSoft, color: C.muted } }, members.length)),
                sup && (React.createElement("div", { className: "flex gap-1" },
                    React.createElement("button", { onClick: () => { setEdit(sup); setName(sup.name); }, className: "p-1.5 rounded hover:bg-gray-100" },
                        React.createElement(Pencil, { size: 14, color: C.muted })),
                    React.createElement("button", { onClick: () => removeSup(sup), className: "p-1.5 rounded hover:bg-gray-100" },
                        React.createElement(Trash2, { size: 14, color: C.down }))))),
            members.length === 0 ? (React.createElement("div", { className: "text-sm py-3", style: { color: C.muted } },
                "Nenhum colaborador ",
                sup ? "nesta equipe" : "pendente",
                ".")) : (React.createElement("div", { className: "flex flex-col gap-1.5" }, members.sort((a, b) => (+a.matricula) - (+b.matricula)).map((c) => {
                var _a;
                return (React.createElement("div", { key: c.id, className: "flex items-center gap-2.5 rounded-lg px-3 py-2", style: { border: `1px solid ${C.border}` } },
                    React.createElement(MatBadge, { mat: c.matricula, size: 28 }),
                    React.createElement("div", { className: "flex-1 min-w-0" },
                        React.createElement("div", { className: "text-sm font-semibold truncate" },
                            "Matr\u00EDcula ",
                            c.matricula),
                        React.createElement("div", { className: "text-[11px] truncate", style: { color: C.muted } }, ((_a = profById[c.perfilId]) === null || _a === void 0 ? void 0 : _a.name) || "sem perfil")),
                    React.createElement(Select, { value: c.supervisorId || "", onChange: (e) => assign(c.id, e.target.value), style: { width: 150, padding: "4px 8px", fontSize: 12 } },
                        React.createElement("option", { value: "" }, "mover para\u2026"),
                        db.supervisors.map((s) => React.createElement("option", { key: s.id, value: s.id }, s.name)))));
            }))))))),
        edit !== null && (React.createElement(Modal, { title: edit.id ? "Editar supervisor" : "Cadastrar supervisor", onClose: () => setEdit(null) },
            React.createElement("div", { className: "flex flex-col gap-3.5" },
                React.createElement("div", null,
                    React.createElement(Label, null, "Nome do supervisor"),
                    React.createElement(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex.: Ana Souza" })),
                React.createElement("div", { className: "flex justify-end gap-2" },
                    React.createElement(Btn, { kind: "ghost", onClick: () => setEdit(null) }, "Cancelar"),
                    React.createElement(Btn, { onClick: saveSup },
                        React.createElement(Check, { size: 15 }),
                        " Salvar"))))),
        confirmNode));
}
/* ---------- Perfis ---------- */
function AdminProfiles({ db, update }) {
    const [edit, setEdit] = useState(null);
    const [ask, confirmNode] = useConfirm();
    const usage = useMemo(() => {
        const u = {};
        db.collaborators.forEach((c) => { if (c.perfilId)
            u[c.perfilId] = (u[c.perfilId] || 0) + 1; });
        return u;
    }, [db]);
    function remove(p) {
        if (usage[p.id]) {
            ask(`O perfil "${p.name}" está em uso por ${usage[p.id]} colaborador(es). Reatribua-os antes de excluir.`, null);
            return;
        }
        ask(`Excluir o perfil "${p.name}"?`, () => update((d) => { d.profiles = d.profiles.filter((x) => x.id !== p.id); return d; }));
    }
    return (React.createElement("div", null,
        React.createElement("div", { className: "flex justify-end mb-4" },
            React.createElement(Btn, { onClick: () => setEdit({}) },
                React.createElement(Plus, { size: 15 }),
                " Adicionar perfil")),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, db.profiles.map((p) => {
            const metas = Object.keys(p.metas);
            return (React.createElement(Card, { key: p.id, className: "p-4" },
                React.createElement("div", { className: "flex items-start justify-between gap-2 mb-2.5" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "font-bold", style: { fontFamily: FONT_HEAD } }, p.name),
                        React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } },
                            metas.length,
                            " meta(s) \u00B7 ",
                            usage[p.id] || 0,
                            " colaborador(es)")),
                    React.createElement("div", { className: "flex gap-1 shrink-0" },
                        React.createElement("button", { onClick: () => setEdit(p), className: "p-1.5 rounded hover:bg-gray-100" },
                            React.createElement(Pencil, { size: 14, color: C.muted })),
                        React.createElement("button", { onClick: () => remove(p), className: "p-1.5 rounded hover:bg-gray-100" },
                            React.createElement(Trash2, { size: 14, color: C.down })))),
                React.createElement("div", { className: "flex flex-wrap gap-1.5" }, metas.length ? metas.map((m) => {
                    const cfg = p.metas[m];
                    return (React.createElement("span", { key: m, className: "text-[11px] font-semibold px-2 py-1 rounded-full", style: { background: C.accentSoft, color: C.accentInk } },
                        m,
                        " ",
                        React.createElement("span", { style: { opacity: 0.7 } },
                            cfg.g4 != null ? `G4 ${fmtPct(cfg.g4)} · ` : "",
                            "G3 ",
                            fmtPct(cfg.g3),
                            cfg.g2 != null ? ` · G2 ${fmtPct(cfg.g2)}` : "",
                            cfg.g1 != null ? ` · G1 ${fmtPct(cfg.g1)}` : "")));
                }) : React.createElement("span", { className: "text-xs", style: { color: C.muted } }, "Nenhuma meta configurada."))));
        })),
        edit !== null && React.createElement(ProfileForm, { db: db, initial: edit, onClose: () => setEdit(null), update: update }),
        confirmNode));
}
function ProfileForm({ db, initial, onClose, update }) {
    const isNew = !initial.id;
    const [name, setName] = useState(initial.name || "");
    const [metas, setMetas] = useState(() => {
        const m = {};
        META_CANON.forEach((mn) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const ex = (_a = initial.metas) === null || _a === void 0 ? void 0 : _a[mn];
            const def = META_TIERS_DEFAULT[mn] || { g3: 90, g2: 95, g1: 100 };
            m[mn] = {
                on: !!ex,
                g6: (_c = (_b = ex === null || ex === void 0 ? void 0 : ex.g6) !== null && _b !== void 0 ? _b : def.g6) !== null && _c !== void 0 ? _c : "",
                g4: (_e = (_d = ex === null || ex === void 0 ? void 0 : ex.g4) !== null && _d !== void 0 ? _d : def.g4) !== null && _e !== void 0 ? _e : "",
                g3: (_g = (_f = ex === null || ex === void 0 ? void 0 : ex.g3) !== null && _f !== void 0 ? _f : ex === null || ex === void 0 ? void 0 : ex.alvo) !== null && _g !== void 0 ? _g : def.g3,
                g2: (_j = (_h = ex === null || ex === void 0 ? void 0 : ex.g2) !== null && _h !== void 0 ? _h : def.g2) !== null && _j !== void 0 ? _j : "",
                g1: (_l = (_k = ex === null || ex === void 0 ? void 0 : ex.g1) !== null && _k !== void 0 ? _k : def.g1) !== null && _l !== void 0 ? _l : "",
                valG4: (_m = ex === null || ex === void 0 ? void 0 : ex.valG4) !== null && _m !== void 0 ? _m : "", valG3: (_o = ex === null || ex === void 0 ? void 0 : ex.valG3) !== null && _o !== void 0 ? _o : "", valG2: (_p = ex === null || ex === void 0 ? void 0 : ex.valG2) !== null && _p !== void 0 ? _p : "", valG1: (_q = ex === null || ex === void 0 ? void 0 : ex.valG1) !== null && _q !== void 0 ? _q : "",
            };
        });
        return m;
    });
    const [err, setErr] = useState(null);
    const setField = (mn, k, v) => setMetas((prev) => ({ ...prev, [mn]: { ...prev[mn], [k]: v } }));
    const numOrNull = (v) => v === "" || v == null ? null : Number(v);
    function save() {
        if (!name.trim())
            return setErr("Informe o nome do perfil.");
        if (db.profiles.some((p) => strip(p.name) === strip(name) && p.id !== initial.id))
            return setErr("Já existe um perfil com este nome.");
        const out = {};
        META_CANON.forEach((mn) => {
            var _a, _b, _c;
            const x = metas[mn];
            if (!x.on)
                return;
            out[mn] = {
                g6: numOrNull(x.g6),
                g4: numOrNull(x.g4),
                g3: Number(x.g3) || 0, g2: numOrNull(x.g2), g1: numOrNull(x.g1),
                valG4: numOrNull(x.valG4), valG3: numOrNull(x.valG3), valG2: numOrNull(x.valG2), valG1: numOrNull(x.valG1),
                peso: (_c = (_b = (_a = initial.metas) === null || _a === void 0 ? void 0 : _a[mn]) === null || _b === void 0 ? void 0 : _b.peso) !== null && _c !== void 0 ? _c : null,
            };
        });
        update((d) => {
            if (isNew)
                d.profiles.push({ id: "p_" + uid(), name: name.trim(), metas: out });
            else {
                const p = d.profiles.find((x) => x.id === initial.id);
                p.name = name.trim();
                p.metas = out;
            }
            return d;
        });
        onClose();
    }
    const numCls = "w-14 rounded px-1.5 py-1 text-xs text-right tabular-nums outline-none";
    return (React.createElement(Modal, { title: isNew ? "Adicionar perfil" : "Editar perfil", onClose: onClose, wide: true },
        React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("div", null,
                React.createElement(Label, null, "Nome do perfil"),
                React.createElement(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex.: Analistas Noturno" })),
            React.createElement("div", null,
                React.createElement(Label, null, "Metas, patamares (%) e premia\u00E7\u00E3o (R$)"),
                React.createElement("div", { className: "text-[11px] mb-2", style: { color: C.muted } }, "Corte (G6) = m\u00EDnimo aceit\u00E1vel \u00B7 G4 = abaixo da meta (premiado) \u00B7 G3 = Meta \u00B7 G2 = Supera\u00E7\u00E3o \u00B7 G1 = Alta Performance. Deixe um campo em branco se n\u00E3o se aplica."),
                React.createElement("div", { className: "flex flex-col gap-2" }, META_CANON.map((mn) => {
                    const x = metas[mn];
                    return (React.createElement("div", { key: mn, className: "rounded-lg px-3 py-2", style: { border: `1px solid ${x.on ? C.accent : C.border}`, background: x.on ? C.accentSoft : "#fff" } },
                        React.createElement("label", { className: "flex items-center gap-2.5 cursor-pointer" },
                            React.createElement("input", { type: "checkbox", checked: x.on, onChange: (e) => setField(mn, "on", e.target.checked) }),
                            React.createElement("span", { className: "flex-1 text-sm font-medium" }, mn),
                            x.on && (React.createElement("span", { className: "flex items-center gap-1 text-[11px]", style: { color: C.down } },
                                "Corte",
                                React.createElement("input", { type: "number", min: "0", max: "100", step: "0.5", value: x.g6, placeholder: "\u2014", onChange: (e) => setField(mn, "g6", e.target.value), className: numCls, style: { border: `1px solid ${C.down}55` } }),
                                React.createElement("span", { style: { color: C.muted } }, "%")))),
                        x.on && (React.createElement("div", { className: "mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2" }, [["G4", "g4", "valG4", LEVEL_COLOR.G4], ["G3", "g3", "valG3", C.gold], ["G2", "g2", "valG2", C.accent], ["G1", "g1", "valG1", C.up]].map(([lab, kPct, kVal, col]) => (React.createElement("div", { key: lab, className: "rounded-md px-2 py-1.5", style: { background: "#fff", border: `1px solid ${C.border}` } },
                            React.createElement("div", { className: "text-[10px] font-bold mb-1", style: { color: col } },
                                lab,
                                lab === "G4" ? " (abaixo)" : ""),
                            React.createElement("div", { className: "flex items-center gap-1" },
                                React.createElement("input", { type: "number", min: "0", max: "100", step: "0.5", value: x[kPct], placeholder: "%", onChange: (e) => setField(mn, kPct, e.target.value), className: numCls, style: { border: `1px solid ${C.border}` } }),
                                React.createElement("span", { className: "text-[10px]", style: { color: C.muted } }, "%")),
                            React.createElement("div", { className: "flex items-center gap-1 mt-1" },
                                React.createElement("span", { className: "text-[10px]", style: { color: C.muted } }, "R$"),
                                React.createElement("input", { type: "number", min: "0", step: "0.5", value: x[kVal], placeholder: "\u2014", onChange: (e) => setField(mn, kVal, e.target.value), className: numCls, style: { border: `1px solid ${C.border}` } })))))))));
                }))),
            err && React.createElement("div", { className: "text-sm", style: { color: C.down } }, err),
            React.createElement("div", { className: "flex justify-end gap-2" },
                React.createElement(Btn, { kind: "ghost", onClick: onClose }, "Cancelar"),
                React.createElement(Btn, { onClick: save },
                    React.createElement(Check, { size: 15 }),
                    " Salvar perfil")))));
}
/* ---------- Histórico ---------- */
function AdminHistory({ db, update, months }) {
    const [ask, confirmNode] = useConfirm();
    function removeMonth(ym) {
        ask(`Excluir todos os dados de ${ymLabelFull(ym)}? Esta ação não pode ser desfeita.`, () => update((d) => { delete d.monthly[ym]; return d; }));
    }
    if (!months.length)
        return (React.createElement(Card, { className: "p-10 text-center text-sm", style: { color: C.muted } },
            "Nenhum m\u00EAs importado ainda. Use a aba ",
            React.createElement("b", null, "Importar planilha"),
            " para lan\u00E7ar o primeiro m\u00EAs."));
    return (React.createElement(Card, { className: "overflow-hidden" },
        React.createElement("table", { className: "w-full text-sm" },
            React.createElement("thead", null,
                React.createElement("tr", { style: { background: "#F7F9FA" } }, ["Competência", "Colaboradores lançados", "Arquivo", "Importado em", ""].map((h, i) => (React.createElement("th", { key: i, className: `px-5 py-2.5 text-xs font-semibold uppercase tracking-wide ${i >= 4 ? "text-right" : "text-left"}`, style: { color: C.muted } }, h))))),
            React.createElement("tbody", null, [...months].reverse().map((ym) => {
                const m = db.monthly[ym];
                return (React.createElement("tr", { key: ym, style: { borderTop: `1px solid ${C.border}` } },
                    React.createElement("td", { className: "px-5 py-3 font-bold", style: { fontFamily: FONT_HEAD } }, ymLabelFull(ym)),
                    React.createElement("td", { className: "px-5 py-3 tabular-nums" }, Object.keys(m.byMat).length),
                    React.createElement("td", { className: "px-5 py-3 text-xs", style: { color: C.muted } }, m.arquivo || "—"),
                    React.createElement("td", { className: "px-5 py-3 text-xs tabular-nums", style: { color: C.muted } }, m.importedAt ? new Date(m.importedAt).toLocaleString("pt-BR") : "—"),
                    React.createElement("td", { className: "px-5 py-3 text-right" },
                        React.createElement("button", { onClick: () => removeMonth(ym), className: "p-1.5 rounded hover:bg-gray-100", title: "Excluir m\u00EAs" },
                            React.createElement(Trash2, { size: 15, color: C.down })))));
            }))),
        React.createElement("div", { className: "px-5 py-3 text-xs", style: { color: C.muted, borderTop: `1px solid ${C.border}` } }, "Para sobrescrever um m\u00EAs j\u00E1 lan\u00E7ado, basta importar uma nova planilha selecionando a mesma compet\u00EAncia."),
        confirmNode));
}
// ============ Render ============
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(PainelGOP));
