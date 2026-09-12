import type { DailyWeather } from '../types/weather'

export type SolarPhaseId = 'sunrise' | 'day' | 'afternoon' | 'evening' | 'sunset' | 'night'

export type SolarPhase = {
  id: SolarPhaseId
  label: string
  isDaylight: boolean
}

type ZonedDateParts = {
  dateKey: string
  minutes: number
}

const PHASES: Record<SolarPhaseId, SolarPhase> = {
  sunrise: { id: 'sunrise', label: 'Sunrise', isDaylight: true },
  day: { id: 'day', label: 'Daytime', isDaylight: true },
  afternoon: { id: 'afternoon', label: 'Afternoon', isDaylight: true },
  evening: { id: 'evening', label: 'Evening', isDaylight: true },
  sunset: { id: 'sunset', label: 'Sunset', isDaylight: true },
  night: { id: 'night', label: 'Night', isDaylight: false },
}

function getZonedDateParts(date: Date, timezone: string): ZonedDateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const hour = Number(values.hour ?? 0)
  const minute = Number(values.minute ?? 0)

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    minutes: hour * 60 + minute,
  }
}

function getMinutesFromLocalIso(value: string) {
  const [, time = '00:00'] = value.split('T')
  const [hour = '0', minute = '0'] = time.split(':')
  return Number(hour) * 60 + Number(minute)
}

export function getLocalIsoMinute(date: Date, timezone: string) {
  const { dateKey } = getZonedDateParts(date, timezone)
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)

  return `${dateKey}T${time}`
}

export function formatLocationTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

export function formatLocationDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function getSolarPhase(date: Date, timezone: string, daily: DailyWeather[]): SolarPhase {
  const zoned = getZonedDateParts(date, timezone)
  const today = daily.find((day) => day.date === zoned.dateKey) ?? daily[0]

  if (!today) {
    return zoned.minutes >= 7 * 60 && zoned.minutes < 19 * 60 ? PHASES.day : PHASES.night
  }

  const sunrise = getMinutesFromLocalIso(today.sunrise)
  const sunset = getMinutesFromLocalIso(today.sunset)

  if (!Number.isFinite(sunrise) || !Number.isFinite(sunset) || sunset <= sunrise) {
    return zoned.minutes >= 7 * 60 && zoned.minutes < 19 * 60 ? PHASES.day : PHASES.night
  }

  const sunriseStart = Math.max(0, sunrise - 30)
  const sunriseEnd = Math.min(sunset, sunrise + 45)
  const sunsetStart = Math.max(sunriseEnd, sunset - 30)
  const sunsetEnd = Math.min(24 * 60, sunset + 30)

  if (zoned.minutes < sunriseStart || zoned.minutes >= sunsetEnd) {
    return PHASES.night
  }

  if (zoned.minutes < sunriseEnd) {
    return PHASES.sunrise
  }

  if (zoned.minutes >= sunsetStart) {
    return PHASES.sunset
  }

  const usableDaylight = Math.max(1, sunsetStart - sunriseEnd)
  const dayBoundary = sunriseEnd + usableDaylight / 3
  const afternoonBoundary = sunriseEnd + (usableDaylight * 2) / 3

  if (zoned.minutes < dayBoundary) {
    return PHASES.day
  }

  if (zoned.minutes < afternoonBoundary) {
    return PHASES.afternoon
  }

  return PHASES.evening
}
