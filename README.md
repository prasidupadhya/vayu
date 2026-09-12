# Vayu

Vayu is a responsive weather dashboard built with Vite, React, and TypeScript. It shows current conditions, hourly weather, and a seven-day outlook with animated weather artwork from Meteocons.

## Features

- Search cities and places with live location suggestions
- Use browser geolocation for local weather
- Current temperature, feels-like temperature, humidity, wind, pressure, and visibility
- Eight-hour forecast with precipitation probability
- Seven-day forecast with daily highs, lows, and rain probability
- Sunrise and sunset information
- Animated condition and metric icons from Meteocons
- Day/night and weather-aware visual atmosphere
- Last selected location persisted locally in the browser
- Responsive layouts for desktop, tablet, and mobile
- Keyboard-accessible location search and reduced-motion support

## Development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Run the TypeScript compiler independently with:

```bash
npm run typecheck
```

## Data and icons

Weather forecasts and place search are provided by [Open-Meteo](https://open-meteo.com/). The app does not require a client-side weather API key.

Animated weather artwork is provided by [Meteocons](https://github.com/basmilius/meteocons) through the `@meteocons/svg` package under the MIT license.

## Tech stack

- Vite
- React
- TypeScript
- Open-Meteo Forecast API
- Open-Meteo Geocoding API
- Meteocons animated SVGs
- Lucide React for interface controls
