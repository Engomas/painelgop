# Painel GOP — Gestão de Metas

Aplicação web estática (HTML + CSS + JavaScript) para acompanhamento mensal de metas
de colaboradores. **Não precisa de build nem de servidor** — basta hospedar os arquivos.

## Arquivos

| Arquivo        | O que é                                                              |
|----------------|----------------------------------------------------------------------|
| `index.html`   | Página principal. Carrega as bibliotecas e inicia o painel.          |
| `app.js`       | A aplicação inteira (já compilada de React para JavaScript puro).    |
| `icons.js`     | Ícones em SVG.                                                       |
| `.nojekyll`    | Sinaliza ao GitHub Pages para servir os arquivos como estão.         |
| `vendor/`      | (Opcional) bibliotecas locais, para não depender de CDN.             |

As bibliotecas (React, Recharts, XLSX) são baixadas de CDN pelo `index.html`. O carregador
tenta automaticamente **3 CDNs diferentes** (jsDelivr, cdnjs e unpkg) para cada biblioteca —
se um estiver fora do ar ou bloqueado, ele usa o próximo.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie **todos os arquivos** para a raiz do repositório (`index.html`, `app.js`,
   `icons.js`, `.nojekyll`).
3. **Settings → Pages → Source:** "Deploy from a branch" → branch `main`, pasta `/ (root)` → Save.
4. Em 1–2 minutos o endereço aparece (ex.: `https://SEU-USUARIO.github.io/painelgop/`).

## Rede corporativa bloqueando os CDNs? (deixar 100% local)

Se sua empresa bloqueia jsDelivr/cdnjs/unpkg, baixe as bibliotecas e coloque-as numa
pasta `vendor` **dentro do repositório**. O `index.html` já procura nelas primeiro.

Crie a pasta `vendor/` e baixe estes arquivos (de uma máquina com internet liberada),
salvando com **exatamente estes nomes**:

| Salvar como (em `vendor/`)        | Baixar de                                                                       |
|-----------------------------------|---------------------------------------------------------------------------------|
| `react.production.min.js`         | https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js            |
| `react-dom.production.min.js`     | https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js    |
| `react-is.production.min.js`      | https://cdn.jsdelivr.net/npm/react-is@18.3.1/umd/react-is.production.min.js      |
| `Recharts.min.js`                 | https://cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.min.js                 |
| `xlsx.full.min.js`                | https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js                   |

Suba a pasta `vendor/` junto com os outros arquivos. Pronto — o painel passa a funcionar
sem depender de internet externa (resta apenas a fonte e o Tailwind, que também podem ser
baixados se necessário; me avise se precisar dessa parte também).

## Importante sobre os dados

Os dados são salvos **no navegador de cada pessoa** (localStorage). Cada usuário tem sua
própria cópia; uma alteração feita por uma pessoa **não** aparece para as outras.
Para dados compartilhados entre todos, é necessário um backend com banco de dados
(ex.: Supabase) — etapa separada desta versão estática.

## Versão

A versão atual aparece no rodapé do menu lateral do painel (atual: 1.0.0).
