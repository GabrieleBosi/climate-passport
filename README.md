# 🌿 Climate Passport

**Where does your houseplant think it lives?**

Every houseplant carries the climate of its ancestors. Climate Passport compares that native climate with the room your plant sits in now, tells you which gap it feels most, and gives you a shareable passport card.

**Live app:** https://plant-climate-passport.netlify.app

---

## How it works

1. **Pick a plant.** Search 36 common houseplants by common or scientific name. You get the native region, the habitat, and a short origin story.
2. **Say where it lives now.** Type a city or postcode, or share your location. The app fetches the current outdoor temperature and humidity from Open-Meteo, then estimates what that air becomes inside a heated or cooled room.
3. **Add indoor readings, if you have them.** A hygrometer or thermometer reading, and the light at the plant's spot, replace the estimate.
4. **Read the insights.** The app ranks the humidity, temperature, and light gaps by severity and explains each one in plain language, for example "Your room is running ~40 points drier than the 70–90% humidity of the lowland tropical rainforest."
5. **Get the passport.** A card shows the plant, a world map with its origin, native versus home conditions side by side, a match score, and a one-line verdict. Download it as a PNG, share the summary, or save the plant to your collection.

No account. No backend. Your collection stays in your browser.

---

## Run it locally

You need Node.js 18 or newer.

```bash
git clone https://github.com/GabrieleBosi/climate-passport.git
cd climate-passport
npm install
npm run dev
```

Open the address Vite prints, usually http://localhost:5173.

| Command           | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload           |
| `npm test`        | Run the unit tests                             |
| `npm run build`   | Type-check and build the production bundle     |
| `npm run preview` | Serve the production bundle locally            |

---

## Deploy

The app is a static site. Netlify builds it from `main` on every push using `netlify.toml`, which sets the build command, the `dist` folder, Node 22, and a single-page-app redirect.

To deploy anywhere else, run `npm run build` and host the `dist` folder.

---

## Project layout

```
src/
├── App.tsx                 page state, weather fetch, save and export actions
├── styles.css              all styles; the .passport block is the card
├── components/
│   ├── PlantSearch.tsx     search box and species summary
│   ├── HomeProfile.tsx     location lookup, outdoor and indoor readings
│   ├── IndoorOverrides.tsx manual humidity, temperature and light inputs
│   ├── Insights.tsx        ranked plain-language insights
│   ├── PassportCard.tsx    the shareable card
│   ├── WorldMap.tsx        small SVG map with the origin marker
│   └── Collection.tsx      saved plants
├── data/
│   ├── plants.ts           the plant database
│   └── world.ts            simplified land outlines for the map
└── lib/
    ├── compare.ts          comparison engine, scoring, verdicts
    ├── humidity.ts         dew-point maths for the indoor estimate
    ├── weather.ts          Open-Meteo geocoding and forecast client
    ├── storage.ts          localStorage persistence
    ├── types.ts            shared types
    └── compare.test.ts     unit tests
```

---

## Add a plant

Append an entry to `src/data/plants.ts`:

```ts
{
  id: 'ficus-lyrata',
  commonName: 'Fiddle-leaf fig',
  scientificName: 'Ficus lyrata',
  family: 'Moraceae',
  nativeRegion: 'West Africa, from Sierra Leone to Cameroon',
  regionLabel: 'West Africa',
  habitat: 'lowland tropical rainforest',
  origin: { lat: 5.0, lon: -1.0 },
  climate: {
    humidity: [70, 90],
    temp: [22, 32],
    light: 'bright-indirect',
    rainfall: 'Heavy rain most of the year, with a short drier season',
  },
  story: 'Starts life high in the canopy as a strangler fig ...',
}
```

Then run `npm test`. The tests check that every entry has a unique id, valid ranges, and coordinates inside the map.

Light levels are `low`, `medium`, `bright-indirect`, or `direct`. Humidity is % RH and temperature is °C.

---

## How the numbers are made

**Indoor estimate.** Rooms hold roughly the same moisture as the air outside, but they are heated to about 20 °C or cooled to about 26 °C. The app converts the outdoor reading to a dew point and recomputes relative humidity at the indoor temperature. This is why a cold, wet winter day becomes a dry apartment.

**Severity.** Each factor gets a signed distance from the native range. Humidity bands are 5, 15, and 30 points. Temperature bands are 2, 5, and 9 °C. Light is one or two steps on the four-level scale.

**Score.** A weighted 0–100 match: humidity 40, light 35, temperature 25. Each factor loses part of its weight by severity.

**Data.** Native ranges and habitats come from Kew Plants of the World Online, the Missouri Botanical Garden Plant Finder, the RHS plant database, and Wikipedia species pages. Climate bands are typical growing-season values for the habitat, rounded to sensible ranges. They describe the ancestral niche, not the tightest tolerance of a cultivated plant.

---

## Roadmap ideas

- Seasonal view using Open-Meteo climate normals
- Hardware input from a Bluetooth or MQTT hygrometer
- More species and cultivar-specific tolerances
- Share a passport by URL, not only as a PNG

---

## Credits

Weather and geocoding by [Open-Meteo](https://open-meteo.com/). Built with React, TypeScript, and Vite.
