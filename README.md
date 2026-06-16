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

As bibliotecas React, Recharts e XLSX são carregadas de CDN (internet) pelo `index.html`.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `painel-gop`).
2. Envie **todos os arquivos desta pasta** para a raiz do repositório
   (`index.html`, `app.js`, `icons.js`, `.nojekyll`). Pode ser pelo site do
   GitHub em **Add file → Upload files**, arrastando os arquivos.
3. No repositório, vá em **Settings → Pages**.
4. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
5. Em **Branch**, selecione `main` e a pasta `/ (root)`. Clique em **Save**.
6. Aguarde 1–2 minutos. O endereço aparecerá no topo da página de Pages, algo como:
   `https://SEU-USUARIO.github.io/painel-gop/`

Pronto — o painel estará no ar.

## Importante sobre os dados

Os dados (colaboradores, perfis, importações de planilha) são salvos **no navegador
de cada pessoa** (localStorage). Ou seja: cada usuário tem sua própria cópia, e uma
alteração feita por uma pessoa **não** aparece para as outras automaticamente.

Para um painel com dados **compartilhados entre todos** (uma alteração na Administração
refletindo para qualquer pessoa que acessar), é necessário um backend com banco de dados
(ex.: Supabase). Isso é uma etapa adicional, separada desta versão estática.

## Versão

A versão atual aparece no rodapé do menu lateral do próprio painel.

## Opcional: funcionar sem depender de CDN

Se preferir não depender de internet/CDN, você pode baixar as bibliotecas e colocá-las
junto dos arquivos, trocando os endereços no `index.html`:

- React 18.3.1 (`react.production.min.js`)
- ReactDOM 18.3.1 (`react-dom.production.min.js`)
- react-is 18.3.1 (`react-is.production.min.js`)
- Recharts 2.12.7 (`Recharts.min.js`)
- XLSX 0.18.5 (`xlsx.full.min.js`)
- Tailwind Play CDN (`https://cdn.tailwindcss.com`)

Baixe cada um, salve na pasta e ajuste os `src=` no `index.html` para apontar para os
arquivos locais.
