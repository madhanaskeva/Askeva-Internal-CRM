# Askeva Internal CRM — HTML → React migration

The original app (`../Internal CRM/`) was a single `index.html` built on a template
runtime (`support.js`): 21 views toggled by `<sc-if>` blocks with `{{ }}` bindings,
one logic class (`renderVals()` + ~50 mutations), all state in `localStorage`.
This project rebuilds it with React 19, React Router 7, Redux Toolkit 2 and Ant Design 6.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## What went where

| Original | React |
|---|---|
| `support.js` (template runtime) | Not needed — React itself |
| `_ds/_ds_bundle.js` (design-system components) | Not used by the app markup; not migrated |
| `_ds/tokens/*.css` | `src/styles/global.css` `:root` variables (+ `styles/antdTheme.js`) |
| inline colours (`#B42318`, `#FFF1EE`, `#F4F2EA`, `#E3E0D5`, `#CFCBBE`, `#FAF9F4`) | `--danger`, `--danger-bg`, `--done-bg`, `--track-bg`, `--divider`, `--hover-bg` |
| 1,767 inline `style` attributes | utility + component classes in `global.css`, page CSS files |
| `assets/logo-01.png`, `assets/logo.png` | `src/assets/images/logo-green.png`, `logo-ink.png` via `src/assets/images.js` |
| `STAGES`, `GATES`, `ROLES`, `ROLE_NAV`, `TRANS`, … | `src/data/stages.js`, `roles.js`, `workflow.js`, `rules.js` (all re-exported by `src/data/index.js`) |
| `seed()` + constructor migrations | `src/data/projects.js`, `tasks.js`, … (arrays) → `src/utils/storage/seed.js` (`seed()`), `src/utils/storage/migrations.js` |
| `localStorage` key `askeva-pc-crm-v2` (fallback `-v1`) | Split on first load into one key per dataset (`data/storageKeys.js` → `STORAGE_KEYS`) by `utils/storage/crmStorage.js`; all reads/writes go through `utils/storage/storage.js` — existing saved data is picked up |
| `this.state.data` + `mut()` + syslog | Entity utils `utils/entities/projectUtils.js`, `taskUtils.js`, `bugUtils.js`, `releaseUtils.js`, … (find/filter/map on localStorage, built on `utils/storage/collection.js`); every change appends the audit log (`utils/entities/syslogUtils.js`). React reads it with `useCrmData()` (`utils/storage/crmData.js`). **Not in Redux.** |
| role / pmId / signedIn / client project | `redux/slices/sessionSlice.js` (kept in `sessionStorage` so refresh keeps the role) |
| toast, task drawer, form modal, shared action note | `redux/slices/uiSlice.js` |
| permission checks + toasts (`moveTask`, `moveBug`, `deployRelease`, `goRelease`, `setRule`, …) | `utils/actions/*` — take a `ctx`, return `{ ok, message, … }`; no Redux. Pages call them through `useAction()` in `app/useCrm.js`, which shows the toast / clears the note |
| PM project scoping (`data` vs `fullData`) | `utils/storage/crmData.js` → `scopeData`; pages use `useData()` / `useFullData()` from `app/useCrm.js` |
| `health()`, `fin()`, alerts, `mapTask`, `finRows`, `deadlineRows` | `src/utils/domain/*.js` (pure) + memoised selectors |
| `openModal()` field sets + `submit()` | `src/components/forms/modalForms.js` + `utils/actions/formActions.js`, rendered by `components/modals/FormModal` (antd Modal + Form) |
| task drawer | `components/modals/TaskDrawer` (antd Drawer) |
| sign-in / switch-role overlay | `pages/Login` + `components/modals/RoleSwitchModal` (`RolePicker`) |
| `view` state + `go()` | React Router (`routes/AppRoutes.jsx`, `data/routes.js` + `utils/helpers/routes.js`; pages call `navigate(pathFor(view))` directly) |
| `window.prompt` (hold reason) | antd Modal |

## Routes

| View | Path | Roles (sidebar) |
|---|---|---|
| Dashboard | `/dashboard` | SuperAdmin, Admin, PM, PC |
| Projects / detail | `/projects`, `/projects/:projectId` | SuperAdmin, Admin, PM, PC |
| Deadlines | `/deadlines` | SuperAdmin, Admin, PM, PC |
| Change requests | `/change-requests` | SuperAdmin, Admin, PM, PC |
| Client communication | `/communication` | SuperAdmin, Admin, PM, PC |
| Tester (team QA) | `/tester` | SuperAdmin, Admin, PM, PC |
| Deploy | `/deploy` | SuperAdmin, Admin, PM, PC, DevOps |
| Daily audit | `/audit` | all except Client |
| Team | `/team?person=&range=` | SuperAdmin, Admin, PM, PC |
| P&L | `/pnl` | SuperAdmin, Admin |
| Finance | `/finance` | SuperAdmin, Admin (+ dashboard shortcut) |
| Salary & payroll | `/salary` | SuperAdmin, Admin |
| Settings | `/settings` | SuperAdmin, Admin |
| System log | `/system-log` | SuperAdmin |
| Tasks | `/tasks` | PC, devs, Tester (+ dashboard shortcut) |
| Follow-ups | `/follow-ups` | PC (+ dashboard shortcut) |
| My work / Inbox | `/my-work`, `/inbox` | Frontend, Backend, DevOps |
| QA dashboard | `/qa` | Tester |
| Client portal | `/client-portal` | Client |

`/login` is the sign-in (role picker). A URL outside the current role's views redirects
to that role's landing page.

## Styling rules

- **All CSS lives in `src/styles/`**. Nothing under `pages/` or `components/` imports CSS.
  - `global.css`: design tokens (`:root` variables), base styles, and the shared component, layout, and utility classes. It is imported once, in `main.jsx`.
  - `utilities.css`: generated `w-pct-N` / `h-pct-N` / `l-pct-N` classes (0–100). Use them via `utils/helpers/classNames.js` (`wPct`, `hPct`, `lPct`) for data-driven bar sizes.
  - `pages/<Page>.css`: page-specific classes, pulled in through `pages/index.css`.
- **No inline `style` attributes.** Colours come from tone classes (`.tone-lime`, `.tone-danger`, …) and text classes (`.text-danger`, …). There are no hard-coded hex values outside `:root`.
- `styles/antdTheme.js` mirrors the tokens for Ant Design, because antd needs literal colour values.

## State rules

- **Redux**: the CRM dataset (single source of truth), session, and cross-page UI
  (toast, drawer, modal, shared action note, current view for the audit log).
- **Component state**: filters, tabs, period chips, drafts, selected month, etc.
- **No React Context** for app state (only antd's `ConfigProvider` / `App`).
- No backend exists — there are no API calls; persistence is `localStorage` exactly as before.

## Behaviour notes (deliberate, for parity with the original)

- The QA **search bar and role filter** only narrow the tester's *Queue · retest · decisions* lists. This is true on both QA pages; the analytics panels ignore them, as in the original.
- On the Daily audit, the **PC / PM sign-off** buttons can be clicked by any role that can see the row (the original did not restrict them).
- *Tasks closed* on a PC's Team record counts each close event twice. The original formula is kept.
- Small intentional changes:
  - The *Bug age red flag* rule (Settings) now drives the QA age colour. The original hard-coded 3 days, which is also the default.
  - The payroll month defaults to the current month; the original hard-coded Sept 2026.
  - "Put on hold" asks for the reason in a modal instead of `window.prompt`.

## Authentication

The original prototype had none ("Authentication is out of scope for this prototype") —
you pick a role. That behaviour is preserved; `ProtectedRoute` only checks that a role
is selected, and `RequireView` enforces the role's navigation.
