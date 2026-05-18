import { DataTable } from '../components/common/DataTable'
import { SectionCard } from '../components/common/SectionCard'
import { NetworkGraph } from '../components/network/NetworkGraph'

export function NetworkModelPage({ state, updateSupplierField, updateLaneField, saveNetwork }) {
  if (!state.network) {
    return null
  }

  const nodeRows = [
    ...state.network.suppliers.map((item) => ({
      id: item.id,
      node_type: 'supplier',
      name: item.name,
      metric_1: item.capacity,
      metric_2: item.lead_time_days,
    })),
    ...state.network.plants.map((item) => ({
      id: item.id,
      node_type: 'plant',
      name: item.name,
      metric_1: item.capacity,
      metric_2: item.production_rate,
    })),
    ...state.network.dcs.map((item) => ({
      id: item.id,
      node_type: 'dc',
      name: item.name,
      metric_1: item.storage_limit,
      metric_2: item.service_level_target,
    })),
    ...state.network.customers.map((item) => ({
      id: item.id,
      node_type: 'customer',
      name: item.name,
      metric_1: item.priority,
      metric_2: '-',
    })),
  ]

  const skuDemand = state.network.demand_profiles.reduce((acc, item) => acc + item.demand_per_period, 0)

  return (
    <div className="page-grid one-col">
      <SectionCard title="Network Graph" subtitle="Supplier -> Plant -> DC -> Customer lane visualization">
        <NetworkGraph network={state.network} />
      </SectionCard>

      <SectionCard
        title="Editable Network Assumptions"
        subtitle="Quick edits for supplier economics and lane assumptions"
        actions={<button onClick={saveNetwork}>Save Network</button>}
      >
        <div className="inline-edit-grid">
          {state.network.suppliers.map((supplier) => (
            <article key={supplier.id} className="inline-card">
              <h4>{supplier.name}</h4>
              <label>
                Unit Cost
                <input
                  type="number"
                  value={supplier.cost_per_unit}
                  step="0.1"
                  onChange={(event) =>
                    updateSupplierField(supplier.id, 'cost_per_unit', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  value={supplier.capacity}
                  onChange={(event) =>
                    updateSupplierField(supplier.id, 'capacity', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Lead Time (days)
                <input
                  type="number"
                  value={supplier.lead_time_days}
                  onChange={(event) =>
                    updateSupplierField(supplier.id, 'lead_time_days', Number(event.target.value))
                  }
                />
              </label>
            </article>
          ))}

          {state.network.lanes.slice(0, 4).map((lane) => (
            <article key={lane.id} className="inline-card">
              <h4>{lane.id}</h4>
              <label>
                Transport Cost
                <input
                  type="number"
                  value={lane.transport_cost}
                  step="0.05"
                  onChange={(event) =>
                    updateLaneField(lane.id, 'transport_cost', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Lead Time
                <input
                  type="number"
                  value={lane.lead_time_days}
                  onChange={(event) =>
                    updateLaneField(lane.id, 'lead_time_days', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Disrupted
                <input
                  type="checkbox"
                  checked={lane.disrupted}
                  onChange={(event) =>
                    updateLaneField(lane.id, 'disrupted', event.target.checked)
                  }
                />
              </label>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Lane Details" subtitle="Cost, lead-time and capacity by lane">
        <DataTable
          columns={[
            { key: 'id', label: 'Lane' },
            { key: 'from_node', label: 'From' },
            { key: 'to_node', label: 'To' },
            { key: 'mode', label: 'Mode' },
            { key: 'transport_cost', label: 'Transport Cost', format: 'currency' },
            { key: 'lead_time_days', label: 'Lead Time (days)' },
            { key: 'capacity', label: 'Capacity', format: 'number' },
          ]}
          rows={state.network.lanes}
        />
      </SectionCard>

      <SectionCard title="Node Details" subtitle="Master network nodes and assumptions">
        <DataTable
          columns={[
            { key: 'id', label: 'Node Id' },
            { key: 'node_type', label: 'Node Type', format: 'title' },
            { key: 'name', label: 'Name' },
            { key: 'metric_1', label: 'Primary Metric' },
            { key: 'metric_2', label: 'Secondary Metric' },
          ]}
          rows={nodeRows}
        />
      </SectionCard>

      <SectionCard title="SKU Flow Summary" subtitle="Current period demand and throughput assumptions">
        <div className="summary-lines">
          <p>
            <strong>SKU:</strong> {state.network.skus[0].name}
          </p>
          <p>
            <strong>Total Demand:</strong> {Math.round(skuDemand)} units / period
          </p>
          <p>
            <strong>Total Supplier Capacity:</strong>{' '}
            {Math.round(state.network.suppliers.reduce((acc, item) => acc + item.capacity, 0))} units
          </p>
          <p>
            <strong>Plant Capacity:</strong>{' '}
            {Math.round(state.network.plants.reduce((acc, item) => acc + item.capacity, 0))} units
          </p>
          <p>
            <strong>Total DC Storage:</strong>{' '}
            {Math.round(state.network.dcs.reduce((acc, item) => acc + item.storage_limit, 0))} units
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
