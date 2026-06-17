/* Gráfico de evolução em SVG puro. window.GopChart(chartData, tiers, cut) -> Node
   chartData: [{mes, valor|null}]; tiers: [{key,label,value}]; cut: number|null */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const LEVEL_COLOR = { G1:"#1B8C4C", G2:"#0E8A7B", G3:"#A97A1E", G4:"#C7791F" };
  const LEVEL_SOFT  = { G1:"#E5F4EA", G2:"#E1F1EE", G3:"#FBF2DE", G4:"#FBEDDB" };
  const ACCENT = "#0E8A7B", BORDER = "#E1E6EB", MUTED = "#65748A", INK = "#15212C", DOWN = "#D24343";
  const fmtPct = (v) => v == null ? "—" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";

  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  window.GopChart = function (chartData, tiers, cut) {
    const W = 720, H = 320, padL = 44, padR = 110, padT = 12, padB = 28;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const vals = chartData.map((d) => d.valor).filter((v) => v != null);
    const marks = tiers.map((t) => t.value).concat(cut != null ? [cut] : []);
    const all = vals.concat(marks);
    let lo = 0, hi = 100;
    if (all.length) {
      const mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
      const pad = Math.max((mx - mn) * 0.18, 4);
      lo = Math.max(0, Math.floor((mn - pad) / 5) * 5);
      hi = Math.min(100, Math.ceil((mx + pad) / 5) * 5);
      if (hi - lo < 12) { hi = Math.min(100, lo + 12); lo = Math.max(0, hi - 12); }
    }
    const span = hi - lo || 1;
    const yOf = (v) => padT + (1 - (v - lo) / span) * plotH;
    const n = chartData.length;
    const xOf = (i) => n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW;

    const root = window.GOP.h("div.chart-wrap");
    const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", height: H, preserveAspectRatio: "none" });
    svg.style.display = "block";

    // grid horizontal + eixo Y (4 marcas)
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = lo + (span * i / ticks);
      const y = yOf(val);
      svg.appendChild(svgEl("line", { x1: padL, y1: y, x2: padL + plotW, y2: y, stroke: BORDER, "stroke-dasharray": "3 3" }));
      const tx = svgEl("text", { x: padL - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: MUTED });
      tx.textContent = Math.round(val) + "%";
      svg.appendChild(tx);
    }
    // eixo X (meses)
    chartData.forEach((d, i) => {
      const tx = svgEl("text", { x: xOf(i), y: H - 8, "text-anchor": "middle", "font-size": 11, fill: MUTED });
      tx.textContent = d.mes;
      svg.appendChild(tx);
    });

    // linhas de referência (patamares + corte)
    const refs = tiers.map((t) => ({ key: t.key, value: t.value, color: LEVEL_COLOR[t.key], dash: t.key === "G3" ? "0" : "6 4", w: t.key === "G3" ? 2.5 : 1.5 }))
      .concat(cut != null ? [{ key: "G6", value: cut, color: DOWN, dash: "2 3", w: 1.5 }] : [])
      .filter((r) => r.value >= lo && r.value <= hi)
      .sort((a, b) => b.value - a.value);
    refs.forEach((r) => {
      const y = yOf(r.value);
      svg.appendChild(svgEl("line", { x1: padL, y1: y, x2: padL + plotW, y2: y, stroke: r.color, "stroke-width": r.w, "stroke-dasharray": r.dash === "0" ? "" : r.dash }));
    });

    // linha de resultado (conecta pontos não-nulos)
    const pts = chartData.map((d, i) => d.valor == null ? null : [xOf(i), yOf(d.valor)]);
    let dPath = "", started = false;
    pts.forEach((p) => { if (!p) return; dPath += (started ? " L" : "M") + p[0] + " " + p[1]; started = true; });
    if (dPath) svg.appendChild(svgEl("path", { d: dPath, fill: "none", stroke: ACCENT, "stroke-width": 2.75, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    pts.forEach((p) => { if (p) svg.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: 4, fill: ACCENT })); });

    root.appendChild(svg);

    // rótulos de patamar à direita, com anti-colisão (em pixels reais sobre a área renderizada)
    // Usamos posicionamento proporcional via padding-top relativo à altura renderizada.
    const labelBand = window.GOP.h("div.chart-labels", { style: { right: "0", width: padR + "px" } });
    const minGap = 18;
    const labelY = refs.map((r) => yOf(r.value));
    for (let i = 1; i < labelY.length; i++) if (labelY[i] - labelY[i-1] < minGap) labelY[i] = labelY[i-1] + minGap;
    for (let i = labelY.length - 1; i > 0; i--) { if (labelY[i] > padT + plotH) labelY[i] = padT + plotH; if (labelY[i] - labelY[i-1] < minGap) labelY[i-1] = labelY[i] - minGap; }
    refs.forEach((r, i) => {
      const pct = (labelY[i] / H) * 100;
      const lab = window.GOP.h("div.lab", { style: { top: "calc(" + pct + "% - 9px)", left: "8px" } },
        window.GOP.h("span", { style: { display: "inline-block", width: "10px", borderTop: "2px " + (r.dash === "0" ? "solid" : r.key === "G6" ? "dotted" : "dashed") + " " + r.color } }),
        window.GOP.h("span", { style: { fontSize: "10px", fontWeight: "700", padding: "1px 4px", borderRadius: "4px", background: r.key === "G6" ? "#FBE9E9" : (LEVEL_SOFT[r.key] || "#EEF1F4"), color: r.color } },
          (r.key === "G6" ? "Corte" : r.key) + " " + fmtPct(r.value))
      );
      labelBand.appendChild(lab);
    });
    root.appendChild(labelBand);
    return root;
  };
})();
