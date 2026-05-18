export const initialState = {
  network: null,
  strategies: [],
  scenarios: [],
  resultsByScenario: {},
  baselineScenarioId: 'baseline',
  activeScenarioId: 'baseline',
  comparisonScenarioIds: ['baseline'],
  scenarioDeltas: [],
  strategyComparison: [],
  sensitivity: null,
  alerts: [],
  recommendations: [],
  events: [],
  loading: false,
  error: null,
}

function addEvent(state, message) {
  const eventId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  return {
    ...state,
    events: [{ id: eventId, message, at: new Date().toISOString() }, ...state.events].slice(0, 10),
  }
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'HYDRATE_BOOTSTRAP': {
      const { network, strategies, scenarios, baselineResult } = action.payload
      return {
        ...state,
        network,
        strategies,
        scenarios,
        resultsByScenario: {
          ...state.resultsByScenario,
          baseline: baselineResult,
        },
        alerts: baselineResult.alerts,
        recommendations: baselineResult.recommendations,
        loading: false,
        error: null,
      }
    }

    case 'SET_ACTIVE_SCENARIO':
      return { ...state, activeScenarioId: action.payload }

    case 'SET_SCENARIO_RESULT': {
      const { scenarioId, result } = action.payload
      const withResult = {
        ...state,
        resultsByScenario: {
          ...state.resultsByScenario,
          [scenarioId]: result,
        },
        alerts: result.alerts,
        recommendations: result.recommendations,
      }
      return addEvent(withResult, `Scenario ${scenarioId} simulated`) 
    }

    case 'UPSERT_SCENARIO': {
      const scenario = action.payload
      const exists = state.scenarios.some((item) => item.id === scenario.id)
      const scenarios = exists
        ? state.scenarios.map((item) => (item.id === scenario.id ? scenario : item))
        : [...state.scenarios, scenario]
      const withScenarios = { ...state, scenarios }
      return addEvent(withScenarios, `Scenario ${scenario.name} saved`) 
    }

    case 'UPDATE_SCENARIO_ADJUSTMENT': {
      const { scenarioId, field, value } = action.payload
      const scenarios = state.scenarios.map((scenario) => {
        if (scenario.id !== scenarioId) {
          return scenario
        }
        return {
          ...scenario,
          adjustments: {
            ...scenario.adjustments,
            [field]: value,
          },
        }
      })
      return { ...state, scenarios }
    }

    case 'UPDATE_SCENARIO_FIELD': {
      const { scenarioId, field, value } = action.payload
      const scenarios = state.scenarios.map((scenario) => (scenario.id === scenarioId ? { ...scenario, [field]: value } : scenario))
      return { ...state, scenarios }
    }

    case 'UPDATE_SUPPLIER_FIELD': {
      const { supplierId, field, value } = action.payload
      const network = {
        ...state.network,
        suppliers: state.network.suppliers.map((supplier) =>
          supplier.id === supplierId ? { ...supplier, [field]: value } : supplier,
        ),
      }
      return { ...state, network }
    }

    case 'UPDATE_LANE_FIELD': {
      const { laneId, field, value } = action.payload
      const network = {
        ...state.network,
        lanes: state.network.lanes.map((lane) => (lane.id === laneId ? { ...lane, [field]: value } : lane)),
      }
      return { ...state, network }
    }

    case 'UPDATE_SKU_FIELD': {
      const { skuId, field, value } = action.payload
      const network = {
        ...state.network,
        skus: state.network.skus.map((sku) => (sku.id === skuId ? { ...sku, [field]: value } : sku)),
      }
      return { ...state, network }
    }

    case 'UPDATE_PLANT_FIELD': {
      const { plantId, field, value } = action.payload
      const network = {
        ...state.network,
        plants: state.network.plants.map((plant) =>
          plant.id === plantId ? { ...plant, [field]: value } : plant,
        ),
      }
      return { ...state, network }
    }

    case 'UPDATE_DC_FIELD': {
      const { dcId, field, value } = action.payload
      const network = {
        ...state.network,
        dcs: state.network.dcs.map((dc) => (dc.id === dcId ? { ...dc, [field]: value } : dc)),
      }
      return { ...state, network }
    }

    case 'UPDATE_DEMAND_PROFILE_FIELD': {
      const { customerId, field, value } = action.payload
      const network = {
        ...state.network,
        demand_profiles: state.network.demand_profiles.map((profile) =>
          profile.customer_id === customerId ? { ...profile, [field]: value } : profile,
        ),
      }
      return { ...state, network }
    }

    case 'UPDATE_INVENTORY_POLICY_FIELD': {
      const { nodeId, field, value } = action.payload
      const network = {
        ...state.network,
        inventory_policies: state.network.inventory_policies.map((policy) =>
          policy.node_id === nodeId ? { ...policy, [field]: value } : policy,
        ),
      }
      return { ...state, network }
    }

    case 'SET_STRATEGY_COMPARISON':
      return { ...state, strategyComparison: action.payload }

    case 'SET_SCENARIO_DELTAS':
      return { ...state, scenarioDeltas: action.payload }

    case 'SET_SENSITIVITY':
      return { ...state, sensitivity: action.payload }

    case 'SET_COMPARISON_SCENARIOS':
      return { ...state, comparisonScenarioIds: action.payload }

    default:
      return state
  }
}
