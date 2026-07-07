# Lake Macquarie EV & E-Bus Survey — Web 

An online questionnaire based on **LM_EV_eBus_Questionnaire_v4.10**, for **pilot testing** or as a **SurveyEngine programming reference**.

## Quick start (standalone HTML — recommended)

No Node.js required. Open directly in a browser:

```
survey.html
```

For external sharing, upload these files to static hosting (e.g. GitHub Pages):

- `survey.html`
- `suburbs-data.js`
- `assets/` (logos)

**Live example (GitHub Pages):**

```
https://xihaoning666.github.io/EV-Survey/survey.html
```

## Quick start (React + Vite)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

Production build:

```bash
npm run build
npm run preview
```

The `dist/` folder can be deployed to any static host (Netlify, GitHub Pages, university server, etc.).

## Features

- **Parts 0–10** — welcome, screening, travel, home & charging, EV intentions, attitudes, DCE-A/B, energy views, charger priorities, demographics, close
- **v4.10 routing logic**:
  - Terminate if respondent is outside Lake Macquarie / Newcastle LGA
  - Zero-car households skip Q2.2–Q2.5; show Q4.5
  - `USUAL_CENTRE_MODE` drives DCE-B status-quo label and car-cost display
  - `HOME_CHARGE_FEASIBLE` routes DCE-A charging access and electricity-cost bands
  - Lake Macquarie On Demand shown by suburb lookup only
  - Non-drivers cannot select “Drive myself”
  - LGA-routed consequentiality text and Q8B suburb dropdown
- **Randomisation**: `ORDER_ATT` (attitudes pre/post DCE, 50/50), `ORDER_DCE` (A-first / B-first), shuffled attitude and moderator items
- **DCE pilot tasks**: 8 DCE-A + 6 DCE-B example designs (replace with Ngene matrices for main fieldwork)
- **Export**: download **JSON** on completion (includes computed variables and design metadata)

## Relationship to SurveyEngine

Main fieldwork is intended for **SurveyEngine**:

1. Create a new project in the SurveyEngine dashboard
2. Program logic from this specification, or use **Export/Import Codeplan** (Excel)
3. Import the DCE design from **Ngene** (8 DCE-A tasks, 6 DCE-B tasks)
4. Use this web prototype for pilot feedback or logic cross-checks

SurveyEngine documentation: <https://surveyengine.com/software-tutorials/how-to-build-an-online-questionnaire/>

## Project structure

```
survey.html            # Standalone questionnaire (no build step)
suburbs-data.js        # Suburb / LGA / zone lookup
assets/                # UON & LMCC logos

src/
  App.tsx              # React version — main flow and all parts
  types.ts             # Answer data structures
  data/constants.ts    # Attitude text, scales, vehicle bases
  data/suburbs.ts      # TypeScript suburb data (source for suburbs-data.js)
  utils/compute.ts     # Derived variables and DCE task generation
  utils/export.ts      # JSON/CSV export
  components/          # Reusable form components
```

## Notes

- DCE attribute levels in this prototype are **pilot examples**, not the final Ngene design matrix
- Replace `[TBC]` with the HREC approval number before any data collection
- Lock the **reference month** (Opal fares, electricity tariffs, fuel prices, vehicle prices) before main fieldwork — currently stamped as `2026-07` in the prototype
- For GitHub Pages, use `survey.html` (or the root `index.html` redirect). The React `index.html` requires a Vite build and does not run as-is on static hosting

## Tech stack

**Standalone:** HTML · JavaScript · no backend

**React version:** React 18 · TypeScript · Vite · static deployment
