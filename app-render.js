/* ============================================================================
   Painel GOP — views (parte 3): Colaborador, Importação, Administração + boot.
   ========================================================================== */
(function () {
  "use strict";
  const G = window.GOP, V = window.GOPV;
  const { h, ic, clear, strip, ymLabel, ymLabelFull, fmtPct, fmtBRL, fmtPP,
          tiersOf, evalMeta, alvoOf, canonMeta, LEVEL_COLOR, LEVEL_SOFT, COL, MESES_FULL, META_ALIAS } = G;
  const { ring, matBadge, deltaTag, monthPicker, openModal, closeModal, confirmDialog } = V;

  let selMeta = null, showExtra = false;

  /* ============================ COLABORADOR ============================ */
  function viewCollab() {
    const c = G.DB.collaborators.find((x) => x.id === V.collabId);
    if (!c) return h("div", null, "Colaborador não encontrado. ", h("button.btn.sm",{onclick:()=>{V.route={view:"home"};window.__rerender();}},"Voltar"));
    const prof = G.profById(c.perfilId);
    const cms = G.collabMonths(c.matricula);
    const lastYm = cms[cms.length-1];
    const refYm = (V.selMonth && G.DB.monthly[V.selMonth]) ? V.selMonth : lastYm;
    const hasRef = refYm && G.DB.monthly[refYm] && G.DB.monthly[refYm].byMat[c.matricula];
    const score = hasRef ? G.scoreFor(c, prof, refYm) : null;
    const prem = hasRef ? G.DB.monthly[refYm].byMat[c.matricula].premiacao : null;
    const profMetas = prof ? Object.keys(prof.metas) : [];
    const extraMetas = (function(){ const set={}; cms.forEach((ym)=>Object.keys(G.DB.monthly[ym].byMat[c.matricula].valores).forEach((m)=>{set[m]=1;})); return Object.keys(set).filter((m)=>profMetas.indexOf(m)<0); })();

    const wrap = h("div");
    wrap.appendChild(h("button", { class:"row center gap2", style:{background:"none",border:"none",color:COL.accentInk,fontWeight:"500",marginBottom:"16px"}, onclick:()=>{ V.route={view:"home"}; selMeta=null; window.__rerender(); } }, ic("ChevronLeft",{size:16}), "Voltar para a lista"));

    // RESUMO
    const resumo = h("div.card.pad.mb4");
    resumo.appendChild(h("div.row.wrap.gap4.center", null,
      matBadge(c.matricula, 56),
      h("div.flex1.minw0", null,
        h("h2.page", null, "Matrícula " + c.matricula),
        h("div.row.wrap.small.muted.mt1",{style:{gap:"6px 20px"}},
          h("span",null,"Perfil ", h("b",{style:{color:COL.ink}}, prof?prof.name:"—")),
          h("span",null,"Supervisor ", h("b",{style:{color:COL.ink}}, c.supervisorId?(G.supById(c.supervisorId)||{}).name:"não definido")),
          h("span",null,"Último mês lançado ", h("b",{style:{color:COL.ink}}, lastYm?ymLabelFull(lastYm):"—")))),
      h("div.row.center.gap5", null,
        (prem != null && prem > 0) ? h("div.right", null,
          h("div.xsmall.semibold.cap",{style:{color:COL.gold}}, "Premiação " + ymLabel(refYm)),
          h("div.bold.tnum",{style:{color:COL.gold,fontSize:"18px",fontFamily:"var(--head)"}}, fmtBRL(prem))) : null,
        score ? h("div.row.center.gap2", null, ring(score.pct),
          h("div.xsmall.muted",{style:{lineHeight:"1.3"}}, h("b",{style:{color:COL.ink}}, score.hit+" de "+score.counted), " metas", h("br"), "atingidas em "+ymLabel(refYm))) : null)));

    if (G.months().length) {
      resumo.appendChild(h("div.dashed-top.row.between.center.wrap.gap2", null,
        h("div.semibold", null, "Mês de referência ", h("span.muted",{style:{fontWeight:"400"}}, "· define o resultado exibido")),
        monthPicker(refYm, (ym)=>{ V.selMonth=ym; window.__rerender(); })));
    }
    if (!hasRef && refYm) resumo.appendChild(h("div.small.mt2",{style:{color:COL.gold,display:"flex",gap:"6px",alignItems:"center"}}, ic("AlertTriangle",{size:13}), "Esta matrícula não possui dados em " + ymLabelFull(refYm) + ". O comparativo abaixo mostra os meses disponíveis."));
    // download PPT
    const pptBtn = h("button.btn.dark", { disabled: !cms.length, onclick:()=>doPpt() }, ic("Download",{size:15}), "Baixar apresentação (PPT)");
    const pptErr = h("div.small.mt2.hidden",{style:{color:COL.down,display:"flex",gap:"6px",alignItems:"center"}}, ic("AlertTriangle",{size:13}), "Não foi possível gerar o arquivo.");
    resumo.appendChild(h("div.dashed-top.row.between.center.wrap.gap2", null,
      h("div.small.muted", null, "Gere uma apresentação (.pptx) com a evolução mês a mês e os resultados de " + (refYm?ymLabelFull(refYm):"—") + "."),
      pptBtn));
    resumo.appendChild(pptErr);
    function doPpt(){
      pptErr.classList.add("hidden");
      try {
        clear(pptBtn); pptBtn.appendChild(ic("Save",{size:15,cls:"spin"})); pptBtn.appendChild(document.createTextNode(" Gerando…")); pptBtn.disabled=true;
        window.GopPpt.gerar({ db:G.DB, c, prof, refYm, score, prem, profMetas, cms, supName: c.supervisorId?(G.supById(c.supervisorId)||{}).name:"não definido" });
      } catch(e){ console.error(e); pptErr.classList.remove("hidden"); }
      finally { setTimeout(()=>{ clear(pptBtn); pptBtn.appendChild(ic("Download",{size:15})); pptBtn.appendChild(document.createTextNode(" Baixar apresentação (PPT)")); pptBtn.disabled = !cms.length; }, 600); }
    }
    wrap.appendChild(resumo);

    // ---- análise do mês ----
    let analysis = null;
    if (hasRef && profMetas.length) {
      const recRef = G.DB.monthly[refYm].byMat[c.matricula];
      const items = profMetas.map((m)=>{ const cfg=prof.metas[m]; const e=evalMeta(cfg, recRef.valores[m]); const ganho = e.next ? ((e.next.prem||0)-(e.prem||0)) : 0; return Object.assign({meta:m,cfg,ganho}, e); });
      const comDados = items.filter((it)=>it.value!=null);
      const batendo = comDados.filter((it)=>it.hitG3);
      const naoBatendo = comDados.filter((it)=>!it.hitG3);
      const abaixoCorte = comDados.filter((it)=>it.belowCut);
      const semDados = items.filter((it)=>it.value==null);
      const rank = (it)=> it.belowCut?0 : !it.hitG3?1 : 2;
      const prioridade = comDados.filter((it)=>it.next||it.belowCut).map((it)=>Object.assign({score:(it.ganho||1)/Math.max(it.gap||0.5,0.5)},it))
        .sort((a,b)=>{ const ra=rank(a),rb=rank(b); if(ra!==rb)return ra-rb; if(ra===0)return (b.gapCut||0)-(a.gapCut||0); return b.score-a.score; });
      const foraItems = (showExtra?extraMetas:[]).map((m)=>({meta:m,value:recRef.valores[m]!=null?recRef.valores[m]:null})).filter((it)=>it.value!=null);
      analysis = { batendo, naoBatendo, abaixoCorte, semDados, prioridade, foraItems };
    }

    if (analysis) wrap.appendChild(buildDetailing(c, refYm, score, analysis, extraMetas, prof));

    // ---- detalhe da meta selecionada ----
    if (selMeta && prof && prof.metas[selMeta]) {
      const valor = hasRef ? G.DB.monthly[refYm].byMat[c.matricula].valores[selMeta] : null;
      const chartData = cms.map((ym)=>({ mes: ymLabel(ym), valor: G.DB.monthly[ym].byMat[c.matricula].valores[selMeta] != null ? G.DB.monthly[ym].byMat[c.matricula].valores[selMeta] : null }));
      wrap.appendChild(buildMetaDetail(selMeta, prof.metas[selMeta], valor, refYm, chartData));
    }

    // ---- comparativo mês a mês ----
    wrap.appendChild(buildComparativo(c, prof, profMetas, extraMetas, cms));
    return wrap;
  }

  function buildDetailing(c, refYm, score, A, extraMetas, prof) {
    const card = h("div.card.pad.mb4");
    const head = h("div.row.between.wrap.gap2.mb3", null,
      h("div", null, h("div.bold",{style:{fontFamily:"var(--head)"}}, "Detalhamento de " + ymLabelFull(refYm)),
        h("div.xsmall.muted.mt1", null, "Situação por meta, premiação e onde focar. Clique numa meta para ver os patamares.")),
      h("div.row.center.gap3", null,
        extraMetas.length ? h("label.row.center.gap2.small.muted",{style:{cursor:"pointer"}},
          (function(){ const cb=h("input",{type:"checkbox",onchange:(e)=>{showExtra=e.target.checked;window.__rerender();}}); if(showExtra)cb.checked=true; return cb; })(),
          "indicadores fora do perfil ("+extraMetas.length+")") : null,
        score ? h("div.row.center.gap2.small", null, [["G1",score.g1],["G2",score.g2],["G3",score.g3],["G4",score.g4]].map(([k,nn])=>
          h("span.pill",{style:{background:LEVEL_SOFT[k],color:LEVEL_COLOR[k]}}, k+" ", h("b",{class:"tnum"},nn)))) : null));
    card.appendChild(head);

    if (A.abaixoCorte.length) {
      card.appendChild(h("div.alert.err.mb3", null, ic("AlertTriangle",{size:16}),
        h("span", null, h("b",null, A.abaixoCorte.length + " meta(s) abaixo da linha de corte"), " — atenção máxima: " + A.abaixoCorte.map((it)=> it.meta+" ("+fmtPct(it.value)+" < corte "+fmtPct(it.cut)+")").join(", ") + ".")));
    }
    if (score) {
      const ganhoTotal = A.prioridade.reduce((s,it)=>s+(it.ganho||0),0);
      card.appendChild(h("div.row.wrap.center.mb3",{style:{gap:"8px 24px",padding:"12px",borderRadius:"12px",background:"#FBF2DE"}},
        h("div", null, h("div.xsmall.semibold.cap",{style:{color:COL.gold}}, "Premiação estimada no mês"),
          h("div.bold.tnum",{style:{color:COL.gold,fontSize:"20px",fontFamily:"var(--head)"}}, fmtBRL(score.prem))),
        h("div.small",{style:{color:COL.ink}}, score.hit + " de " + score.counted + " metas no nível Meta (G3) ou acima" + (ganhoTotal>0 ? "" : ""),
          ganhoTotal>0 ? [" · até ", h("b",{style:{color:COL.gold}}, fmtBRL(ganhoTotal)), " a mais alcançando o próximo nível de cada meta"] : null)));
    }

    if (A.prioridade.length) {
      const pr = h("div.mb4", null, h("div.xsmall.semibold.cap.mb2.row.center.gap2",{style:{color:COL.muted}}, ic("Award",{size:13,color:COL.down}), "Prioridades — abaixo do corte primeiro, depois maior retorno por esforço"));
      const grid = h("div.priorities");
      A.prioridade.slice(0,3).forEach((it,i)=>{
        const crit = it.belowCut;
        grid.appendChild(h("button.prio",{ style:{ border:"1px solid "+(crit?COL.down:i===0?COL.gold:COL.border), background: crit?"#FBE9E9":i===0?"#FBF2DE":"#fff" }, onclick:()=>{ selMeta = selMeta===it.meta?null:it.meta; window.__rerender(); } },
          h("div.row.between.center.gap2", null, h("span.bold",{style:{fontFamily:"var(--head)"}}, it.meta),
            crit ? h("span.pill",{style:{background:COL.down,color:"#fff"}},"ABAIXO DO CORTE") : h("span.pill",{style:{background:"#EEF1F4",color:COL.muted}},"#"+(i+1))),
          h("div.small.muted.mt1", null, "Atual ", h("b",{class:"tnum",style:{color:COL.ink}}, fmtPct(it.value)),
            crit ? [" · ", h("b",{class:"tnum",style:{color:COL.down}}, fmtPP(it.gapCut)+" pp"), " abaixo do corte ("+fmtPct(it.cut)+")"]
                 : it.next ? [" · faltam ", h("b",{class:"tnum",style:{color:it.hitG3?COL.accentInk:COL.down}}, fmtPP(it.gap)+" pp"), " p/ "+it.next.key] : null),
          (it.next && it.ganho>0) ? h("div.small.semibold.mt1",{style:{color:COL.gold}}, "+"+fmtBRL(it.ganho)+" ao atingir "+it.next.label) : null));
      });
      pr.appendChild(grid);
      card.appendChild(pr);
    }

    function metaRow(it) {
      const col = it.hitG3 ? (it.level==="G1"?LEVEL_COLOR.G1:it.level==="G2"?LEVEL_COLOR.G2:LEVEL_COLOR.G3) : COL.down;
      return h("button.metarow",{ style:{ border:"1px solid "+(selMeta===it.meta?COL.accent:it.belowCut?COL.down:COL.border), background: selMeta===it.meta?"#E1F1EE":it.belowCut?"#FBE9E9":"#fff" }, onclick:()=>{ selMeta=selMeta===it.meta?null:it.meta; window.__rerender(); } },
        h("div.row.between.center.gap2", null, h("span.semibold.trunc", null, it.meta),
          h("span.row.center.gap2", null,
            it.belowCut ? h("span.pill",{style:{background:COL.down,color:"#fff"}},"CORTE") : null,
            it.level ? h("span.pill",{style:{background:LEVEL_SOFT[it.level],color:LEVEL_COLOR[it.level]}}, it.level) : null,
            h("span.bold.tnum",{style:{color:col}}, fmtPct(it.value)))),
        h("div.xsmall.muted.row.between.center.gap2",{style:{marginTop:"2px"}},
          h("span", null, it.belowCut ? h("span",{style:{color:COL.down,fontWeight:"600"}}, "Abaixo do corte ("+fmtPct(it.cut)+")") : (it.levelLabel?("Nível: "+it.levelLabel):"Abaixo da meta"), it.prem>0?(" · "+fmtBRL(it.prem)):""),
          it.next ? h("span", null, "faltam ", h("b",{style:{color:it.hitG3?COL.accentInk:COL.down}}, fmtPP(it.gap)+" pp"), " p/ "+it.next.key) : null));
    }
    card.appendChild(h("div.two-col", null,
      h("div", null, h("div.xsmall.semibold.cap.mb2.row.center.gap2",{style:{color:COL.up}}, ic("Check",{size:13}), "Batendo a meta ("+A.batendo.length+")"),
        h("div.col.gap2", null, A.batendo.length ? A.batendo.map(metaRow) : h("div.xsmall.muted",{style:{padding:"8px 0"}}, "Nenhuma meta atingida neste mês."))),
      h("div", null, h("div.xsmall.semibold.cap.mb2.row.center.gap2",{style:{color:COL.down}}, ic("X",{size:13}), "Abaixo da meta ("+A.naoBatendo.length+")"),
        h("div.col.gap2", null, A.naoBatendo.length ? A.naoBatendo.map(metaRow) : h("div.xsmall.muted",{style:{padding:"8px 0"}}, "Todas as metas com dados foram atingidas.")))));

    if (A.semDados.length) card.appendChild(h("div.xsmall.muted.dashed-top", null, "Sem dados em " + ymLabel(refYm) + ": " + A.semDados.map((it)=>it.meta).join(", ") + "."));
    if (showExtra && A.foraItems.length) {
      card.appendChild(h("div.dashed-top", null,
        h("div.xsmall.semibold.cap.mb2",{style:{color:COL.muted}}, "Indicadores fora do perfil ", h("span",{style:{textTransform:"none",fontWeight:"400"}}, "· não exigidos, apenas informativo")),
        h("div.row.wrap.gap2", null, A.foraItems.map((it)=> h("span",{class:"tnum",style:{fontSize:"12px",padding:"4px 10px",borderRadius:"999px",background:"#EEF1F4",color:COL.muted}}, it.meta+" ", h("b",{style:{color:COL.ink}}, fmtPct(it.value)))))));
    }
    return card;
  }

  function buildMetaDetail(meta, cfg, valor, refYm, chartData) {
    const e = evalMeta(cfg, valor);
    const tiers = tiersOf(cfg);
    const card = h("div.card.pad.mb4");
    card.appendChild(h("div.row.between.center", null,
      h("div.bold.row.center.gap2",{style:{fontFamily:"var(--head)"}}, ic("Award",{size:16,color:COL.gold}), "Patamares · " + meta),
      h("button",{class:"small row center gap2",style:{background:"none",border:"none",color:COL.muted},onclick:()=>{selMeta=null;window.__rerender();}}, ic("X",{size:13}), "fechar")));
    card.appendChild(h("div.small.muted.mb3.mt1", null,
      "Resultado em " + ymLabelFull(refYm) + ": ", h("b",{class:"tnum",style:{color:COL.ink}}, fmtPct(valor)),
      e.level ? [" · nível atual ", h("b",{style:{color:LEVEL_COLOR[e.level]}}, e.level+" ("+e.levelLabel+")")] : [" · ", h("b",{style:{color:COL.down}}, "abaixo da meta")],
      e.belowCut ? [" · ", h("b",{style:{color:COL.down}}, "⚠ abaixo da linha de corte ("+fmtPct(e.cut)+") — prioridade máxima")] : null));

    const tg = h("div.tier-grid.mb2");
    tiers.forEach((t)=>{
      const reached = valor != null && valor >= t.value;
      const gap = valor != null ? Math.round((t.value - valor)*100)/100 : null;
      tg.appendChild(h("div.tier",{style:{ border:"1px solid "+(reached?LEVEL_COLOR[t.key]:COL.border), background: reached?LEVEL_SOFT[t.key]:"#fff" }},
        h("div.row.between.center", null, h("span.xsmall.bold",{style:{color:LEVEL_COLOR[t.key]}}, t.key+" · "+t.label), reached?ic("Check",{size:14,color:LEVEL_COLOR[t.key]}):null),
        h("div.bold.tnum.mt1",{style:{fontSize:"18px",fontFamily:"var(--head)"}}, fmtPct(t.value)),
        h("div.xsmall.muted",{style:{marginTop:"2px"}}, (t.prem!=null?fmtBRL(t.prem):"—"),
          valor!=null ? (reached ? [" · ", h("span",{style:{color:LEVEL_COLOR[t.key]}}, "atingido")] : [" · faltam ", h("b",{style:{color:COL.down}}, fmtPP(gap)+" pp")]) : null)));
    });
    card.appendChild(tg);

    // legenda + gráfico
    const legend = h("div.legend.mt3", null,
      h("span", null, h("span.ln",{style:{height:"2px",background:COL.accent,display:"inline-block"}}), "Resultado"),
      tiers.map((t)=> h("span", null, h("span.ln",{style:{borderTop:"2px "+(t.key==="G3"?"solid":"dashed")+" "+LEVEL_COLOR[t.key]}}), t.key+" "+t.label+(t.key==="G3"?" (destaque)":""))),
      e.cut!=null ? h("span", null, h("span.ln",{style:{borderTop:"2px dotted "+COL.down}}), "Corte G6") : null);
    card.appendChild(legend);
    card.appendChild(window.GopChart(chartData, tiers, e.cut));
    return card;
  }

  function buildComparativo(c, prof, profMetas, extraMetas, cms) {
    const rows = showExtra ? profMetas.concat(extraMetas) : profMetas;
    const card = h("div.card.mb4",{style:{overflow:"hidden"}});
    card.appendChild(h("div.row.between.wrap.gap2",{style:{padding:"16px 20px 12px"}},
      h("div", null, h("div.bold",{style:{fontFamily:"var(--head)"}}, "Comparativo mês a mês"),
        h("div.xsmall.muted.mt1", null, "Clique num indicador para ver os patamares e o gráfico. Verde = meta (G3) atingida.")),
      extraMetas.length ? h("label.row.center.gap2.xsmall.muted",{style:{cursor:"pointer"}},
        (function(){ const cb=h("input",{type:"checkbox",onchange:(e)=>{showExtra=e.target.checked;window.__rerender();}}); if(showExtra)cb.checked=true; return cb; })(),
        "mostrar indicadores fora do perfil ("+extraMetas.length+")") : null));
    if (!cms.length) { card.appendChild(h("div.small.muted",{style:{padding:"0 20px 24px"}}, "Nenhum dado importado para este colaborador ainda.")); return card; }
    if (!rows.length) { card.appendChild(h("div.small.muted",{style:{padding:"0 20px 24px"}}, "O perfil deste colaborador não possui metas configuradas.")); return card; }

    const thead = h("tr", null, h("th",null,"Indicador"), h("th",{style:{textAlign:"right"}},"Alvo (G3)"), cms.map((ym)=>h("th",{style:{textAlign:"right"}}, ymLabel(ym))));
    const tbody = h("tbody");
    rows.forEach((m)=>{
      const isExtra = profMetas.indexOf(m) < 0;
      const cfg = prof ? prof.metas[m] : null;
      const alvo = alvoOf(cfg);
      const sel = selMeta === m;
      const tr = h("tr.clickable",{ style:{ background: sel?"#E1F1EE":"transparent" }, onclick:()=>{ selMeta=sel?null:m; window.__rerender(); } });
      tr.appendChild(h("td.semibold", null, h("span.row.center.gap2",{style:{display:"inline-flex"}}, h("span",{style:{width:"6px",height:"6px",borderRadius:"50%",background:sel?COL.accent:COL.flat,display:"inline-block"}}), m,
        isExtra ? h("span.pill",{style:{background:"#EEF1F4",color:COL.muted}},"fora do perfil") : null)));
      tr.appendChild(h("td.right.tnum.muted", null, alvo!=null?fmtPct(alvo):"—"));
      cms.forEach((ym,i)=>{
        const v = G.DB.monthly[ym].byMat[c.matricula].valores[m];
        let prev = null; for (let j=i-1;j>=0;j--){ const pv=G.DB.monthly[cms[j]].byMat[c.matricula].valores[m]; if(pv!=null){prev=pv;break;} }
        const d = (v!=null && prev!=null) ? v-prev : null;
        const ok = (v!=null && alvo!=null) ? v>=alvo : null;
        tr.appendChild(h("td.right",{style:{ background: ok===true?"#F0F8F4":ok===false?"#FCF1F0":"transparent" }},
          h("div.bold.tnum",{style:{color: ok===false?COL.down:COL.ink}}, fmtPct(v)),
          h("div",{style:{marginTop:"2px",display:"flex",justifyContent:"flex-end"}}, deltaTag(d))));
      });
      tbody.appendChild(tr);
    });
    card.appendChild(h("div.table-wrap", null, h("table.table", null, h("thead",null,thead), tbody)));
    return card;
  }

  /* ============================ IMPORTAÇÃO ============================ */
  let imp = { mes:new Date().getMonth()+1, ano:new Date().getFullYear(), file:null, parsed:null, err:null, createMap:{}, done:null };
  function viewImport() {
    const wrap = h("div",{style:{maxWidth:"760px"}});
    wrap.appendChild(h("h1.page.mb2", null, "Importar planilha mensal"));
    wrap.appendChild(h("p.small.muted.mb4", null, "Selecione o mês/ano de referência e envie o arquivo .xlsx. Cada linha é vinculada ao colaborador pela matrícula."));
    const ym = imp.ano + "-" + String(imp.mes).padStart(2,"0");
    const exists = !!G.DB.monthly[ym];

    const card = h("div.card.pad.mb3");
    const mesSel = h("select.select", { onchange:(e)=>{ imp.mes=+e.target.value; window.__rerender(); } }, MESES_FULL.map((mm,i)=>h("option",{value:i+1}, mm)));
    mesSel.value = imp.mes;
    const anoSel = h("select.select", { onchange:(e)=>{ imp.ano=+e.target.value; window.__rerender(); } },
      (function(){ const y=new Date().getFullYear(); const arr=[]; for(let k=y-3;k<=y+3;k++)arr.push(k); return arr.map((yy)=>h("option",{value:yy},yy)); })());
    anoSel.value = imp.ano;
    card.appendChild(h("div.grid.mb3",{style:{gridTemplateColumns:"1fr 1fr"}},
      h("div",null,h("div.label",null,"Mês"),mesSel), h("div",null,h("div.label",null,"Ano"),anoSel)));
    if (exists) card.appendChild(h("div.alert.warn.mb3", null, ic("AlertTriangle",{size:16}),
      h("span", null, h("b",null,ymLabelFull(ym)), " já possui dados (" + Object.keys(G.DB.monthly[ym].byMat).length + " colaboradores). Importar de novo ", h("b",null,"sobrescreve"), " o mês.")));

    const fileInput = h("input",{type:"file",accept:".xlsx",style:{display:"none"},onchange:(e)=>{ if(e.target.files[0]) handleFile(e.target.files[0]); }});
    const drop = h("label.drop" + (imp.file?".active":""), null,
      ic("FileSpreadsheet",{size:26,color:imp.file?COL.accentInk:COL.muted}),
      h("div.semibold", null, imp.file?imp.file.name:"Clique para selecionar o arquivo .xlsx"),
      h("div.xsmall.muted", null, "Formato esperado: colunas Agente, Perfil, Matricula e indicadores"),
      fileInput);
    card.appendChild(drop);
    if (imp.err) card.appendChild(h("div.alert.err.mt3", null, ic("AlertTriangle",{size:16}), imp.err));
    if (imp.done) card.appendChild(h("div.alert.ok.mt3", null, ic("Check",{size:16}), h("span",null, imp.done+" ", h("a",{href:"#",style:{fontWeight:"600",color:"inherit"},onclick:(e)=>{e.preventDefault();route_home();}}, "Ver painel"))));
    wrap.appendChild(card);

    function route_home(){ V.route={view:"home"}; window.__rerender(); }

    async function handleFile(f){
      imp.file=f; imp.err=null; imp.parsed=null; imp.done=null; window.__rerender();
      try {
        const buf = await f.arrayBuffer();
        const grid = await window.XlsxReader.readFirstSheet(buf);
        let hIdx=-1;
        for (let i=0;i<Math.min(grid.length,15);i++){ if ((grid[i]||[]).some((cell)=>strip(cell)==="matricula")) { hIdx=i; break; } }
        if (hIdx<0) throw new Error("Não encontrei a coluna “Matricula”. Verifique se o arquivo segue o modelo de exportação.");
        const header = grid[hIdx];
        const col = { mat:-1, agente:-1, perfil:-1, prem:-1, metas:{} };
        header.forEach((hh,i)=>{ const s=strip(hh);
          if (s==="matricula") col.mat=i; else if (["agente","nome","colaborador"].indexOf(s)>=0) col.agente=i;
          else if (s.indexOf("perfil")>=0) col.perfil=i; else if (s.indexOf("premiac")>=0) col.prem=i;
          else { const cm=canonMeta(hh); if(cm)col.metas[i]=cm; } });
        const rows=[];
        for (let i=hIdx+1;i<grid.length;i++){
          const r=grid[i]||[]; const rawMat=r[col.mat]; const agente=col.agente>=0?String(r[col.agente]||"").trim():"";
          if (strip(agente)==="total") continue;
          if (rawMat==null||String(rawMat).trim()==="") continue;
          const mat=String(parseInt(rawMat,10)); if(!/^\d+$/.test(mat))continue;
          const valores={};
          Object.keys(col.metas).forEach((i2)=>{ let v=r[i2]; const mName=col.metas[i2];
            if (v==null||v==="") return; if (typeof v==="string") v=parseFloat(v.replace("%","").replace(",","."));
            if (isNaN(v)) return; if (v<=1.5) v=v*100; v=Number(v.toPrecision(12)); valores[mName]=v; });
          let prem = col.prem>=0?r[col.prem]:null; if (typeof prem==="string") prem=parseFloat(prem.replace(/[R$\s.]/g,"").replace(",",".")); if (prem!=null&&isNaN(prem))prem=null;
          const perfilRaw = col.perfil>=0?String(r[col.perfil]||"").trim():"";
          rows.push({ mat, perfilRaw, valores, premiacao:prem });
        }
        if (!rows.length) throw new Error("Nenhuma linha de colaborador válida encontrada.");
        const matSet={}; G.DB.collaborators.forEach((c)=>{matSet[c.matricula]=1;});
        const unknown = rows.filter((r)=>!matSet[r.mat]);
        imp.createMap={}; unknown.forEach((u)=>{ imp.createMap[u.mat]=true; });
        imp.parsed={ rows, unknown }; window.__rerender();
      } catch(e){ imp.err = e.message || String(e); window.__rerender(); }
    }

    if (imp.parsed) {
      const matSet={}; G.DB.collaborators.forEach((c)=>{matSet[c.matricula]=1;});
      const knownCount = imp.parsed.rows.length - imp.parsed.unknown.length;
      const willCreate = imp.parsed.unknown.filter((u)=>imp.createMap[u.mat]).length;
      const pcard = h("div.card.pad");
      pcard.appendChild(h("div.bold.mb3",{style:{fontFamily:"var(--head)"}}, "Pré-visualização da importação"));
      const stat=(lab,val)=>h("div",{style:{borderRadius:"12px",padding:"10px 12px",background:"#F7F9FA",border:"1px solid "+COL.border}}, h("div.xsmall.semibold.cap",{style:{color:COL.muted}},lab), h("div.bold.tnum",{style:{fontSize:"18px",fontFamily:"var(--head)"}},val));
      pcard.appendChild(h("div.grid.mb3",{style:{gridTemplateColumns:"repeat(3,1fr)"}}, stat("Linhas lidas",imp.parsed.rows.length), stat("Matrículas reconhecidas",knownCount), stat("Não cadastradas",imp.parsed.unknown.length)));
      if (imp.parsed.unknown.length) {
        const box = h("div.mb3", null, h("div.small.semibold.mb2.row.center.gap2", null, ic("AlertTriangle",{size:14,color:COL.gold}), "Colaboradores não cadastrados"),
          h("div.xsmall.muted.mb2", null, "Marque para criar automaticamente (usa o perfil indicado na planilha quando existir). Desmarcados são ignorados."));
        const lst = h("div.col.gap2",{style:{maxHeight:"220px",overflowY:"auto"}});
        imp.parsed.unknown.forEach((u)=>{
          const cb=h("input",{type:"checkbox",onchange:(e)=>{ imp.createMap[u.mat]=e.target.checked; }}); if(imp.createMap[u.mat])cb.checked=true;
          lst.appendChild(h("label.row.center.gap2.small",{style:{border:"1px solid "+COL.border,borderRadius:"8px",padding:"8px 12px",cursor:"pointer"}},
            cb, h("span.semibold.tnum",null,"Matrícula "+u.mat), h("span.flex1.trunc.xsmall.muted",null, u.perfilRaw?("perfil: "+u.perfilRaw):"perfil: Outros")));
        });
        box.appendChild(lst); pcard.appendChild(box);
      }
      pcard.appendChild(h("div.row.between.center.wrap.gap3", null,
        h("div.xsmall.muted", null, "Serão lançados ", h("b",{style:{color:COL.ink}}, String(knownCount+willCreate)), " colaboradores em ", h("b",{style:{color:COL.ink}}, ymLabelFull(ym)), willCreate?(" ("+willCreate+" novos)"):""),
        h("button.btn.primary",{onclick:confirmImport}, ic("Upload",{size:15}), "Importar planilha")));
      wrap.appendChild(pcard);

      function confirmImport(){
        G.update((d)=>{
          const pByName={}; d.profiles.forEach((p)=>{pByName[strip(p.name)]=p;});
          let outros = d.profiles.find((p)=>strip(p.name)==="outros");
          const byMat={};
          imp.parsed.rows.forEach((r)=>{
            const known = d.collaborators.find((c)=>c.matricula===r.mat);
            if (!known){ if(!imp.createMap[r.mat])return;
              let pid = r.perfilRaw && pByName[strip(r.perfilRaw)] ? pByName[strip(r.perfilRaw)].id : null;
              if (!pid){ if(!outros){ outros={id:"p_"+G.uid(),name:"Outros",metas:{}}; d.profiles.push(outros); } pid=outros.id; }
              d.collaborators.push({ id:"c_"+G.uid(), matricula:r.mat, perfilId:pid, supervisorId:null });
            }
            byMat[r.mat]={ valores:r.valores, premiacao:r.premiacao };
          });
          d.monthly[ym]={ byMat, importedAt:new Date().toISOString(), arquivo:imp.file.name };
        });
        const total = imp.parsed.rows.filter((r)=>matSet[r.mat]||imp.createMap[r.mat]).length;
        imp.done = "Importação concluída: " + total + " colaborador(es) lançado(s) em " + ymLabelFull(ym) + ".";
        imp.parsed=null; imp.file=null; window.__rerender();
      }
    }
    return wrap;
  }

  /* ============================ ADMIN ============================ */
  let adminTab = "collabs";
  function viewAdmin() {
    const wrap = h("div");
    wrap.appendChild(h("h1.page.mb3", null, "Administração"));
    const tabs = [["collabs","Colaboradores","Users"],["sups","Supervisores","UserCog"],["profiles","Perfis de metas","Target"],["history","Histórico de importações","History"]];
    wrap.appendChild(h("div.tabs2", null, tabs.map(([k,label,icn])=> h("button"+(adminTab===k?".active":""),{onclick:()=>{adminTab=k;window.__rerender();}}, ic(icn,{size:15}), label))));
    if (adminTab==="collabs") wrap.appendChild(adminCollabs());
    else if (adminTab==="sups") wrap.appendChild(adminSups());
    else if (adminTab==="profiles") wrap.appendChild(adminProfiles());
    else wrap.appendChild(adminHistory());
    return wrap;
  }

  let admQ = "";
  function adminCollabs() {
    const card = h("div.card",{style:{overflow:"hidden"}});
    const searchInp = h("input.input",{placeholder:"Buscar por matrícula…",value:admQ,oninput:(e)=>{admQ=e.target.value.replace(/\D/g,"");renderRows();}});
    card.appendChild(h("div.row.between.wrap.gap3",{style:{padding:"16px 20px",borderBottom:"1px solid "+COL.border}},
      h("div.search.flex1",{style:{maxWidth:"360px"}}, h("span.ic",null,ic("Search",{size:15,color:COL.muted})), searchInp),
      h("button.btn.primary",{onclick:()=>collabForm(null)}, ic("Plus",{size:15}), "Adicionar colaborador")));
    const tbody = h("tbody");
    const wrapTbl = h("div.table-wrap", null, h("table.table", null,
      h("thead",null,h("tr",null,h("th",null,"Matrícula"),h("th",null,"Perfil"),h("th",null,"Supervisor"),h("th",{style:{textAlign:"right"}},""))), tbody));
    card.appendChild(wrapTbl);
    function renderRows(){
      clear(tbody);
      const list = G.DB.collaborators.filter((c)=>{ const t=strip(admQ); return !t||c.matricula.indexOf(t)>=0; }).sort((a,b)=>(+a.matricula)-(+b.matricula));
      list.forEach((c)=>{
        tbody.appendChild(h("tr", null,
          h("td.semibold.tnum", null, h("button",{style:{background:"none",border:"none",color:COL.accentInk,cursor:"pointer",textDecoration:"underline"},onclick:()=>{V.collabId=c.id;V.route={view:"collab"};window.__rerender();}}, c.matricula)),
          h("td", null, (G.profById(c.perfilId)||{}).name || h("span.muted",null,"—")),
          h("td", null, c.supervisorId ? (G.supById(c.supervisorId)||{}).name : h("span.muted",null,"não definido")),
          h("td.right",null,
            h("button.iconbtn",{onclick:()=>collabForm(c)}, ic("Pencil",{size:15,color:COL.muted})),
            h("button.iconbtn",{onclick:()=>confirmDialog("Excluir a matrícula "+c.matricula+"? Os dados mensais importados permanecem no histórico, mas o colaborador sai do painel.", ()=>G.update((d)=>{ d.collaborators=d.collaborators.filter((x)=>x.id!==c.id); }))}, ic("Trash2",{size:15,color:COL.down})))));
      });
    }
    renderRows();
    return card;
  }
  function collabForm(initial) {
    initial = initial || {};
    const isNew = !initial.id;
    openModal(isNew?"Adicionar colaborador":"Editar colaborador", (body)=>{
      let mat=initial.matricula||"", perfilId=initial.perfilId||"", supId=initial.supervisorId||"";
      const err=h("div.small",{style:{color:COL.down}});
      const matIn=h("input.input",{value:mat,placeholder:"000",oninput:(e)=>{ e.target.value=e.target.value.replace(/\D/g,"").slice(0,3); mat=e.target.value; }});
      const pSel=h("select.select",{onchange:(e)=>perfilId=e.target.value}, h("option",{value:""},"— sem perfil —"), G.DB.profiles.map((p)=>h("option",{value:p.id},p.name))); pSel.value=perfilId;
      const sSel=h("select.select",{onchange:(e)=>supId=e.target.value}, h("option",{value:""},"— não definido —"), G.DB.supervisors.map((s)=>h("option",{value:s.id},s.name))); sSel.value=supId;
      body.appendChild(h("div.col.gap3", null,
        h("div",null,h("div.label",null,"Matrícula (3 dígitos)"),matIn),
        h("div",null,h("div.label",null,"Perfil de metas"),pSel),
        h("div",null,h("div.label",null,"Supervisor"),sSel), err,
        h("div.row",{style:{justifyContent:"flex-end",gap:"8px"}},
          h("button.btn.ghost",{onclick:closeModal},"Cancelar"),
          h("button.btn.primary",{onclick:()=>{ const m=mat.trim();
            if(!/^\d{1,3}$/.test(m)){err.textContent="A matrícula deve ter até 3 dígitos numéricos.";return;}
            if(G.DB.collaborators.some((c)=>c.matricula===m&&c.id!==initial.id)){err.textContent="A matrícula "+m+" já está em uso.";return;}
            G.update((d)=>{ if(isNew)d.collaborators.push({id:"c_"+G.uid(),matricula:m,perfilId:perfilId||null,supervisorId:supId||null});
              else{ const c=d.collaborators.find((x)=>x.id===initial.id); c.matricula=m;c.perfilId=perfilId||null;c.supervisorId=supId||null; } });
            closeModal(); }}, ic("Check",{size:15}),"Salvar"))));
    });
  }

  function adminSups() {
    const wrap=h("div");
    wrap.appendChild(h("div.row",{style:{justifyContent:"flex-end",marginBottom:"16px"}}, h("button.btn.primary",{onclick:()=>supForm(null)}, ic("Plus",{size:15}),"Cadastrar supervisor")));
    const groups = G.DB.supervisors.map((s)=>({sup:s,members:G.DB.collaborators.filter((c)=>c.supervisorId===s.id)}))
      .concat([{sup:null,members:G.DB.collaborators.filter((c)=>!c.supervisorId)}]);
    const grid=h("div.sup-grid");
    groups.forEach(({sup,members})=>{
      const card=h("div.card.pad-sm");
      card.appendChild(h("div.row.between.center.mb3", null,
        h("div.bold.row.center.gap2",{style:{fontFamily:"var(--head)"}}, ic("UserCog",{size:16,color:sup?COL.accentInk:COL.muted}), sup?sup.name:"Sem supervisor definido",
          h("span.pill.tnum",{style:{background:"#EEF1F4",color:COL.muted}}, members.length)),
        sup ? h("div.row.gap2", null, h("button.iconbtn",{onclick:()=>supForm(sup)},ic("Pencil",{size:14,color:COL.muted})),
          h("button.iconbtn",{onclick:()=>confirmDialog('Excluir o supervisor "'+sup.name+'"? A equipe ficará sem supervisor.', ()=>G.update((d)=>{ d.supervisors=d.supervisors.filter((x)=>x.id!==sup.id); d.collaborators.forEach((c)=>{if(c.supervisorId===sup.id)c.supervisorId=null;}); }))},ic("Trash2",{size:14,color:COL.down}))) : null));
      if (!members.length) card.appendChild(h("div.small.muted",{style:{padding:"12px 0"}}, "Nenhum colaborador "+(sup?"nesta equipe":"pendente")+"."));
      else {
        const lst=h("div.col.gap2");
        members.sort((a,b)=>(+a.matricula)-(+b.matricula)).forEach((c)=>{
          const moveSel=h("select.select",{style:{width:"150px",padding:"4px 8px",fontSize:"12px"},onchange:(e)=>{ const v=e.target.value; G.update((d)=>{ d.collaborators.find((x)=>x.id===c.id).supervisorId=v||null; }); }},
            h("option",{value:""},"mover para…"), G.DB.supervisors.map((s)=>h("option",{value:s.id},s.name)));
          lst.appendChild(h("div.row.center.gap2",{style:{border:"1px solid "+COL.border,borderRadius:"8px",padding:"8px 12px"}},
            matBadge(c.matricula,28), h("div.flex1.minw0", null, h("div.small.semibold.trunc",null,"Matrícula "+c.matricula),
              h("div.xsmall.muted.trunc",null,(G.profById(c.perfilId)||{}).name||"sem perfil")), moveSel));
        });
        card.appendChild(lst);
      }
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }
  function supForm(sup) {
    openModal(sup?"Editar supervisor":"Cadastrar supervisor",(body)=>{
      let name=sup?sup.name:"";
      const inp=h("input.input",{value:name,placeholder:"Ex.: Ana Souza",oninput:(e)=>name=e.target.value});
      body.appendChild(h("div.col.gap3", null, h("div",null,h("div.label",null,"Nome do supervisor"),inp),
        h("div.row",{style:{justifyContent:"flex-end",gap:"8px"}}, h("button.btn.ghost",{onclick:closeModal},"Cancelar"),
          h("button.btn.primary",{onclick:()=>{ if(!name.trim())return; G.update((d)=>{ if(sup)d.supervisors.find((x)=>x.id===sup.id).name=name.trim(); else d.supervisors.push({id:"s_"+G.uid(),name:name.trim()}); }); closeModal(); }}, ic("Check",{size:15}),"Salvar"))));
    });
  }

  function adminProfiles() {
    const usage={}; G.DB.collaborators.forEach((c)=>{ if(c.perfilId)usage[c.perfilId]=(usage[c.perfilId]||0)+1; });
    const wrap=h("div");
    wrap.appendChild(h("div.row",{style:{justifyContent:"flex-end",marginBottom:"16px"}}, h("button.btn.primary",{onclick:()=>profileForm(null)}, ic("Plus",{size:15}),"Adicionar perfil")));
    const grid=h("div.grid",{style:{gridTemplateColumns:"repeat(2,1fr)"}});
    G.DB.profiles.forEach((p)=>{
      const metas=Object.keys(p.metas);
      const card=h("div.card.pad-sm");
      card.appendChild(h("div.row.between.mb2",{style:{alignItems:"flex-start"}},
        h("div",null,h("div.bold",{style:{fontFamily:"var(--head)"}},p.name), h("div.xsmall.muted.mt1",null,metas.length+" meta(s) · "+(usage[p.id]||0)+" colaborador(es)")),
        h("div.row.gap2",null,h("button.iconbtn",{onclick:()=>profileForm(p)},ic("Pencil",{size:14,color:COL.muted})),
          h("button.iconbtn",{onclick:()=>{ if(usage[p.id]){confirmDialog('O perfil "'+p.name+'" está em uso por '+usage[p.id]+' colaborador(es). Reatribua-os antes de excluir.',null);return;} confirmDialog('Excluir o perfil "'+p.name+'"?', ()=>G.update((d)=>{ d.profiles=d.profiles.filter((x)=>x.id!==p.id); })); }},ic("Trash2",{size:14,color:COL.down})))));
      const chips=h("div.row.wrap.gap2");
      if (metas.length) metas.forEach((m)=>{ const cfg=p.metas[m]; chips.appendChild(h("span.chip",null, m+" ",
        h("span",{style:{opacity:"0.7"}}, (cfg.g4!=null?("G4 "+fmtPct(cfg.g4)+" · "):"")+"G3 "+fmtPct(cfg.g3)+(cfg.g2!=null?(" · G2 "+fmtPct(cfg.g2)):"")+(cfg.g1!=null?(" · G1 "+fmtPct(cfg.g1)):"")))); });
      else chips.appendChild(h("span.xsmall.muted",null,"Nenhuma meta configurada."));
      card.appendChild(chips);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }
  function profileForm(initial) {
    initial = initial || {};
    const isNew=!initial.id;
    openModal(isNew?"Adicionar perfil":"Editar perfil",(body)=>{
      let name=initial.name||"";
      const metas={};
      G.META_ALIAS; // noop
      window.META_CANON.forEach((mn)=>{ const ex=initial.metas&&initial.metas[mn]; const def=window.META_TIERS_DEFAULT[mn]||{g3:90,g2:95,g1:100};
        metas[mn]={ on:!!ex, g6:ex&&ex.g6!=null?ex.g6:(def.g6!=null?def.g6:""), g4:ex&&ex.g4!=null?ex.g4:(def.g4!=null?def.g4:""),
          g3:ex&&ex.g3!=null?ex.g3:(ex&&ex.alvo!=null?ex.alvo:def.g3), g2:ex&&ex.g2!=null?ex.g2:(def.g2!=null?def.g2:""), g1:ex&&ex.g1!=null?ex.g1:(def.g1!=null?def.g1:""),
          valG4:ex&&ex.valG4!=null?ex.valG4:"", valG3:ex&&ex.valG3!=null?ex.valG3:"", valG2:ex&&ex.valG2!=null?ex.valG2:"", valG1:ex&&ex.valG1!=null?ex.valG1:"" }; });
      const err=h("div.small",{style:{color:COL.down}});
      const nameIn=h("input.input",{value:name,placeholder:"Ex.: Analistas Noturno",oninput:(e)=>name=e.target.value});
      const list=h("div.col.gap2");
      const numOrNull=(v)=> v===""||v==null?null:Number(v);
      const numCls={width:"56px",borderRadius:"6px",padding:"4px 6px",fontSize:"12px",textAlign:"right",border:"1px solid "+COL.border,outline:"none"};
      window.META_CANON.forEach((mn)=>{
        const x=metas[mn];
        const tiersWrap=h("div.grid.mt2",{style:{gridTemplateColumns:"repeat(4,1fr)",gap:"8px",display:x.on?"grid":"none"}});
        [["G4","g4","valG4",LEVEL_COLOR.G4],["G3","g3","valG3",COL.gold],["G2","g2","valG2",COL.accent],["G1","g1","valG1",COL.up]].forEach(([lab,kP,kV,clr])=>{
          const pIn=h("input",{type:"number",min:"0",max:"100",step:"0.5",value:x[kP],placeholder:"%",style:numCls,oninput:(e)=>x[kP]=e.target.value});
          const vIn=h("input",{type:"number",min:"0",step:"0.5",value:x[kV],placeholder:"—",style:numCls,oninput:(e)=>x[kV]=e.target.value});
          tiersWrap.appendChild(h("div",{style:{borderRadius:"6px",padding:"6px 8px",background:"#fff",border:"1px solid "+COL.border}},
            h("div.xsmall.bold",{style:{color:clr,marginBottom:"4px"}}, lab+(lab==="G4"?" (abaixo)":"")),
            h("div.row.center.gap2",null,pIn,h("span.xsmall.muted",null,"%")),
            h("div.row.center.gap2",{style:{marginTop:"4px"}},h("span.xsmall.muted",null,"R$"),vIn)));
        });
        const cutIn=h("input",{type:"number",min:"0",max:"100",step:"0.5",value:x.g6,placeholder:"—",style:Object.assign({},numCls,{border:"1px solid #D2434355"}),oninput:(e)=>x.g6=e.target.value});
        const cutWrap=h("span.row.center.gap2.xsmall",{style:{color:COL.down,display:x.on?"flex":"none"}}, "Corte", cutIn, h("span.muted",null,"%"));
        const cb=h("input",{type:"checkbox",onchange:(e)=>{ x.on=e.target.checked; tiersWrap.style.display=x.on?"grid":"none"; cutWrap.style.display=x.on?"flex":"none"; rowEl.style.borderColor=x.on?COL.accent:COL.border; rowEl.style.background=x.on?"#E1F1EE":"#fff"; }});
        if (x.on) cb.checked=true;
        const rowEl=h("div",{style:{borderRadius:"8px",padding:"8px 12px",border:"1px solid "+(x.on?COL.accent:COL.border),background:x.on?"#E1F1EE":"#fff"}},
          h("label.row.center.gap2",{style:{cursor:"pointer"}}, cb, h("span.flex1.small.semibold",null,mn), cutWrap), tiersWrap);
        list.appendChild(rowEl);
      });
      body.appendChild(h("div.col.gap4", null,
        h("div",null,h("div.label",null,"Nome do perfil"),nameIn),
        h("div",null,h("div.label",null,"Metas, patamares (%) e premiação (R$)"),
          h("div.xsmall.muted.mb2",null,"Corte (G6) = mínimo · G4 = abaixo da meta (premiado) · G3 = Meta · G2 = Superação · G1 = Alta Performance."), list),
        err,
        h("div.row",{style:{justifyContent:"flex-end",gap:"8px"}}, h("button.btn.ghost",{onclick:closeModal},"Cancelar"),
          h("button.btn.primary",{onclick:()=>{
            if(!name.trim()){err.textContent="Informe o nome do perfil.";return;}
            if(G.DB.profiles.some((p)=>strip(p.name)===strip(name)&&p.id!==initial.id)){err.textContent="Já existe um perfil com este nome.";return;}
            const out={};
            window.META_CANON.forEach((mn)=>{ const x=metas[mn]; if(!x.on)return;
              out[mn]={ g6:numOrNull(x.g6), g4:numOrNull(x.g4), g3:Number(x.g3)||0, g2:numOrNull(x.g2), g1:numOrNull(x.g1),
                valG4:numOrNull(x.valG4), valG3:numOrNull(x.valG3), valG2:numOrNull(x.valG2), valG1:numOrNull(x.valG1),
                peso: initial.metas&&initial.metas[mn]?initial.metas[mn].peso:null }; });
            G.update((d)=>{ if(isNew)d.profiles.push({id:"p_"+G.uid(),name:name.trim(),metas:out});
              else{ const p=d.profiles.find((x)=>x.id===initial.id); p.name=name.trim(); p.metas=out; } });
            closeModal();
          }}, ic("Check",{size:15}),"Salvar perfil"))));
    }, true);
  }

  function adminHistory() {
    const ms = G.months();
    if (!ms.length) return h("div.card.pad",{style:{textAlign:"center",color:COL.muted,padding:"40px"}}, "Nenhum mês importado ainda. Use a aba Importar planilha.");
    const tbody=h("tbody");
    ms.slice().reverse().forEach((ym)=>{
      const m=G.DB.monthly[ym];
      tbody.appendChild(h("tr",null,
        h("td.bold",{style:{fontFamily:"var(--head)"}},ymLabelFull(ym)),
        h("td.tnum",null,String(Object.keys(m.byMat).length)),
        h("td.xsmall.muted",null,m.arquivo||"—"),
        h("td.xsmall.muted.tnum",null,m.importedAt?new Date(m.importedAt).toLocaleString("pt-BR"):"—"),
        h("td.right",null,h("button.iconbtn",{onclick:()=>confirmDialog("Excluir todos os dados de "+ymLabelFull(ym)+"? Esta ação não pode ser desfeita.", ()=>G.update((d)=>{ delete d.monthly[ym]; }))},ic("Trash2",{size:15,color:COL.down})))));
    });
    const card=h("div.card",{style:{overflow:"hidden"}});
    card.appendChild(h("div.table-wrap",null,h("table.table",null,
      h("thead",null,h("tr",null,h("th",null,"Competência"),h("th",null,"Colaboradores"),h("th",null,"Arquivo"),h("th",null,"Importado em"),h("th",{style:{textAlign:"right"}},""))),tbody)));
    card.appendChild(h("div.xsmall.muted",{style:{padding:"12px 20px",borderTop:"1px solid "+COL.border}}, "Para sobrescrever um mês, importe uma nova planilha com a mesma competência."));
    return card;
  }

  /* ============================ BOOT / RENDER ============================ */
  function render() {
    const app = document.getElementById("app");
    clear(app);
    app.appendChild(V.buildSidebar());
    app.appendChild(V.buildTopbar());
    const main = h("main.main");
    const v = V.route.view;
    if (v==="home") main.appendChild(V.viewHome());
    else if (v==="collab") main.appendChild(viewCollab());
    else if (v==="import") main.appendChild(viewImport());
    else if (v==="admin") main.appendChild(viewAdmin());
    app.appendChild(main);
  }
  window.__rerender = render;

  // migração leve (caso haja dados antigos salvos sem g4/g6) — reaproveita defaults
  function migrate() {
    const d = G.DB; const v = d.version || 1;
    if (v < 5) {
      (d.profiles||[]).forEach((p)=>{ const ref=window.SEED_PROFILES[p.name]||{};
        Object.keys(p.metas||{}).forEach((m)=>{ const cfg=p.metas[m];
          if (cfg.g6==null) cfg.g6 = ref[m]?ref[m].g6:(window.META_TIERS_DEFAULT[m]?window.META_TIERS_DEFAULT[m].g6:null);
          if (cfg.g4==null) cfg.g4 = ref[m]?ref[m].g4:(window.META_TIERS_DEFAULT[m]?window.META_TIERS_DEFAULT[m].g4:null);
          if (cfg.g3==null && cfg.alvo!=null) cfg.g3=cfg.alvo;
          if (cfg.valG4==null) cfg.valG4 = ref[m]?ref[m].valG4:(cfg.valG3!=null?Math.round(cfg.valG3*50)/100:null);
        }); });
      (d.collaborators||[]).forEach((c)=>{ delete c.nome; });
      d.version=5; G.saveDB();
    }
  }

  // inicializar
  G.loadDB();
  migrate();
  const ms = G.months();
  V.selMonth = ms.length ? ms[ms.length-1] : null;
  const boot = document.getElementById("boot"); if (boot) boot.remove();
  render();
})();
