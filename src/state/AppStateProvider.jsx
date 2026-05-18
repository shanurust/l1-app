/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

import { getMockBootstrap, simulateScenario } from '../data/mockData'
import { appReducer, initialState } from './reducer'

const AppStateContext = createContext(null)

function findById(items, id) {
  return items.find((item) => item.id === id)
}

function listSensitivityValues(start, end, step) {
  const values = []
  for (let value = start; value <= end + 1e-9; value += step) {
    values.push(Number(value.toFixed(4)))
  }
  return values
}

function useAppStore() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const activeScenario = useMemo(
    () => state.scenarios.find((scenario) => scenario.id === state.activeScenarioId),
    [state.scenarios, state.activeScenarioId],
  )

  const activeResult = useMemo(
    () => state.resultsByScenario[state.activeScenarioId] || null,
    [state.resultsByScenario, state.activeScenarioId],
  )

  const loadBootstrap = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const data = getMockBootstrap()
      dispatch({
        type: 'HYDRATE_BOOTSTRAP',
        payload: {
          network: data.network,
          strategies: data.strategies,
          scenarios: data.scenarios,
          baselineResult: data.baseline_result,
        },
      })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load bootstrap' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const runScenario = useCallback(async (scenarioId) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const scenario = findById(state.scenarios, scenarioId)
      const strategy = findById(state.strategies, scenario?.strategy_id)
      const result = simulateScenario(state.network, scenario, strategy)
      dispatch({ type: 'SET_SCENARIO_RESULT', payload: { scenarioId, result } })
      dispatch({ type: 'SET_LOADING', payload: false })
      return result
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to run scenario' })
      dispatch({ type: 'SET_LOADING', payload: false })
      return null
    }
  }, [state.network, state.scenarios, state.strategies])

  const compareScenarios = useCallback(async (scenarioIds) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const baselineId = scenarioIds[0]
      const getScenarioResult = (scenarioId) => {
        const scenario = findById(state.scenarios, scenarioId)
        const strategy = findById(state.strategies, scenario?.strategy_id)
        return state.resultsByScenario[scenarioId] || simulateScenario(state.network, scenario, strategy)
      }
      const baseline = getScenarioResult(baselineId)
      const response = {
        baseline_scenario_id: baselineId,
        deltas: scenarioIds.slice(1).map((scenarioId) => {
          const result = getScenarioResult(scenarioId)
          return {
            scenario_id: scenarioId,
            total_landed_cost_delta: result.cost.total_landed_cost - baseline.cost.total_landed_cost,
            fill_rate_delta: result.fill_rate - baseline.fill_rate,
            lead_time_delta: result.expected_lead_time_days - baseline.expected_lead_time_days,
            inventory_delta: result.inventory.ending_inventory - baseline.inventory.ending_inventory,
          }
        }),
      }
      dispatch({ type: 'SET_SCENARIO_DELTAS', payload: response.deltas })
      dispatch({ type: 'SET_COMPARISON_SCENARIOS', payload: scenarioIds })
      dispatch({ type: 'SET_LOADING', payload: false })
      return response
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to compare scenarios' })
      dispatch({ type: 'SET_LOADING', payload: false })
      return null
    }
  }, [state.network, state.resultsByScenario, state.scenarios, state.strategies])

  const compareStrategies = useCallback(async ({ scenarioId, strategyIds }) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const scenario = findById(state.scenarios, scenarioId)
      const response = {
        scenario_id: scenarioId,
        rows: strategyIds.map((strategyId) => {
          const strategy = findById(state.strategies, strategyId)
          const result = simulateScenario(state.network, scenario, strategy)
          return {
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            total_landed_cost: result.cost.total_landed_cost,
            fill_rate: result.fill_rate,
            lead_time_days: result.expected_lead_time_days,
            risk_score: result.risk_score,
          }
        }),
      }
      dispatch({ type: 'SET_STRATEGY_COMPARISON', payload: response.rows })
      dispatch({ type: 'SET_LOADING', payload: false })
      return response.rows
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to compare strategies' })
      dispatch({ type: 'SET_LOADING', payload: false })
      return []
    }
  }, [state.network, state.scenarios, state.strategies])

  const runSensitivity = useCallback(async (payload) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const { scenarioId, parameter, start, end, step } = payload
      const scenario = findById(state.scenarios, scenarioId)
      const strategy = findById(state.strategies, scenario?.strategy_id)
      const points = listSensitivityValues(start, end, step).map((value) => {
        const adjusted = {
          ...scenario,
          adjustments: {
            ...scenario.adjustments,
            [parameter]: value,
          },
        }
        const result = simulateScenario(state.network, adjusted, strategy)
        return {
          parameter_value: value,
          total_landed_cost: result.cost.total_landed_cost,
          fill_rate: result.fill_rate,
          ending_inventory: result.inventory.ending_inventory,
        }
      })
      const response = {
        result: {
          scenario_id: scenarioId,
          parameter,
          points,
        },
      }
      dispatch({ type: 'SET_SENSITIVITY', payload: response.result })
      dispatch({ type: 'SET_LOADING', payload: false })
      return response.result
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to run sensitivity analysis' })
      dispatch({ type: 'SET_LOADING', payload: false })
      return null
    }
  }, [state.network, state.scenarios, state.strategies])

  const setActiveScenario = useCallback((scenarioId) => {
    dispatch({ type: 'SET_ACTIVE_SCENARIO', payload: scenarioId })
  }, [])

  const updateScenarioAdjustment = useCallback((scenarioId, field, value) => {
    dispatch({
      type: 'UPDATE_SCENARIO_ADJUSTMENT',
      payload: { scenarioId, field, value },
    })
  }, [])

  const updateScenarioField = useCallback((scenarioId, field, value) => {
    dispatch({
      type: 'UPDATE_SCENARIO_FIELD',
      payload: { scenarioId, field, value },
    })
  }, [])

  const saveScenario = useCallback(async (scenario) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      dispatch({ type: 'UPSERT_SCENARIO', payload: scenario })
      dispatch({ type: 'SET_LOADING', payload: false })
      return scenario
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to save scenario' })
      dispatch({ type: 'SET_LOADING', payload: false })
      return null
    }
  }, [])

  const updateSupplierField = useCallback((supplierId, field, value) => {
    dispatch({ type: 'UPDATE_SUPPLIER_FIELD', payload: { supplierId, field, value } })
  }, [])

  const updateLaneField = useCallback((laneId, field, value) => {
    dispatch({ type: 'UPDATE_LANE_FIELD', payload: { laneId, field, value } })
  }, [])

  const updateSkuField = useCallback((skuId, field, value) => {
    dispatch({ type: 'UPDATE_SKU_FIELD', payload: { skuId, field, value } })
  }, [])

  const updatePlantField = useCallback((plantId, field, value) => {
    dispatch({ type: 'UPDATE_PLANT_FIELD', payload: { plantId, field, value } })
  }, [])

  const updateDcField = useCallback((dcId, field, value) => {
    dispatch({ type: 'UPDATE_DC_FIELD', payload: { dcId, field, value } })
  }, [])

  const updateDemandProfileField = useCallback((customerId, field, value) => {
    dispatch({
      type: 'UPDATE_DEMAND_PROFILE_FIELD',
      payload: { customerId, field, value },
    })
  }, [])

  const updateInventoryPolicyField = useCallback((nodeId, field, value) => {
    dispatch({
      type: 'UPDATE_INVENTORY_POLICY_FIELD',
      payload: { nodeId, field, value },
    })
  }, [])

  const saveNetwork = useCallback(async () => {
    if (!state.network) {
      return
    }
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [state.network])

  useEffect(() => {
    loadBootstrap()
  }, [loadBootstrap])

  return {
    state,
    activeScenario,
    activeResult,
    loadBootstrap,
    runScenario,
    compareScenarios,
    compareStrategies,
    runSensitivity,
    setActiveScenario,
    updateScenarioAdjustment,
    updateScenarioField,
    saveScenario,
    updateSupplierField,
    updateLaneField,
    updateSkuField,
    updatePlantField,
    updateDcField,
    updateDemandProfileField,
    updateInventoryPolicyField,
    saveNetwork,
  }
}

export function AppStateProvider({ children }) {
  const store = useAppStore()
  return <AppStateContext.Provider value={store}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}
