import { useMemo } from 'react'

import { DataTable } from '../components/common/DataTable'
import { SectionCard } from '../components/common/SectionCard'
import { formatPercent } from '../utils/formatters'

const numericAdjustmentFields = [
  ['supplier_cost_delta_pct', 'Supplier Cost Delta %'],
  ['supplier_lead_time_delta_pct', 'Supplier Lead Time Delta %'],
  ['supplier_capacity_delta_pct', 'Supplier Capacity Delta %'],
  ['demand_delta_pct', 'Demand Delta %'],
  ['transport_cost_delta_pct', 'Transport Cost Delta %'],
]

export function ScenarioSimulatorPage({
  state,
  activeScenario,
  runScenario,
  compareScenarios,
  updateScenarioAdjustment,
  saveScenario,
}) {
  const availableScenarios = state.scenarios.map((item) => item.id)

  const comparisonRows = useMemo(
    () =>
      state.scenarioDeltas.map((item) => ({
        ...item,
        id: item.scenario_id,
      })),
    [state.scenarioDeltas],
  )

  const cloneScenario = async () => {
    const clone = {
      ...activeScenario,
      id: `${activeScenario.id}_copy_${Date.now().toString().slice(-4)}`,
      name: `${activeScenario.name} Copy`,
      base_scenario_id: activeScenario.id,
    }
    await saveScenario(clone)
  }

  const runAndCompare = async () => {
    await runScenario(activeScenario.id)
    await compareScenarios(['baseline', activeScenario.id])
  }

  return (
    <div className="page-grid one-col">
      <SectionCard
        title="Scenario Editing"
        subtitle="Change cost, lead-time, capacity, demand, and disruption assumptions"
        actions={
          <div className="button-row">
            <button onClick={runAndCompare}>Run Scenario</button>
            <button onClick={cloneScenario} className="secondary">
              Clone Scenario
            </button>
          </div>
        }
      >
        <div className="slider-grid">
          {numericAdjustmentFields.map(([field, label]) => (
            <label key={field}>
              <span>
                {label}: {formatPercent(activeScenario.adjustments[field] || 0, 1)}
              </span>
              <input
                type="range"
                min="-0.5"
                max="0.8"
                step="0.01"
                value={activeScenario.adjustments[field] || 0}
                onChange={(event) =>
                  updateScenarioAdjustment(activeScenario.id, field, Number(event.target.value))
                }
              />
            </label>
          ))}
        </div>

        <div className="selector-grid">
          <label>
            Transport Disruption
            <select
              value={activeScenario.adjustments.transport_disruption_ids?.[0] || ''}
              onChange={(event) =>
                updateScenarioAdjustment(
                  activeScenario.id,
                  'transport_disruption_ids',
                  event.target.value ? [event.target.value] : [],
                )
              }
            >
              <option value="">None</option>
              {state.network.lanes.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Plant Outage
            <select
              value={activeScenario.adjustments.plant_outage_ids?.[0] || ''}
              onChange={(event) =>
                updateScenarioAdjustment(
                  activeScenario.id,
                  'plant_outage_ids',
                  event.target.value ? [event.target.value] : [],
                )
              }
            >
              <option value="">None</option>
              {state.network.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Scenario Comparison vs Baseline" subtitle="Delta view for performance metrics">
        <DataTable
          columns={[
            { key: 'scenario_id', label: 'Scenario' },
            { key: 'total_landed_cost_delta', label: 'Cost Delta', format: 'currency' },
            { key: 'fill_rate_delta', label: 'Fill Delta', format: 'percent' },
            { key: 'lead_time_delta', label: 'Lead Time Delta' },
            { key: 'inventory_delta', label: 'Inventory Delta', format: 'number' },
          ]}
          rows={comparisonRows}
          emptyText="Run and compare a scenario against baseline to populate this table."
        />
      </SectionCard>

      <SectionCard title="Scenario Portfolio" subtitle="Available scenario set for run/compare workflows">
        <div className="chip-wrap">
          {availableScenarios.map((scenarioId) => (
            <span key={scenarioId} className="chip">
              {scenarioId}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
