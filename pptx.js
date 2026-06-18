/* =========================================================================
   pptx.js — Gera um .pptx SEM biblioteca.
   Monta o OOXML mínimo de uma apresentação e empacota num ZIP "store"
   (método 0, sem compressão), calculando o CRC32 de cada entrada na mão.
   ========================================================================= */

// ---- CRC32 ---------------------------------------------------------------
const _crcTab = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = _crcTab[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

const _enc = new TextEncoder();
function bytesDe(str) { return _enc.encode(str); }

// ---- ZIP store ------------------------------------------------------------
function zipStore(arquivos) {
  // arquivos: [{nome, dados:Uint8Array}]
  const locais = [];
  const central = [];
  let offset = 0;

  function p16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
  function p32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

  for (const f of arquivos) {
    const nome = bytesDe(f.nome);
    const crc = crc32(f.dados);
    const tam = f.dados.length;
    const local = [].concat(
      p32(0x04034b50), p16(20), p16(0), p16(0), p16(0), p16(0),
      p32(crc), p32(tam), p32(tam), p16(nome.length), p16(0)
    );
    const localBytes = new Uint8Array(local.length + nome.length + tam);
    localBytes.set(local, 0);
    localBytes.set(nome, local.length);
    localBytes.set(f.dados, local.length + nome.length);
    locais.push(localBytes);

    const cdir = [].concat(
      p32(0x02014b50), p16(20), p16(20), p16(0), p16(0), p16(0), p16(0),
      p32(crc), p32(tam), p32(tam), p16(nome.length), p16(0), p16(0),
      p16(0), p16(0), p32(0), p32(offset)
    );
    const cdirBytes = new Uint8Array(cdir.length + nome.length);
    cdirBytes.set(cdir, 0);
    cdirBytes.set(nome, cdir.length);
    central.push(cdirBytes);

    offset += localBytes.length;
  }

  let cdSize = 0;
  for (const c of central) cdSize += c.length;
  const cdOffset = offset;

  const eocd = new Uint8Array([].concat(
    p32(0x06054b50), p16(0), p16(0),
    p16(arquivos.length), p16(arquivos.length),
    p32(cdSize), p32(cdOffset), p16(0)
  ));

  let total = cdSize + eocd.length;
  for (const l of locais) total += l.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const l of locais) { out.set(l, pos); pos += l.length; }
  for (const c of central) { out.set(c, pos); pos += c.length; }
  out.set(eocd, pos);
  return out;
}

// ---- Helpers de XML de slide ---------------------------------------------
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
const EMU = 914400; // por polegada
function pol(v) { return Math.round(v * EMU); }

// Caixa de texto simples.
function caixaTexto(id, nome, x, y, w, h, paras) {
  const corpo = paras.map(p => {
    const runs = (p.runs || []).map(r =>
      `<a:r><a:rPr lang="pt-BR" sz="${r.sz || 1800}" b="${r.b ? 1 : 0}"${r.cor ? ` ><a:solidFill><a:srgbClr val="${r.cor}"/></a:solidFill></a:rPr` : "/"}><a:t>${esc(r.t)}</a:t></a:r>`
    ).join("");
    return `<a:p><a:pPr algn="${p.algn || "l"}"/>${runs}</a:p>`;
  }).join("");
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${esc(nome)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${pol(x)}" y="${pol(y)}"/><a:ext cx="${pol(w)}" cy="${pol(h)}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>` +
    `<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${corpo}</p:txBody></p:sp>`;
}

// Retângulo de fundo colorido.
function retangulo(id, x, y, w, h, cor) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="bg${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${pol(x)}" y="${pol(y)}"/><a:ext cx="${pol(w)}" cy="${pol(h)}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
    `<a:solidFill><a:srgbClr val="${cor}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>` +
    `<p:txBody><a:bodyPr/><a:p/></p:txBody></p:sp>`;
}

// Tabela simples (linhas = array de arrays de strings; primeira é cabeçalho).
function tabela(id, x, y, w, linhas, larguras) {
  const nCols = larguras.length;
  const grid = larguras.map(lw => `<a:gridCol w="${pol(lw)}"/>`).join("");
  const trs = linhas.map((linha, ri) => {
    const cab = ri === 0;
    const tcs = linha.map(txt => {
      const cor = cab ? "FFFFFF" : "1A2B33";
      const fill = cab ? "0E7C7B" : (ri % 2 ? "F2F6F6" : "FFFFFF");
      return `<a:tc><a:txBody><a:bodyPr/><a:p><a:pPr algn="l"/>` +
        `<a:r><a:rPr lang="pt-BR" sz="1000" b="${cab ? 1 : 0}"><a:solidFill><a:srgbClr val="${cor}"/></a:solidFill></a:rPr>` +
        `<a:t>${esc(txt)}</a:t></a:r></a:p></a:txBody>` +
        `<a:tcPr><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></a:tcPr></a:tc>`;
    }).join("");
    return `<a:tr h="${pol(0.32)}">${tcs}</a:tr>`;
  }).join("");
  return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="tab"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>` +
    `<p:xfrm><a:off x="${pol(x)}" y="${pol(y)}"/><a:ext cx="${pol(w)}" cy="${pol(0.32 * linhas.length)}"/></p:xfrm>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">` +
    `<a:tbl><a:tblPr firstRow="1"/><a:tblGrid>${grid}</a:tblGrid>${trs}</a:tbl>` +
    `</a:graphicData></a:graphic></p:graphicFrame>`;
}

function slideXml(shapes) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
    `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
    `<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
    shapes + `</p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sld>`;
}

// ---- Montagem do pacote ---------------------------------------------------
function gerarPptx(dados) {
  // dados: { matricula, perfil, supervisor, mes, resultados:[{meta,corte,metaG3,valor,nivel,premiacao}],
  //          prioridades:[{meta,gap,ganho,abaixoCorte}], evolucao:{metas:[], meses:[], valores:{meta:{mes:v}}, alvos:{meta:g3}} }
  const TEAL = "0E7C7B", ESCURO = "1A2B33", CLARO = "F2F6F6";
  const slides = [];

  // Slide 1 — Capa
  slides.push(slideXml(
    retangulo(2, 0, 0, 13.333, 2.6, TEAL) +
    caixaTexto(3, "titulo", 0.6, 0.7, 12, 1, [{ runs: [{ t: "Painel GOP — Resultados", sz: 3200, b: true, cor: "FFFFFF" }] }]) +
    caixaTexto(4, "sub", 0.6, 1.7, 12, 0.6, [{ runs: [{ t: "Mês de referência: " + dados.mes, sz: 1800, cor: "FFFFFF" }] }]) +
    caixaTexto(5, "info", 0.6, 3.2, 12, 2, [
      { runs: [{ t: "Matrícula: " + dados.matricula, sz: 2000, b: true, cor: ESCURO }] },
      { runs: [{ t: "Perfil: " + dados.perfil, sz: 1800, cor: ESCURO }] },
      { runs: [{ t: "Supervisor: " + (dados.supervisor || "—"), sz: 1800, cor: ESCURO }] },
    ])
  ));

  // Slide 2 — Resultados do mês
  const linhasRes = [["Indicador", "Corte", "Meta (G3)", "Resultado", "Nível", "Premiação"]];
  for (const r of dados.resultados) {
    linhasRes.push([
      r.meta,
      r.corte != null ? fmtPct(r.corte) : "—",
      r.metaG3 != null ? fmtPct(r.metaG3) : "—",
      r.valor != null ? fmtPct(r.valor) : "—",
      r.nivel || "—",
      r.premiacao != null ? fmtMoeda(r.premiacao) : "—",
    ]);
  }
  slides.push(slideXml(
    caixaTexto(2, "t", 0.6, 0.35, 12, 0.7, [{ runs: [{ t: "Resultados do mês", sz: 2600, b: true, cor: TEAL }] }]) +
    tabela(3, 0.6, 1.3, 12.1, linhasRes, [3.6, 1.5, 1.7, 1.7, 1.4, 2.2])
  ));

  // Slide 3 — Onde focar (prioridades)
  const linhasPri = [["Indicador", "Falta (pp)", "Ganho (R$)", "Situação"]];
  for (const p of dados.prioridades) {
    linhasPri.push([
      p.meta,
      p.gap != null ? fmtPct(p.gap) : "—",
      p.ganho != null ? fmtMoeda(p.ganho) : "—",
      p.abaixoCorte ? "Abaixo do corte" : (p.abaixoMeta ? "Abaixo da meta" : "Subir de nível"),
    ]);
  }
  slides.push(slideXml(
    caixaTexto(2, "t", 0.6, 0.35, 12, 0.7, [{ runs: [{ t: "Onde focar", sz: 2600, b: true, cor: TEAL }] }]) +
    tabela(3, 0.6, 1.3, 12.1, linhasPri.length > 1 ? linhasPri : [["Indicador", "Falta (pp)", "Ganho (R$)", "Situação"], ["Sem prioridades neste mês", "", "", ""]], [4.5, 2.3, 2.6, 2.7])
  ));

  // Slide 4 — Evolução mês a mês
  const ev = dados.evolucao;
  const linhasEv = [["Indicador", "Alvo (G3)"].concat(ev.meses)];
  for (const meta of ev.metas) {
    const linha = [meta, ev.alvos[meta] != null ? fmtPct(ev.alvos[meta]) : "—"];
    let anterior = null;
    for (const mes of ev.meses) {
      const v = ev.valores[meta] ? ev.valores[meta][mes] : null;
      let cel = v != null ? fmtPct(v) : "—";
      if (v != null && anterior != null) {
        if (v > anterior) cel += " ▲"; else if (v < anterior) cel += " ▼";
      }
      if (v != null) anterior = v;
      linha.push(cel);
    }
    linhasEv.push(linha);
  }
  const colW = [3.2, 1.5].concat(ev.meses.map(() => Math.max(1.1, (7.6 / Math.max(1, ev.meses.length)))));
  slides.push(slideXml(
    caixaTexto(2, "t", 0.6, 0.35, 12, 0.7, [{ runs: [{ t: "Evolução mês a mês", sz: 2600, b: true, cor: TEAL }] }]) +
    tabela(3, 0.6, 1.3, 12.1, linhasEv, colW)
  ));

  // ---- Partes fixas do pacote ----
  const arquivos = [];
  function add(nome, str) { arquivos.push({ nome, dados: bytesDe(str) }); }

  const nSlides = slides.length;
  const slideOverrides = slides.map((_, i) =>
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join("");

  add("[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>` +
    `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>` +
    `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>` +
    `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>` +
    slideOverrides + `</Types>`);

  add("_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>` +
    `</Relationships>`);

  const sldIdLst = slides.map((_, i) =>
    `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`
  ).join("");
  add("ppt/presentation.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
    `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
    `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` +
    `<p:sldIdLst>${sldIdLst}</p:sldIdLst>` +
    `<p:sldSz cx="${pol(13.333)}" cy="${pol(7.5)}" type="screen16x9"/>` +
    `<p:notesSz cx="${pol(7.5)}" cy="${pol(10)}"/></p:presentation>`);

  const presRels = [`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`]
    .concat(slides.map((_, i) =>
      `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    ))
    .concat([`<Relationship Id="rId${nSlides + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>`])
    .join("");
  add("ppt/_rels/presentation.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${presRels}</Relationships>`);

  // Slides + rels de cada slide.
  slides.forEach((s, i) => {
    add(`ppt/slides/slide${i + 1}.xml`, s);
    add(`ppt/slides/_rels/slide${i + 1}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
      `</Relationships>`);
  });

  // Master, layout, theme mínimos.
  add("ppt/slideMasters/slideMaster1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
    `<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
    `<p:grpSpPr/></p:spTree></p:cSld>` +
    `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>` +
    `<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`);
  add("ppt/slideMasters/_rels/slideMaster1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>` +
    `</Relationships>`);
  add("ppt/slideLayouts/slideLayout1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">` +
    `<p:cSld name="Em branco"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>` +
    `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`);
  add("ppt/slideLayouts/_rels/slideLayout1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>` +
    `</Relationships>`);
  add("ppt/theme/theme1.xml", temaXml());

  return zipStore(arquivos);
}

function temaXml() {
  const c = (n, v) => `<a:${n}><a:srgbClr val="${v}"/></a:${n}>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="GOP">` +
    `<a:themeElements><a:clrScheme name="GOP">` +
    `<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>` +
    `<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>` +
    c("dk2", "1A2B33") + c("lt2", "F2F6F6") +
    c("accent1", "0E7C7B") + c("accent2", "12A19A") + c("accent3", "E0A93B") +
    c("accent4", "C0392B") + c("accent5", "5DADE2") + c("accent6", "7D8B92") +
    c("hlink", "0E7C7B") + c("folHlink", "7D8B92") +
    `</a:clrScheme>` +
    `<a:fontScheme name="GOP"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>` +
    `<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>` +
    `<a:fmtScheme name="GOP"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>` +
    `<a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>` +
    `<a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>` +
    `<a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>` +
    `<a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>` +
    `<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle>` +
    `<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>` +
    `<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>` +
    `<a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>` +
    `</a:fmtScheme></a:themeElements></a:theme>`;
}

// Formatação (duplicada aqui para o módulo ser autônomo em Node).
function fmtPct(v) {
  if (v == null) return "—";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + "%";
}
function fmtMoeda(v) {
  if (v == null) return "—";
  return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

if (typeof window !== "undefined") window.gerarPptx = gerarPptx;
if (typeof module !== "undefined" && module.exports) module.exports = { gerarPptx, zipStore, crc32 };
