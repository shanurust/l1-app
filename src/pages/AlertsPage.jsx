import { AlertPanel } from '../components/common/AlertPanel'
import { SectionCard } from '../components/common/SectionCard'

export function AlertsPage({ alerts, recommendations }) {
  return (
    <div className="page-grid one-col">
      <SectionCard title="Near-Real-Time Edge Alerts" subtitle="Supplier, inventory, capacity and transport risk notifications">
        <AlertPanel alerts={alerts} />
      </SectionCard>

      <SectionCard title="Action Recommendations" subtitle="Suggested user-centric actions by event type">
        <ul className="quick-actions">
          {recommendations.map((recommendation) => (
            <li key={recommendation.id}>
              <h4>{recommendation.title}</h4>
              <p>{recommendation.action}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
