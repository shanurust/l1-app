import { formatNumber } from '../../utils/formatters'

export function BarChart({ data = [] }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div key={item.label} className="bar-row">
          <div className="bar-label">{item.label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color || 'linear-gradient(90deg, #0d9488, #22c55e)',
              }}
            />
          </div>
          <div className="bar-value">{formatNumber(item.value, 0)}</div>
        </div>
      ))}
    </div>
  )
}
