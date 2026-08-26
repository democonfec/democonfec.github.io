# Linha Clara — demonstração para confecções

Demonstração comercial de um sistema operacional sob medida para confecções, uniformes, estamparias e operações semelhantes. Todos os dados são fictícios; esta não é uma solução universal nem um ERP completo.

## Stack e execução

Requer Node.js 22+ e pnpm.

```bash
pnpm install
pnpm dev
```

Checks e build:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

## Estrutura

- `src/data.ts`: seed único, coerente e relativo ao dia atual.
- `src/store.tsx`: estado React, operações e persistência versionada em `localStorage`.
- `src/selectors.ts`: indicadores, alertas, estoque e agregados derivados.
- `src/App.tsx`: rotas, telas e fluxos da demonstração.
- `src/styles.css`: design responsivo mobile-first, sem assets externos.

As rotas usam `HashRouter`, por exemplo `/#/pedidos` e `/#/producao`, para funcionar diretamente no GitHub Pages.

## Personalização por link

- `?empresa=AGV%20Confecções`
- `?cor=2563eb`
- combinação: `https://democonfec.github.io/?empresa=AGV%20Confecções&cor=2563eb#/`

Os valores da URL são efêmeros, validados e não substituem o aviso de ambiente demonstrativo. A ação **Restaurar dados** recria o seed e mantém a política do tour separada.

## GitHub Pages

O repositório é um user site, portanto o Vite usa `base: '/'` e a URL esperada é `https://democonfec.github.io/`. O workflow `.github/workflows/deploy.yml` valida e publica `dist`.

No GitHub, confirme uma vez: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
