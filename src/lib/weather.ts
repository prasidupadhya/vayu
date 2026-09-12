import type {
  DailyWeather,
  HourlyWeather,
  WeatherCondition,
  WeatherLocation,
  WeatherSnapshot,
} from '../types/weather'

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search'

type GeocodingResult = {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string
  timezone?: string
}

type GeocodingResponse = {
  results?: GeocodingResult[]
}

type ForecastResponse = {
  timezone: string
  timezone_abbreviation: string
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    precipitation: number
    surface_pressure: number
    wind_speed_10m: number
    wind_direction_10m: number
    weather_code: number
    is_day: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    precipitation_probability: number[]
    visibility: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    sunrise: string[]
    sunset: string[]
  }
}

const WEATHER_CONDITIONS: Record<number, WeatherCondition> = {
  0: { label: 'Clear sky', shortLabel: 'Clear' },
  1: { label: 'Mainly clear', shortLabel: 'Mostly clear' },
  2: { label: 'Partly cloudy', shortLabel: 'Partly cloudy' },
  3: { label: 'Overcast', shortLabel: 'Overcast' },
  45: { label: 'Fog', shortLabel: 'Fog' },
  48: { label: 'Depositing rime fog', shortLabel: 'Rime fog' },
  51: { label: 'Light drizzle', shortLabel: 'Drizzle' },
  53: { label: 'Moderate drizzle', shortLabel: 'Drizzle' },
  55: { label: 'Dense drizzle', shortLabel: 'Drizzle' },
  56: { label: 'Light freezing drizzle', shortLabel: 'Freezing drizzle' },
  57: { label: 'Dense freezing drizzle', shortLabel: 'Freezing drizzle' },
  61: { label: 'Slight rain', shortLabel: 'Light rain' },
  63: { label: 'Moderate rain', shortLabel: 'Rain' },
  65: { label: 'Heavy rain', shortLabel: 'Heavy rain' },
  66: { label: 'Light freezing rain', shortLabel: 'Freezing rain' },
  67: { label: 'Heavy freezing rain', shortLabel: 'Freezing rain' },
  71: { label: 'Slight snowfall', shortLabel: 'Light snow' },
  73: { label: 'Moderate snowfall', shortLabel: 'Snow' },
  75: { label: 'Heavy snowfall', shortLabel: 'Heavy snow' },
  77: { label: 'Snow grains', shortLabel: 'Snow grains' },
  80: { label: 'Slight rain showers', shortLabel: 'Showers' },
  81: { label: 'Moderate rain showers', shortLabel: 'Showers' },
  82: { label: 'Violent rain showers', shortLabel: 'Heavy showers' },
  85: { label: 'Slight snow showers', shortLabel: 'Snow showers' },
  86: { label: 'Heavy snow showers', shortLabel: 'Snow showers' },
  95: { label: 'Thunderstorm', shortLabel: 'Thunderstorm' },
  96: { label: 'Thunderstorm with slight hail', shortLabel: 'Storm with hail' },
  99: { label: 'Thunderstorm with heavy hail', shortLabel: 'Storm with hail' },
}

function assertOk(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    throw new Error(fallbackMessage)
  }
}

function mapLocation(result: GeocodingResult): WeatherLocation {
  return {
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    countryCode: result.country_code,
    admin1: result.admin1,
    timezone: result.timezone,
  }
}

function mapHourly(response: ForecastResponse): HourlyWeather[] {
  return response.hourly.time.map((time, index) => ({
    time,
    temperature: response.hourly.temperature_2m[index],
    weatherCode: response.hourly.weather_code[index],
    precipitationProbability: response.hourly.precipitation_probability[index],
    visibility: response.hourly.visibility[index],
  }))
}

function mapDaily(response: ForecastResponse): DailyWeather[] {
  return response.daily.time.map((date, index) => ({
    date,
    weatherCode: response.daily.weather_code[index],
    temperatureMax: response.daily.temperature_2m_max[index],
    temperatureMin: response.daily.temperature_2m_min[index],
    precipitationProbability: response.daily.precipitation_probability_max[index],
    sunrise: response.daily.sunrise[index],
    sunset: response.daily.sunset[index],
  }))
}

export function getWeatherCondition(code: number): WeatherCondition {
  return WEATHER_CONDITIONS[code] ?? { label: 'Mixed conditions', shortLabel: 'Mixed' }
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<WeatherLocation[]> {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 2) {
    return []
  }

  const params = new URLSearchParams({
    name: trimmedQuery,
    count: '6',
    language: 'en',
    format: 'json',
  })

  const response = await fetch(`${GEOCODING_API}?${params.toString()}`, { signal })
  assertOk(response, 'Unable to search locations right now.')

  const data = (await response.json()) as GeocodingResponse
  return (data.results ?? []).map(mapLocation)
}

export async function getWeather(
  location: WeatherLocation,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
      'is_day',
    ].join(','),
    hourly: [
      'temperature_2m',
      'weather_code',
      'precipitation_probability',
      'visibility',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
  })

  const response = await fetch(`${FORECAST_API}?${params.toString()}`, { signal })
  assertOk(response, 'Unable to load the weather right now.')

  const data = (await response.json()) as ForecastResponse

  return {
    location,
    timezone: data.timezone,
    timezoneAbbreviation: data.timezone_abbreviation,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      pressure: data.current.surface_pressure,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    hourly: mapHourly(data),
    daily: mapDaily(data),
  }
}

export function makeDeviceLocation(latitude: number, longitude: number): WeatherLocation {
  return {
    name: 'Current location',
    latitude,
    longitude,
  }
}
