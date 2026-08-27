# Ilha Prints — demo de gestão para gráfica

Demonstração comercial, com dados fictícios, de um sistema operacional para gráfica e comunicação visual. A experiência centraliza pedido, prova de arte, aprovação por versão, produção, materiais e instalação.

## O que funciona

- dashboard com indicadores e alertas derivados do estado;
- busca e filtros de pedidos, detalhe operacional e histórico;
- arte com versões imutáveis e distinção entre versão atual e aprovada;
- portal demonstrativo para aprovar uma versão exata ou solicitar alteração;
- quadro de produção com gate de aprovação;
- orçamentos, incluindo conversão única de orçamento aprovado em pedido;
- clientes, materiais, reservas, disponibilidade e faltas;
- criação de pedidos, persistência local e restauração da massa fictícia.

## Stack

React, TypeScript, Vite, React Router, date-fns, lucide-react e localStorage. Não há backend, login real ou integração externa.

## Executar

```bash
npm ci
npm run dev
```

Validação:

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Estrutura

- `src/data/seed.ts`: dados fictícios com datas relativas ao dia do primeiro carregamento;
- `src/types/domain.ts`: contratos de pedidos, artes, aprovações, orçamentos e materiais;
- `src/lib/selectors.ts`: indicadores, alertas e regras derivadas;
- `src/hooks/usePrintStore.ts`: ações e persistência versionada;
- `src/App.tsx`: módulos, fluxos e portal demonstrativo;
- `src/index.css`: sistema visual e responsividade.

Para restaurar os dados iniciais, use **Restaurar demo** no menu lateral. O armazenamento incompatível ou inválido é descartado de forma segura e substituído por um novo seed.

Esta demo não representa uma implantação real. Etapas, campos e regras podem ser adaptados após diagnóstico da operação.
