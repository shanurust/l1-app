const COLUMN_ORDER = ['supplier', 'plant', 'dc', 'customer']

function nodeType(node) {
  if (node.id.startsWith('SUP')) return 'supplier'
  if (node.id.startsWith('PLT')) return 'plant'
  if (node.id.startsWith('DC')) return 'dc'
  return 'customer'
}

function collectNodes(network) {
  return [
    ...network.suppliers,
    ...network.plants,
    ...network.dcs,
    ...network.customers,
  ].map((node) => ({ ...node, type: nodeType(node) }))
}

export function NetworkGraph({ network }) {
  const nodes = collectNodes(network)
  const grouped = COLUMN_ORDER.map((type) => nodes.filter((node) => node.type === type))

  const positions = {}
  grouped.forEach((group, column) => {
    group.forEach((node, index) => {
      positions[node.id] = {
        x: 120 + column * 240,
        y: 80 + index * 130,
      }
    })
  })

  const width = 900
  const height = 520

  return (
    <div className="network-graph-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="network-graph">
        {network.lanes.map((lane) => {
          const from = positions[lane.from_node]
          const to = positions[lane.to_node]
          if (!from || !to) {
            return null
          }
          return (
            <g key={lane.id}>
              <line
                x1={from.x + 56}
                y1={from.y + 22}
                x2={to.x - 56}
                y2={to.y + 22}
                stroke={lane.disrupted ? '#ef4444' : '#0f766e'}
                strokeDasharray={lane.disrupted ? '6 4' : '0'}
                strokeWidth="2"
              />
              <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 8} className="lane-label">
                {lane.mode} | ${lane.transport_cost}/u
              </text>
            </g>
          )
        })}

        {nodes.map((node) => {
          const point = positions[node.id]
          return (
            <g key={node.id}>
              <rect
                x={point.x - 58}
                y={point.y}
                width="116"
                height="46"
                rx="12"
                fill="white"
                stroke="#99a9b0"
              />
              <text x={point.x} y={point.y + 18} textAnchor="middle" className="node-title">
                {node.name}
              </text>
              <text x={point.x} y={point.y + 34} textAnchor="middle" className="node-subtitle">
                {node.id}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
