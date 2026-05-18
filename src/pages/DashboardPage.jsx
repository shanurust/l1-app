import { AlertPanel } from '../components/common/AlertPanel'
import { KpiCard } from '../components/common/KpiCard'
import { RecommendationList } from '../components/common/RecommendationList'
import { SectionCard } from '../components/common/SectionCard'
import { formatCurrency, formatPercent } from '../utils/formatters'

export function DashboardPage({ state, activeScenario, activeResult }) {
  return (
    <div className="page-grid two-col">
      <SectionCard title="KPI Summary" subtitle="Current scenario network health">
        <div className="kpi-grid">
          <KpiCard label="Total Landed Cost" value={activeResult?.cost?.total_landed_cost || 0} kind="currency" />
          <KpiCard label="Fill Rate" value={activeResult?.fill_rate || 0} kind="percent" />
          <KpiCard label="Expected Lead Time" value={activeResult?.expected_lead_time_days || 0} hint="days" />
          <KpiCard label="Risk Score" value={activeResult?.risk_score || 0} />
        </div>
      </SectionCard>

      <SectionCard title="Current Scenario" subtitle={activeScenario?.description || 'Scenario assumptions'}>
        <div className="summary-lines">
          <p>
            <strong>Scenario:</strong> {activeScenario?.name || 'N/A'}
          </p>
          <p>
            <strong>Strategy:</strong> {activeScenario?.strategy_id || 'N/A'}
          </p>
          <p>
            <strong>Demand:</strong> {Math.round(activeResult?.total_demand || 0)} units
          </p>
          <p>
            <strong>Fulfilled:</strong> {Math.round(activeResult?.fulfilled_demand || 0)} units ({formatPercent(activeResult?.fill_rate || 0, 1)})
          </p>
          <p>
            <strong>Inventory On Hand (End):</strong> {Math.round(activeResult?.inventory?.ending_inventory || 0)} units
          </p>
          <p>
            <strong>Carrying Cost:</strong> {formatCurrency(activeResult?.cost?.inventory_carrying_cost || 0, 0)}
          </p>
        </div>
      </SectionCard>

      <AlertPanel alerts={state.alerts} />
      <RecommendationList recommendations={state.recommendations} />

      <SectionCard title="Recent Changes" subtitle="Latest scenario and simulation actions">
        <ul className="event-list">
          {state.events.map((event) => (
            <li key={event.id}>
              <span>{new Date(event.at).toLocaleTimeString()}</span>
              <p>{event.message}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Quick Recommendations" subtitle="Business actions based on current outputs">
        <ul className="quick-actions">
          {(state.recommendations || []).slice(0, 4).map((item) => (
            <li key={item.id}>
              <h4>{item.title}</h4>
              <p>{item.action}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
