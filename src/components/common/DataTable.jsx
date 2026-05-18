import { formatCurrency, formatNumber, formatPercent, toTitleCase } from '../../utils/formatters'

function cellFormatter(value, format) {
  if (format === 'currency') {
    return formatCurrency(value, 0)
  }
  if (format === 'percent') {
    return formatPercent(value, 1)
  }
  if (format === 'number') {
    return formatNumber(value, 0)
  }
  if (format === 'title') {
    return toTitleCase(value)
  }
  return value
}

export function DataTable({ columns, rows, emptyText = 'No data available.' }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-row">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id || JSON.stringify(row)}>
                {columns.map((column) => (
                  <td key={column.key}>{cellFormatter(row[column.key], column.format)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
