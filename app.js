/* =========================================================================
   app.js — Painel GOP. Orquestra estado (localStorage), navegação e telas.
   Depende de: xlsx.js (lerXlsx), regras.js (GOP_REGRAS), pptx.js (gerarPptx).
   ========================================================================= */
(function () {
  "use strict";

  const VERSAO = "v1.0.0";
  const CHAVE = "gop:data";
  const R = window.GOP_REGRAS;
  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // ---- Estado / persistência --------------------------------------------
  // Estrutura:
  // { perfis:{nome:{meta:regra}}, supervisores:[{id,nome}],
  //   colaboradores:{mat:{matricula,perfil,supervisor}},
  //   monthly:{ "AAAA-MM": {byMat:{mat:{valores,premiacao}}, importedAt, arquivo} } }
  let estado = null;

  function estadoVazio() {
    return { perfis: {}, supervisores: [], colaboradores: {}, monthly: {} };
  }
  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      estado = bruto ? JSON.parse(bruto) : estadoVazio();
    } catch (e) { estado = estadoVazio(); }
    // Garante chaves.
    if (!estado.perfis) estado.perfis = {};
    if (!estado.supervisores) estado.supervisores = [];
    if (!estado.colaboradores) estado.colaboradores = {};
    if (!estado.monthly) estado.monthly = {};
  }
  function salvar() { localStorage.setItem(CHAVE, JSON.stringify(estado)); }

  // Carrega perfis-semente do perfis_regras.json se ainda não houver perfis.
  // (busca o arquivo na mesma pasta; se a rede bloquear, segue sem semente.)
  async function semearPerfis() {
    if (Object.keys(estado.perfis).length > 0) return;
    try {
      const resp = await fetch("perfis_regras.json");
      if (resp.ok) {
        const dados = await resp.json();
        estado.perfis = dados;
        salvar();
      }
    } catch (e) { /* sem semente; usuário pode criar em Administração */ }
  }

  // ---- Helpers de formatação --------------------------------------------
  function fmtPct(v) {
    if (v == null || v === "") return "—";
    return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + "%";
  }
  function fmtMoeda(v) {
    if (v == null) return "—";
    return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function nomeMes(comp) { // "2026-06" -> "Junho/2026"
    const [a, m] = comp.split("-");
    return MESES[parseInt(m, 10) - 1] + "/" + a;
  }
  function mesesOrdenados() { return Object.keys(estado.monthly).sort(); }

  // ---- Acesso a dados derivados -----------------------------------------
  function perfilDoColab(mat) {
    const c = estado.colaboradores[mat];
    return c ? c.perfil : null;
  }
  function regrasDoColab(mat) {
    const p = perfilDoColab(mat);
    return p && estado.perfis[p] ? estado.perfis[p] : {};
  }
  function valoresNoMes(mat, comp) {
    const m = estado.monthly[comp];
    if (!m || !m.byMat[mat]) return null;
    return m.byMat[mat].valores || {};
  }
  // Avaliação completa de um colab num mês (usa regras do perfil atual).
  function avaliarNoMes(mat, comp) {
    const regras = regrasDoColab(mat);
    const valores = valoresNoMes(mat, comp) || {};
    return R.avaliarColaborador(regras, valores);
  }

  // ---- DOM utils ---------------------------------------------------------
  const $ = sel => document.querySelector(sel);
  const conteudo = () => $("#conteudo");
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function limpar(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  function toast(msg, tipo) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast" + (tipo ? " " + tipo : "");
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 3200);
  }

  function abrirModal(htmlOuNode) {
    const c = $("#modalConteudo");
    limpar(c);
    if (typeof htmlOuNode === "string") c.innerHTML = htmlOuNode;
    else c.appendChild(htmlOuNode);
    $("#modal").hidden = false;
  }
  function fecharModal() { $("#modal").hidden = true; limpar($("#modalConteudo")); }

  // ---- Estado de navegação ----------------------------------------------
  let telaAtual = "visao";
  let mesRef = null;           // competência selecionada (compartilhada)
  let matAberta = null;        // colaborador em foco (tela do colab)
  let mostrarFora = false;     // checkbox "indicadores fora do perfil"

  function mesPadrao() {
    const ms = mesesOrdenados();
    return ms.length ? ms[ms.length - 1] : null;
  }
  function garantirMes() {
    const ms = mesesOrdenados();
    if (!mesRef || !estado.monthly[mesRef]) mesRef = mesPadrao();
  }

  // ---- Componente: seletor de mês ---------------------------------------
  function seletorMes(aoMudar) {
    const ms = mesesOrdenados();
    const wrap = el(`<div class="seletor-mes"></div>`);
    const ant = el(`<button class="seta-mes" aria-label="Mês anterior">‹</button>`);
    const sel = el(`<select aria-label="Mês de referência"></select>`);
    const prox = el(`<button class="seta-mes" aria-label="Próximo mês">›</button>`);
    if (!ms.length) {
      sel.innerHTML = `<option>Nenhum mês importado</option>`;
      sel.disabled = ant.disabled = prox.disabled = true;
    } else {
      ms.forEach(c => {
        const o = document.createElement("option");
        o.value = c; o.textContent = nomeMes(c);
        if (c === mesRef) o.selected = true;
        sel.appendChild(o);
      });
      const idx = ms.indexOf(mesRef);
      ant.disabled = idx <= 0;
      prox.disabled = idx >= ms.length - 1;
      sel.addEventListener("change", () => { mesRef = sel.value; aoMudar(); });
      ant.addEventListener("click", () => { const i = ms.indexOf(mesRef); if (i > 0) { mesRef = ms[i - 1]; aoMudar(); } });
      prox.addEventListener("click", () => { const i = ms.indexOf(mesRef); if (i < ms.length - 1) { mesRef = ms[i + 1]; aoMudar(); } });
    }
    wrap.append(ant, sel, prox);
    return wrap;
  }

  /* =======================================================================
     TELA 1 — VISÃO GERAL
     ======================================================================= */
  function telaVisao() {
    garantirMes();
    const raiz = conteudo();
    limpar(raiz);

    const cab = el(`<div class="cabecalho-tela"><div><h1>Visão geral</h1>
      <div class="subtitulo">Acompanhamento mensal de metas e premiação</div></div></div>`);
    cab.appendChild(seletorMes(() => telaVisao()));
    raiz.appendChild(cab);

    if (!mesRef) {
      raiz.appendChild(el(`<div class="painel"><div class="vazio">
        Nenhum mês importado ainda. Vá em <strong>Importar planilha</strong> para começar.</div></div>`));
      return;
    }

    // Reúne colaboradores que têm dados no mês ou estão cadastrados.
    const mats = Object.keys(estado.colaboradores);
    const comDados = mats.filter(m => valoresNoMes(m, mesRef));
    let somaPrem = 0, somaAting = 0, somaTotal = 0;
    const avaliacoes = {};
    comDados.forEach(m => {
      const a = avaliarNoMes(m, mesRef);
      avaliacoes[m] = a;
      somaPrem += a.premiacao;
      somaAting += a.atingidas; somaTotal += a.totalMetas;
    });
    const pctMedio = somaTotal ? (somaAting / somaTotal * 100) : 0;

    const kpis = el(`<div class="kpis">
      <div class="kpi"><div class="kpi-rotulo">Colaboradores cadastrados</div><div class="kpi-valor">${mats.length}</div></div>
      <div class="kpi"><div class="kpi-rotulo">Com dados no mês</div><div class="kpi-valor">${comDados.length}</div></div>
      <div class="kpi"><div class="kpi-rotulo">Atingimento médio</div><div class="kpi-valor teal">${fmtPct(pctMedio)}</div></div>
      <div class="kpi"><div class="kpi-rotulo">Soma de premiação</div><div class="kpi-valor">${fmtMoeda(somaPrem)}</div></div>
    </div>`);
    raiz.appendChild(kpis);

    // Filtros.
    const supOpts = `<option value="">Todos supervisores</option>` +
      estado.supervisores.map(s => `<option value="${escAttr(s.id)}">${esc(s.nome)}</option>`).join("");
    const perfOpts = `<option value="">Todos perfis</option>` +
      Object.keys(estado.perfis).map(p => `<option value="${escAttr(p)}">${esc(p)}</option>`).join("");
    const filtros = el(`<div class="filtros">
      <input type="text" id="fBusca" placeholder="Buscar matrícula…">
      <select id="fSup">${supOpts}</select>
      <select id="fPerf">${perfOpts}</select>
    </div>`);
    raiz.appendChild(filtros);

    const grade = el(`<div class="grade-cards" id="grade"></div>`);
    raiz.appendChild(grade);

    function render() {
      limpar(grade);
      const busca = $("#fBusca").value.trim();
      const fSup = $("#fSup").value;
      const fPerf = $("#fPerf").value;
      let lista = comDados.slice();
      if (busca) lista = lista.filter(m => m.includes(busca));
      if (fSup) lista = lista.filter(m => (estado.colaboradores[m].supervisor || "") === fSup);
      if (fPerf) lista = lista.filter(m => perfilDoColab(m) === fPerf);
      lista.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      if (!lista.length) { grade.appendChild(el(`<div class="vazio" style="grid-column:1/-1">Nenhum colaborador encontrado para os filtros.</div>`)); return; }

      lista.forEach(m => {
        const c = estado.colaboradores[m];
        const a = avaliacoes[m];
        const sup = supNome(c.supervisor);
        const pct = a.totalMetas ? (a.atingidas / a.totalMetas * 100) : 0;
        const card = el(`<button class="card-colab${a.temAbaixoCorte ? " alerta" : ""}">
          <div class="card-topo"><span class="card-mat">${esc(m)}</span><span class="card-prem">${fmtMoeda(a.premiacao)}</span></div>
          <div class="card-meta-info">${esc(c.perfil || "—")} · ${esc(sup || "Sem supervisor")}</div>
          <div class="barra"><span style="width:${pct.toFixed(1)}%"></span></div>
          <div class="barra-rotulo"><span>${a.atingidas}/${a.totalMetas} metas batidas</span>${a.temAbaixoCorte ? '<span style="color:var(--vermelho)">⚠ corte</span>' : ""}</div>
        </button>`);
        card.addEventListener("click", () => { matAberta = m; irPara("colab"); });
        grade.appendChild(card);
      });
    }
    ["fBusca", "fSup", "fPerf"].forEach(id => $("#" + id).addEventListener("input", render));
    render();
  }

  function supNome(id) {
    const s = estado.supervisores.find(x => x.id === id);
    return s ? s.nome : "";
  }

  /* =======================================================================
     TELA 2 — COLABORADOR
     ======================================================================= */
  function telaColab() {
    garantirMes();
    const raiz = conteudo();
    limpar(raiz);
    const mat = matAberta;
    const c = estado.colaboradores[mat];

    const voltar = el(`<button class="voltar">‹ Voltar à visão geral</button>`);
    voltar.addEventListener("click", () => irPara("visao"));
    raiz.appendChild(voltar);

    if (!c) { raiz.appendChild(el(`<div class="painel"><div class="vazio">Colaborador não encontrado.</div></div>`)); return; }

    const a = mesRef ? avaliarNoMes(mat, mesRef) : R.avaliarColaborador(regrasDoColab(mat), {});
    const ultimoMes = ultimoMesComDados(mat);
    const pct = a.totalMetas ? (a.atingidas / a.totalMetas * 100) : 0;

    // Cabeçalho com donut.
    const cab = el(`<div class="painel"><div class="cabecalho-tela" style="margin-bottom:16px">
        <div class="colab-cabecalho">
          <div class="donut-wrap">${donutSVG(pct, a.temAbaixoCorte)}</div>
          <div class="colab-dados">
            <div class="colab-mat">${esc(mat)}</div>
            <div class="colab-linha">${esc(c.perfil || "—")} · ${esc(supNome(c.supervisor) || "Sem supervisor")}</div>
            <div class="colab-linha">Último mês lançado: ${ultimoMes ? esc(nomeMes(ultimoMes)) : "—"}</div>
            <div class="colab-prem">${fmtMoeda(a.premiacao)}</div>
          </div>
        </div>
      </div></div>`);
    const segWrap = el(`<div class="linha-acoes" style="margin-top:6px"></div>`);
    segWrap.appendChild(seletorMes(() => telaColab()));
    const btnPpt = el(`<button class="btn secundario btn-pequeno">Baixar apresentação (PPT)</button>`);
    btnPpt.addEventListener("click", () => baixarPptx(mat));
    segWrap.appendChild(btnPpt);
    cab.querySelector(".cabecalho-tela").appendChild(segWrap);
    raiz.appendChild(cab);

    if (!mesRef) { raiz.appendChild(el(`<div class="painel"><div class="vazio">Nenhum mês importado.</div></div>`)); return; }
    if (!valoresNoMes(mat, mesRef)) {
      raiz.appendChild(el(`<div class="painel"><div class="vazio">Sem dados deste colaborador em ${esc(nomeMes(mesRef))}.</div></div>`));
    }

    // Alerta de corte.
    if (a.temAbaixoCorte) {
      const cortes = a.metas.filter(x => x.abaixoCorte).map(x => x.meta);
      raiz.appendChild(el(`<div class="alerta-corte">⚠ Atenção: ${cortes.length} meta(s) abaixo do corte — ${esc(cortes.join(", "))}. Situação crítica, sem premiação nessas metas.</div>`));
    }

    // Distribuição por nível + ganho potencial.
    const dist = { g1: 0, g2: 0, g3: 0, g4: 0 };
    a.metas.forEach(m => { if (m.nivel) dist[m.nivel]++; });
    const ganhoPot = a.metas.reduce((s, m) => s + (m.proximo ? m.proximo.ganho : 0), 0);
    const painelDist = el(`<div class="painel">
      <h2>Detalhamento — ${esc(nomeMes(mesRef))}</h2>
      <div class="dist-niveis">
        <div class="dist-item g1"><div class="n">${dist.g1}</div><div class="r">G1 · Alta perf.</div></div>
        <div class="dist-item g2"><div class="n">${dist.g2}</div><div class="r">G2 · Superação</div></div>
        <div class="dist-item g3"><div class="n">${dist.g3}</div><div class="r">G3 · Meta</div></div>
        <div class="dist-item g4"><div class="n">${dist.g4}</div><div class="r">G4 · Abaixo</div></div>
      </div>
      <p style="margin:14px 0 0;color:var(--cinza);font-size:14px">Premiação estimada do mês: <strong style="color:var(--teal)">${fmtMoeda(a.premiacao)}</strong>${ganhoPot > 0 ? ` · Pode ganhar até <strong>${fmtMoeda(ganhoPot)}</strong> a mais subindo de nível.` : ""}</p>
    </div>`);
    raiz.appendChild(painelDist);

    // Prioridades (até 3).
    const prios = R.calcularPrioridades(a.metas, 3);
    if (prios.length) {
      const cards = prios.map(p => {
        const tipo = p.abaixoCorte ? "corte" : (!p.atingiu ? "meta" : "subir");
        const tag = p.abaixoCorte ? "Abaixo do corte" : (!p.atingiu ? "Abaixo da meta" : "Subir de nível");
        return `<div class="prio-card ${tipo}">
          <div class="tag">${tag}</div>
          <div class="nome">${esc(p.meta)}</div>
          <div class="det">Falta ${fmtPct(p.proximo.gap)} para ${R.ROTULO_NIVEL[p.proximo.nivel]}</div>
          <div class="ganho">+${fmtMoeda(p.proximo.ganho)}</div>
        </div>`;
      }).join("");
      raiz.appendChild(el(`<div class="painel"><h2>Onde focar</h2><div class="prioridades">${cards}</div></div>`));
    }

    // Duas colunas: batendo / abaixo.
    const batendo = a.metas.filter(m => m.atingiu);
    const abaixo = a.metas.filter(m => !m.atingiu);
    const colBat = batendo.length ? batendo.map(m => linhaMeta(m, mat)).join("") : `<div class="vazio">Nenhuma meta batida ainda.</div>`;
    const colAb = abaixo.length ? abaixo.map(m => linhaMeta(m, mat)).join("") : `<div class="vazio">Todas as metas batidas! 🎉</div>`;
    const painelCols = el(`<div class="painel"><h2>Indicadores do mês</h2>
      <div class="duas-colunas">
        <div><h3>Batendo a meta (${batendo.length})</h3><div class="lista-metas" data-col="bat">${colBat}</div></div>
        <div><h3>Abaixo da meta (${abaixo.length})</h3><div class="lista-metas" data-col="ab">${colAb}</div></div>
      </div></div>`);
    raiz.appendChild(painelCols);
    painelCols.querySelectorAll(".meta-linha").forEach(n => {
      n.addEventListener("click", () => abrirDetalheMeta(mat, n.dataset.meta));
    });

    // Indicadores fora do perfil (checkbox).
    const foraPainel = el(`<div class="painel">
      <label class="linha-check"><input type="checkbox" id="chkFora" ${mostrarFora ? "checked" : ""}> Mostrar indicadores fora do perfil (informativos)</label>
      <div id="foraLista"></div></div>`);
    raiz.appendChild(foraPainel);
    function renderFora() {
      const cont = $("#foraLista");
      limpar(cont);
      if (!mostrarFora) return;
      if (!a.fora.length) { cont.appendChild(el(`<div class="vazio">Nenhum indicador fora do perfil neste mês.</div>`)); return; }
      const html = a.fora.map(f => `<div class="meta-linha fora-perfil"><div><div class="nome">${esc(f.meta)}</div><div class="sub">Informativo — não conta para premiação</div></div><span class="sub">${fmtPct(f.valor)}</span></div>`).join("");
      cont.appendChild(el(`<div class="lista-metas">${html}</div>`));
    }
    $("#chkFora").addEventListener("change", e => { mostrarFora = e.target.checked; renderFora(); });
    renderFora();

    // Comparativo mês a mês.
    raiz.appendChild(comparativoMesAMes(mat));
  }

  function linhaMeta(m, mat) {
    const nivelTxt = m.nivel ? R.ROTULO_NIVEL[m.nivel] : "Sem nível";
    const pill = m.nivel ? `<span class="pill ${m.nivel}">${nivelTxt}</span>` : `<span class="pill zero">${m.abaixoCorte ? "Corte" : "0"}</span>`;
    const falta = m.proximo ? `Falta ${fmtPct(m.proximo.gap)} p/ ${R.ROTULO_NIVEL[m.proximo.nivel]} (+${fmtMoeda(m.proximo.ganho)})` : "No nível máximo";
    return `<div class="meta-linha${m.abaixoCorte ? " corte" : ""}" data-meta="${escAttr(m.meta)}">
      <div><div class="nome">${esc(m.meta)} ${pill}</div>
      <div class="sub">${m.valor != null ? fmtPct(m.valor) : "sem dado"} · ${fmtMoeda(m.premiacao)} · ${falta}</div></div>
    </div>`;
  }

  function ultimoMesComDados(mat) {
    const ms = mesesOrdenados();
    for (let i = ms.length - 1; i >= 0; i--) if (valoresNoMes(mat, ms[i])) return ms[i];
    return null;
  }

  /* =======================================================================
     Comparativo mês a mês (tabela)
     ======================================================================= */
  function comparativoMesAMes(mat) {
    const ms = mesesOrdenados();
    const regras = regrasDoColab(mat);
    const metas = Object.keys(regras);
    if (!metas.length || !ms.length) {
      return el(`<div class="painel"><h2>Comparativo mês a mês</h2><div class="vazio">Sem dados suficientes.</div></div>`);
    }
    let thead = `<tr><th>Indicador</th><th>Alvo (G3)</th>` + ms.map(c => `<th>${esc(nomeMes(c))}</th>`).join("") + `</tr>`;
    let tbody = "";
    metas.forEach(meta => {
      const g3 = regras[meta].g3;
      let anterior = null;
      let tds = ms.map(c => {
        const v = valoresNoMes(mat, c) ? valoresNoMes(mat, c)[meta] : null;
        let cls = "";
        if (v != null && g3 != null && v >= g3) cls = "batida";
        if (v != null && regras[meta].g6 != null && v < regras[meta].g6) cls = "corte";
        let seta = "";
        if (v != null && anterior != null) {
          if (v > anterior) seta = ` <span class="var-sobe">▲</span>`;
          else if (v < anterior) seta = ` <span class="var-desce">▼</span>`;
        }
        if (v != null) anterior = v;
        return `<td class="${cls}">${v != null ? fmtPct(v) + seta : "—"}</td>`;
      }).join("");
      tbody += `<tr class="clicavel" data-meta="${escAttr(meta)}"><td>${esc(meta)}</td><td>${fmtPct(g3)}</td>${tds}</tr>`;
    });
    const painel = el(`<div class="painel"><h2>Comparativo mês a mês</h2>
      <div class="tabela-rolagem"><table class="tabela"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div></div>`);
    painel.querySelectorAll("tr.clicavel").forEach(tr => tr.addEventListener("click", () => abrirDetalheMeta(mat, tr.dataset.meta)));
    return painel;
  }

  /* =======================================================================
     Detalhe da meta (modal): patamares + gráfico de evolução SVG
     ======================================================================= */
  function abrirDetalheMeta(mat, meta) {
    const regra = regrasDoColab(mat)[meta];
    if (!regra) { toast("Esta meta não faz parte do perfil.", "erro"); return; }
    const mesAtual = mesRef;
    const vAtual = valoresNoMes(mat, mesAtual) ? valoresNoMes(mat, mesAtual)[meta] : null;
    const av = R.avaliarMeta(meta, vAtual, regra);

    // Cartões de patamares.
    const niveis = ["g4", "g3", "g2", "g1"];
    const cards = niveis.filter(n => regra[n] != null).map(n => {
      const atingido = vAtual != null && vAtual >= regra[n];
      const falta = vAtual != null && vAtual < regra[n] ? `Falta ${fmtPct(regra[n] - vAtual)}` : (atingido ? "Atingido" : "—");
      return `<div class="patamar${atingido ? " atingido" : ""}">
        <div class="nv">${R.ROTULO_NIVEL[n]}</div>
        <div class="alvo">${fmtPct(regra[n])}</div>
        <div class="prem">${fmtMoeda(regra[R.VAL_DE[n]])}</div>
        <div class="falta">${falta}</div></div>`;
    }).join("");

    const corteTxt = regra.g6 != null ? `<p style="font-size:13px;color:var(--cinza)">Corte (G6): <strong>${fmtPct(regra.g6)}</strong> — abaixo disso, sem premiação.</p>` : "";
    const node = el(`<div>
      <h2>${esc(meta)}</h2>
      <p style="color:var(--cinza);font-size:14px;margin:2px 0 16px">Resultado em ${esc(nomeMes(mesAtual))}: <strong>${vAtual != null ? fmtPct(vAtual) : "sem dado"}</strong>${av.nivel ? ` · nível ${R.ROTULO_NIVEL[av.nivel]}` : ""}</p>
      <div class="patamares">${cards}</div>
      ${corteTxt}
      <h3 style="margin:18px 0 8px;color:var(--cinza)">Evolução mês a mês</h3>
      <div class="grafico-wrap" id="graficoWrap"></div>
    </div>`);
    abrirModal(node);
    node.querySelector("#graficoWrap").appendChild(graficoLinha(mat, meta, regra));
  }

  /* =======================================================================
     Gráfico de linha SVG: evolução com referências e zoom dinâmico no eixo Y
     e anti-colisão dos rótulos dos patamares à direita.
     ======================================================================= */
  function graficoLinha(mat, meta, regra) {
    const ms = mesesOrdenados();
    const pontos = ms.map(c => {
      const v = valoresNoMes(mat, c) ? valoresNoMes(mat, c)[meta] : null;
      return { comp: c, v: (v != null ? v : null) };
    });
    const valores = pontos.filter(p => p.v != null).map(p => p.v);

    // Faixa do eixo Y: considera valores + patamares relevantes (zoom dinâmico).
    const refs = [];
    ["g6", "g4", "g3", "g2", "g1"].forEach(n => { if (regra[n] != null) refs.push(regra[n]); });
    const todos = valores.concat(refs);
    let yMin = todos.length ? Math.min.apply(null, todos) : 0;
    let yMax = todos.length ? Math.max.apply(null, todos) : 100;
    if (yMin === yMax) { yMin -= 5; yMax += 5; }
    const margem = (yMax - yMin) * 0.12 || 5;
    yMin = yMin - margem; yMax = yMax + margem;

    const W = Math.max(420, ms.length * 80 + 120), H = 280;
    const padL = 44, padR = 96, padT = 16, padB = 34;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const x = i => padL + (ms.length <= 1 ? plotW / 2 : (i / (ms.length - 1)) * plotW);
    const y = v => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Evolução de ${esc(meta)}">`;

    // Grade horizontal (5 linhas).
    for (let g = 0; g <= 4; g++) {
      const yy = padT + (g / 4) * plotH;
      const val = yMax - (g / 4) * (yMax - yMin);
      svg += `<line class="grade" x1="${padL}" y1="${yy.toFixed(1)}" x2="${padL + plotW}" y2="${yy.toFixed(1)}"/>`;
      svg += `<text x="${padL - 6}" y="${(yy + 4).toFixed(1)}" font-size="10" fill="#8A989E" text-anchor="end">${val.toFixed(0)}</text>`;
    }

    // Linhas de referência dos patamares + rótulos à direita com anti-colisão.
    const rotulos = [];
    function addRef(nivel, classe, label) {
      if (regra[nivel] == null) return;
      const yy = y(regra[nivel]);
      svg += `<line class="${classe}" x1="${padL}" y1="${yy.toFixed(1)}" x2="${padL + plotW}" y2="${yy.toFixed(1)}"/>`;
      rotulos.push({ y: yy, texto: `${label} ${fmtPct(regra[nivel])}`, classe });
    }
    addRef("g1", "ref-tracejado", "G1");
    addRef("g2", "ref-tracejado", "G2");
    addRef("g3", "ref-g3", "G3");
    addRef("g6", "ref-corte", "Corte");

    // Anti-colisão: ordena por y e empurra rótulos que ficam muito próximos.
    rotulos.sort((a, b) => a.y - b.y);
    const minGap = 14;
    for (let i = 1; i < rotulos.length; i++) {
      if (rotulos[i].y - rotulos[i - 1].y < minGap) rotulos[i].y = rotulos[i - 1].y + minGap;
    }
    // Garante que não saiam da área.
    for (let i = rotulos.length - 1; i >= 0; i--) {
      if (rotulos[i].y > padT + plotH) rotulos[i].y = padT + plotH - (rotulos.length - 1 - i) * minGap;
    }
    rotulos.forEach(r => {
      const cor = r.classe === "ref-corte" ? "#C0392B" : (r.classe === "ref-g3" ? "#0E7C7B" : "#7D8B92");
      svg += `<text x="${padL + plotW + 6}" y="${(r.y + 3).toFixed(1)}" font-size="10.5" fill="${cor}" font-weight="600">${r.texto}</text>`;
    });

    // Linha do valor (conecta pontos com dado; ignora buracos).
    let caminho = "", iniciado = false;
    pontos.forEach((p, i) => {
      if (p.v == null) { iniciado = false; return; }
      caminho += (iniciado ? " L" : "M") + ` ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`;
      iniciado = true;
    });
    if (caminho) svg += `<path class="linha-valor" d="${caminho}"/>`;

    // Pontos + rótulos de valor.
    pontos.forEach((p, i) => {
      if (p.v == null) return;
      svg += `<circle class="ponto" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4"/>`;
      svg += `<text x="${x(i).toFixed(1)}" y="${(y(p.v) - 9).toFixed(1)}" font-size="10.5" fill="#0E7C7B" text-anchor="middle" font-weight="600">${fmtPct(p.v)}</text>`;
    });

    // Rótulos do eixo X (mês abreviado).
    pontos.forEach((p, i) => {
      const [a, m] = p.comp.split("-");
      svg += `<text x="${x(i).toFixed(1)}" y="${(H - 10)}" font-size="10" fill="#5B6B72" text-anchor="middle">${MESES[parseInt(m, 10) - 1].slice(0, 3)}/${a.slice(2)}</text>`;
    });

    svg += `</svg>`;
    const wrap = el(`<div>${svg}</div>`);
    return wrap;
  }

  // Donut de atingimento (anel SVG).
  function donutSVG(pct, alerta) {
    const r = 42, c = 2 * Math.PI * r, off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
    const cor = alerta ? "#C0392B" : "#0E7C7B";
    return `<svg width="108" height="108" viewBox="0 0 108 108">
      <circle cx="54" cy="54" r="${r}" fill="none" stroke="#E3E9EA" stroke-width="10"/>
      <circle cx="54" cy="54" r="${r}" fill="none" stroke="${cor}" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 54 54)"/>
      <text x="54" y="50" text-anchor="middle" font-size="22" font-weight="700" fill="#1A2B33">${pct.toFixed(0)}%</text>
      <text x="54" y="68" text-anchor="middle" font-size="10" fill="#5B6B72">atingido</text>
    </svg>`;
  }

  /* =======================================================================
     TELA 3 — IMPORTAR PLANILHA
     ======================================================================= */
  let previewAtual = null; // { comp, arquivo, linhas:[], byMat:{}, novas:[], reconhecidas:[] }

  function telaImportar() {
    const raiz = conteudo();
    limpar(raiz);
    previewAtual = null;
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const anoOpts = [];
    for (let a = anoAtual + 1; a >= anoAtual - 4; a--) anoOpts.push(a);

    raiz.appendChild(el(`<div class="cabecalho-tela"><div><h1>Importar planilha</h1>
      <div class="subtitulo">Leia um arquivo .xlsx e converta os resultados do mês em JSON</div></div></div>`));

    const painel = el(`<div class="painel">
      <div class="form-grid">
        <div class="campo"><label>Mês de referência</label>
          <select id="impMes">${MESES.map((m, i) => `<option value="${i + 1}"${i === hoje.getMonth() ? " selected" : ""}>${m}</option>`).join("")}</select></div>
        <div class="campo"><label>Ano</label>
          <select id="impAno">${anoOpts.map(a => `<option value="${a}"${a === anoAtual ? " selected" : ""}>${a}</option>`).join("")}</select></div>
      </div>
      <div class="zona-upload" id="zona">
        <p><strong>Arraste o arquivo .xlsx aqui</strong> ou clique para selecionar.</p>
        <input type="file" id="impArquivo" accept=".xlsx" hidden>
        <button class="btn secundario" id="btnEscolher">Escolher arquivo</button>
        <p style="font-size:12.5px">A leitura é feita no próprio navegador, sem enviar nada para servidores.</p>
      </div>
      <div id="previewArea"></div>
    </div>`);
    raiz.appendChild(painel);

    // Botão de reimportar JSON salvo.
    const painelJson = el(`<div class="painel">
      <h2>Restaurar de um backup JSON</h2>
      <p style="color:var(--cinza);font-size:14px">Selecione um arquivo .json exportado anteriormente para restaurar os dados de um mês.</p>
      <input type="file" id="jsonArquivo" accept=".json" hidden>
      <button class="btn cinza" id="btnJson">Selecionar JSON…</button>
    </div>`);
    raiz.appendChild(painelJson);

    const inputArq = $("#impArquivo");
    $("#btnEscolher").addEventListener("click", () => inputArq.click());
    inputArq.addEventListener("change", () => { if (inputArq.files[0]) processarArquivo(inputArq.files[0]); });

    const zona = $("#zona");
    ["dragenter", "dragover"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.add("sobre"); }));
    ["dragleave", "drop"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.remove("sobre"); }));
    zona.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if (f) processarArquivo(f); });

    const inputJson = $("#jsonArquivo");
    $("#btnJson").addEventListener("click", () => inputJson.click());
    inputJson.addEventListener("change", () => { if (inputJson.files[0]) restaurarJson(inputJson.files[0]); });
  }

  async function processarArquivo(file) {
    const area = $("#previewArea");
    area.innerHTML = `<div class="vazio">Lendo planilha…</div>`;
    try {
      const buf = await file.arrayBuffer();
      const { headers, linhas } = await window.lerXlsx(buf);
      const mapaCol = mapearColunas(headers);
      if (mapaCol.matricula == null) throw new Error("Coluna 'Matricula' não encontrada no cabeçalho.");

      const mes = parseInt($("#impMes").value, 10);
      const ano = $("#impAno").value;
      const comp = `${ano}-${String(mes).padStart(2, "0")}`;

      // Constrói byMat + identifica novas/reconhecidas.
      const byMat = {};
      const novas = [], reconhecidas = [];
      linhas.forEach(linha => {
        const matRaw = linha[headers[mapaCol.matricula]];
        if (matRaw == null || matRaw === "") return;
        const mat = String(matRaw).trim().split(".")[0]; // remove .0 de números
        const valores = {};
        mapaCol.metas.forEach(({ canon, header }) => {
          const v = R.normalizarPercentual(linha[header]);
          if (v != null) valores[canon] = v;
        });
        let premiacao = null;
        if (mapaCol.premiacao != null) {
          const p = linha[headers[mapaCol.premiacao]];
          if (p != null && p !== "") premiacao = Number(String(p).replace(/[^\d,.-]/g, "").replace(".", "").replace(",", "."));
          if (Number.isNaN(premiacao)) premiacao = null;
        }
        const perfilPlan = mapaCol.perfil != null ? String(linha[headers[mapaCol.perfil]] || "").trim() : "";
        byMat[mat] = { valores, premiacao, perfilPlan };
        if (estado.colaboradores[mat]) reconhecidas.push(mat); else novas.push(mat);
      });

      previewAtual = { comp, arquivo: file.name, byMat, novas, reconhecidas, nLinhas: linhas.length };
      renderPreview();
    } catch (e) {
      area.innerHTML = `<div class="alerta-corte">Falha ao ler a planilha: ${esc(e.message)}</div>`;
    }
  }

  // Casa cabeçalhos da planilha com colunas conhecidas.
  function mapearColunas(headers) {
    const res = { matricula: null, perfil: null, premiacao: null, metas: [] };
    headers.forEach((h, i) => {
      const n = R.normalizar(h);
      if (n === "matricula") res.matricula = i;
      else if (n === "perfil considerado" || n === "perfil") res.perfil = i;
      else if (n === "premiacao") res.premiacao = i;
      else {
        const canon = R.canonizarMeta(h);
        if (canon) res.metas.push({ canon, header: h });
      }
    });
    return res;
  }

  function renderPreview() {
    const p = previewAtual;
    const area = $("#previewArea");
    const jaExiste = !!estado.monthly[p.comp];
    const novasHtml = p.novas.length
      ? `<label class="linha-check"><input type="checkbox" id="chkCriar" checked> Criar automaticamente as ${p.novas.length} matrícula(s) nova(s): ${esc(p.novas.slice(0, 12).join(", "))}${p.novas.length > 12 ? "…" : ""}</label>`
      : "";
    area.innerHTML = `
      <div class="preview-resumo">
        <div class="bloco"><div class="n">${p.nLinhas}</div><div class="r">linhas lidas</div></div>
        <div class="bloco"><div class="n">${p.reconhecidas.length}</div><div class="r">matrículas conhecidas</div></div>
        <div class="bloco"><div class="n${p.novas.length ? " alerta" : ""}">${p.novas.length}</div><div class="r">matrículas novas</div></div>
        <div class="bloco"><div class="n">${esc(nomeMes(p.comp))}</div><div class="r">mês de destino</div></div>
      </div>
      ${jaExiste ? `<div class="alerta-corte">O mês ${esc(nomeMes(p.comp))} já foi importado e será <strong>sobrescrito</strong>.</div>` : ""}
      ${novasHtml}
      <div class="acoes">
        <button class="btn" id="btnConfirmar">Confirmar importação</button>
        <button class="btn cinza" id="btnCancelar">Cancelar</button>
      </div>`;
    $("#btnConfirmar").addEventListener("click", confirmarImportacao);
    $("#btnCancelar").addEventListener("click", () => { previewAtual = null; area.innerHTML = ""; });
  }

  function confirmarImportacao() {
    const p = previewAtual;
    const criar = $("#chkCriar") ? $("#chkCriar").checked : false;

    // Cria matrículas novas (se marcado).
    if (criar) {
      p.novas.forEach(mat => {
        const perfilPlan = p.byMat[mat].perfilPlan;
        const perfil = perfilPlan && estado.perfis[perfilPlan] ? perfilPlan : "Outros";
        if (perfil === "Outros" && !estado.perfis["Outros"]) estado.perfis["Outros"] = {};
        estado.colaboradores[mat] = { matricula: mat, perfil, supervisor: "" };
      });
    }

    // Grava o mês.
    const byMatSalvar = {};
    Object.keys(p.byMat).forEach(mat => {
      if (!estado.colaboradores[mat]) return; // pula novas não criadas
      byMatSalvar[mat] = { valores: p.byMat[mat].valores, premiacao: p.byMat[mat].premiacao };
    });
    estado.monthly[p.comp] = { byMat: byMatSalvar, importedAt: new Date().toISOString(), arquivo: p.arquivo };
    salvar();
    mesRef = p.comp;
    toast(`Mês ${nomeMes(p.comp)} importado: ${Object.keys(byMatSalvar).length} colaboradores.`, "ok");
    // Oferece baixar o JSON.
    const c = $("#previewArea");
    c.innerHTML = `<div class="painel" style="margin:0"><h2>Importação concluída</h2>
      <p style="color:var(--cinza);font-size:14px">${Object.keys(byMatSalvar).length} colaboradores gravados em ${esc(nomeMes(p.comp))}.</p>
      <div class="acoes"><button class="btn secundario" id="btnBaixarJson">Baixar JSON do mês</button>
      <button class="btn" id="btnIrVisao">Ver na visão geral</button></div></div>`;
    $("#btnBaixarJson").addEventListener("click", () => baixarJsonMes(p.comp));
    $("#btnIrVisao").addEventListener("click", () => irPara("visao"));
  }

  function baixarJsonMes(comp) {
    const dados = { competencia: comp, ...estado.monthly[comp] };
    baixarArquivo(`dados_${comp}.json`, JSON.stringify(dados, null, 2), "application/json");
  }

  async function restaurarJson(file) {
    try {
      const txt = await file.text();
      const dados = JSON.parse(txt);
      const comp = dados.competencia;
      if (!comp || !dados.byMat) throw new Error("JSON inválido (faltam 'competencia' ou 'byMat').");
      estado.monthly[comp] = { byMat: dados.byMat, importedAt: dados.importedAt || new Date().toISOString(), arquivo: dados.arquivo || file.name };
      // Cria colaboradores ausentes referenciados no JSON.
      Object.keys(dados.byMat).forEach(mat => {
        if (!estado.colaboradores[mat]) estado.colaboradores[mat] = { matricula: mat, perfil: "Outros", supervisor: "" };
      });
      if (!estado.perfis["Outros"]) estado.perfis["Outros"] = {};
      salvar();
      mesRef = comp;
      toast(`Backup de ${nomeMes(comp)} restaurado.`, "ok");
    } catch (e) { toast("Falha ao restaurar JSON: " + e.message, "erro"); }
  }

  /* =======================================================================
     TELA 4 — ADMINISTRAÇÃO (4 abas)
     ======================================================================= */
  let abaAdmin = "colaboradores";

  function telaAdmin() {
    const raiz = conteudo();
    limpar(raiz);
    raiz.appendChild(el(`<div class="cabecalho-tela"><div><h1>Administração</h1>
      <div class="subtitulo">Cadastros e histórico de importações</div></div></div>`));

    const abas = el(`<div class="abas">
      <button class="aba" data-aba="colaboradores">Colaboradores</button>
      <button class="aba" data-aba="supervisores">Supervisores</button>
      <button class="aba" data-aba="perfis">Perfis de metas</button>
      <button class="aba" data-aba="historico">Histórico de importações</button>
    </div>`);
    raiz.appendChild(abas);
    const corpo = el(`<div id="abaCorpo"></div>`);
    raiz.appendChild(corpo);

    abas.querySelectorAll(".aba").forEach(b => {
      if (b.dataset.aba === abaAdmin) b.classList.add("ativa");
      b.addEventListener("click", () => { abaAdmin = b.dataset.aba; telaAdmin(); });
    });

    if (abaAdmin === "colaboradores") abaColaboradores(corpo);
    else if (abaAdmin === "supervisores") abaSupervisores(corpo);
    else if (abaAdmin === "perfis") abaPerfis(corpo);
    else abaHistorico(corpo);
  }

  function abaColaboradores(corpo) {
    const perfis = Object.keys(estado.perfis);
    const mats = Object.keys(estado.colaboradores).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const painel = el(`<div class="painel">
      <div class="linha-acoes" style="justify-content:space-between;margin-bottom:14px">
        <h2 style="margin:0">Colaboradores (${mats.length})</h2>
        <button class="btn" id="btnNovoColab">+ Novo colaborador</button>
      </div>
      <div class="lista-admin" id="listaColab"></div>
    </div>`);
    corpo.appendChild(painel);
    const lista = painel.querySelector("#listaColab");
    if (!mats.length) lista.appendChild(el(`<div class="vazio">Nenhum colaborador. Cadastre ou importe uma planilha.</div>`));
    mats.forEach(mat => {
      const c = estado.colaboradores[mat];
      const item = el(`<div class="item-admin">
        <span class="principal">${esc(mat)}</span>
        <span class="sec">${esc(c.perfil || "—")} · ${esc(supNome(c.supervisor) || "sem supervisor")}</span>
        <span class="espaco"></span>
        <button class="btn cinza btn-pequeno" data-acao="editar">Editar</button>
        <button class="btn perigo btn-pequeno" data-acao="excluir">Excluir</button>
      </div>`);
      item.querySelector('[data-acao="editar"]').addEventListener("click", () => formColaborador(mat));
      item.querySelector('[data-acao="excluir"]').addEventListener("click", () => {
        if (confirm(`Excluir o colaborador ${mat}? Ele sumirá do painel (os dados mensais dele permanecem no histórico, mas não serão exibidos).`)) {
          delete estado.colaboradores[mat]; salvar(); telaAdmin();
        }
      });
      lista.appendChild(item);
    });
    painel.querySelector("#btnNovoColab").addEventListener("click", () => formColaborador(null));
  }

  function formColaborador(mat) {
    const novo = mat == null;
    const c = novo ? { matricula: "", perfil: "", supervisor: "" } : estado.colaboradores[mat];
    const perfOpts = Object.keys(estado.perfis).map(p => `<option value="${escAttr(p)}"${p === c.perfil ? " selected" : ""}>${esc(p)}</option>`).join("");
    const supOpts = `<option value="">Sem supervisor</option>` + estado.supervisores.map(s => `<option value="${escAttr(s.id)}"${s.id === c.supervisor ? " selected" : ""}>${esc(s.nome)}</option>`).join("");
    const node = el(`<div>
      <h2>${novo ? "Novo colaborador" : "Editar " + esc(mat)}</h2>
      <div class="form-grid" style="margin-top:14px">
        <div class="campo"><label>Matrícula (3 dígitos)</label><input id="cMat" maxlength="3" value="${escAttr(c.matricula)}" ${novo ? "" : "disabled"} placeholder="000"></div>
        <div class="campo"><label>Perfil</label><select id="cPerfil"><option value="">Selecione…</option>${perfOpts}</select></div>
        <div class="campo"><label>Supervisor</label><select id="cSup">${supOpts}</select></div>
      </div>
      <div class="acoes"><button class="btn" id="cSalvar">Salvar</button><button class="btn cinza" id="cCancelar">Cancelar</button></div>
    </div>`);
    abrirModal(node);
    node.querySelector("#cCancelar").addEventListener("click", fecharModal);
    node.querySelector("#cSalvar").addEventListener("click", () => {
      const m = novo ? node.querySelector("#cMat").value.trim() : mat;
      const perfil = node.querySelector("#cPerfil").value;
      const sup = node.querySelector("#cSup").value;
      if (novo && !/^\d{1,3}$/.test(m)) { toast("Matrícula deve ter até 3 dígitos.", "erro"); return; }
      if (novo && estado.colaboradores[m]) { toast("Matrícula já existe.", "erro"); return; }
      if (!perfil) { toast("Selecione um perfil.", "erro"); return; }
      estado.colaboradores[m] = { matricula: m, perfil, supervisor: sup };
      salvar(); fecharModal(); telaAdmin();
      toast("Colaborador salvo.", "ok");
    });
  }

  function abaSupervisores(corpo) {
    const painel = el(`<div class="painel">
      <div class="linha-acoes" style="justify-content:space-between;margin-bottom:14px">
        <h2 style="margin:0">Supervisores (${estado.supervisores.length})</h2>
        <button class="btn" id="btnNovoSup">+ Novo supervisor</button>
      </div>
      <div class="lista-admin" id="listaSup"></div>
    </div>`);
    corpo.appendChild(painel);
    const lista = painel.querySelector("#listaSup");
    if (!estado.supervisores.length) lista.appendChild(el(`<div class="vazio">Nenhum supervisor cadastrado.</div>`));
    estado.supervisores.forEach(s => {
      const equipe = Object.keys(estado.colaboradores).filter(m => estado.colaboradores[m].supervisor === s.id);
      const item = el(`<div class="item-admin">
        <span class="principal">${esc(s.nome)}</span>
        <span class="sec">${equipe.length} colaborador(es)${equipe.length ? ": " + esc(equipe.join(", ")) : ""}</span>
        <span class="espaco"></span>
        <button class="btn cinza btn-pequeno" data-acao="editar">Renomear</button>
        <button class="btn perigo btn-pequeno" data-acao="excluir">Excluir</button>
      </div>`);
      item.querySelector('[data-acao="editar"]').addEventListener("click", () => {
        const novo = prompt("Nome do supervisor:", s.nome);
        if (novo && novo.trim()) { s.nome = novo.trim(); salvar(); telaAdmin(); }
      });
      item.querySelector('[data-acao="excluir"]').addEventListener("click", () => {
        if (confirm(`Excluir supervisor ${s.nome}? Os colaboradores ficarão sem supervisor.`)) {
          Object.keys(estado.colaboradores).forEach(m => { if (estado.colaboradores[m].supervisor === s.id) estado.colaboradores[m].supervisor = ""; });
          estado.supervisores = estado.supervisores.filter(x => x.id !== s.id);
          salvar(); telaAdmin();
        }
      });
      lista.appendChild(item);
    });
    painel.querySelector("#btnNovoSup").addEventListener("click", () => {
      const nome = prompt("Nome do novo supervisor:");
      if (nome && nome.trim()) {
        estado.supervisores.push({ id: "sup_" + Date.now().toString(36), nome: nome.trim() });
        salvar(); telaAdmin();
      }
    });
  }

  function abaPerfis(corpo) {
    const perfis = Object.keys(estado.perfis);
    const painel = el(`<div class="painel">
      <div class="linha-acoes" style="justify-content:space-between;margin-bottom:14px">
        <h2 style="margin:0">Perfis de metas (${perfis.length})</h2>
        <button class="btn" id="btnNovoPerfil">+ Novo perfil</button>
      </div>
      <div class="lista-admin" id="listaPerfil"></div>
    </div>`);
    corpo.appendChild(painel);
    const lista = painel.querySelector("#listaPerfil");
    if (!perfis.length) lista.appendChild(el(`<div class="vazio">Nenhum perfil. Crie um ou importe o arquivo de regras.</div>`));
    perfis.forEach(nome => {
      const nMetas = Object.keys(estado.perfis[nome]).length;
      const emUso = Object.keys(estado.colaboradores).filter(m => estado.colaboradores[m].perfil === nome).length;
      const item = el(`<div class="item-admin">
        <span class="principal">${esc(nome)}</span>
        <span class="sec">${nMetas} meta(s) · ${emUso} colaborador(es)</span>
        <span class="espaco"></span>
        <button class="btn cinza btn-pequeno" data-acao="editar">Editar metas</button>
        <button class="btn perigo btn-pequeno" data-acao="excluir"${emUso ? " disabled title='Em uso'" : ""}>Excluir</button>
      </div>`);
      item.querySelector('[data-acao="editar"]').addEventListener("click", () => editorPerfil(nome));
      const bx = item.querySelector('[data-acao="excluir"]');
      if (!emUso) bx.addEventListener("click", () => {
        if (confirm(`Excluir o perfil "${nome}"?`)) { delete estado.perfis[nome]; salvar(); telaAdmin(); }
      });
      lista.appendChild(item);
    });
    painel.querySelector("#btnNovoPerfil").addEventListener("click", () => {
      const nome = prompt("Nome do novo perfil:");
      if (nome && nome.trim()) {
        if (estado.perfis[nome.trim()]) { toast("Perfil já existe.", "erro"); return; }
        estado.perfis[nome.trim()] = {}; salvar(); editorPerfil(nome.trim());
      }
    });
  }

  function editorPerfil(nome) {
    const regras = estado.perfis[nome];
    const blocos = R.METAS_CANONICAS.map(meta => {
      const r = regras[meta] || null;
      const ligada = !!r;
      const v = (k) => r && r[k] != null ? r[k] : "";
      return `<div class="editor-meta${ligada ? "" : " desligada"}" data-meta="${escAttr(meta)}">
        <div class="editor-meta-topo">
          <label class="switch"><input type="checkbox" class="chkMeta" ${ligada ? "checked" : ""}><span class="desl"></span></label>
          <span class="nome">${esc(meta)}</span>
        </div>
        <div class="editor-campos">
          <div class="mini"><label>Corte G6</label><input data-c="g6" value="${v("g6")}"></div>
          <div class="mini"><label>G4 %</label><input data-c="g4" value="${v("g4")}"></div>
          <div class="mini"><label>G3 %</label><input data-c="g3" value="${v("g3")}"></div>
          <div class="mini"><label>G2 %</label><input data-c="g2" value="${v("g2")}"></div>
          <div class="mini"><label>G1 %</label><input data-c="g1" value="${v("g1")}"></div>
          <div class="mini"><label>R$ G4</label><input data-c="valG4" value="${v("valG4")}"></div>
          <div class="mini"><label>R$ G3</label><input data-c="valG3" value="${v("valG3")}"></div>
          <div class="mini"><label>R$ G2</label><input data-c="valG2" value="${v("valG2")}"></div>
          <div class="mini"><label>R$ G1</label><input data-c="valG1" value="${v("valG1")}"></div>
        </div>
      </div>`;
    }).join("");
    const node = el(`<div><h2>Editar perfil — ${esc(nome)}</h2>
      <p style="color:var(--cinza);font-size:13px;margin:4px 0 16px">Ligue cada meta e defina os patamares (%) e a premiação (R$). Deixe em branco para ignorar um patamar.</p>
      ${blocos}
      <div class="acoes"><button class="btn" id="pSalvar">Salvar perfil</button><button class="btn cinza" id="pCancelar">Cancelar</button></div>
    </div>`);
    abrirModal(node);
    node.querySelectorAll(".chkMeta").forEach(chk => {
      chk.addEventListener("change", () => chk.closest(".editor-meta").classList.toggle("desligada", !chk.checked));
    });
    node.querySelector("#pCancelar").addEventListener("click", fecharModal);
    node.querySelector("#pSalvar").addEventListener("click", () => {
      const novas = {};
      node.querySelectorAll(".editor-meta").forEach(bl => {
        if (!bl.querySelector(".chkMeta").checked) return;
        const meta = bl.dataset.meta;
        const obj = {};
        bl.querySelectorAll("input[data-c]").forEach(inp => {
          const k = inp.dataset.c;
          const val = inp.value.trim().replace(",", ".");
          obj[k] = val === "" ? null : Number(val);
        });
        novas[meta] = obj;
      });
      estado.perfis[nome] = novas;
      salvar(); fecharModal(); telaAdmin();
      toast("Perfil salvo.", "ok");
    });
  }

  function abaHistorico(corpo) {
    const ms = mesesOrdenados().reverse();
    const painel = el(`<div class="painel"><h2>Histórico de importações</h2><div id="histLista" class="lista-admin"></div></div>`);
    corpo.appendChild(painel);
    const lista = painel.querySelector("#histLista");
    if (!ms.length) { lista.appendChild(el(`<div class="vazio">Nenhum mês importado.</div>`)); return; }
    ms.forEach(comp => {
      const m = estado.monthly[comp];
      const n = Object.keys(m.byMat).length;
      const data = m.importedAt ? new Date(m.importedAt).toLocaleString("pt-BR") : "—";
      const item = el(`<div class="item-admin">
        <span class="principal">${esc(nomeMes(comp))}</span>
        <span class="sec">${n} colaborador(es) · ${esc(m.arquivo || "—")} · importado em ${esc(data)}</span>
        <span class="espaco"></span>
        <button class="btn secundario btn-pequeno" data-acao="json">Baixar JSON</button>
        <button class="btn perigo btn-pequeno" data-acao="excluir">Excluir mês</button>
      </div>`);
      item.querySelector('[data-acao="json"]').addEventListener("click", () => baixarJsonMes(comp));
      item.querySelector('[data-acao="excluir"]').addEventListener("click", () => {
        if (confirm(`Excluir os dados de ${nomeMes(comp)}?`)) {
          delete estado.monthly[comp];
          if (mesRef === comp) mesRef = mesPadrao();
          salvar(); telaAdmin();
        }
      });
      lista.appendChild(item);
    });
  }

  /* =======================================================================
     PPTX
     ======================================================================= */
  function baixarPptx(mat) {
    if (!mesRef) { toast("Selecione um mês primeiro.", "erro"); return; }
    const c = estado.colaboradores[mat];
    const regras = regrasDoColab(mat);
    const a = avaliarNoMes(mat, mesRef);

    const resultados = a.metas.map(m => ({
      meta: m.meta, corte: regras[m.meta].g6, metaG3: regras[m.meta].g3,
      valor: m.valor, nivel: m.nivel ? R.ROTULO_NIVEL[m.nivel] : (m.abaixoCorte ? "Corte" : "—"),
      premiacao: m.premiacao,
    }));
    const prioridades = R.calcularPrioridades(a.metas, 5).map(p => ({
      meta: p.meta, gap: p.proximo.gap, ganho: p.proximo.ganho,
      abaixoCorte: p.abaixoCorte, abaixoMeta: !p.atingiu,
    }));
    const ms = mesesOrdenados();
    const metas = Object.keys(regras);
    const valores = {}, alvos = {};
    metas.forEach(meta => {
      alvos[meta] = regras[meta].g3;
      valores[meta] = {};
      ms.forEach(comp => { const v = valoresNoMes(mat, comp) ? valoresNoMes(mat, comp)[meta] : null; if (v != null) valores[meta][comp] = v; });
    });

    try {
      const bytes = window.gerarPptx({
        matricula: mat, perfil: c.perfil, supervisor: supNome(c.supervisor), mes: nomeMes(mesRef),
        resultados, prioridades, evolucao: { metas, meses: ms, valores, alvos },
      });
      baixarArquivo(`apresentacao_${mat}_${mesRef}.pptx`, bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      toast("Apresentação gerada.", "ok");
    } catch (e) { toast("Falha ao gerar PPT: " + e.message, "erro"); }
  }

  // ---- Download genérico -------------------------------------------------
  function baixarArquivo(nome, conteudo, mime) {
    const blob = conteudo instanceof Uint8Array ? new Blob([conteudo], { type: mime }) : new Blob([conteudo], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- Escape ------------------------------------------------------------
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function escAttr(s) { return esc(s).replace(/"/g, "&quot;"); }

  // ---- Navegação ---------------------------------------------------------
  function irPara(tela) {
    telaAtual = tela;
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("ativo", b.dataset.tela === (tela === "colab" ? "visao" : tela)));
    fecharMenuMobile();
    if (tela === "visao") telaVisao();
    else if (tela === "colab") telaColab();
    else if (tela === "importar") telaImportar();
    else if (tela === "admin") telaAdmin();
  }

  function fecharMenuMobile() {
    $("#menuLateral").classList.remove("aberto");
    $("#overlay").classList.remove("ativo");
  }

  // ---- Inicialização -----------------------------------------------------
  async function iniciar() {
    $("#versaoApp").textContent = VERSAO;
    carregar();
    await semearPerfis();
    garantirMes();

    document.querySelectorAll(".nav-item").forEach(b => {
      b.addEventListener("click", () => irPara(b.dataset.tela));
    });
    $("#btnMenu").addEventListener("click", () => {
      $("#menuLateral").classList.toggle("aberto");
      $("#overlay").classList.toggle("ativo");
    });
    $("#overlay").addEventListener("click", fecharMenuMobile);
    $("#modalFechar").addEventListener("click", fecharModal);
    $("#modal").addEventListener("click", e => { if (e.target.id === "modal") fecharModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

    irPara("visao");
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
