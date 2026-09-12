import barometerIcon from '@meteocons/svg/fill/barometer.svg'
import humidityIcon from '@meteocons/svg/fill/humidity.svg'
import sunriseIcon from '@meteocons/svg/fill/sunrise.svg'
import sunsetIcon from '@meteocons/svg/fill/sunset.svg'
import thermometerIcon from '@meteocons/svg/fill/thermometer.svg'
import windIcon from '@meteocons/svg/fill/wind.svg'
import { ArrowUp, LocateFixed, MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import LocationSearch from './components/LocationSearch'
import WeatherIcon from './components/WeatherIcon'
import { getWeather, getWeatherCondition, makeDeviceLocation } from './lib/weather'
import type { WeatherLocation, WeatherSnapshot } from './types/weather'

const DEFAULT_LOCATION: WeatherLocation = {
  name: 'Barcelona',
  country: 'Spain',
  countryCode: 'ES',
  admin1: 'Catalonia',
  latitude: 41.3888,
  longitude: 2.159,
  timezone: 'Europe/Madrid',
}

const LAST_LOCATION_KEY = 'vayu:last-location'

function getInitialLocation(): WeatherLocation {
  try {
    const storedLocation = window.localStorage.getItem(LAST_LOCATION_KEY)
    if (!storedLocation) {
      return DEFAULT_LOCATION
    }

    const parsed = JSON.parse(storedLocation) as WeatherLocation
    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number'
    ) {
      return DEFAULT_LOCATION
    }

    return parsed
  } catch {
    return DEFAULT_LOCATION
  }
}

function getWeatherTone(code?: number) {
  if (code === undefined) return 'neutral'
  if (code === 0 || code === 1) return 'clear'
  if (code === 2 || code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'neutral'
}

function roundTemperature(value: number) {
  return Math.round(value)
}

function formatHour(value: string) {
  const [, time = ''] = value.split('T')
  return time.slice(0, 5)
}

function formatDay(value: string, index: number) {
  if (index === 0) {
    return 'Today'
  }

  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function formatLocation(location: WeatherLocation) {
  const region = location.admin1 && location.admin1 !== location.name ? location.admin1 : undefined
  return [region, location.country].filter(Boolean).join(', ')
}

function App() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>(getInitialLocation)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const weatherRequestRef = useRef<AbortController | null>(null)

  const loadWeather = async (location: WeatherLocation) => {
    weatherRequestRef.current?.abort()
    const controller = new AbortController()
    weatherRequestRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const snapshot = await getWeather(location, controller.signal)
      setWeather(snapshot)
      setSelectedLocation(location)
      window.localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location))
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }

      setError(requestError instanceof Error ? requestError.message : 'Unable to load weather data.')
    } finally {
      if (weatherRequestRef.current === controller) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadWeather(selectedLocation)

    return () => {
      weatherRequestRef.current?.abort()
    }
  }, [])

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError('Device location is not available in this browser.')
      return
    }

    setLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = makeDeviceLocation(position.coords.latitude, position.coords.longitude)
        void loadWeather(location).finally(() => setLocating(false))
      },
      (locationError) => {
        setLocating(false)
        setError(locationError.message || 'Unable to access your device location.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  const condition = weather ? getWeatherCondition(weather.current.weatherCode) : null
  const currentHourIndex = useMemo(() => {
    if (!weather) {
      return 0
    }

    const exactIndex = weather.hourly.findIndex((entry) => entry.time >= weather.current.time)
    return exactIndex >= 0 ? exactIndex : 0
  }, [weather])

  const nextHours = weather?.hourly.slice(currentHourIndex, currentHourIndex + 8) ?? []
  const currentVisibility = weather?.hourly[currentHourIndex]?.visibility ?? 0
  const today = weather?.daily[0]
  const pageTone = weather?.current.isDay ? 'day' : 'night'
  const weatherTone = getWeatherTone(weather?.current.weatherCode)

  return (
    <main className={`weather-app weather-app--${pageTone} weather-app--${weatherTone}`}>
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      <div className="app-frame">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="Vayu home">
            <span className="brand-symbol" aria-hidden="true">
              V
            </span>
            <span>
              <strong>Vayu</strong>
              <small>Weather, clearly</small>
            </span>
          </a>

          <div className="topbar-location" aria-live="polite">
            <MapPin size={16} strokeWidth={1.8} />
            <span>{selectedLocation.name}</span>
          </div>
        </header>

        <section className="workspace" id="top">
          <div className="workspace-main">
            <div className="search-row">
              <LocationSearch
                onSelect={(location) => void loadWeather(location)}
                onUseLocation={useDeviceLocation}
                locating={locating}
              />
            </div>

            {error ? (
              <div className="status-banner status-banner--error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => void loadWeather(selectedLocation)}>
                  Try again
                </button>
              </div>
            ) : null}

            <section className={`hero-panel ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
              <div className="hero-copy">
                <div className="location-line">
                  <span className="location-name">{selectedLocation.name}</span>
                  {formatLocation(selectedLocation) ? (
                    <span className="location-region">{formatLocation(selectedLocation)}</span>
                  ) : null}
                </div>

                {weather && condition ? (
                  <>
                    <div className="temperature-row">
                      <span className="temperature-value">
                        {roundTemperature(weather.current.temperature)}
                      </span>
                      <span className="temperature-unit">°C</span>
                    </div>

                    <div className="condition-row">
                      <WeatherIcon
                        className="condition-icon"
                        code={weather.current.weatherCode}
                        decorative
                        isDay={weather.current.isDay}
                      />
                      <span>{condition.label}</span>
                    </div>

                    <p className="weather-summary">
                      Feels like {roundTemperature(weather.current.apparentTemperature)}°. Today reaches{' '}
                      {roundTemperature(today?.temperatureMax ?? weather.current.temperature)}° with a low of{' '}
                      {roundTemperature(today?.temperatureMin ?? weather.current.temperature)}°.
                    </p>
                  </>
                ) : (
                  <div className="hero-skeleton" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>

              <div className="weather-orb" aria-hidden="true">
                <div className="weather-orb__halo" />
                {weather ? (
                  <WeatherIcon
                    className="weather-orb__icon"
                    code={weather.current.weatherCode}
                    decorative
                    isDay={weather.current.isDay}
                  />
                ) : null}
              </div>

              {weather ? (
                <div className="hero-meta">
                  <span>Updated {formatHour(weather.current.time)}</span>
                  <span>{weather.timezoneAbbreviation}</span>
                </div>
              ) : null}
            </section>

            <section className="metric-grid" aria-label="Current conditions">
              <article className="metric-card">
                <div className="metric-icon">
                  <img alt="" aria-hidden="true" src={thermometerIcon} />
                </div>
                <div>
                  <span className="metric-label">Feels like</span>
                  <strong>{weather ? `${roundTemperature(weather.current.apparentTemperature)}°` : '—'}</strong>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-icon">
                  <img alt="" aria-hidden="true" src={humidityIcon} />
                </div>
                <div>
                  <span className="metric-label">Humidity</span>
                  <strong>{weather ? `${Math.round(weather.current.humidity)}%` : '—'}</strong>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-icon">
                  <img alt="" aria-hidden="true" src={windIcon} />
                </div>
                <div>
                  <span className="metric-label">Wind</span>
                  <strong>{weather ? `${Math.round(weather.current.windSpeed)} km/h` : '—'}</strong>
                </div>
                {weather ? (
                  <ArrowUp
                    className="wind-arrow"
                    size={16}
                    style={{ transform: `rotate(${weather.current.windDirection}deg)` }}
                    aria-label={`Wind direction ${Math.round(weather.current.windDirection)} degrees`}
                  />
                ) : null}
              </article>

              <article className="metric-card">
                <div className="metric-icon">
                  <img alt="" aria-hidden="true" src={barometerIcon} />
                </div>
                <div>
                  <span className="metric-label">Pressure</span>
                  <strong>{weather ? `${Math.round(weather.current.pressure)} hPa` : '—'}</strong>
                </div>
              </article>

              <article className="metric-card metric-card--wide">
                <div className="metric-icon metric-icon--plain">
                  <Search size={19} />
                </div>
                <div>
                  <span className="metric-label">Visibility</span>
                  <strong>{weather ? `${Math.round(currentVisibility / 1000)} km` : '—'}</strong>
                </div>
                <div className="visibility-track" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, currentVisibility / 240)}%` }} />
                </div>
              </article>
            </section>

            <section className="forecast-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Next up</span>
                  <h2>Hourly forecast</h2>
                </div>
                <span className="section-note">Local time</span>
              </div>

              <div className="hourly-strip">
                {nextHours.length > 0
                  ? nextHours.map((entry, index) => (
                      <article className={`hour-card ${index === 0 ? 'hour-card--active' : ''}`} key={entry.time}>
                        <span className="hour-time">{index === 0 ? 'Now' : formatHour(entry.time)}</span>
                        <WeatherIcon
                          className="hour-icon"
                          code={entry.weatherCode}
                          decorative
                          isDay={entry.isDay}
                        />
                        <strong>{roundTemperature(entry.temperature)}°</strong>
                        <span className="rain-chance">{entry.precipitationProbability}%</span>
                      </article>
                    ))
                  : Array.from({ length: 8 }, (_, index) => (
                      <article className="hour-card hour-card--placeholder" key={index} aria-hidden="true" />
                    ))}
              </div>
            </section>
          </div>

          <aside className="forecast-panel">
            <div className="forecast-panel__header">
              <div>
                <span className="section-kicker">Week ahead</span>
                <h2>7-day outlook</h2>
              </div>
              <LocateFixed size={20} strokeWidth={1.7} />
            </div>

            <div className="daily-list">
              {weather
                ? weather.daily.map((day, index) => {
                    const dayCondition = getWeatherCondition(day.weatherCode)
                    return (
                      <article className="day-row" key={day.date}>
                        <div className="day-name">
                          <strong>{formatDay(day.date, index)}</strong>
                          <span>{dayCondition.shortLabel}</span>
                        </div>
                        <WeatherIcon className="day-icon" code={day.weatherCode} decorative />
                        <span className="day-rain">{day.precipitationProbability}%</span>
                        <div className="day-temp">
                          <strong>{roundTemperature(day.temperatureMax)}°</strong>
                          <span>{roundTemperature(day.temperatureMin)}°</span>
                        </div>
                      </article>
                    )
                  })
                : Array.from({ length: 7 }, (_, index) => (
                    <article className="day-row day-row--placeholder" key={index} aria-hidden="true" />
                  ))}
            </div>

            {today ? (
              <div className="sun-card">
                <div className="sun-stat">
                  <img alt="" aria-hidden="true" src={sunriseIcon} />
                  <span>
                    <small>Sunrise</small>
                    <strong>{formatHour(today.sunrise)}</strong>
                  </span>
                </div>
                <div className="sun-divider" />
                <div className="sun-stat">
                  <img alt="" aria-hidden="true" src={sunsetIcon} />
                  <span>
                    <small>Sunset</small>
                    <strong>{formatHour(today.sunset)}</strong>
                  </span>
                </div>
              </div>
            ) : null}

            <p className="data-credit">Forecast data by Open-Meteo</p>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
