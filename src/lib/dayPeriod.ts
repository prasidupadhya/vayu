export type DayPeriodId = 'morning' | 'afternoon' | 'evening' | 'night'

export type DayPeriod = {
  id: DayPeriodId
  label: string
  isDaylight: boolean
}

type ZonedDateParts = {
  dateKey: string
  minutes: number
}

const PERIODS: Record<DayPeriodId, DayPeriod> = {
  morning: { id: 'morning', label: 'Morning', isDaylight: true },
  afternoon: { id: 'afternoon', label: 'Afternoon', isDaylight: true },
  evening: { id: 'evening', label: 'Evening', isDaylight: true },
  night: { id: 'night', label: 'Night', isDaylight: false },
}

function getDayPeriodFromMinutes(minutes: number): DayPeriod {
  if (minutes >= 6 * 60 && minutes < 12 * 60) {
    return PERIODS.morning
  }

  if (minutes >= 12 * 60 && minutes < 17 * 60) {
    return PERIODS.afternoon
  }

  if (minutes >= 17 * 60 && minutes < 21 * 60) {
    return PERIODS.evening
  }

  return PERIODS.night
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

export function getDayPeriod(date: Date, timezone: string): DayPeriod {
  const zoned = getZonedDateParts(date, timezone)
  return getDayPeriodFromMinutes(zoned.minutes)
}

export function getDayPeriodFromLocalIso(value: string): DayPeriod {
  const [, time = '00:00'] = value.split('T')
  const [hour = '0', minute = '0'] = time.split(':')
  return getDayPeriodFromMinutes(Number(hour) * 60 + Number(minute))
}
