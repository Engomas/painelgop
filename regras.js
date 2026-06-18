/* =========================================================================
   regras.js — Regras de negócio do Painel GOP.
   Escala de patamares (crescente): G6 corte, G4 abaixo da meta, G3 meta,
   G2 superação, G1 alta performance. G5 é ignorado (não existe aqui).
   Toda porcentagem é tratada exatamente como informada (sem arredondar).
   ========================================================================= */

const NIVEIS = ["g4", "g3", "g2", "g1"]; // ordem crescente premiável
const VAL_DE = { g4: "valG4", g3: "valG3", g2: "valG2", g1: "valG1" };
const ROTULO_NIVEL = { g1: "G1", g2: "G2", g3: "G3", g4: "G4", g6: "Corte" };

// As 12 metas canônicas, na ordem oficial de exibição.
const METAS_CANONICAS = [
  "Tabulação", "CSAT", "CSAT Resposta", "ABS", "Monitoria", "Eficiencia",
  "Tempo resposta", "AF SLA 2 dias", "Assertividade",
  "Fechamento SLA 2 dias", "Tempo Produtivo", "Faturamento 2 dias"
];

// Normaliza um texto para comparar nomes de meta/coluna (sem acento, minúsculo).
function normalizar(txt) {
  return String(txt == null ? "" : txt)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

// Mapa nome-normalizado -> nome canônico, para casar cabeçalhos variáveis.
const _mapaCanon = (() => {
  const m = {};
  for (const nome of METAS_CANONICAS) m[normalizar(nome)] = nome;
  // Apelidos vistos em planilhas.
  m[normalizar("AF sla 2 dias")] = "AF SLA 2 dias";
  m[normalizar("Fechamento Sla 2 dias")] = "Fechamento SLA 2 dias";
  m[normalizar("Faturamento 2 dias")] = "Faturamento 2 dias";
  return m;
})();

function canonizarMeta(nome) {
  return _mapaCanon[normalizar(nome)] || null;
}

// Normaliza um valor percentual: fração (<=1,5) vira porcentagem; preserva
// as casas decimais exatas removendo apenas ruído de ponto flutuante.
function normalizarPercentual(v) {
  if (v == null || v === "") return null;
  let n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (Number.isNaN(n)) return null;
  if (n <= 1.5) n = n * 100;
  return Number(n.toPrecision(12));
}

/* Avalia uma meta dado o valor v e a regra (objeto de patamares).
   Retorna um objeto rico com nível atingido, premiação, próximo nível, gap,
   ganho, e flags (atingiu, abaixoCorte). */
function avaliarMeta(nome, v, regra) {
  const r = {
    meta: nome, valor: v, regra,
    nivel: null,        // "g4"|"g3"|"g2"|"g1" ou null (abaixo de G4)
    premiacao: 0,
    atingiu: false,     // v >= g3
    temCorte: regra.g6 != null,
    abaixoCorte: false, // g6 existe e v < g6
    proximo: null,      // {nivel, alvo, gap, ganho} ou null (já no topo)
  };
  if (v == null) return r; // sem dado no mês

  if (regra.g6 != null && v < regra.g6) r.abaixoCorte = true;

  // Maior patamar alcançado (entre os existentes).
  let atingido = null;
  for (const nv of NIVEIS) {
    if (regra[nv] != null && v >= regra[nv]) atingido = nv;
  }
  r.nivel = atingido;
  r.premiacao = atingido ? (regra[VAL_DE[atingido]] || 0) : 0;
  r.atingiu = regra.g3 != null && v >= regra.g3;

  // Próximo patamar acima de v (primeiro existente cujo alvo > v).
  for (const nv of NIVEIS) {
    if (regra[nv] != null && v < regra[nv]) {
      const ganho = (regra[VAL_DE[nv]] || 0) - r.premiacao;
      r.proximo = {
        nivel: nv,
        alvo: regra[nv],
        gap: Number((regra[nv] - v).toPrecision(12)),
        ganho: Number(ganho.toPrecision(12)),
      };
      break;
    }
  }
  return r;
}

/* Avalia todas as metas de um colaborador no mês.
   perfilRegras: { nomeMeta: regra }. valores: { nomeMeta: percentual }.
   Retorna { metas:[avaliacoes do perfil], fora:[indicadores fora do perfil],
             totalMetas, atingidas, premiacao, temAbaixoCorte }. */
function avaliarColaborador(perfilRegras, valores) {
  const metas = [];
  const fora = [];
  let premiacao = 0, atingidas = 0, temAbaixoCorte = false;

  // Metas do perfil (contam para tudo).
  for (const nome of Object.keys(perfilRegras || {})) {
    const v = valores ? (valores[nome] != null ? valores[nome] : null) : null;
    const av = avaliarMeta(nome, v, perfilRegras[nome]);
    metas.push(av);
    premiacao += av.premiacao;
    if (av.atingiu) atingidas++;
    if (av.abaixoCorte) temAbaixoCorte = true;
  }

  // Indicadores presentes nos valores mas fora do perfil (informativos).
  for (const nome of Object.keys(valores || {})) {
    if (perfilRegras && perfilRegras[nome] != null) continue;
    if (valores[nome] == null) continue;
    fora.push({ meta: nome, valor: valores[nome] });
  }

  return {
    metas, fora,
    totalMetas: metas.length,
    atingidas,
    premiacao: Number(premiacao.toPrecision(12)),
    temAbaixoCorte,
  };
}

/* Ordena prioridades: (1) abaixo do corte, (2) abaixo da meta, (3) pode subir.
   Dentro de cada grupo: maior ganho por esforço (ganho R$ / gap pp). */
function calcularPrioridades(avaliacoes, limite) {
  const candidatos = avaliacoes.filter(a => a.valor != null && a.proximo);
  function grupo(a) {
    if (a.abaixoCorte) return 0;
    if (!a.atingiu) return 1; // abaixo da meta (g3)
    return 2;                 // já atingiu, pode subir
  }
  function eficiencia(a) {
    const gap = a.proximo.gap > 0 ? a.proximo.gap : 0.0001;
    return a.proximo.ganho / gap;
  }
  candidatos.sort((x, y) => {
    const gx = grupo(x), gy = grupo(y);
    if (gx !== gy) return gx - gy;
    return eficiencia(y) - eficiencia(x);
  });
  return limite ? candidatos.slice(0, limite) : candidatos;
}

if (typeof window !== "undefined") {
  window.GOP_REGRAS = {
    NIVEIS, VAL_DE, ROTULO_NIVEL, METAS_CANONICAS,
    normalizar, canonizarMeta, normalizarPercentual,
    avaliarMeta, avaliarColaborador, calcularPrioridades,
  };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    NIVEIS, VAL_DE, ROTULO_NIVEL, METAS_CANONICAS,
    normalizar, canonizarMeta, normalizarPercentual,
    avaliarMeta, avaliarColaborador, calcularPrioridades,
  };
}
