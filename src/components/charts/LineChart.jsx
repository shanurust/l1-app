import { formatCurrency, formatPercent } from '../../utils/formatters'

export function LineChart({ points = [] }) {
  if (!points.length) {
    return <div className="line-chart-empty">Run sensitivity analysis to render chart.</div>
  }

  const width = 760
  const height = 260
  const padding = 36

  const xMin = Math.min(...points.map((point) => point.parameter_value))
  const xMax = Math.max(...points.map((point) => point.parameter_value))
  const yMin = Math.min(...points.map((point) => point.total_landed_cost))
  const yMax = Math.max(...points.map((point) => point.total_landed_cost))

  const normalizeX = (value) =>
    padding + ((value - xMin) / Math.max(xMax - xMin, 1e-6)) * (width - padding * 2)
  const normalizeY = (value) =>
    height - padding - ((value - yMin) / Math.max(yMax - yMin, 1e-6)) * (height - padding * 2)

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${normalizeX(point.parameter_value)} ${normalizeY(point.total_landed_cost)}`)
    .join(' ')

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <rect x="0" y="0" width={width} height={height} fill="#f8fbfc" />
        <path d={path} fill="none" stroke="#0f766e" strokeWidth="3" />
        {points.map((point) => (
          <circle
            key={`${point.parameter_value}-${point.total_landed_cost}`}
            cx={normalizeX(point.parameter_value)}
            cy={normalizeY(point.total_landed_cost)}
            r="4"
            fill="#0f766e"
          />
        ))}
      </svg>
      <div className="line-chart-legend">
        <span>Cost Range: {formatCurrency(yMin, 0)} to {formatCurrency(yMax, 0)}</span>
        <span>Fill Range: {formatPercent(Math.min(...points.map((point) => point.fill_rate)), 1)} to {formatPercent(Math.max(...points.map((point) => point.fill_rate)), 1)}</span>
      </div>
    </div>
  )
}
