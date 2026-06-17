/* Ícones SVG (estilo lucide), sem dependências. window.icon(name, {size,color,cls}) -> SVGElement */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const P = (d) => ["path", { d }];
  const L = (x1, y1, x2, y2) => ["line", { x1, y1, x2, y2 }];
  const C = (cx, cy, r) => ["circle", { cx, cy, r }];
  const PL = (points) => ["polyline", { points }];
  const R = (x, y, w, h, rx) => ["rect", { x, y, width: w, height: h, rx }];

  const D = {
    LayoutDashboard: [R(3,3,7,9,1),R(14,3,7,5,1),R(14,12,7,9,1),R(3,16,7,5,1)],
    Upload: [P("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"),PL("17 8 12 3 7 8"),L(12,3,12,15)],
    Download: [P("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"),PL("7 10 12 15 17 10"),L(12,15,12,3)],
    Settings: [P("M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"),C(12,12,3)],
    Search: [C(11,11,8),L(21,21,16.65,16.65)],
    ChevronLeft: [PL("15 18 9 12 15 6")],
    ChevronRight: [PL("9 18 15 12 9 6")],
    TrendingUp: [PL("22 7 13.5 15.5 8.5 10.5 2 17"),PL("16 7 22 7 22 13")],
    TrendingDown: [PL("22 17 13.5 8.5 8.5 13.5 2 7"),PL("16 17 22 17 22 11")],
    Minus: [L(5,12,19,12)],
    Plus: [L(12,5,12,19),L(5,12,19,12)],
    Pencil: [P("M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"),L(15,5,19,9)],
    Trash2: [PL("3 6 5 6 21 6"),P("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),L(10,11,10,17),L(14,11,14,17)],
    Award: [C(12,8,6),PL("15.477 12.89 17 22 12 19 7 22 8.523 12.89")],
    FileSpreadsheet: [P("M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"),PL("14 2 14 8 20 8"),L(8,13,16,13),L(8,17,16,17),L(10,9,10,21)],
    AlertTriangle: [P("M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"),L(12,9,12,13),L(12,17,12.01,17)],
    Check: [PL("20 6 9 17 4 12")],
    X: [L(18,6,6,18),L(6,6,18,18)],
    Users: [P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"),C(9,7,4),P("M22 21v-2a4 4 0 0 0-3-3.87"),P("M16 3.13a4 4 0 0 1 0 7.75")],
    Target: [C(12,12,10),C(12,12,6),C(12,12,2)],
    History: [P("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"),PL("3 3 3 8 8 8"),PL("12 7 12 12 15 14")],
    UserCog: [C(9,7,4),P("M14 19a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"),C(19,11,2),P("M19 8v1"),P("M19 13v1"),P("M21.6 9.5l-.87.5"),P("M17.27 12l-.87.5"),P("M21.6 12.5l-.87-.5"),P("M17.27 11l-.87-.5")],
    CalendarDays: [R(3,4,18,18,2),L(16,2,16,6),L(8,2,8,6),L(3,10,21,10)],
    Save: [P("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"),PL("17 21 17 13 7 13 7 21"),PL("7 3 7 8 15 8")],
  };

  window.icon = function (name, opts) {
    opts = opts || {};
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", opts.size || 16);
    svg.setAttribute("height", opts.size || 16);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", opts.color || "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    if (opts.cls) svg.setAttribute("class", opts.cls);
    if (opts.style) svg.setAttribute("style", opts.style);
    (D[name] || []).forEach(([tag, attrs]) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      svg.appendChild(el);
    });
    return svg;
  };
})();
