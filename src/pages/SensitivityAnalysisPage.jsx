import { useState } from 'react'

import { LineChart } from '../components/charts/LineChart'
import { DataTable } from '../components/common/DataTable'
import { SectionCard } from '../components/common/SectionCard'

const parameterOptions = [
  { value: 'supplier_lead_time_delta_pct', label: 'Lead Time Sensitivity' },
  { value: 'demand_delta_pct', label: 'Demand Sensitivity' },
  { value: 'supplier_cost_delta_pct', label: 'Supplier Cost Sensitivity' },
  { value: 'transport_cost_delta_pct', label: 'Holding / Transport Cost Sensitivity' },
]

export function SensitivityAnalysisPage({ state, activeScenario, runSensitivity }) {
  const [parameter, setParameter] = useState('supplier_lead_time_delta_pct')
  const [start, setStart] = useState(-0.2)
  const [end, setEnd] = useState(0.4)
  const [step, setStep] = useState(0.1)

  const run = async () => {
    await runSensitivity({
      scenarioId: activeScenario.id,
      parameter,
      start: Number(start),
      end: Number(end),
      step: Number(step),
    })
  }

  return (
    <div className="page-grid one-col">
      <SectionCard
        title="Sensitivity Sweep"
        subtitle="Vary one parameter and observe landed cost, service and inventory response"
        actions={<button onClick={run}>Run Sensitivity</button>}
      >
        <div className="sensitivity-controls">
          <label>
            Parameter
            <select value={parameter} onChange={(event) => setParameter(event.target.value)}>
              {parameterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Start
            <input type="number" step="0.05" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label>
            End
            <input type="number" step="0.05" value={end} onChange={(event) => setEnd(event.target.value)} />
          </label>
          <label>
            Step
            <input type="number" step="0.01" value={step} onChange={(event) => setStep(event.target.value)} />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Cost/Service Response Curve" subtitle="Structured sweep output for charting">
        <LineChart points={state.sensitivity?.points || []} />
      </SectionCard>

      <SectionCard title="Sensitivity Points" subtitle="Data points used for chart rendering">
        <DataTable
          columns={[
            { key: 'parameter_value', label: 'Parameter Value' },
            { key: 'total_landed_cost', label: 'Total Landed Cost', format: 'currency' },
            { key: 'fill_rate', label: 'Fill Rate', format: 'percent' },
            { key: 'ending_inventory', label: 'Ending Inventory', format: 'number' },
          ]}
          rows={(state.sensitivity?.points || []).map((point, index) => ({ ...point, id: index }))}
          emptyText="Run a sensitivity sweep to populate points."
        />
      </SectionCard>
    </div>
  )
}
