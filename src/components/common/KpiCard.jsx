import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'

const FORMATTERS = {
  currency: formatCurrency,
  percent: formatPercent,
  number: formatNumber,
}

export function KpiCard({ label, value, kind = 'number', hint }) {
  const formatter = FORMATTERS[kind] || formatNumber
  return (
    <article className="kpi-card">
      <p>{label}</p>
      <h3>{formatter(value, kind === 'percent' ? 1 : 0)}</h3>
      {hint ? <small>{hint}</small> : null}
    </article>
  )
}
