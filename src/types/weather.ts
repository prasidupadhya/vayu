export type Coordinates = {
  latitude: number
  longitude: number
}

export type WeatherLocation = Coordinates & {
  id?: number
  name: string
  country?: string
  countryCode?: string
  admin1?: string
  timezone?: string
}

export type CurrentWeather = {
  time: string
  temperature: number
  apparentTemperature: number
  humidity: number
  precipitation: number
  pressure: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  isDay: boolean
}

export type HourlyWeather = {
  time: string
  temperature: number
  weatherCode: number
  precipitationProbability: number
  visibility: number
  isDay: boolean
}

export type DailyWeather = {
  date: string
  weatherCode: number
  temperatureMax: number
  temperatureMin: number
  precipitationProbability: number
  sunrise: string
  sunset: string
}

export type WeatherSnapshot = {
  location: WeatherLocation
  timezone: string
  timezoneAbbreviation: string
  current: CurrentWeather
  hourly: HourlyWeather[]
  daily: DailyWeather[]
}

export type WeatherCondition = {
  label: string
  shortLabel: string
}
