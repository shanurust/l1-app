export function RecommendationList({ recommendations = [] }) {
  return (
    <section className="recommendation-list">
      <h3>Recommended Actions</h3>
      {recommendations.length === 0 ? <p>No recommendations yet.</p> : null}
      <ul>
        {recommendations.map((item) => (
          <li key={item.id}>
            <h4>{item.title}</h4>
            <p>{item.rationale}</p>
            <small>{item.action}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}
