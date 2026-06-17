# Painel GOP — Gestão de Metas (versão sem bibliotecas)

Aplicação web **100% estática**, escrita em HTML, CSS e JavaScript puro.
**Não usa React, Recharts, XLSX nem nenhuma biblioteca externa. Não carrega nada de CDN.**
Por isso, redes corporativas que bloqueiam CDNs **não conseguem quebrar o carregamento** —
todo o código está nos próprios arquivos.

## Arquivos

| Arquivo           | O que é                                                            |
|-------------------|-------------------------------------------------------------------|
| `index.html`      | Página principal. Carrega os scripts locais na ordem certa.       |
| `styles.css`      | Todo o visual (substitui o Tailwind).                             |
| `data.js`         | Dados-semente: perfis, patamares (G6/G4/G3/G2/G1), colaboradores. |
| `icons.js`        | Ícones em SVG.                                                    |
| `xlsx-reader.js`  | Leitor de `.xlsx` próprio (descompacta e lê a planilha).          |
| `charts.js`       | Gráfico de evolução em SVG (substitui o Recharts).                |
| `ppt.js`          | Gerador de apresentação `.pptx`.                                  |
| `app-core.js`     | Lógica de dados, patamares e premiação.                          |
| `app-views.js`    | Telas: visão geral, menu, seletor de mês.                        |
| `app-render.js`   | Telas: colaborador, importação, administração.                   |
| `.nojekyll`       | Faz o GitHub Pages servir os arquivos como estão.                |

## Como publicar no GitHub Pages

1. No seu repositório, **substitua todos os arquivos** pela pasta desta versão
   (`index.html`, `styles.css` e todos os `.js`, mais o `.nojekyll`).
   Pode apagar os arquivos antigos (`app.js`/`icons.js` da versão anterior).
2. **Settings → Pages → Source:** "Deploy from a branch" → branch `main`, pasta `/ (root)` → Save.
3. Aguarde 1–2 minutos e acesse o endereço (ex.: `https://SEU-USUARIO.github.io/painelgop/`).

Pronto. Como não há dependências externas, deve abrir normalmente mesmo na rede da empresa.

## Requisito do navegador

A leitura de `.xlsx` usa um recurso nativo dos navegadores modernos
(`DecompressionStream`), disponível em Chrome/Edge 80+ e Firefox 113+.
Se a empresa usar um navegador muito antigo, a importação pode não funcionar —
nesse caso, atualizar o navegador resolve.

## Importante sobre os dados

Os dados são salvos **no navegador de cada pessoa** (localStorage). Cada usuário tem sua
própria cópia; uma alteração feita por uma pessoa **não** aparece para as outras.
Para dados compartilhados entre todos, seria necessário um backend com banco de dados
(ex.: Supabase) — etapa separada desta versão estática.

## Versão

A versão atual (2.0.0) aparece no rodapé do menu lateral e no topo (no celular).
