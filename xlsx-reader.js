/* ============================================================================
   Leitor de planilhas .xlsx — 100% sem bibliotecas externas.
   Usa DecompressionStream('deflate-raw'), nativo dos navegadores modernos.
   Expõe window.XlsxReader.readFirstSheet(arrayBuffer) -> Promise<linhas[][]>.
   ========================================================================== */
(function () {
  "use strict";

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === "undefined")
      throw new Error("Seu navegador não suporta a descompressão necessária. Use um navegador atualizado (Chrome, Edge ou Firefox recentes).");
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Response(new Blob([bytes])).body.pipeThrough(ds);
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  async function unzip(bytes) {
    let eocd = -1;
    const min = Math.max(0, bytes.length - 22 - 65536);
    for (let i = bytes.length - 22; i >= min; i--) {
      if (u32(bytes, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("Arquivo .xlsx inválido (estrutura ZIP não reconhecida).");
    const cdCount = u16(bytes, eocd + 10);
    let off = u32(bytes, eocd + 16);
    const files = {};
    for (let n = 0; n < cdCount; n++) {
      if (u32(bytes, off) !== 0x02014b50) break;
      const method = u16(bytes, off + 10);
      const compSize = u32(bytes, off + 20);
      const nameLen = u16(bytes, off + 28);
      const extraLen = u16(bytes, off + 30);
      const commentLen = u16(bytes, off + 32);
      const localOff = u32(bytes, off + 42);
      const name = new TextDecoder().decode(bytes.subarray(off + 46, off + 46 + nameLen));
      if (u32(bytes, localOff) === 0x04034b50) {
        const lNameLen = u16(bytes, localOff + 26);
        const lExtraLen = u16(bytes, localOff + 28);
        const dataStart = localOff + 30 + lNameLen + lExtraLen;
        const raw = bytes.subarray(dataStart, dataStart + compSize);
        files[name] = method === 0 ? raw : await inflateRaw(raw);
      }
      off += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  const dec = (b) => new TextDecoder("utf-8").decode(b);

  function unescapeXml(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&");
  }

  function parseSharedStrings(xml) {
    if (!xml) return [];
    const out = [];
    const siRe = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g;
    let m;
    while ((m = siRe.exec(xml))) {
      let text = "";
      const tRe = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g;
      let t;
      while ((t = tRe.exec(m[1]))) text += t[1];
      out.push(unescapeXml(text));
    }
    return out;
  }

  function colIndex(ref) {
    const m = /^([A-Z]+)/.exec(ref || "");
    if (!m) return null;
    let c = 0;
    for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64);
    return c - 1;
  }

  function parseSheet(xml, shared) {
    const rows = [];
    const rowRe = /<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g;
    let rm;
    while ((rm = rowRe.exec(xml))) {
      const cells = [];
      let auto = 0;
      const cRe = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g;
      let cm;
      while ((cm = cRe.exec(rm[1]))) {
        const attrs = cm[1] || "", bodyC = cm[2] || "";
        const rRef = (/\br="([^"]+)"/.exec(attrs) || [])[1];
        const t = (/\bt="([^"]+)"/.exec(attrs) || [])[1];
        const idx = rRef != null ? colIndex(rRef) : auto;
        auto = idx + 1;
        let val = null;
        if (t === "inlineStr") {
          let txt = ""; const tRe = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g; let tm;
          while ((tm = tRe.exec(bodyC))) txt += tm[1];
          val = unescapeXml(txt);
        } else if (t === "s") {
          const vm = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(bodyC);
          val = vm ? (shared[+vm[1]] != null ? shared[+vm[1]] : "") : "";
        } else if (t === "str") {
          const vm = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(bodyC);
          val = vm ? unescapeXml(vm[1]) : "";
        } else {
          const vm = /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(bodyC);
          if (vm) { const num = parseFloat(vm[1]); val = isNaN(num) ? vm[1] : num; }
        }
        cells[idx] = val;
      }
      rows.push(cells);
    }
    return rows;
  }

  async function readFirstSheet(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const files = await unzip(bytes);
    let sheetName = Object.keys(files).find((n) => /^xl\/worksheets\/sheet1\.xml$/i.test(n))
      || Object.keys(files).find((n) => /^xl\/worksheets\/.*\.xml$/i.test(n));
    if (!sheetName) throw new Error("Nenhuma planilha encontrada dentro do arquivo .xlsx.");
    const sharedXml = files["xl/sharedStrings.xml"] ? dec(files["xl/sharedStrings.xml"]) : "";
    const shared = parseSharedStrings(sharedXml);
    return parseSheet(dec(files[sheetName]), shared);
  }

  window.XlsxReader = { readFirstSheet };
})();
