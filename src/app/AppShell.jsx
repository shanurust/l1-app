import { useEffect, useMemo, useState } from 'react'

import { SideNav } from '../components/layout/SideNav'
import { TopBar } from '../components/layout/TopBar'
import { AlertsPage } from '../pages/AlertsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { InputConfigurationPage } from '../pages/InputConfigurationPage'
import { NetworkModelPage } from '../pages/NetworkModelPage'
import { ResultsRecommendationsPage } from '../pages/ResultsRecommendationsPage'
import { ScenarioSimulatorPage } from '../pages/ScenarioSimulatorPage'
import { SensitivityAnalysisPage } from '../pages/SensitivityAnalysisPage'
import { SourcingStrategyPage } from '../pages/SourcingStrategyPage'
import { useAppState } from '../state/AppStateProvider'
import { DEFAULT_ROUTE, APP_ROUTES } from './routes'

function getHashPath() {
  const hash = window.location.hash.replace('#', '')
  if (!hash) {
    return DEFAULT_ROUTE
  }
  return hash.startsWith('/') ? hash : `/${hash}`
}

export function AppShell() {
  const {
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
  } = useAppState()

  const [path, setPath] = useState(getHashPath())

  useEffect(() => {
    const handleHashChange = () => {
      setPath(getHashPath())
    }

    if (!window.location.hash) {
      window.location.hash = DEFAULT_ROUTE
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const route = useMemo(() => APP_ROUTES.find((item) => item.path === path) || APP_ROUTES[0], [path])

  const navigate = (routePath) => {
    window.location.hash = routePath
  }

  const handleRunScenario = async () => {
    if (!activeScenario) {
      return
    }
    await saveScenario(activeScenario)
    await runScenario(activeScenario.id)
  }

  const renderPage = () => {
    if (!state.network || !activeScenario) {
      return <p className="loading-text">Loading data model...</p>
    }

    switch (route.pageKey) {
      case 'dashboard':
        return <DashboardPage state={state} activeScenario={activeScenario} activeResult={activeResult} />
      case 'network':
        return (
          <NetworkModelPage
            state={state}
            updateSupplierField={updateSupplierField}
            updateLaneField={updateLaneField}
            saveNetwork={saveNetwork}
          />
        )
      case 'input':
        return (
          <InputConfigurationPage
            state={state}
            updateSupplierField={updateSupplierField}
            updateLaneField={updateLaneField}
            updateSkuField={updateSkuField}
            updatePlantField={updatePlantField}
            updateDcField={updateDcField}
            updateDemandProfileField={updateDemandProfileField}
            updateInventoryPolicyField={updateInventoryPolicyField}
          />
        )
      case 'strategy':
        return (
          <SourcingStrategyPage
            state={state}
            activeScenario={activeScenario}
            updateScenarioField={updateScenarioField}
            compareStrategies={compareStrategies}
            saveScenario={saveScenario}
          />
        )
      case 'simulator':
        return (
          <ScenarioSimulatorPage
            state={state}
            activeScenario={activeScenario}
            runScenario={runScenario}
            compareScenarios={compareScenarios}
            updateScenarioAdjustment={updateScenarioAdjustment}
            saveScenario={saveScenario}
          />
        )
      case 'sensitivity':
        return (
          <SensitivityAnalysisPage
            state={state}
            activeScenario={activeScenario}
            runSensitivity={runSensitivity}
          />
        )
      case 'results':
        return (
          <ResultsRecommendationsPage
            activeResult={activeResult}
            alerts={state.alerts}
            recommendations={state.recommendations}
          />
        )
      case 'alerts':
        return <AlertsPage alerts={state.alerts} recommendations={state.recommendations} />
      default:
        return <DashboardPage state={state} activeScenario={activeScenario} activeResult={activeResult} />
    }
  }

  return (
    <div className="app-layout">
      <SideNav routes={APP_ROUTES} activeRoute={route.path} onNavigate={navigate} />
      <main className="main-shell">
        <TopBar
          activeScenario={activeScenario}
          scenarios={state.scenarios}
          onScenarioChange={setActiveScenario}
          onRun={handleRunScenario}
          onRefresh={loadBootstrap}
          loading={state.loading}
        />
        {state.error ? <p className="error-banner">{state.error}</p> : null}
        {renderPage()}
      </main>
    </div>
  )
}
