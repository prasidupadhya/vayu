import clearDay from '@meteocons/svg/fill/clear-day.svg'
import clearNight from '@meteocons/svg/fill/clear-night.svg'
import drizzle from '@meteocons/svg/fill/drizzle.svg'
import fogDay from '@meteocons/svg/fill/fog-day.svg'
import fogNight from '@meteocons/svg/fill/fog-night.svg'
import mostlyClearDay from '@meteocons/svg/fill/mostly-clear-day.svg'
import mostlyClearNight from '@meteocons/svg/fill/mostly-clear-night.svg'
import overcastDay from '@meteocons/svg/fill/overcast-day.svg'
import overcastNight from '@meteocons/svg/fill/overcast-night.svg'
import partlyCloudyDay from '@meteocons/svg/fill/partly-cloudy-day.svg'
import partlyCloudyNight from '@meteocons/svg/fill/partly-cloudy-night.svg'
import rain from '@meteocons/svg/fill/rain.svg'
import snow from '@meteocons/svg/fill/snow.svg'
import thunderstormsDay from '@meteocons/svg/fill/thunderstorms-day.svg'
import thunderstormsDayHail from '@meteocons/svg/fill/thunderstorms-day-hail.svg'
import thunderstormsNight from '@meteocons/svg/fill/thunderstorms-night.svg'
import thunderstormsNightHail from '@meteocons/svg/fill/thunderstorms-night-hail.svg'
import { getWeatherCondition } from '../lib/weather'

type WeatherIconProps = {
  code: number
  isDay?: boolean
  className?: string
  decorative?: boolean
}

function weatherIconSource(code: number, isDay: boolean) {
  if (code === 0) {
    return isDay ? clearDay : clearNight
  }

  if (code === 1) {
    return isDay ? mostlyClearDay : mostlyClearNight
  }

  if (code === 2) {
    return isDay ? partlyCloudyDay : partlyCloudyNight
  }

  if (code === 3) {
    return isDay ? overcastDay : overcastNight
  }

  if (code === 45 || code === 48) {
    return isDay ? fogDay : fogNight
  }

  if (code >= 51 && code <= 57) {
    return drizzle
  }

  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return rain
  }

  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return snow
  }

  if (code === 96 || code === 99) {
    return isDay ? thunderstormsDayHail : thunderstormsNightHail
  }

  if (code === 95) {
    return isDay ? thunderstormsDay : thunderstormsNight
  }

  return isDay ? partlyCloudyDay : partlyCloudyNight
}

function WeatherIcon({ code, isDay = true, className, decorative = false }: WeatherIconProps) {
  const condition = getWeatherCondition(code)

  return (
    <img
      alt={decorative ? '' : condition.label}
      aria-hidden={decorative || undefined}
      className={className}
      src={weatherIconSource(code, isDay)}
    />
  )
}

export default WeatherIcon
