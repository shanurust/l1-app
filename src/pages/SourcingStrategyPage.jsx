import { useMemo, useState } from 'react'

import { BarChart } from '../components/charts/BarChart'
import { DataTable } from '../components/common/DataTable'
import { SectionCard } from '../components/common/SectionCard'
import { getStrategyById } from '../state/selectors'

export function SourcingStrategyPage({
  state,
  activeScenario,
  updateScenarioField,
  compareStrategies,
  saveScenario,
}) {
  const [selectedStrategyIds, setSelectedStrategyIds] = useState(['cheapest', 'split_70_30', 'split_50_50', 'risk_balanced'])

  const chartData = useMemo(
    () =>
      state.strategyComparison.map((item) => ({
        label: item.strategy_name,
        value: item.total_landed_cost,
      })),
    [state.strategyComparison],
  )

  const toggleStrategy = (strategyId) => {
    setSelectedStrategyIds((current) =>
      current.includes(strategyId)
        ? current.filter((item) => item !== strategyId)
        : [...current, strategyId],
    )
  }

  const runComparison = async () => {
    await compareStrategies({
      scenarioId: activeScenario.id,
      strategyIds: selectedStrategyIds,
    })
  }

  const cloneScenarioForStrategy = async (strategyId) => {
    const clone = {
      ...activeScenario,
      id: `${activeScenario.id}_${strategyId}`,
      name: `${activeScenario.name} - ${strategyId}`,
      strategy_id: strategyId,
      base_scenario_id: activeScenario.id,
    }
    await saveScenario(clone)
  }

  return (
    <div className="page-grid one-col">
      <SectionCard title="Define Sourcing Strategy" subtitle="Cheapest, split-sourcing, and risk-balanced policies">
        <div className="strategy-grid">
          {state.strategies.map((strategy) => {
            const selected = activeScenario?.strategy_id === strategy.id
            return (
              <article key={strategy.id} className={`strategy-card ${selected ? 'selected' : ''}`}>
                <h3>{strategy.name}</h3>
                <p>{strategy.description}</p>
                <p>Risk Bias: {strategy.risk_bias}</p>
                <div className="strategy-actions">
                  <button
                    type="button"
                    className={selected ? 'secondary' : ''}
                    onClick={() => updateScenarioField(activeScenario.id, 'strategy_id', strategy.id)}
                  >
                    {selected ? 'Active Strategy' : 'Set Active'}
                  </button>
                  <button type="button" className="secondary" onClick={() => cloneScenarioForStrategy(strategy.id)}>
                    Save as Scenario
                  </button>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedStrategyIds.includes(strategy.id)}
                    onChange={() => toggleStrategy(strategy.id)}
                  />
                  Include in comparison
                </label>
              </article>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Strategy Comparison"
        subtitle="Side-by-side comparison for cost, service, lead-time and risk"
        actions={<button onClick={runComparison}>Compare Selected Strategies</button>}
      >
        <DataTable
          columns={[
            { key: 'strategy_name', label: 'Strategy' },
            { key: 'total_landed_cost', label: 'Total Landed Cost', format: 'currency' },
            { key: 'fill_rate', label: 'Fill Rate', format: 'percent' },
            { key: 'lead_time_days', label: 'Lead Time (days)' },
            { key: 'risk_score', label: 'Risk Score' },
          ]}
          rows={state.strategyComparison}
          emptyText="Run comparison to populate strategy impact table."
        />

        <BarChart data={chartData} />
      </SectionCard>

      <SectionCard title="Save / Load Scenarios" subtitle="Tie a strategy to reusable scenario definitions">
        <div className="summary-lines">
          <p>
            <strong>Current Scenario:</strong> {activeScenario?.name}
          </p>
          <p>
            <strong>Current Strategy:</strong>{' '}
            {getStrategyById(state, activeScenario?.strategy_id)?.name || activeScenario?.strategy_id}
          </p>
          <p>
            <strong>Saved Scenarios:</strong> {state.scenarios.length}
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
