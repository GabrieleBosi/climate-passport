# Climate Passport

A web app that tells you where your houseplant *thinks* it lives.

Pick a species, enter your city, and the app compares the plant's native
ancestral climate (humidity, temperature, light) with the conditions in your
home. It surfaces the biggest mismatches as plain-language insights and
generates a shareable **Climate Passport** card that you can download as a PNG.

## Features (v1)

- **Plant lookup** from a seeded database of 36 common houseplants, each with
  scientific name, native region, habitat, a short origin story, and a native
  climate profile (humidity range, temperature range, light, rainfall pattern).
- **Home profile** from a city or postcode, or the browser's location. Current
  outdoor temperature and humidity come from [Open-Meteo](https://open-meteo.com/)
  (free, no API key).
- **Indoor estimate**: outdoor readings are converted to a likely indoor value.
  The app assumes a room heated to 20 °C or cooled to 26 °C that holds the same
  moisture as the outside air. This is why a cold, humid winter day turns into
  a dry apartment.
- **Manual overrides** for indoor humidity, temperature, and light level, for
  people with a hygrometer or a known windowsill.
- **Comparison engine** that computes signed deltas against the native ranges,
  ranks them by severity, and writes 2–3 insights plus a verdict and a
  0–100 match score.
- **Passport card** with a small world map that marks the native region, a
  native-vs-home table, a verdict line, and a stamp. Export to PNG or share
  the summary text.
- **Collection**: save plants with their location and readings to
  `localStorage` and reopen them later.

## Install and run

Requirements: Node.js 18 or later.

```bash
npm install
npm run dev
```

Open the URL that Vite prints (usually `http://localhost:5173`).

Other commands:

```bash
npm test        # unit tests for the comparison engine and plant data
npm run build   # type-check and build to dist/
npm run preview # serve the production build
```

There is no backend. The browser calls Open-Meteo directly, so the app works
from any static host.

## Project structure

```
src/
  main.tsx                 entry point
  App.tsx                  page state, weather fetch, save/export actions
  styles.css               all styles (the .passport block is the card)
  components/
    PlantSearch.tsx        search box and species summary
    HomeProfile.tsx        location lookup and outdoor/indoor readings
    IndoorOverrides.tsx    manual humidity, temperature and light inputs
    Insights.tsx           ranked plain-language insights
    PassportCard.tsx       the shareable card
    WorldMap.tsx           small SVG map with an origin marker
    Collection.tsx         saved plants list
  data/
    plants.ts              seeded species database (sources in comments)
    world.ts               simplified land outlines for the map
  lib/
    types.ts               shared types
    compare.ts             comparison engine, scoring, verdicts
    humidity.ts            dew point maths for the indoor estimate
    weather.ts             Open-Meteo geocoding and forecast client
    storage.ts             localStorage persistence
    compare.test.ts        unit tests
```

## Data notes

Native ranges and habitats come from general botanical references: Kew Plants
of the World Online, the Missouri Botanical Garden Plant Finder, the RHS plant
database, and Wikipedia species pages. Climate bands are typical growing-season
values for the native habitat, rounded to sensible ranges. They describe the
ancestral niche, not the tightest tolerance of a cultivated plant.

To add a species, append an entry to `src/data/plants.ts`. The test suite
checks that every entry has valid ranges and coordinates.

## Ideas for v2

- Seasonal view: show how the gap changes through the year using Open-Meteo
  climate normals.
- Hardware input: read a Bluetooth or MQTT hygrometer.
- More species, and cultivar-specific tolerances.
- Passport sharing by URL instead of PNG only.
