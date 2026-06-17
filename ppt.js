/* Gerador de apresentação .pptx (OOXML) — 100%% sem bibliotecas. window.GopPpt.gerar(opts) */
(function(){
"use strict";
var MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
var MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
function tiersOf(cfg){ if(!cfg)return[]; var o=[]; if(cfg.g4!=null)o.push({key:'G4',label:'Abaixo da Meta',value:cfg.g4,prem:cfg.valG4}); if(cfg.g3!=null)o.push({key:'G3',label:'Meta',value:cfg.g3,prem:cfg.valG3}); if(cfg.g2!=null)o.push({key:'G2',label:'Superação',value:cfg.g2,prem:cfg.valG2}); if(cfg.g1!=null)o.push({key:'G1',label:'Alta Performance',value:cfg.g1,prem:cfg.valG1}); return o; }
function alvoOf(cfg){ return cfg?(cfg.g3!=null?cfg.g3:(cfg.alvo!=null?cfg.alvo:null)):null; }
function evalMeta(cfg,v){ var tiers=tiersOf(cfg),g3=alvoOf(cfg),cut=cfg&&cfg.g6!=null?cfg.g6:null; if(v==null||!tiers.length)return{value:v,level:null,levelLabel:null,prem:0,hitG3:false,next:null,gap:null,tiers:tiers,g3:g3,cut:cut,belowCut:false,gapCut:null}; var level=null,prem=0; for(var i=0;i<tiers.length;i++){if(v>=tiers[i].value){level=tiers[i];prem=tiers[i].prem!=null?tiers[i].prem:0;}} var next=null; for(var j=0;j<tiers.length;j++){if(v<tiers[j].value){next=tiers[j];break;}} var gap=next?Math.round((next.value-v)*100)/100:null; var belowCut=cut!=null&&v<cut; var gapCut=cut!=null?Math.round((cut-v)*100)/100:null; return{value:v,level:level?level.key:null,levelLabel:level?level.label:null,prem:prem,hitG3:g3!=null&&v>=g3,next:next,gap:gap,tiers:tiers,g3:g3,cut:cut,belowCut:belowCut,gapCut:gapCut}; }

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

async function gerarPpt(opts) {
  const { db, c, prof, cms, refYm, score, prem, profMetas } = opts;
  _spId = 1;
  const W = 13.333, H = 7.5;
  const INK = "15212C", MUTED = "65748A", ACC = "0E8A7B", ACCINK = "0A6B60";
  const UP = "1B8C4C", DOWN = "D24343", FLAT = "8A97A5", GOLD = "A97A1E", LINE = "E1E6EB", DARK = "0B222F";
  const supName = opts.supName || "não definido";
  const fmt = (v) => v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const monthLabel = (ym) => { const [y, m] = ym.split("-"); return `${MESES_FULL[+m - 1]}/${y}`; };
  const rec = refYm ? db.monthly[refYm]?.byMat[c.matricula] : null;

  /* ---------- Slide 1: capa ---------- */
  const sh1 = [
    _rect(0, 0, 0.35, H, ACC),
    _txt(0.9, 2.2, 11, 0.5, [{ text: "ACOMPANHAMENTO DE METAS", size: 18, color: "7FA3B3" }]),
    _txt(0.9, 2.75, 11.5, 1.1, [{ text: `Matrícula ${c.matricula}`, size: 54, bold: true, color: "FFFFFF" }]),
    _txt(0.9, 4.05, 11.5, 0.5, [
      { text: "Perfil  ", size: 16, color: "7FA3B3" }, { text: `${prof?.name || "—"}      `, size: 16, bold: true, color: "FFFFFF" },
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
        const v = db.monthly[ym].byMat[c.matricula]?.valores[meta];
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

window.GopPpt = { gerar: gerarPpt };
})();
