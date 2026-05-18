export function AlertPanel({ alerts = [] }) {
  return (
    <section className="alert-panel">
      <h3>Event and Alerts</h3>
      <div className="alert-list">
        {alerts.map((alert) => (
          <article key={alert.id} className={`alert-item ${alert.severity}`}>
            <div>
              <p className="alert-title">{alert.title}</p>
              <p className="alert-detail">{alert.detail}</p>
            </div>
            <p className="alert-action">{alert.recommended_action}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
