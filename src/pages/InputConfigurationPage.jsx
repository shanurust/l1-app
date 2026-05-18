import { SectionCard } from '../components/common/SectionCard'

export function InputConfigurationPage({
  state,
  updateSupplierField,
  updateLaneField,
  updateSkuField,
  updatePlantField,
  updateDcField,
  updateDemandProfileField,
  updateInventoryPolicyField,
}) {
  if (!state.network) {
    return null
  }

  return (
    <div className="page-grid one-col">
      <SectionCard title="Supplier Master Data" subtitle="Cost, capacity, MOQ and lead-time assumptions">
        <div className="form-grid">
          {state.network.suppliers.map((supplier) => (
            <article key={supplier.id} className="form-card">
              <h3>{supplier.name}</h3>
              <label>
                Cost Per Unit
                <input
                  type="number"
                  step="0.1"
                  value={supplier.cost_per_unit}
                  onChange={(event) => updateSupplierField(supplier.id, 'cost_per_unit', Number(event.target.value))}
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  value={supplier.capacity}
                  onChange={(event) => updateSupplierField(supplier.id, 'capacity', Number(event.target.value))}
                />
              </label>
              <label>
                MOQ
                <input
                  type="number"
                  value={supplier.min_order_qty}
                  onChange={(event) => updateSupplierField(supplier.id, 'min_order_qty', Number(event.target.value))}
                />
              </label>
              <label>
                Lead Time (days)
                <input
                  type="number"
                  value={supplier.lead_time_days}
                  onChange={(event) => updateSupplierField(supplier.id, 'lead_time_days', Number(event.target.value))}
                />
              </label>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Plant / DC / Customer Data" subtitle="Production and service assumptions">
        <div className="form-grid compact">
          {state.network.plants.map((plant) => (
            <article key={plant.id} className="form-card">
              <h3>{plant.name}</h3>
              <label>
                Production Rate
                <input
                  type="number"
                  value={plant.production_rate}
                  onChange={(event) =>
                    updatePlantField(plant.id, 'production_rate', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  value={plant.capacity}
                  onChange={(event) =>
                    updatePlantField(plant.id, 'capacity', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Inventory On Hand
                <input
                  type="number"
                  value={plant.inventory_on_hand}
                  onChange={(event) =>
                    updatePlantField(plant.id, 'inventory_on_hand', Number(event.target.value))
                  }
                />
              </label>
            </article>
          ))}
          {state.network.dcs.map((dc) => (
            <article key={dc.id} className="form-card">
              <h3>{dc.name}</h3>
              <label>
                Storage Limit
                <input
                  type="number"
                  value={dc.storage_limit}
                  onChange={(event) => updateDcField(dc.id, 'storage_limit', Number(event.target.value))}
                />
              </label>
              <label>
                Inventory On Hand
                <input
                  type="number"
                  value={dc.inventory_on_hand}
                  onChange={(event) =>
                    updateDcField(dc.id, 'inventory_on_hand', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Service Target
                <input
                  type="number"
                  step="0.01"
                  value={dc.service_level_target}
                  onChange={(event) =>
                    updateDcField(dc.id, 'service_level_target', Number(event.target.value))
                  }
                />
              </label>
            </article>
          ))}
          {state.network.customers.map((customer) => (
            <article key={customer.id} className="form-card">
              <h3>{customer.name}</h3>
              <p>Priority Tier: {customer.priority}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="SKU and Demand" subtitle="Demand profile and service targets">
        <div className="form-grid compact">
          {state.network.skus.map((sku) => (
            <article key={sku.id} className="form-card">
              <h3>{sku.name}</h3>
              <label>
                Demand Per Period
                <input
                  type="number"
                  value={sku.demand_per_period}
                  onChange={(event) => updateSkuField(sku.id, 'demand_per_period', Number(event.target.value))}
                />
              </label>
              <label>
                Service Target
                <input
                  type="number"
                  step="0.01"
                  value={sku.service_level_target}
                  onChange={(event) => updateSkuField(sku.id, 'service_level_target', Number(event.target.value))}
                />
              </label>
            </article>
          ))}
          {state.network.demand_profiles.map((profile) => (
            <article key={`${profile.customer_id}-${profile.sku_id}`} className="form-card">
              <h3>{profile.customer_id}</h3>
              <label>
                Demand Per Period
                <input
                  type="number"
                  value={profile.demand_per_period}
                  onChange={(event) =>
                    updateDemandProfileField(
                      profile.customer_id,
                      'demand_per_period',
                      Number(event.target.value),
                    )
                  }
                />
              </label>
              <label>
                Variability
                <input
                  type="number"
                  step="0.01"
                  value={profile.variability}
                  onChange={(event) =>
                    updateDemandProfileField(
                      profile.customer_id,
                      'variability',
                      Number(event.target.value),
                    )
                  }
                />
              </label>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Transport and Inventory Policies" subtitle="Lane assumptions and policy drivers">
        <div className="form-grid">
          {state.network.lanes.map((lane) => (
            <article key={lane.id} className="form-card compact-row">
              <h3>{lane.id}</h3>
              <label>
                Cost
                <input
                  type="number"
                  step="0.05"
                  value={lane.transport_cost}
                  onChange={(event) => updateLaneField(lane.id, 'transport_cost', Number(event.target.value))}
                />
              </label>
              <label>
                Lead Time
                <input
                  type="number"
                  value={lane.lead_time_days}
                  onChange={(event) => updateLaneField(lane.id, 'lead_time_days', Number(event.target.value))}
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  value={lane.capacity}
                  onChange={(event) => updateLaneField(lane.id, 'capacity', Number(event.target.value))}
                />
              </label>
            </article>
          ))}
        </div>

        <div className="policy-grid">
          {state.network.inventory_policies.map((policy) => (
            <article key={`${policy.node_id}-${policy.sku_id}`} className="policy-card">
              <h4>{policy.node_id}</h4>
              <label>
                Safety Days
                <input
                  type="number"
                  value={policy.safety_days}
                  onChange={(event) =>
                    updateInventoryPolicyField(policy.node_id, 'safety_days', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Reorder Days
                <input
                  type="number"
                  value={policy.reorder_days}
                  onChange={(event) =>
                    updateInventoryPolicyField(policy.node_id, 'reorder_days', Number(event.target.value))
                  }
                />
              </label>
              <label>
                Carrying Rate
                <input
                  type="number"
                  step="0.01"
                  value={policy.carrying_rate}
                  onChange={(event) =>
                    updateInventoryPolicyField(policy.node_id, 'carrying_rate', Number(event.target.value))
                  }
                />
              </label>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
