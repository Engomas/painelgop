/* =========================================================================
   xlsx.js — Leitura de planilhas .xlsx SEM biblioteca.
   Um .xlsx é um arquivo ZIP contendo XMLs. Este módulo:
     1. Lê a estrutura do ZIP (End of Central Directory -> central directory
        -> cabeçalhos locais);
     2. Descomprime cada entrada com DecompressionStream("deflate-raw")
        (nativo do navegador). Trata também o método 0 = "store" (sem compressão);
     3. Faz o parsing do XML da primeira worksheet, cobrindo:
        - t="inlineStr"  (<is><t>...</t></is>)
        - t="s"          (sharedStrings via xl/sharedStrings.xml)
        - t="str"        (fórmula com resultado string)
        - números        (t="n" ou sem t)
        - referências r="A1" e células vazias (preserva a coluna)
   Exporta lerXlsx(arrayBuffer) -> Promise<{ headers:[], linhas:[{}], matriz:[[]] }>
   ========================================================================= */

// ---- Utilidades de bytes -------------------------------------------------

function u16(dv, off) { return dv.getUint16(off, true); }
function u32(dv, off) { return dv.getUint32(off, true); }

// Decodifica bytes UTF-8 em string (nomes de arquivo dentro do ZIP / XML).
const _decoder = new TextDecoder("utf-8");
function utf8(bytes) { return _decoder.decode(bytes); }

// Descomprime "deflate-raw" usando a API nativa. Para método 0 ("store"),
// devolve os bytes inalterados.
async function inflateRaw(bytes, metodo) {
  if (metodo === 0) return bytes; // armazenado sem compressão
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const partes = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    partes.push(value);
  }
  let total = 0;
  for (const p of partes) total += p.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) { out.set(p, pos); pos += p.length; }
  return out;
}

// ---- Leitura da estrutura ZIP -------------------------------------------

// Lê o ZIP e devolve um Map nome->Uint8Array (conteúdo descomprimido).
async function lerZip(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const dv = new DataView(arrayBuffer);

  // 1) Localiza o End of Central Directory (assinatura 0x06054b50),
  //    varrendo de trás para frente (há comentário opcional no fim).
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (u32(dv, i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("ZIP inválido: EOCD não encontrado.");

  const totalEntradas = u16(dv, eocd + 10);
  let cdOffset = u32(dv, eocd + 16);

  const arquivos = new Map();
  const CD_SIG = 0x02014b50;

  // 2) Percorre o Central Directory.
  let p = cdOffset;
  for (let n = 0; n < totalEntradas; n++) {
    if (u32(dv, p) !== CD_SIG) break;
    const metodo       = u16(dv, p + 10);
    const compSize     = u32(dv, p + 20);
    const nomeLen      = u16(dv, p + 28);
    const extraLen     = u16(dv, p + 30);
    const comentLen    = u16(dv, p + 32);
    const offsetLocal  = u32(dv, p + 42);
    const nome = utf8(bytes.subarray(p + 46, p + 46 + nomeLen));

    // 3) Vai ao cabeçalho local para descobrir o início real dos dados
    //    (os campos de nome/extra do local podem diferir do central).
    const LOCAL_SIG = 0x04034b50;
    if (u32(dv, offsetLocal) !== LOCAL_SIG) {
      throw new Error("Cabeçalho local inválido para " + nome);
    }
    const lNomeLen  = u16(dv, offsetLocal + 26);
    const lExtraLen = u16(dv, offsetLocal + 28);
    const inicioDados = offsetLocal + 30 + lNomeLen + lExtraLen;
    const comprimidos = bytes.subarray(inicioDados, inicioDados + compSize);

    arquivos.set(nome, await inflateRaw(comprimidos, metodo));

    p += 46 + nomeLen + extraLen + comentLen;
  }
  return arquivos;
}

// ---- Helpers de XML / células -------------------------------------------

// Converte referência de coluna "A","B",...,"AA" em índice 0-based.
function colParaIndice(ref) {
  let n = 0;
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i);
    if (c < 65 || c > 90) break; // só letras
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

// Desescapa entidades XML básicas.
function desescapar(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
          .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
          .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
          .replace(/&amp;/g, "&"); // por último
}

// Lê o sharedStrings.xml (quando existir) -> array de strings.
function lerSharedStrings(xml) {
  if (!xml) return [];
  const out = [];
  // Cada <si> pode ter um ou vários <t> (runs <r><t>...</t></r>).
  const reSi = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = reSi.exec(xml))) {
    const interno = m[1];
    let texto = "";
    const reT = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let mt;
    while ((mt = reT.exec(interno))) texto += desescapar(mt[1]);
    out.push(texto);
  }
  return out;
}

// ---- Parsing da worksheet -----------------------------------------------

// Devolve matriz de linhas; cada linha é array de células (string|number|null).
function lerWorksheet(xml, shared) {
  const linhas = [];
  const reRow = /<row\b[^>]*>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g;
  let mRow;
  while ((mRow = reRow.exec(xml))) {
    const interno = mRow[1] || "";
    const celulas = [];
    let autoCol = 0; // posição quando não há r="A1"

    // Captura cada <c ...>...</c> ou <c .../> (vazia).
    const reCell = /<c\b([^>]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let mC;
    while ((mC = reCell.exec(interno))) {
      const attrsVazia = mC[1];
      const attrs = mC[2];
      const corpo = mC[3];
      const attrStr = attrsVazia !== undefined ? attrsVazia : attrs;

      // Descobre a coluna: por r="A1" se houver; senão posição sequencial.
      let colIdx;
      const mRef = /\br="([A-Z]+)\d+"/.exec(attrStr);
      if (mRef) colIdx = colParaIndice(mRef[1]);
      else colIdx = autoCol;

      // Garante posições intermediárias vazias.
      while (celulas.length < colIdx) celulas.push(null);

      let valor = null;
      if (attrsVazia === undefined) {
        const mT = /\bt="([^"]+)"/.exec(attrStr);
        const tipo = mT ? mT[1] : null;
        if (tipo === "inlineStr") {
          let texto = "";
          const reT = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
          let mt;
          while ((mt = reT.exec(corpo))) texto += desescapar(mt[1]);
          valor = texto;
        } else if (tipo === "s") {
          const mV = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(corpo);
          const idx = mV ? parseInt(mV[1], 10) : -1;
          valor = shared[idx] !== undefined ? shared[idx] : "";
        } else if (tipo === "str") {
          const mV = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(corpo);
          valor = mV ? desescapar(mV[1]) : "";
        } else {
          // número (t="n" ou ausente)
          const mV = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(corpo);
          if (mV) {
            const num = Number(mV[1]);
            valor = Number.isNaN(num) ? desescapar(mV[1]) : num;
          } else {
            valor = null;
          }
        }
      }
      celulas[colIdx] = valor;
      autoCol = colIdx + 1;
    }
    linhas.push(celulas);
  }
  return linhas;
}

// ---- API pública ---------------------------------------------------------

async function lerXlsx(arrayBuffer) {
  const arquivos = await lerZip(arrayBuffer);

  // Acha a primeira worksheet. O caminho usual é xl/worksheets/sheet1.xml.
  let sheetXml = null;
  // Tenta resolver via workbook + rels para respeitar a ordem real.
  const wb = arquivos.get("xl/workbook.xml");
  const rels = arquivos.get("xl/_rels/workbook.xml.rels");
  if (wb && rels) {
    const mSheet = /<sheet\b[^>]*r:id="([^"]+)"[^>]*\/>|<sheet\b[^>]*\/>/.exec(wb);
    const rid = mSheet && mSheet[1];
    if (rid) {
      const reRel = new RegExp('<Relationship\\b[^>]*Id="' + rid + '"[^>]*Target="([^"]+)"');
      const mRel = reRel.exec(rels);
      if (mRel) {
        let alvo = mRel[1].replace(/^\//, "");
        if (!alvo.startsWith("xl/")) alvo = "xl/" + alvo;
        sheetXml = utf8Or(arquivos.get(alvo));
      }
    }
  }
  // Fallbacks robustos.
  if (!sheetXml) sheetXml = utf8Or(arquivos.get("xl/worksheets/sheet1.xml"));
  if (!sheetXml) {
    for (const [nome, dados] of arquivos) {
      if (/^xl\/worksheets\/.*\.xml$/.test(nome)) { sheetXml = utf8(dados); break; }
    }
  }
  if (!sheetXml) throw new Error("Worksheet não encontrada no arquivo.");

  const shared = lerSharedStrings(utf8Or(arquivos.get("xl/sharedStrings.xml")));
  const matriz = lerWorksheet(sheetXml, shared);

  // Primeira linha não vazia = cabeçalho.
  let h = 0;
  while (h < matriz.length && matriz[h].every(c => c === null || c === "")) h++;
  const headers = (matriz[h] || []).map(c => (c == null ? "" : String(c).trim()));
  const dados = matriz.slice(h + 1).filter(l => l.some(c => c !== null && c !== ""));

  // Monta objetos linha {header: valor}.
  const linhas = dados.map(l => {
    const obj = {};
    headers.forEach((hd, i) => { obj[hd] = l[i] !== undefined ? l[i] : null; });
    return obj;
  });

  return { headers, linhas, matriz };
}

function utf8Or(bytes) { return bytes ? utf8(bytes) : null; }

// Export para navegador (window) e para Node (module.exports), p/ testes.
if (typeof window !== "undefined") {
  window.lerXlsx = lerXlsx;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { lerXlsx };
}
