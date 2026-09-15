# Tableaux Frontend

A generic React client for the [tableaux backend](https://github.com/campudus/tableaux). See
[README.md](./README.md) for setup and configuration, and [CONTEXT.md](./CONTEXT.md) for the
project's vocabulary.

## Verification

Narrowest checks, in the order they're worth running:

```sh
npx vitest run <path>      # tests live beside the source as *.test.{js,jsx,ts,tsx}
npx tsc --noEmit           # no standalone script; `npm run build` wraps it
npm run lint:changes       # eslint on files that differ from master
```

`npm test` needs `NODE_ICU_DATA=./node_modules/full-icu`; use the script rather
than a bare `vitest` for the full suite.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, used verbatim as label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
