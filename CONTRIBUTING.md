# Contributing

This repo lands work as **one branch per change**, stacked from the previous green commit.

## Branches

Cut a branch from a clean tree. Do not mix two features in one commit.

## Checks

```bash
npm install
npm run typecheck
npm test
npm run lint
```

## Demo

```bash
npm run dev
```

Open the local Vite URL. Exercise list/cards, selection, menus, and drag-and-drop before sending a PR.

CI runs typecheck, tests, and lint on pull requests and on `main`.
