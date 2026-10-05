# Environment marker

Status: ready-for-agent
Ticket: GRUD_DEV-1254

## Problem

Customers sometimes report wrong data in GRUD that turns out to live in their test
instance, not in production. Today only the URL tells the two apart. Instances that are not
production should say so in the UI itself.

## Terms

See **Environment** and **Environment marker** in [CONTEXT.md](../../CONTEXT.md).

## Behaviour

### Environment

- Values: `production`, `staging`, `test`.
- Unset, empty, `production` or anything unrecognized → production. Production shows no
  marker at all.
- An unrecognised value (anything other than empty, `production`, `staging`, `test`) logs a
  warning on server start, next to the existing "Overriding … from env" output. No client-side
  warning.

### Configuration

Runtime configuration through the existing path: `server/config.js` (defaults ← `config.json`
← env) → served at `/config.json` → `initConfig` in the client. The same image runs in every
environment; no rebuild.

| config.json key        | env variable             | value                             |
| ---------------------- | ------------------------ | --------------------------------- |
| `grudEnvironment`      | `GRUD_ENVIRONMENT`       | `production` · `staging` · `test` |
| `grudEnvironmentColor` | `GRUD_ENVIRONMENT_COLOR` | any CSS color, optional           |

The `GRUD_` prefix is deliberate: a generic `ENVIRONMENT` variable is often already set in
container deployments and must not switch the marker on by accident.

Add both keys to `envParams` in `server/config.js`, to the `Config` type in
`TableauxConstants.ts`, and to the env-variable list in `README.md`.

### Marker (staging and test only)

**Banner**, matching the concept screenshot:

- A thin full-width strip above everything else, on every route (dashboard, tables, profile,
  taxonomies, services, …).
- Pushes the layout down, not overlaid on it.
- Stays visible above full-screen overlays (attachment, link, … overlays start below it).
- Not dismissible.
- Centered content: flask icon, bold environment name, `·`, explanation.
- The header/toolbar is not tinted. No intensity setting. The concept's "Tweaks" panel was a
  prototype tool and is not part of the feature.

**Tab title**: prefix `document.title` with a short tag, e.g. `[TEST] GRUD`.

### Colour

- Defaults: test = lime (as in the concept), staging = orange.
- `grudEnvironmentColor` overrides the background with any CSS color.
- Text colour (black or white) is picked automatically for contrast with the background.

### Texts

i18n via the existing locales (`de`, `en`), following the user's UI language.

| environment | banner (de)                                                                         | banner (en)                                                            | tab prefix  |
| ----------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| test        | **Testsystem** · Änderungen hier wirken sich nicht auf das Produktivsystem aus.     | **Test system** · Changes made here do not affect your live system.    | `[TEST]`    |
| staging     | **Staging-System** · Änderungen hier wirken sich nicht auf das Produktivsystem aus. | **Staging system** · Changes made here do not affect your live system. | `[STAGING]` |

The concept's "…website or shop" is dropped on purpose: it is not true for every customer.

## Acceptance

- No config → no banner, unchanged title.
- `GRUD_ENVIRONMENT=test` → lime banner with the test text on every route, `[TEST]` title prefix.
- `GRUD_ENVIRONMENT=staging` → orange banner, `[STAGING]` prefix.
- `GRUD_ENVIRONMENT=test GRUD_ENVIRONMENT_COLOR=#123456` → dark banner with white text.
- `GRUD_ENVIRONMENT=tset` → behaves as production, server logs a warning on start.
- `ENVIRONMENT=staging` alone → behaves as production.
- Opening a full-screen overlay leaves the banner visible.
- Switching UI language switches the banner text.
