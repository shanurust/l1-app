export function TopBar({
  activeScenario,
  scenarios = [],
  onScenarioChange,
  onRun,
  onRefresh,
  loading,
}) {
  return (
    <header className="top-bar">
      <div>
        <p className="kicker">Supply Chain Optimization POC</p>
        <h1>Network Analytics and Scenario Studio</h1>
        <p className="subtitle">
          Deterministic planning engine across Supplier - Plant - DC - Customer lanes.
        </p>
      </div>
      <div className="top-bar-actions">
        <label className="scenario-picker">
          Scenario
          <select
            value={activeScenario?.id || ''}
            onChange={(event) => onScenarioChange(event.target.value)}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onRun} disabled={loading}>
          {loading ? 'Running...' : 'Run Active Scenario'}
        </button>
        <button type="button" className="secondary" onClick={onRefresh} disabled={loading}>
          Reload Data
        </button>
      </div>
    </header>
  )
}
