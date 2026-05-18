export function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatCurrency(value, digits = 0) {
  return `$${formatNumber(value, digits)}`
}

export function formatPercent(value, digits = 1) {
  return `${formatNumber((value || 0) * 100, digits)}%`
}

export function toTitleCase(value) {
  if (!value) {
    return ''
  }
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
