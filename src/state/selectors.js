export function getCurrentScenarioSummary(state) {
  const scenario = state.scenarios.find((item) => item.id === state.activeScenarioId)
  return scenario || null
}

export function getScenarioById(state, scenarioId) {
  return state.scenarios.find((item) => item.id === scenarioId)
}

export function getStrategyById(state, strategyId) {
  return state.strategies.find((item) => item.id === strategyId)
}

export function getResultByScenarioId(state, scenarioId) {
  return state.resultsByScenario[scenarioId] || null
}
