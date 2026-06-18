# Painel GOP — v1.0.0

Painel web para acompanhamento mensal de metas e premiação de colaboradores
de call center. **100% HTML/CSS/JS puro**, sem nenhuma biblioteca externa e
sem carregar nada da internet — funciona em redes corporativas que bloqueiam
CDNs e no GitHub Pages.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página (carregue/abra este) |
| `styles.css` | Estilos |
| `xlsx.js` | Leitor de planilhas `.xlsx` sem biblioteca (usa `DecompressionStream` nativo) |
| `regras.js` | Regras de negócio (níveis G6→G1, corte, prioridades, premiação) |
| `pptx.js` | Gerador de apresentação `.pptx` sem biblioteca |
| `app.js` | Aplicação (telas, gráficos SVG, importação, administração) |
| `perfis_regras.json` | Perfis-semente carregados no primeiro uso |
| `.nojekyll` | Impede o GitHub Pages de processar os arquivos com Jekyll |

## Como publicar no GitHub Pages

1. Crie um repositório e envie **todos** estes arquivos para a raiz (incluindo
   o `.nojekyll`, que é um arquivo vazio mas obrigatório).
2. Em **Settings → Pages**, escolha a branch (`main`) e a pasta `/ (root)`.
3. Aguarde alguns minutos e acesse a URL gerada.

> O `perfis_regras.json` precisa ficar **na mesma pasta** do `index.html`. Na
> primeira abertura o painel o carrega para semear os perfis; depois disso tudo
> fica salvo no navegador (localStorage, chave `gop:data`) e o app funciona
> mesmo sem o arquivo.

## Como usar

1. **Importar planilha** — escolha mês/ano e o `.xlsx`. O painel lê o arquivo,
   mostra uma pré-visualização (linhas lidas, matrículas novas/conhecidas) e só
   grava após você confirmar. Matrículas novas podem ser criadas automaticamente.
2. **Visão geral** — KPIs do mês, filtros e cards por matrícula.
3. **Tela do colaborador** — donut de atingimento, prioridades ("onde focar"),
   indicadores batendo/abaixo, gráfico por meta e comparativo mês a mês. Botão
   **Baixar apresentação (PPT)** gera um `.pptx` do colaborador.
4. **Administração** — colaboradores, supervisores, perfis de metas e histórico
   de importações.

A planilha de exemplo `Exemplo_Junho_2026.xlsx` acompanha esta entrega para você
testar o fluxo de importação.

## Privacidade

O painel **nunca exibe nomes** — colaboradores são identificados apenas pela
matrícula. Os dados ficam somente no navegador; não há backend.
