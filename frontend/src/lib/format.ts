const numberFormatter = new Intl.NumberFormat('zh-CN')
const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function formatTime(value?: string | null) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '--' : dateTimeFormatter.format(date)
}

export function formatNumber(value?: number | null) {
  const nextValue = value ?? Number.NaN
  return Number.isFinite(nextValue) ? numberFormatter.format(nextValue) : '--'
}

export function formatOptionalMetric(value?: number | string | null) {
  if (typeof value === 'number') {
    return formatNumber(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : '--'
  }

  return '--'
}

export function formatFractionMetric(
  leftValue?: number | string | null,
  rightValue?: number | string | null,
) {
  return `${formatOptionalMetric(leftValue)}/${formatOptionalMetric(rightValue)}`
}
