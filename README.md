# Painel GOP — versão HTML + CSS + JavaScript puro

Conversão fiel do projeto original em React/JSX (`painel-gop.jsx`) para **HTML, CSS e JavaScript nativos**, sem React, JSX, Next.js, TypeScript, Babel ou qualquer framework.

## Estrutura de arquivos

```
painel-gop/
├── index.html     → shell da página + carregamento de fontes e libs
├── styles.css     → tokens de cor, reset e utilidades (equivalente ao Tailwind usado)
└── script.js      → toda a lógica: estado, render, views, gráfico e geração de PPT
```

## Como executar

Como o app usa `fetch`/leitura de arquivos e bibliotecas via CDN, sirva a pasta por um servidor HTTP (abrir o `index.html` direto via `file://` funciona na maioria dos navegadores, mas um servidor evita qualquer restrição):

```bash
cd painel-gop
python3 -m http.server 8000
# abra http://localhost:8000 no navegador
```

Ou qualquer alternativa equivalente (`npx serve`, extensão "Live Server" do VS Code, etc.).

Requer conexão com a internet na primeira carga para baixar as fontes e as bibliotecas abaixo (todas via CDN público):

| Biblioteca | Função | Substitui |
|---|---|---|
| **SheetJS (xlsx 0.18.5)** | Leitura das planilhas `.xlsx/.xls/.csv` na importação | `import * as XLSX` |
| **Chart.js 4.4.1** | Gráfico de evolução mês a mês das metas | `recharts` (LineChart) |
| Google Fonts (Archivo + Inter) | Tipografia idêntica | mesma fonte do original |

> A geração de PowerPoint **não** usa biblioteca externa: o `.pptx` é montado manualmente em OOXML e empacotado num ZIP, exatamente como no projeto React (função `gerarPpt`). Não depende de PptxGenJS nem de CDN.

## Equivalência com o React

| React/JSX | Implementação em JS puro |
|---|---|
| `useState` | propriedades no objeto `STATE` (+ `STATE.ui` por view) e chamada a `rerender()` |
| `useEffect` (carregar/migrar) | `loadDb()` chamado em `init()` |
| `useEffect` (salvar) | `scheduleSave()` com *debounce* de 500 ms gravando no `localStorage` |
| `useEffect` (mês válido) | `ensureValidSelMonth()` chamado no início de cada `rerender()` |
| `useMemo` / `useCallback` | funções recalculadas no render (mesmo resultado, custo desprezível) |
| `useRef` | variáveis de módulo / closures |
| JSX | função `h(tag, props, ...children)` que cria nós DOM |
| `lucide-react` | ícones SVG inline (objeto `ICON_PATHS` + função `icon()`) |
| `window.storage` (sandbox) | `localStorage` (mesmo formato de dados e chave `gop:data`) |
| `recharts` | Chart.js com plugin custom que desenha as linhas de patamar (G6/G4/G3/G2/G1) e os rótulos laterais com anti-colisão, reproduzindo o gráfico original |

## Adaptações por limitação do JavaScript puro

1. **Persistência:** o original usava `window.storage` (disponível só no sandbox). Aqui usamos `localStorage` com a mesma chave (`gop:data`), mesmo formato JSON e as mesmas migrações de versão (v1→v6). Se o `localStorage` estiver indisponível (ex.: modo privado), o aviso "sem persistência" aparece igual ao original.
2. **Gráfico:** o `recharts` foi substituído por **Chart.js**. As linhas de referência (patamares e corte) são desenhadas por um plugin custom (`gopRefLines`) para reproduzir as `ReferenceLine`, e os rótulos laterais com anti-colisão são posicionados pelo mesmo algoritmo do JSX. Curva `monotone` → `tension: 0.4`; `connectNulls` → `spanGaps: true`.
3. **Re-render:** sem o *diffing* do React, cada mudança de estado reconstrói a árvore (`rerender()`). Para a busca/filtros da tela inicial e a busca de colaboradores no Admin, a lista é reconstruída isoladamente para não perder o foco do campo de texto.
4. **Estilo:** as classes utilitárias do Tailwind usadas no projeto foram reescritas manualmente em `styles.css`; os estilos que no JSX eram *inline* (baseados nos tokens `C`) continuam aplicados inline via `element.style`, preservando cores, bordas, sombras e espaçamentos exatos.

## O que foi preservado integralmente

Layout, responsividade (breakpoints sm/md/lg), tipografia, paleta de cores, tokens, sombras, bordas, transições, todos os ícones, navegação (sidebar + topo mobile), as 4 telas (Visão geral, Importar, Administração com 4 abas, Detalhe do colaborador), filtros, modais, confirmações, tabelas, cards, anel de progresso, badges, o gráfico de patamares, a importação de planilha com pré-visualização e criação de colaboradores, e a geração de apresentação `.pptx` (4 slides, mesmo conteúdo e layout).
