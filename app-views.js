/* ============================================================================
   Painel GOP — views (parte 2). Usa window.GOP (core) e window.GopChart.
   ========================================================================== */
(function () {
  "use strict";
  const G = window.GOP;
  const { h, ic, clear, strip, ymLabel, ymLabelFull, fmtPct, fmtBRL, fmtPP,
          LEVEL_COLOR, LEVEL_SOFT, COL, MESES_FULL, APP_VERSION } = G;

  // estado de navegação
  let route = { view: "home" };          // home | collab | import | admin
  let selMonth = null;                    // mês de referência (compartilhado)
  let collabId = null;

  const app = document.getElementById("app");

  /* ---------- componentes utilitários ---------- */
  function ring(pct, size) {
    size = size || 64;
    const r = (size - 8) / 2, circ = 2 * Math.PI * r;
    const color = pct >= 70 ? COL.up : pct >= 40 ? COL.gold : COL.down;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", size); svg.setAttribute("height", size);
    const mk = (attrs) => { const c = document.createElementNS(NS, "circle"); for (const k in attrs) c.setAttribute(k, attrs[k]); return c; };
    svg.appendChild(mk({ cx:size/2, cy:size/2, r, fill:"none", stroke:"#EEF1F4", "stroke-width":7 }));
    svg.appendChild(mk({ cx:size/2, cy:size/2, r, fill:"none", stroke:color, "stroke-width":7, "stroke-linecap":"round",
      "stroke-dasharray": (pct/100*circ) + " " + circ, transform: "rotate(-90 " + size/2 + " " + size/2 + ")" }));
    return h("div.ring", { style: { width: size+"px", height: size+"px" } }, svg, h("div.lbl", null, Math.round(pct) + "%"));
  }
  function matBadge(mat, size) {
    size = size || 40;
    return h("div.matbadge.tnum", { style: { width: size+"px", height: size+"px", fontSize: (size*0.34)+"px" } }, mat);
  }
  function deltaTag(d) {
    if (d == null) return null;
    if (Math.abs(d) < 0.05) return h("span.delta", { style:{ background:"#EEF1F4", color:COL.flat } }, ic("Minus",{size:11}), "estável");
    const up = d > 0;
    return h("span.delta", { style:{ background: up?"#E5F4EA":"#FBE9E9", color: up?COL.up:COL.down } },
      ic(up?"TrendingUp":"TrendingDown",{size:11}), (up?"+":"") + fmtPP(d) + " pp");
  }
  function monthPicker(value, onChange) {
    const ms = G.months();
    if (!ms.length) return null;
    const last = ms[ms.length - 1], idx = ms.indexOf(value);
    const go = (d) => { const nx = idx + d; if (nx >= 0 && nx < ms.length) onChange(ms[nx]); };
    const sel = h("select.select", { style:{ width:"auto", fontWeight:"600" }, onchange:(e)=>onChange(e.target.value) },
      ms.map((ym)=> { const o=h("option",{value:ym}, ymLabelFull(ym) + (ym===last?" (último)":"")); if(ym===value)o.selected=true; return o; }));
    return h("div.row.center.gap2", null,
      ic("CalendarDays",{size:15,color:COL.muted}),
      h("button.iconbtn", { onclick:()=>go(-1), disabled: idx<=0, style:{border:"1px solid "+COL.border} }, ic("ChevronLeft",{size:15})),
      sel,
      h("button.iconbtn", { onclick:()=>go(1), disabled: idx>=ms.length-1, style:{border:"1px solid "+COL.border} }, ic("ChevronRight",{size:15})),
    );
  }

  /* ---------- modal genérico ---------- */
  let modalNode = null;
  function openModal(title, bodyBuilder, wide) {
    closeModal();
    const body = h("div.body");
    const ov = h("div.overlay", { onclick:(e)=>{ if(e.target===ov) closeModal(); } },
      h("div.modal" + (wide?".wide":""), null,
        h("div.head", null, h("div.t", null, title), h("button.iconbtn",{onclick:closeModal}, ic("X",{size:18,color:COL.muted}))),
        body));
    document.body.appendChild(ov);
    modalNode = ov;
    bodyBuilder(body, closeModal);
  }
  function closeModal(){ if (modalNode){ modalNode.remove(); modalNode=null; } }
  function confirmDialog(message, onYes) {
    openModal(onYes ? "Confirmar ação" : "Aviso", (body) => {
      body.appendChild(h("div", { style:{ fontSize:"14px", lineHeight:"1.5", marginBottom:"20px" } }, message));
      body.appendChild(h("div.row", { style:{ justifyContent:"flex-end", gap:"8px" } },
        onYes ? [
          h("button.btn.ghost",{onclick:closeModal},"Cancelar"),
          h("button.btn.danger",{onclick:()=>{ closeModal(); onYes(); }}, ic("Trash2",{size:14}), "Confirmar"),
        ] : h("button.btn.primary",{onclick:closeModal},"Entendi")));
    });
  }

  /* ============================ SIDEBAR ============================ */
  function buildSidebar() {
    const last = G.months()[G.months().length-1] || null;
    const nav = [["home","Visão geral","LayoutDashboard"],["import","Importar planilha","Upload"],["admin","Administração","Settings"]];
    const activeKey = route.view === "collab" ? "home" : route.view;
    const navBtns = nav.map(([k,label,icn]) => h("button" + (activeKey===k?".active":""), { onclick:()=>{ route={view:k}; rerender(); } }, ic(icn,{size:17}), label));

    const footStatus = h("div.row.center.gap2", { id:"footstatus", style:{marginTop:"8px"} });
    window.__renderFootStatus = () => {
      clear(footStatus);
      if (G.savingFlag) { footStatus.appendChild(ic("Save",{size:11})); footStatus.appendChild(document.createTextNode(" salvando…")); }
      else if (G.storageOk) { footStatus.appendChild(ic("Check",{size:11,color:COL.accent})); footStatus.appendChild(document.createTextNode(" dados salvos")); }
      else { footStatus.appendChild(ic("AlertTriangle",{size:11,color:"#E2B33C"})); footStatus.appendChild(document.createTextNode(" sem persistência")); }
    };

    const side = h("aside.sidebar", null,
      h("div.brand", null,
        h("div.logo", null, ic("Target",{size:18,color:"#fff"})),
        h("div", null, h("div.title",null,"GOP"), h("div.sub",null,"Gestão de Metas"))),
      h("nav.nav", null, navBtns),
      h("div.foot", null,
        last ? h("div",null,"Último mês lançado", h("br"), h("span",{style:{color:"#fff",fontWeight:"600"}}, ymLabelFull(last))) : "Nenhum mês importado",
        footStatus,
        h("div.ver", null, "Versão ", h("span",{style:{color:"#9FB8C4",fontWeight:"600"}}, APP_VERSION))));
    window.__renderFootStatus();
    return side;
  }
  function buildTopbar() {
    const nav = [["home","LayoutDashboard"],["import","Upload"],["admin","Settings"]];
    const activeKey = route.view === "collab" ? "home" : route.view;
    return h("div.topbar", null,
      h("div.brand", null, h("div.logo",null, ic("Target",{size:15,color:"#fff"})), h("span.title",null,"GOP"), h("span.ver",null,"v"+APP_VERSION)),
      h("div.tabs", null, nav.map(([k,icn])=> h("button"+(activeKey===k?".active":""),{onclick:()=>{route={view:k};rerender();}}, ic(icn,{size:18,color: activeKey===k?"#fff":"#9FB8C4"})))));
  }

  /* ============================ HOME ============================ */
  let homeState = { q:"", fSup:"", fProf:"" };
  function viewHome() {
    const ms = G.months(); const last = ms[ms.length-1] || null;
    const refMonth = (selMonth && G.DB.monthly[selMonth]) ? selMonth : last;

    const wrap = h("div");
    wrap.appendChild(h("div.row.between.wrap.gap3.mb4", { style:{alignItems:"flex-end"} },
      h("div", null,
        h("h1.page", null, "Acompanhamento de metas"),
        h("p.small.muted.mt1", null, refMonth ? ["Exibindo resultados de ", h("b",{style:{color:COL.ink}}, ymLabelFull(refMonth))] : "Importe a primeira planilha para começar.")),
      h("button.btn.primary", { onclick:()=>{ route={view:"import"}; rerender(); } }, ic("Upload",{size:15}), "Importar mês")));

    if (refMonth) {
      wrap.appendChild(h("div.card.pad-sm.mb3.row.between.center.wrap.gap2", null,
        h("div.semibold", null, "Mês de referência"),
        monthPicker(refMonth, (ym)=>{ selMonth=ym; rerender(); })));
    }

    // KPIs
    let kpiStats = null;
    if (refMonth) {
      let hit=0, counted=0, prem=0, withData=0;
      G.DB.collaborators.forEach((c)=>{
        const s = G.scoreFor(c, G.profById(c.perfilId), refMonth);
        const rec = G.DB.monthly[refMonth] && G.DB.monthly[refMonth].byMat[c.matricula];
        if (rec) withData++; if (rec && rec.premiacao) prem += rec.premiacao;
        if (s) { hit += s.hit; counted += s.counted; }
      });
      kpiStats = { atg: counted ? (hit/counted)*100 : 0, prem, withData };
    }
    const kpi = (lab, val, icn) => h("div.card.pad.kpi", null, h("div.lab",null, ic(icn,{size:13}), lab), h("div.val.tnum",null, val));
    wrap.appendChild(h("div.kpis.mb4", null,
      kpi("Colaboradores", String(G.DB.collaborators.length), "Users"),
      kpi(refMonth?("Com dados · "+ymLabel(refMonth)):"Com dados", kpiStats?(kpiStats.withData+"/"+G.DB.collaborators.length):"—", "CalendarDays"),
      kpi(refMonth?("Atingimento · "+ymLabel(refMonth)):"Atingimento", kpiStats?fmtPct(kpiStats.atg):"—", "Target"),
      kpi(refMonth?("Premiação · "+ymLabel(refMonth)):"Premiação", kpiStats?fmtBRL(kpiStats.prem):"—", "Award")));

    // filtros
    const search = h("div.search.flex1", null, h("span.ic",null, ic("Search",{size:15,color:COL.muted})),
      h("input.input",{ placeholder:"Buscar por matrícula…", value:homeState.q, oninput:(e)=>{ homeState.q=e.target.value.replace(/\D/g,""); renderList(); } }));
    const supSel = h("select.select",{ style:{maxWidth:"220px"}, onchange:(e)=>{ homeState.fSup=e.target.value; renderList(); } },
      h("option",{value:""},"Todos os supervisores"), G.DB.supervisors.map((s)=>h("option",{value:s.id}, s.name)), h("option",{value:"none"},"Sem supervisor definido"));
    supSel.value = homeState.fSup;
    const profSel = h("select.select",{ style:{maxWidth:"260px"}, onchange:(e)=>{ homeState.fProf=e.target.value; renderList(); } },
      h("option",{value:""},"Todos os perfis"), G.DB.profiles.map((p)=>h("option",{value:p.id}, p.name)));
    profSel.value = homeState.fProf;
    wrap.appendChild(h("div.card.pad-sm.mb3", null, h("div.row.wrap.gap2", { style:{flexWrap:"wrap"} }, search, supSel, profSel)));

    const listWrap = h("div");
    wrap.appendChild(listWrap);

    function renderList() {
      clear(listWrap);
      const t = strip(homeState.q);
      const list = G.DB.collaborators.filter((c)=>{
        if (t && c.matricula.indexOf(t) < 0) return false;
        if (homeState.fSup === "none" && c.supervisorId) return false;
        if (homeState.fSup && homeState.fSup !== "none" && c.supervisorId !== homeState.fSup) return false;
        if (homeState.fProf && c.perfilId !== homeState.fProf) return false;
        return true;
      }).sort((a,b)=> (+a.matricula) - (+b.matricula));

      if (!list.length) { listWrap.appendChild(h("div.card.pad",{style:{textAlign:"center",color:COL.muted,padding:"40px"}}, "Nenhum colaborador encontrado com os filtros atuais.")); return; }

      const grid = h("div.collab-grid");
      list.forEach((c)=>{
        const prof = G.profById(c.perfilId);
        const hasMonth = refMonth && G.DB.monthly[refMonth] && G.DB.monthly[refMonth].byMat[c.matricula];
        const s = hasMonth ? G.scoreFor(c, prof, refMonth) : null;
        const prem = hasMonth ? G.DB.monthly[refMonth].byMat[c.matricula].premiacao : null;
        const footer = h("div.row.between.center.gap2", { style:{ marginTop:"12px", paddingTop:"12px", borderTop:"1px dashed "+COL.border } },
          s ? h("div.row.center.gap2", null,
                h("div.bar",{style:{width:"80px"}}, h("div",{style:{width:s.pct+"%", background: s.pct>=70?COL.up:s.pct>=40?COL.gold:COL.down }})),
                h("span.small.semibold.tnum", null, s.hit+"/"+s.counted+" metas"))
            : h("span.small.muted", null, "Sem dados em " + (refMonth?ymLabel(refMonth):"—")),
          prem ? h("span.small.bold.tnum",{style:{color:COL.gold}}, fmtBRL(prem)) : null);
        grid.appendChild(h("button.collab-card", { onclick:()=>{ collabId=c.id; route={view:"collab"}; rerender(); } },
          h("div.row.gap3", { style:{alignItems:"flex-start"} },
            matBadge(c.matricula),
            h("div.flex1.minw0", null,
              h("div.row.between.center.gap2", null, h("div.bold.trunc",{style:{fontFamily:"var(--head)"}}, "Matrícula " + c.matricula), ic("ChevronRight",{size:15,color:COL.muted})),
              h("div.small.muted.mt1.trunc", null, prof ? prof.name : "Sem perfil"),
              h("div.xsmall.muted",{style:{marginTop:"4px"}}, c.supervisorId ? (G.supById(c.supervisorId)||{}).name : "Sem supervisor definido"))),
          footer));
      });
      listWrap.appendChild(grid);
    }
    renderList();
    return wrap;
  }

  // expõe parciais para a parte 3
  window.GOPV = {
    get route(){ return route; }, set route(v){ route=v; },
    get selMonth(){ return selMonth; }, set selMonth(v){ selMonth=v; },
    get collabId(){ return collabId; }, set collabId(v){ collabId=v; },
    h, ic, clear, ring, matBadge, deltaTag, monthPicker, openModal, closeModal, confirmDialog,
    buildSidebar, buildTopbar, viewHome,
  };
  function rerender(){ window.__rerender(); }
})();
