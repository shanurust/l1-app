export function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="section-card">
      <header className="section-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}
