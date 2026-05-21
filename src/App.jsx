import { useMemo, useRef, useState } from 'react'
import './styles/app.css'

const NODE_SIZE = { width: 138, height: 72 }
const CANVAS_SIZE = { width: 980, height: 520 }
const DEMAND_PLANNING_WEEKS = 52
const DEMAND_STABLE_WEEKS = 40
const DEMAND_SHIFT_START_WEEK = DEMAND_STABLE_WEEKS + 1
const DEMAND_SHIFT_END_WEEK = DEMAND_PLANNING_WEEKS
const DEFAULT_WEEKLY_DEMAND = 10000
const DEFAULT_DEMAND_SHIFT_SERIES = [
  10500, 10800, 11200, 11600, 12000, 12400,
  12800, 12600, 12300, 11800, 11200, 10800,
]
const DEFAULT_DEMAND_SERIES = Array.from({ length: DEMAND_PLANNING_WEEKS }, (_, index) => (
  index < DEMAND_STABLE_WEEKS
    ? DEFAULT_WEEKLY_DEMAND
    : DEFAULT_DEMAND_SHIFT_SERIES[index - DEMAND_STABLE_WEEKS] || DEFAULT_WEEKLY_DEMAND
))
const DEFAULT_COST_DATA = {
  plantProductPenaltyPerUnit: 1.8,
  plantInventoryPenaltyPerUnit: 0.48,
  dcInventoryPenaltyPerUnit: 0.72,
  retailerMissedDemandPenaltyPerUnit: 4.5,
}

const PALETTE_TYPES = [
  { type: 'supplier', label: 'Supplier' },
  { type: 'plant', label: 'Plant' },
  { type: 'dc', label: 'DC / Distributor' },
  { type: 'customer', label: 'Customer' },
]

const STRATEGIES = [
  { id: 'split_70_30', label: 'Supplier Ratio 70 / 30' },
  { id: 'split_50_50', label: 'Supplier Ratio 50 / 50' },
  { id: 'cheapest', label: 'Safest Option (Least Penalty)' },
]

const BASE_NODES = [
  { id: 'SUP1', type: 'supplier', name: 'Supplier Alpha', x: 70, y: 85, capacity: 7600, demand: 0, costPerUnit: 11.1, leadTimeDays: 16, risk: 0.42, minOrderQty: 500 },
  { id: 'SUP2', type: 'supplier', name: 'Supplier Beta', x: 70, y: 240, capacity: 6200, demand: 0, costPerUnit: 12.2, leadTimeDays: 9, risk: 0.24, minOrderQty: 350 },
  { id: 'PLT1', type: 'plant', name: 'Plant East', x: 320, y: 160, capacity: 10000, demand: 0, costPerUnit: 1.8, leadTimeDays: 2, risk: 0.15, inventoryOnHand: 2900, safetyStock: 1400 },
  { id: 'DC01', type: 'dc', name: 'DC North', x: 580, y: 110, capacity: 5800, demand: 0, costPerUnit: 0.65, leadTimeDays: 2, risk: 0.18, inventoryOnHand: 1800, safetyStock: 900 },
  { id: 'DC02', type: 'dc', name: 'DC South', x: 580, y: 270, capacity: 5200, demand: 0, costPerUnit: 0.72, leadTimeDays: 3, risk: 0.22, inventoryOnHand: 1200, safetyStock: 700 },
  { id: 'CUS1', type: 'customer', name: 'Retail A', x: 840, y: 75, capacity: 0, demand: 4200, costPerUnit: 0, leadTimeDays: 0, risk: 0.1 },
  { id: 'CUS2', type: 'customer', name: 'Retail B', x: 840, y: 220, capacity: 0, demand: 3300, costPerUnit: 0, leadTimeDays: 0, risk: 0.14 },
  { id: 'CUS3', type: 'customer', name: 'E-Com', x: 840, y: 355, capacity: 0, demand: 2400, costPerUnit: 0, leadTimeDays: 0, risk: 0.18 },
]

const BASE_LANES = [
  { id: 'L1', from: 'SUP1', to: 'PLT1', costPerUnit: 0.9, leadTimeDays: 6, capacity: 9000, active: true },
  { id: 'L2', from: 'SUP2', to: 'PLT1', costPerUnit: 1.4, leadTimeDays: 3, capacity: 7000, active: true },
  { id: 'L3', from: 'PLT1', to: 'DC01', costPerUnit: 1.1, leadTimeDays: 2, capacity: 9000, active: true },
  { id: 'L4', from: 'PLT1', to: 'DC02', costPerUnit: 0.95, leadTimeDays: 3, capacity: 8500, active: true },
  { id: 'L5', from: 'DC01', to: 'CUS1', costPerUnit: 0.75, leadTimeDays: 2, capacity: 7000, active: true },
  { id: 'L6', from: 'DC02', to: 'CUS2', costPerUnit: 0.82, leadTimeDays: 2, capacity: 6500, active: true },
  { id: 'L7', from: 'DC02', to: 'CUS3', costPerUnit: 0.88, leadTimeDays: 2, capacity: 6200, active: true },
]

const BASE_SCENARIO = {
  strategyId: 'split_70_30',
  demandDeltaPct: 0,
  demandShiftDeltaPct: 0,
  demandShiftStartWeek: DEMAND_SHIFT_START_WEEK,
  demandShiftEndWeek: DEMAND_SHIFT_END_WEEK,
  demandSeries: DEFAULT_DEMAND_SERIES,
  supplierCostDeltaPct: 0,
  supplierLeadTimeDeltaPct: 0,
  transportCostDeltaPct: 0,
  serviceLevelTarget: 0.95,
  costData: { ...DEFAULT_COST_DATA },
}

const SCENARIO_PRESETS = [
  { id: 'sup1_delay_5d', label: 'Supplier 1 delayed by 5 days' },
  { id: 'sup2_cost_8', label: 'Supplier 2 penalty +8%' },
  { id: 'supplier_cap_minus_30', label: 'Supplier weekly capacity -30%' },
  { id: 'dc_below_safety', label: 'DC inventory below safety stock' },
  { id: 'dc_demand_plus_20', label: 'DC demand +20%' },
  { id: 'lane_cost_double', label: 'Transport lane penalty doubles' },
  { id: 'lane_unavailable', label: 'One lane unavailable' },
  { id: 'moq_overstock', label: 'MOQ forces overstock' },
  { id: 'service_target_impossible', label: 'Service target impossible under constraints' },
  { id: 'plant_util_95', label: 'Plant utilization >95%' },
  { id: 'dc_stockout_3d', label: 'DC projected stockout within 3 days' },
  { id: 'excess_inv_2w', label: 'Excess inventory projected in 2 weeks' },
]

function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatCurrency(value) {
  return formatNumber(value, 0)
}

function formatPct(value) {
  return `${formatNumber((value || 0) * 100, 1)}%`
}

function sum(values) {
  return values.reduce((acc, value) => acc + value, 0)
}

function normalizeDemandSeries(series, fallbackValue = DEFAULT_WEEKLY_DEMAND) {
  const base = Array.from({ length: DEMAND_PLANNING_WEEKS }, (_, index) => {
    const value = Number(series?.[index])
    return Number.isFinite(value) ? Math.max(0, value) : fallbackValue
  })
  return base
}

function getShares(strategyId, suppliers) {
  if (strategyId === 'cheapest') {
    const ranked = [...suppliers].sort((a, b) => a.costPerUnit - b.costPerUnit)
    return Object.fromEntries(ranked.map((supplier, index) => [supplier.id, index === 0 ? 1 : 0]))
  }
  if (strategyId === 'split_70_30') {
    return { [suppliers[0]?.id]: 0.7, [suppliers[1]?.id]: 0.3 }
  }
  if (strategyId === 'split_50_50') {
    return { [suppliers[0]?.id]: 0.5, [suppliers[1]?.id]: 0.5 }
  }

  const weights = suppliers.map((supplier) => {
    const score = supplier.costPerUnit * 0.35 + supplier.leadTimeDays * 0.35 + supplier.risk * 10 * 0.3
    return { id: supplier.id, weight: 1 / Math.max(score, 0.01) }
  })
  const total = weights.reduce((sum, item) => sum + item.weight, 0)
  return Object.fromEntries(weights.map((item) => [item.id, item.weight / Math.max(total, 1e-6)]))
}

function runScenario(nodes, lanes, scenario) {
  const suppliers = nodes.filter((node) => node.type === 'supplier')
  const customers = nodes.filter((node) => node.type === 'customer')
  const plants = nodes.filter((node) => node.type === 'plant')
  const dcs = nodes.filter((node) => node.type === 'dc')
  const costData = { ...DEFAULT_COST_DATA, ...scenario.costData }

  const customerDemandBaseline = customers.reduce((acc, customer) => acc + customer.demand, 0)
  const fallbackDemand = customerDemandBaseline > 0 ? customerDemandBaseline : DEFAULT_WEEKLY_DEMAND
  const demandSeries = normalizeDemandSeries(scenario.demandSeries, fallbackDemand)
  const demandShiftStart = clamp(Math.round(scenario.demandShiftStartWeek || DEMAND_SHIFT_START_WEEK), 1, DEMAND_PLANNING_WEEKS)
  const demandShiftEnd = clamp(Math.round(scenario.demandShiftEndWeek || DEMAND_SHIFT_END_WEEK), demandShiftStart, DEMAND_PLANNING_WEEKS)

  const adjustedDemandSeries = demandSeries.map((baseDemand, index) => {
    const weekNo = index + 1
    const globalMultiplier = 1 + (scenario.demandDeltaPct || 0)
    const shiftMultiplier = weekNo >= demandShiftStart && weekNo <= demandShiftEnd
      ? 1 + (scenario.demandShiftDeltaPct || 0)
      : 1
    return Math.max(0, baseDemand * globalMultiplier * shiftMultiplier)
  })

  const demand = sum(adjustedDemandSeries)
  const planningWeeks = adjustedDemandSeries.length
  const plantCapacityPerWeek = plants.reduce((acc, plant) => acc + plant.capacity, 0)
  const plantCapacity = plantCapacityPerWeek * planningWeeks
  const effectiveDemand = Math.min(demand, plantCapacity)
  const unavailableLanes = lanes.filter((lane) => !lane.active)
  const criticalUnavailableLanes = unavailableLanes.filter(
    (lane) =>
      lane.from.startsWith('PLT') ||
      lane.to.startsWith('DC') ||
      lane.from.startsWith('DC'),
  )

  const adjustedSuppliers = suppliers.map((supplier) => ({
    ...supplier,
    costPerUnit: supplier.costPerUnit * (1 + scenario.supplierCostDeltaPct),
    leadTimeDays: supplier.leadTimeDays * (1 + scenario.supplierLeadTimeDeltaPct),
    capacity: supplier.capacity * planningWeeks,
  }))

  const shares = getShares(scenario.strategyId, adjustedSuppliers)

  const allocations = []
  let fulfilled = 0

  adjustedSuppliers.forEach((supplier) => {
    const target = effectiveDemand * (shares[supplier.id] || 0)
    let allocated = Math.max(0, Math.min(target, supplier.capacity))
    const minOrderQty = supplier.minOrderQty || 0
    if (allocated > 0 && allocated < minOrderQty) {
      allocated = Math.min(minOrderQty, supplier.capacity)
    }
    if (allocated > 0) {
      fulfilled += allocated
      allocations.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        quantity: allocated,
        share: 0,
        unitCost: supplier.costPerUnit,
        leadTimeDays: supplier.leadTimeDays,
        risk: supplier.risk,
      })
    }
  })

  const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.quantity, 0)
  allocations.forEach((allocation) => {
    allocation.share = allocation.quantity / Math.max(totalAllocated, 1e-6)
  })

  const laneDeliveryFactor = Math.max(0.58, 1 - criticalUnavailableLanes.length * 0.2)
  const deliverableQty = fulfilled * laneDeliveryFactor
  const fulfilledDemand = Math.min(deliverableQty, demand)
  const overstockFromMoq = Math.max(totalAllocated - effectiveDemand, 0)
  const unmet = Math.max(demand - fulfilledDemand, 0)
  const fillRate = fulfilledDemand / Math.max(demand, 1e-6)

  const weeklyFulfilledSeries = adjustedDemandSeries.map((weekDemand) => weekDemand * fillRate)
  const weeklyUnmetSeries = adjustedDemandSeries.map((weekDemand) => Math.max(weekDemand - weekDemand * fillRate, 0))
  const demandTrendRows = adjustedDemandSeries.map((weekDemand, index) => ({
    week: index + 1,
    demand: weekDemand,
    fulfilled: weeklyFulfilledSeries[index],
    unmet: weeklyUnmetSeries[index],
  }))

  const baseLaneCost = lanes.filter((lane) => lane.active).reduce((sum, lane) => sum + lane.costPerUnit, 0) / Math.max(lanes.filter((lane) => lane.active).length, 1)
  const baseLaneLead = lanes.filter((lane) => lane.active).reduce((sum, lane) => sum + lane.leadTimeDays, 0) / Math.max(lanes.filter((lane) => lane.active).length, 1)
  const plantInventoryOnHand = plants.reduce((sum, plant) => sum + (plant.inventoryOnHand || 0), 0)
  const dcInventoryOnHand = dcs.reduce((sum, dc) => sum + (dc.inventoryOnHand || 0), 0)
  const beginningInventory = plantInventoryOnHand + dcInventoryOnHand
  const plantInventoryShare = beginningInventory > 0 ? plantInventoryOnHand / beginningInventory : 0.5
  const dcInventoryShare = beginningInventory > 0 ? dcInventoryOnHand / beginningInventory : 0.5
  const blendedInventoryPenaltyPerUnit =
    costData.plantInventoryPenaltyPerUnit * plantInventoryShare
    + costData.dcInventoryPenaltyPerUnit * dcInventoryShare

  const procurementCost = allocations.reduce((sum, allocation) => sum + allocation.quantity * allocation.unitCost, 0)
  const transportCost = totalAllocated * baseLaneCost * (1 + scenario.transportCostDeltaPct)
  const inventoryHoldingCost = (totalAllocated + overstockFromMoq) * (baseLaneLead / 30) * blendedInventoryPenaltyPerUnit
  const stockoutPenalty = unmet * costData.retailerMissedDemandPenaltyPerUnit
  const plantUnitPenalty = costData.plantProductPenaltyPerUnit
  const plantProductionPenalty = fulfilledDemand * plantUnitPenalty
  const productionPenalty = procurementCost + plantProductionPenalty
  const transportationPenalty = transportCost
  const inventoryPenalty = inventoryHoldingCost
  const missedDemandPenalty = stockoutPenalty
  const objectiveFunction = productionPenalty + transportationPenalty + inventoryPenalty + missedDemandPenalty
  const totalLandedCost = objectiveFunction

  const avgLeadTime = allocations.reduce((sum, allocation) => sum + allocation.leadTimeDays * allocation.share, 0) + baseLaneLead
  const weightedRisk = allocations.reduce((sum, allocation) => sum + allocation.risk * allocation.share, 0)
  const dcSafetyStock = dcs.reduce((sum, dc) => sum + (dc.safetyStock || 0), 0)
  const endingInventory = Math.max(beginningInventory + totalAllocated - demand, 0)
  const dailyDemand = demand / Math.max(planningWeeks * 7, 1)
  const daysOfSupply = endingInventory / Math.max(dailyDemand, 1e-6)
  const dcDaysOfSupply = dcInventoryOnHand / Math.max(dailyDemand, 1e-6)
  const projectedInventoryBalanceInTwoWeeks = endingInventory - dailyDemand * 14
  const projectedInventoryInTwoWeeks = Math.max(projectedInventoryBalanceInTwoWeeks, 0)
  const projectedInventoryShortfallInTwoWeeks = Math.max(-projectedInventoryBalanceInTwoWeeks, 0)
  const projectedStockoutDays = endingInventory / Math.max(dailyDemand, 1e-6)
  const plantUtilization = fulfilledDemand / Math.max(plantCapacity, 1e-6)
  const dcBelowSafetyStock = dcInventoryOnHand < dcSafetyStock
  const serviceTargetFeasible = fillRate >= scenario.serviceLevelTarget
  const avgWeeklyDemand = demand / Math.max(planningWeeks, 1)
  const peakWeeklyDemand = Math.max(...adjustedDemandSeries)
  const troughWeeklyDemand = Math.min(...adjustedDemandSeries)
  const demandVolatility = (peakWeeklyDemand - troughWeeklyDemand) / Math.max(avgWeeklyDemand, 1e-6)
  const prebuildUnits = demand * (
    Math.max(scenario.demandDeltaPct, 0) * 0.28
    + Math.max(scenario.demandShiftDeltaPct || 0, 0) * 0.24
    + Math.max(0.95 - fillRate, 0) * 0.48
  )

  const alerts = []
  if (fillRate < 0.93) {
    alerts.push('Service target risk: fill rate below 93%.')
  }
  if (weightedRisk > 0.35) {
    alerts.push('Supplier concentration risk is elevated.')
  }
  if (daysOfSupply < 10) {
    alerts.push('Low inventory coverage at DC network.')
  }
  if (scenario.transportCostDeltaPct > 0.15) {
    alerts.push('Transportation penalty spike detected.')
  }
  if (criticalUnavailableLanes.length > 0) {
    const laneNames = criticalUnavailableLanes
      .map((lane) => formatLaneDisplayName(lane, nodes))
      .join(', ')
    alerts.push(`Lane unavailable: ${laneNames}. Delivery flow constrained.`)
  }
  if (overstockFromMoq > 0) {
    alerts.push(`MOQ overstock triggered: +${Math.round(overstockFromMoq)} units above required quantity.`)
  }
  if (!serviceTargetFeasible) {
    alerts.push(`Service level target ${formatPct(scenario.serviceLevelTarget)} is not feasible under current constraints.`)
  }
  if (plantUtilization > 0.95) {
    alerts.push(`Plant utilization critical: ${formatPct(plantUtilization)} (>95%).`)
  }
  if (dcDaysOfSupply <= 3) {
    alerts.push(`DC projected stockout within ${formatNumber(dcDaysOfSupply, 1)} days.`)
  }
  if (projectedInventoryInTwoWeeks > 0) {
    alerts.push(`Excess inventory projected in 2 weeks: ${formatNumber(projectedInventoryInTwoWeeks)} units.`)
  }
  if (projectedInventoryShortfallInTwoWeeks > 0) {
    alerts.push(`2-week inventory shortfall projected: ${formatNumber(projectedInventoryShortfallInTwoWeeks)} units.`)
  }
  if (dcBelowSafetyStock) {
    alerts.push('DC inventory is below safety stock.')
  }
  if (scenario.demandShiftDeltaPct > 0.12) {
    alerts.push(`Demand surge expected in weeks ${demandShiftStart}-${demandShiftEnd}.`)
  }
  if (scenario.demandShiftDeltaPct < -0.12) {
    alerts.push(`Demand drop expected in weeks ${demandShiftStart}-${demandShiftEnd}; excess risk may rise.`)
  }
  if (demandVolatility > 0.22) {
    alerts.push('Demand volatility is high across planning horizon; weekly buffering recommended.')
  }
  if (alerts.length === 0) {
    alerts.push('Network stable for this scenario run.')
  }

  const recommendations = []
  if (scenario.strategyId === 'cheapest' && weightedRisk > 0.3) {
    recommendations.push('Shift to split sourcing 70/30 to improve resilience.')
  }
  if (fillRate < 0.95) {
    recommendations.push('Reallocate 20% volume to fastest supplier for priority customers.')
  }
  if (prebuildUnits > 0) {
    recommendations.push(`Prebuild ${Math.round(prebuildUnits)} units to DC01 before next cycle.`)
  }
  if (scenario.demandShiftDeltaPct > 0.12) {
    recommendations.push(`Prebuild and stage inventory before week ${demandShiftStart} demand uplift starts.`)
  }
  if (scenario.demandShiftDeltaPct < -0.12) {
    recommendations.push(`Reduce replenishment in weeks ${demandShiftStart}-${demandShiftEnd} to avoid excess carry.`)
  }
  if (inventoryHoldingCost > transportCost) {
    recommendations.push('Hold slow-moving inventory at plant; avoid overpush to DC02.')
  }
  recommendations.push('Expedite only priority customer orders when fill rate drops under 95%.')

  return {
    demand,
    fulfilled: fulfilledDemand,
    fillRate,
    avgLeadTime,
    weightedRisk,
    procurementCost,
    transportCost,
    inventoryHoldingCost,
    totalLandedCost,
    objectiveFunction,
    productionPenalty,
    transportationPenalty,
    inventoryPenalty,
    missedDemandPenalty,
    missedDemandUnits: unmet,
    daysOfSupply,
    dcDaysOfSupply,
    plantUtilization,
    serviceLevelTarget: scenario.serviceLevelTarget,
    serviceTargetFeasible,
    dcBelowSafetyStock,
    projectedStockoutDays,
    projectedInventoryInTwoWeeks,
    projectedInventoryShortfallInTwoWeeks,
    overstockFromMoq,
    prebuildUnits,
    demandShiftStartWeek: demandShiftStart,
    demandShiftEndWeek: demandShiftEnd,
    demandSeries: adjustedDemandSeries,
    demandTrendRows,
    peakWeeklyDemand,
    troughWeeklyDemand,
    demandVolatility,
    stockoutPenalty,
    alerts,
    recommendations,
    allocations,
  }
}

function compareStrategies(nodes, lanes, scenario) {
  return STRATEGIES.map((strategy) => {
    const result = runScenario(nodes, lanes, { ...scenario, strategyId: strategy.id })
    return {
      strategyId: strategy.id,
      strategyLabel: strategy.label,
      totalLandedCost: result.totalLandedCost,
      fillRate: result.fillRate,
      avgLeadTime: result.avgLeadTime,
      weightedRisk: result.weightedRisk,
    }
  })
}

function nodeClass(type) {
  return `node-card node-${type}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

function cloneData(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

function updateById(items, id, patch) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function findNodeId(nodes, preferredId, type, fallbackIndex = 0) {
  if (preferredId && nodes.some((node) => node.id === preferredId)) {
    return preferredId
  }
  const typed = nodes.filter((node) => node.type === type)
  return typed[fallbackIndex]?.id || ''
}

function findLaneId(lanes, preferredId, predicate) {
  if (preferredId && lanes.some((lane) => lane.id === preferredId)) {
    return preferredId
  }
  const lane = lanes.find(predicate)
  return lane?.id || ''
}

function formatLaneDisplayName(lane, nodes) {
  if (!lane) {
    return 'Selected lane'
  }
  const source = nodes.find((node) => node.id === lane.from)
  const target = nodes.find((node) => node.id === lane.to)
  return `${lane.id}: ${source?.name || lane.from} -> ${target?.name || lane.to}`
}

function getPresetModel(
  presetId,
  model = { nodes: BASE_NODES, lanes: BASE_LANES, scenario: BASE_SCENARIO },
) {
  let nextNodes = cloneData(model.nodes)
  let nextLanes = cloneData(model.lanes)
  let nextScenario = { ...BASE_SCENARIO }
  let message = 'Preset loaded.'

  const primarySupplierId = findNodeId(nextNodes, 'SUP1', 'supplier', 0)
  const secondarySupplierId = findNodeId(nextNodes, 'SUP2', 'supplier', 1)
  const primaryPlantId = findNodeId(nextNodes, 'PLT1', 'plant', 0)
  const primaryDcId = findNodeId(nextNodes, 'DC01', 'dc', 0)
  const secondaryDcId = findNodeId(nextNodes, 'DC02', 'dc', 1)
  const plantToDcLaneId = findLaneId(
    nextLanes,
    'L4',
    (lane) => lane.from.startsWith('PLT') && lane.to.startsWith('DC'),
  )

  if (presetId === 'sup1_delay_5d') {
    const supplier = nextNodes.find((node) => node.id === primarySupplierId)
    nextNodes = updateById(nextNodes, primarySupplierId, {
      leadTimeDays: (supplier?.leadTimeDays || 0) + 5,
    })
    message = 'Supplier 1 delay preset loaded (+5 days).'
  } else if (presetId === 'sup2_cost_8') {
    const supplier = nextNodes.find((node) => node.id === secondarySupplierId)
    nextNodes = updateById(nextNodes, secondarySupplierId, {
      costPerUnit: (supplier?.costPerUnit || 0) * 1.08,
    })
    message = 'Supplier 2 penalty increase preset loaded (+8%).'
  } else if (presetId === 'supplier_cap_minus_30') {
    nextNodes = nextNodes.map((node) => (
      node.type === 'supplier' ? { ...node, capacity: node.capacity * 0.7 } : node
    ))
    message = 'Supplier weekly capacity reduction preset loaded (-30%).'
  } else if (presetId === 'dc_below_safety') {
    nextNodes = updateById(
      updateById(nextNodes, primaryDcId, { inventoryOnHand: 200, safetyStock: 900 }),
      secondaryDcId,
      { inventoryOnHand: 180, safetyStock: 700 },
    )
    message = 'DC below safety stock preset loaded.'
  } else if (presetId === 'dc_demand_plus_20') {
    nextScenario = {
      ...nextScenario,
      demandShiftStartWeek: DEMAND_SHIFT_START_WEEK,
      demandShiftEndWeek: DEMAND_SHIFT_END_WEEK,
      demandShiftDeltaPct: 0.2,
    }
    message = `Demand time-series spike preset loaded (+20% in weeks ${DEMAND_SHIFT_START_WEEK}-${DEMAND_SHIFT_END_WEEK}).`
  } else if (presetId === 'lane_cost_double') {
    nextLanes = nextLanes.map((lane) => ({ ...lane, costPerUnit: lane.costPerUnit * 2 }))
    message = 'Lane penalty doubling preset loaded.'
  } else if (presetId === 'lane_unavailable') {
    const disabledLane = nextLanes.find((lane) => lane.id === plantToDcLaneId)
    nextLanes = updateById(nextLanes, plantToDcLaneId, { active: false })
    message = `Lane unavailable preset loaded: ${formatLaneDisplayName(disabledLane, nextNodes)} is disabled.`
  } else if (presetId === 'moq_overstock') {
    nextScenario = { ...nextScenario, strategyId: 'split_50_50', demandDeltaPct: -0.25 }
    nextNodes = nextNodes.map((node) => (
      node.type === 'supplier' ? { ...node, minOrderQty: 3000 } : node
    ))
    message = 'MOQ overstock preset loaded.'
  } else if (presetId === 'service_target_impossible') {
    nextScenario = {
      ...nextScenario,
      demandDeltaPct: 0.2,
      demandShiftDeltaPct: 0.2,
      demandShiftStartWeek: DEMAND_SHIFT_START_WEEK,
      demandShiftEndWeek: DEMAND_SHIFT_END_WEEK,
      supplierLeadTimeDeltaPct: 0.2,
      serviceLevelTarget: 0.99,
    }
    nextNodes = nextNodes.map((node) => (
      node.type === 'supplier' ? { ...node, capacity: node.capacity * 0.68 } : node
    ))
    nextLanes = updateById(nextLanes, plantToDcLaneId, { active: false })
    message = 'Impossible service-level preset loaded.'
  } else if (presetId === 'plant_util_95') {
    nextScenario = { ...nextScenario, demandDeltaPct: 0.02 }
    nextNodes = nextNodes.map((node) => (
      node.type === 'plant' ? { ...node, capacity: node.capacity * 0.95 } : node
    ))
    message = 'Plant utilization stress preset loaded (>95%).'
  } else if (presetId === 'dc_stockout_3d') {
    nextScenario = {
      ...nextScenario,
      demandDeltaPct: 0.12,
      demandShiftDeltaPct: 0.18,
      demandShiftStartWeek: DEMAND_SHIFT_START_WEEK,
      demandShiftEndWeek: DEMAND_SHIFT_END_WEEK,
    }
    nextNodes = updateById(
      updateById(nextNodes, primaryDcId, { inventoryOnHand: 280 }),
      secondaryDcId,
      { inventoryOnHand: 220 },
    )
    message = 'DC stockout within 3 days preset loaded.'
  } else if (presetId === 'excess_inv_2w') {
    nextScenario = {
      ...nextScenario,
      demandDeltaPct: -0.15,
      demandShiftDeltaPct: -0.25,
      demandShiftStartWeek: DEMAND_SHIFT_START_WEEK,
      demandShiftEndWeek: DEMAND_SHIFT_END_WEEK,
    }
    nextNodes = updateById(
      updateById(nextNodes, primaryDcId, { inventoryOnHand: 5400 }),
      secondaryDcId,
      { inventoryOnHand: 4200 },
    )
    nextNodes = updateById(nextNodes, primaryPlantId, { inventoryOnHand: 3600 })
    message = 'Excess inventory in 2 weeks preset loaded.'
  } else {
    nextScenario = { ...BASE_SCENARIO }
    message = 'Baseline scenario loaded on current network.'
  }

  return { nodes: nextNodes, lanes: nextLanes, scenario: nextScenario, message }
}

function formatSigned(value, formatter) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatter(value)}`
}

function DemandTimeSeriesChart({ rows }) {
  if (!rows?.length) {
    return (
      <div className="graph-card">
        <h4>Demand and Fulfillment Time Series</h4>
        <p className="muted">No weekly demand data available.</p>
      </div>
    )
  }

  const width = 920
  const height = 300
  const padding = 46
  const maxY = Math.max(
    ...rows.map((row) => row.demand),
    ...rows.map((row) => row.fulfilled),
    ...rows.map((row) => row.unmet),
    1,
  )
  const minY = 0
  const normalizeX = (index) =>
    padding + (index / Math.max(rows.length - 1, 1)) * (width - padding * 2)
  const normalizeY = (value) =>
    height - padding - ((value - minY) / Math.max(maxY - minY, 1e-6)) * (height - padding * 2)

  const toPath = (values) =>
    values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${normalizeX(index)} ${normalizeY(value)}`).join(' ')

  const demandPath = toPath(rows.map((row) => row.demand))
  const fulfilledPath = toPath(rows.map((row) => row.fulfilled))
  const unmetPath = toPath(rows.map((row) => row.unmet))
  const weekLabelInterval = rows.length > 26 ? 4 : 1

  return (
    <div className="graph-card">
      <h4>Demand and Fulfillment Time Series</h4>
      <p className="muted">X Axis: Week (1-{DEMAND_PLANNING_WEEKS}) | Y Axis: Units</p>
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <rect x="0" y="0" width={width} height={height} fill="#f8fbfd" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#90a4ae" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#90a4ae" />
        <path d={demandPath} fill="none" stroke="#0284c7" strokeWidth="3" />
        <path d={fulfilledPath} fill="none" stroke="#059669" strokeWidth="3" />
        <path d={unmetPath} fill="none" stroke="#dc2626" strokeWidth="3" />
        {rows.map((row, index) => (
          index % weekLabelInterval === 0 || index === rows.length - 1 ? (
            <text key={`wk-label-${row.week}`} x={normalizeX(index)} y={height - padding + 14} fontSize="9" textAnchor="middle" fill="#38525c">
              W{row.week}
            </text>
          ) : null
        ))}
        <text x={width / 2} y={height - 6} fontSize="10" textAnchor="middle" fill="#2f4f58">Week</text>
        <text x={10} y={height / 2} fontSize="10" textAnchor="middle" fill="#2f4f58" transform={`rotate(-90 10 ${height / 2})`}>Units</text>
      </svg>
      <div className="trend-legend">
        <span className="demand-line">Demand</span>
        <span className="fill">Fulfilled</span>
        <span className="unmet-line">Unmet</span>
      </div>
    </div>
  )
}

function DemandSeriesMiniChart({ rows }) {
  if (!rows?.length) {
    return null
  }

  const values = rows.map((item) => item.demand)
  const maxDemand = Math.max(...values, 1)
  const scaleUnit = 10 ** Math.max(0, Math.floor(Math.log10(maxDemand)) - 1)
  const scaleMax = Math.ceil(maxDemand / scaleUnit) * scaleUnit
  const avgDemand = sum(values) / rows.length
  const firstDemand = values[0] || 0
  const finalDemand = values.at(-1) || 0
  const changePct = firstDemand ? (finalDemand - firstDemand) / firstDemand : 0
  const peakRow = rows.reduce((peak, row) => (row.demand > peak.demand ? row : peak), rows[0])
  const barHeight = (demand) => Math.max(6, (demand / scaleMax) * 100)

  return (
    <div className="demand-series-chart">
      <div className="demand-mini-stats">
        <div>
          <span>Average</span>
          <strong>{formatNumber(avgDemand)}</strong>
        </div>
        <div>
          <span>Peak</span>
          <strong>{formatNumber(peakRow.demand)}</strong>
        </div>
        <div>
          <span>W1 to W{rows.at(-1).week}</span>
          <strong className={changePct >= 0 ? 'positive' : 'negative'}>{formatSigned(changePct, formatPct)}</strong>
        </div>
      </div>

      <div className="demand-column-chart" aria-label="Weekly demand column bars">
        <div className="demand-scale-labels" aria-hidden="true">
          <span>{formatNumber(scaleMax)}</span>
          <span>{formatNumber(scaleMax / 2)}</span>
          <span>0</span>
        </div>
        <div className="demand-bar-plot">
          {rows.map((row) => (
            <div
              key={`bar-${row.week}`}
              className={row.week === peakRow.week ? 'demand-bar-cell peak' : 'demand-bar-cell'}
              title={`Week ${row.week}: ${formatNumber(row.demand)} units`}
              aria-label={`Week ${row.week}: ${formatNumber(row.demand)} units`}
            >
              <span className="demand-bar-value">{formatNumber(row.demand)}</span>
              <span className="demand-bar-slot">
                <span className="demand-column-bar" style={{ height: `${barHeight(row.demand)}%` }} aria-hidden="true" />
              </span>
              <span className="demand-bar-week">W{row.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const canvasRef = useRef(null)
  const dragStateRef = useRef(null)
  const dragRafRef = useRef(null)
  const suppressClickRef = useRef(false)

  const [nodes, setNodes] = useState(BASE_NODES)
  const [lanes, setLanes] = useState(BASE_LANES)
  const [scenario, setScenario] = useState(BASE_SCENARIO)
  const [selectedNodeId, setSelectedNodeId] = useState('SUP1')
  const [selectedLaneId, setSelectedLaneId] = useState('')
  const [pendingSourceId, setPendingSourceId] = useState('')
  const [connectMode, setConnectMode] = useState(false)
  const [strategyRows, setStrategyRows] = useState([])
  const [scenarioPackRows, setScenarioPackRows] = useState([])
  const [canvasMessage, setCanvasMessage] = useState('Drag node blocks from left panel into the network canvas.')
  const [activePreset, setActivePreset] = useState('baseline')
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false)

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) || null, [nodes, selectedNodeId])
  const selectedLane = useMemo(() => lanes.find((lane) => lane.id === selectedLaneId) || null, [lanes, selectedLaneId])

  const result = useMemo(() => runScenario(nodes, lanes, scenario), [nodes, lanes, scenario])
  const activeCostData = { ...DEFAULT_COST_DATA, ...scenario.costData }

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((node) => [node.id, node])), [nodes])

  function updateNode(nodeId, patch) {
    setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)))
  }

  function updateLane(laneId, patch) {
    setLanes((current) => current.map((lane) => (lane.id === laneId ? { ...lane, ...patch } : lane)))
  }

  function updateCostData(field, value) {
    setScenario((prev) => ({
      ...prev,
      costData: {
        ...DEFAULT_COST_DATA,
        ...prev.costData,
        [field]: Math.max(0, Number(value) || 0),
      },
    }))
  }

  function nextNodeId(type) {
    const prefixByType = { supplier: 'SUP', plant: 'PLT', dc: 'DC', customer: 'CUS' }
    const prefix = prefixByType[type]
    const count = nodes.filter((node) => node.id.startsWith(prefix)).length + 1
    return `${prefix}${count}`
  }

  function onPaletteDragStart(event, type) {
    event.dataTransfer.effectAllowed = 'copyMove'
    event.dataTransfer.setData('node-type', type)
    event.dataTransfer.setData('text/plain', type)
  }

  function getCanvasPoint(clientX, clientY) {
    const canvas = canvasRef.current
    if (!canvas) {
      return { x: 0, y: 0 }
    }

    const bounds = canvas.getBoundingClientRect()
    return {
      x: clientX - bounds.left + canvas.scrollLeft,
      y: clientY - bounds.top + canvas.scrollTop,
    }
  }

  function onCanvasDrop(event) {
    event.preventDefault()
    const droppedType = event.dataTransfer.getData('node-type')
    if (!droppedType) {
      return
    }

    const point = getCanvasPoint(event.clientX, event.clientY)
    const x = point.x - NODE_SIZE.width / 2
    const y = point.y - NODE_SIZE.height / 2
    const id = nextNodeId(droppedType)

    const nodeDefaults = {
      supplier: { capacity: 5000, demand: 0, costPerUnit: 11.5, leadTimeDays: 12, risk: 0.3, minOrderQty: 250 },
      plant: { capacity: 8500, demand: 0, costPerUnit: 1.9, leadTimeDays: 2, risk: 0.14, inventoryOnHand: 1600, safetyStock: 900 },
      dc: { capacity: 4500, demand: 0, costPerUnit: 0.7, leadTimeDays: 2, risk: 0.2, inventoryOnHand: 900, safetyStock: 600 },
      customer: { capacity: 0, demand: 2200, costPerUnit: 0, leadTimeDays: 0, risk: 0.15 },
    }

    const nameByType = {
      supplier: `Supplier ${id}`,
      plant: `Plant ${id}`,
      dc: `DC ${id}`,
      customer: `Customer ${id}`,
    }

    const newNode = {
      id,
      type: droppedType,
      name: nameByType[droppedType],
      x: clamp(x, 10, CANVAS_SIZE.width - NODE_SIZE.width),
      y: clamp(y, 10, CANVAS_SIZE.height - NODE_SIZE.height),
      ...nodeDefaults[droppedType],
    }

    setNodes((current) => [...current, newNode])
    setSelectedNodeId(id)
    setCanvasMessage(`${nameByType[droppedType]} added to network.`)
  }

  function onCanvasDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function onNodePointerDown(event, nodeId) {
    if (connectMode) {
      return
    }
    event.preventDefault()
    const node = nodeById[nodeId]
    if (!node) {
      return
    }

    const point = getCanvasPoint(event.clientX, event.clientY)
    dragStateRef.current = {
      nodeId,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }

    function onPointerMove(moveEvent) {
      const state = dragStateRef.current
      if (!state) {
        return
      }
      const distance = Math.hypot(moveEvent.clientX - state.startX, moveEvent.clientY - state.startY)
      if (distance > 4) {
        state.moved = true
      }

      const movePoint = getCanvasPoint(moveEvent.clientX, moveEvent.clientY)
      const x = movePoint.x - state.offsetX
      const y = movePoint.y - state.offsetY

      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current)
      }
      dragRafRef.current = requestAnimationFrame(() => {
        updateNode(state.nodeId, {
          x: clamp(x, 10, CANVAS_SIZE.width - NODE_SIZE.width),
          y: clamp(y, 10, CANVAS_SIZE.height - NODE_SIZE.height),
        })
      })
    }

    function onPointerUp() {
      const state = dragStateRef.current
      if (state?.moved) {
        suppressClickRef.current = true
      }
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
      dragStateRef.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function onNodeClick(event, nodeId) {
    event.stopPropagation()
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setSelectedNodeId(nodeId)
    setSelectedLaneId('')

    if (!connectMode) {
      return
    }

    if (!pendingSourceId) {
      setPendingSourceId(nodeId)
      setCanvasMessage('Select destination node to create a lane.')
      return
    }

    if (pendingSourceId === nodeId) {
      return
    }

    const source = nodeById[pendingSourceId]
    const target = nodeById[nodeId]
    if (!source || !target) {
      return
    }

    if (source.type === target.type) {
      setCanvasMessage('Connect different stages (supplier -> plant -> dc -> customer).')
      setPendingSourceId('')
      return
    }

    const laneExists = lanes.some((lane) => lane.from === pendingSourceId && lane.to === nodeId)
    if (laneExists) {
      setCanvasMessage('Lane already exists between selected nodes.')
      setPendingSourceId('')
      return
    }

    const laneId = `L${lanes.length + 1}`
    setLanes((current) => [
      ...current,
      { id: laneId, from: pendingSourceId, to: nodeId, costPerUnit: 1, leadTimeDays: 2, capacity: 6000, active: true },
    ])
    setPendingSourceId('')
    setConnectMode(false)
    setCanvasMessage(`Lane ${laneId} created.`)
  }

  function onLaneClick(event, laneId) {
    event.stopPropagation()
    setSelectedLaneId(laneId)
    setSelectedNodeId('')
  }

  function toggleConnectMode() {
    setConnectMode((prev) => {
      const next = !prev
      if (!next) {
        setPendingSourceId('')
        setCanvasMessage('Connect mode disabled.')
      } else {
        setCanvasMessage('Connect mode enabled. Select source node.')
      }
      return next
    })
  }

  function removeSelectedNode() {
    if (!selectedNode) {
      return
    }
    const nodeId = selectedNode.id
    setNodes((current) => current.filter((node) => node.id !== nodeId))
    setLanes((current) => current.filter((lane) => lane.from !== nodeId && lane.to !== nodeId))
    setSelectedNodeId('')
    setCanvasMessage(`${nodeId} removed.`)
  }

  function removeSelectedLane() {
    if (!selectedLane) {
      return
    }
    const laneId = selectedLane.id
    setLanes((current) => current.filter((lane) => lane.id !== laneId))
    setSelectedLaneId('')
    setCanvasMessage(`${laneId} removed.`)
  }

  function resetModel() {
    setNodes(BASE_NODES)
    setLanes(BASE_LANES)
    setScenario(BASE_SCENARIO)
    setSelectedNodeId('SUP1')
    setSelectedLaneId('')
    setPendingSourceId('')
    setConnectMode(false)
    setStrategyRows([])
    setScenarioPackRows([])
    setActivePreset('baseline')
    setCanvasMessage('Model reset to baseline.')
  }

  function applyScenarioPreset(presetId) {
    const presetModel = getPresetModel(presetId, { nodes, lanes, scenario })
    const nextNodes = presetModel.nodes
    const nextLanes = presetModel.lanes
    const nextScenario = presetModel.scenario
    const message = presetModel.message

    setNodes(nextNodes)
    setLanes(nextLanes)
    setScenario(nextScenario)
    setSelectedNodeId(nextNodes[0]?.id || '')
    setSelectedLaneId('')
    setPendingSourceId('')
    setConnectMode(false)
    setStrategyRows([])
    setScenarioPackRows([])
    setActivePreset(presetId)
    setCanvasMessage(message)
  }

  function runAllScenarioPresets() {
    const baselineModel = getPresetModel('baseline', { nodes, lanes, scenario })
    const baselineResult = runScenario(baselineModel.nodes, baselineModel.lanes, baselineModel.scenario)

    const rows = SCENARIO_PRESETS.map((preset) => {
      const model = getPresetModel(preset.id, { nodes, lanes, scenario })
      const currentResult = runScenario(model.nodes, model.lanes, model.scenario)
      return {
        id: preset.id,
        scenarioLabel: preset.label,
        totalLandedCost: currentResult.totalLandedCost,
        fillRate: currentResult.fillRate,
        avgLeadTime: currentResult.avgLeadTime,
        weightedRisk: currentResult.weightedRisk,
        objectiveDelta: currentResult.totalLandedCost - baselineResult.totalLandedCost,
        fillDelta: currentResult.fillRate - baselineResult.fillRate,
        leadTimeDelta: currentResult.avgLeadTime - baselineResult.avgLeadTime,
        riskDelta: currentResult.weightedRisk - baselineResult.weightedRisk,
      }
    })

    setScenarioPackRows(rows)
    setCanvasMessage('All 12 required scenarios executed. Review delta table below.')
  }

  function openGraphModal() {
    setIsGraphModalOpen(true)
  }

  return (
    <div className="simple-shell">
      <header className="simple-header">
        <div>
          <p className="kicker">POC</p>
          <h1>Supply Chain Network Optimizer</h1>
        </div>
        <div className="header-actions">
          <button type="button" onClick={toggleConnectMode} className={connectMode ? 'active' : ''}>
            {connectMode ? 'Connecting...' : 'Add Lane'}
          </button>
          <button type="button" onClick={() => setStrategyRows(compareStrategies(nodes, lanes, scenario))}>
            Compare Strategies
          </button>
          <button type="button" onClick={openGraphModal}>
            Open Graph View
          </button>
          <button type="button" className="secondary" onClick={resetModel}>
            Reset
          </button>
        </div>
      </header>

      <main className="simple-grid">
        <aside className="panel left-panel">
          <h2>1) Input Setup</h2>
          <p className="muted">Drag a block to canvas. Drag nodes to reposition.</p>
          <div className="palette">
            {PALETTE_TYPES.map((item) => (
              <button
                key={item.type}
                type="button"
                draggable
                onDragStart={(event) => onPaletteDragStart(event, item.type)}
                className={`palette-item ${item.type}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="editor-card">
            <h3>Selected Node</h3>
            {selectedNode ? (
              <>
                <label>
                  Name
                  <input
                    value={selectedNode.name}
                    onChange={(event) => updateNode(selectedNode.id, { name: event.target.value })}
                  />
                </label>
                {(selectedNode.type === 'supplier' || selectedNode.type === 'plant' || selectedNode.type === 'dc') ? (
                  <label>
                    Weekly Capacity
                    <input
                      type="number"
                      value={selectedNode.capacity}
                      onChange={(event) => updateNode(selectedNode.id, { capacity: Number(event.target.value) })}
                    />
                  </label>
                ) : null}
                {selectedNode.type === 'customer' ? (
                  <label>
                    Demand
                    <input
                      type="number"
                      value={selectedNode.demand}
                      onChange={(event) => updateNode(selectedNode.id, { demand: Number(event.target.value) })}
                    />
                  </label>
                ) : null}
                {selectedNode.type === 'supplier' ? (
                  <>
                    <label>
                      Penalty / Unit
                      <input
                        type="number"
                        step="0.1"
                        value={selectedNode.costPerUnit}
                        onChange={(event) => updateNode(selectedNode.id, { costPerUnit: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      Lead Time (days)
                      <input
                        type="number"
                        value={selectedNode.leadTimeDays}
                        onChange={(event) => updateNode(selectedNode.id, { leadTimeDays: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      MOQ
                      <input
                        type="number"
                        value={selectedNode.minOrderQty || 0}
                        onChange={(event) => updateNode(selectedNode.id, { minOrderQty: Number(event.target.value) })}
                      />
                    </label>
                  </>
                ) : null}
                {(selectedNode.type === 'plant' || selectedNode.type === 'dc') ? (
                  <label>
                    Inventory On Hand
                    <input
                      type="number"
                      value={selectedNode.inventoryOnHand || 0}
                      onChange={(event) => updateNode(selectedNode.id, { inventoryOnHand: Number(event.target.value) })}
                    />
                  </label>
                ) : null}
                {(selectedNode.type === 'plant' || selectedNode.type === 'dc') ? (
                  <label>
                    Safety Stock
                    <input
                      type="number"
                      value={selectedNode.safetyStock || 0}
                      onChange={(event) => updateNode(selectedNode.id, { safetyStock: Number(event.target.value) })}
                    />
                  </label>
                ) : null}
                <button type="button" className="danger" onClick={removeSelectedNode}>
                  Remove Node
                </button>
              </>
            ) : (
              <p className="muted">Click a node on canvas to edit.</p>
            )}
          </div>

          <div className="editor-card">
            <h3>Selected Lane</h3>
            {selectedLane ? (
              <>
                <p>
                  {selectedLane.from}
                  {' -> '}
                  {selectedLane.to}
                </p>
                <p className={selectedLane.active === false ? 'status-unavailable' : 'status-active'}>
                  Status: {selectedLane.active === false ? 'Unavailable' : 'Active'}
                </p>
                <label>
                  Transportation Penalty / Unit
                  <input
                    type="number"
                    step="0.05"
                    value={selectedLane.costPerUnit}
                    onChange={(event) => updateLane(selectedLane.id, { costPerUnit: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Lead Time (days)
                  <input
                    type="number"
                    value={selectedLane.leadTimeDays}
                    onChange={(event) => updateLane(selectedLane.id, { leadTimeDays: Number(event.target.value) })}
                  />
                </label>
                <button type="button" className="danger" onClick={removeSelectedLane}>
                  Remove Lane
                </button>
              </>
            ) : (
              <p className="muted">Click a lane line to edit.</p>
            )}
          </div>
        </aside>

        <section className="canvas-wrap panel" onClick={() => { setSelectedLaneId(''); setSelectedNodeId('') }}>
          <h2>2) Network Canvas</h2>
          <p className="muted">{canvasMessage}</p>
          <div
            ref={canvasRef}
            className="canvas"
            onDrop={onCanvasDrop}
            onDragOver={onCanvasDragOver}
          >
            <svg className="lane-layer" viewBox="0 0 980 520" preserveAspectRatio="none">
              {lanes.map((lane) => {
                const source = nodeById[lane.from]
                const target = nodeById[lane.to]
                if (!source || !target) {
                  return null
                }

                const x1 = source.x + NODE_SIZE.width
                const y1 = source.y + NODE_SIZE.height / 2
                const x2 = target.x
                const y2 = target.y + NODE_SIZE.height / 2

                return (
                  <g key={lane.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className={`lane ${lane.active === false ? 'inactive' : ''} ${selectedLane?.id === lane.id ? 'selected' : ''}`}
                      onClick={(event) => onLaneClick(event, lane.id)}
                    />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} className={`lane-label ${lane.active === false ? 'inactive' : ''}`}>
                      {lane.active === false
                        ? `${lane.id} | UNAVAILABLE | ${lane.from} -> ${lane.to}`
                        : `${lane.id} | ${formatNumber(lane.costPerUnit, 2)} /u | ${lane.leadTimeDays}d`}
                    </text>
                  </g>
                )
              })}
            </svg>

            {nodes.map((node) => (
              <article
                key={node.id}
                className={`${nodeClass(node.type)} ${selectedNode?.id === node.id ? 'selected' : ''} ${pendingSourceId === node.id ? 'pending' : ''}`}
                style={{ left: node.x, top: node.y }}
                onPointerDown={(event) => onNodePointerDown(event, node.id)}
                onClick={(event) => onNodeClick(event, node.id)}
              >
                <strong>{node.name}</strong>
                <small>{node.id}</small>
                {node.type === 'customer' ? (
                  <p>Demand: {formatNumber(node.demand)}</p>
                ) : (
                  <p>Weekly Capacity: {formatNumber(node.capacity)}</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <aside className="panel right-panel">
          <h2>3) Inputs + Outputs</h2>
          <div className="editor-card">
            <h3>Scenario Presets</h3>
            <p className="muted">Active: {activePreset === 'baseline' ? 'Baseline' : SCENARIO_PRESETS.find((item) => item.id === activePreset)?.label}</p>
            <button type="button" className="secondary" onClick={runAllScenarioPresets}>
              Run All 12 Scenarios
            </button>
            <div className="preset-list">
              <button type="button" className="secondary" onClick={() => applyScenarioPreset('baseline')}>
                Baseline
              </button>
              {SCENARIO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={activePreset === preset.id ? 'active' : 'secondary'}
                  onClick={() => applyScenarioPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-card">
            <h3>Process Inputs</h3>
            <ul className="text-list">
              <li>Demand planning at customer/retailer level.</li>
              <li>Weekly demand time series (52-week annual horizon) with surge/drop windows.</li>
              <li>DC and plant inventory levels and safety constraints.</li>
              <li>Per-unit cost data for plant, DC, and retailer penalties.</li>
              <li>Plant weekly capacity and supplier weekly capacities.</li>
              <li>Supplier ratio strategy: 70/30, 50/50, safest least-penalty.</li>
            </ul>
          </div>

          <div className="editor-card cost-data-card">
            <h3>Cost Data Per Unit</h3>
            <div className="cost-data-grid">
              <label>
                Product Penalty / Unit at Plant
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={activeCostData.plantProductPenaltyPerUnit}
                  onChange={(event) => updateCostData('plantProductPenaltyPerUnit', event.target.value)}
                />
              </label>
              <label>
                Inventory Penalty / Unit at Plant
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={activeCostData.plantInventoryPenaltyPerUnit}
                  onChange={(event) => updateCostData('plantInventoryPenaltyPerUnit', event.target.value)}
                />
              </label>
              <label>
                Inventory Penalty / Unit at DC
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={activeCostData.dcInventoryPenaltyPerUnit}
                  onChange={(event) => updateCostData('dcInventoryPenaltyPerUnit', event.target.value)}
                />
              </label>
              <label>
                Missed Demand Penalty / Unit at Retailer
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={activeCostData.retailerMissedDemandPenaltyPerUnit}
                  onChange={(event) => updateCostData('retailerMissedDemandPenaltyPerUnit', event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="editor-card">
            <h3>Process Outputs</h3>
            <ul className="text-list">
              <li><strong>Objective Function</strong> value.</li>
              <li>Production, transportation, inventory, and missed-demand penalties.</li>
              <li>Service feasibility, stockout risk, and supplier allocation.</li>
            </ul>
          </div>

          <div className="editor-card">
            <h3>Planning Flow</h3>
            <ul className="text-list">
              <li>Demand planning starts at customer and retailer demand.</li>
              <li>DC inventory is depleted first and held at a safe level.</li>
              <li>Supply planning drives plant production within weekly capacity.</li>
              <li>Supplier plan is split by selected ratio strategy.</li>
            </ul>
          </div>

          <div className="editor-card weekly-demand-card">
            <h3>Weekly Demand Plan (Weeks 1-{DEMAND_PLANNING_WEEKS})</h3>
            <p className="muted">Use this to model stable annual demand for weeks 1-{DEMAND_STABLE_WEEKS} and rise/drop in weeks {DEMAND_SHIFT_START_WEEK}-{DEMAND_SHIFT_END_WEEK}. Capacity values are treated as weekly capacity.</p>
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setScenario((prev) => ({
                    ...prev,
                    demandSeries: normalizeDemandSeries(prev.demandSeries, DEFAULT_WEEKLY_DEMAND).map((value, index) =>
                      index < DEMAND_STABLE_WEEKS ? DEFAULT_WEEKLY_DEMAND : value,
                    ),
                  }))
                }
              >
                Set Weeks 1-{DEMAND_STABLE_WEEKS} = 10,000
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setScenario((prev) => ({
                    ...prev,
                    demandSeries: normalizeDemandSeries(prev.demandSeries, DEFAULT_WEEKLY_DEMAND).map((_, index) => DEFAULT_DEMAND_SERIES[index]),
                  }))
                }
              >
                Load Rise/Drop Example
              </button>
            </div>
            <div className="series-scroll" aria-label="Weekly demand input scroller">
              <div className="series-grid">
                {normalizeDemandSeries(scenario.demandSeries, DEFAULT_WEEKLY_DEMAND).map((weekDemand, index) => (
                  <label key={`wk-${index + 1}`} className="week-input-cell">
                    <span>W{index + 1}</span>
                    <input
                      type="number"
                      value={Math.round(weekDemand)}
                      onChange={(event) =>
                        setScenario((prev) => {
                          const nextSeries = normalizeDemandSeries(prev.demandSeries, DEFAULT_WEEKLY_DEMAND)
                          nextSeries[index] = Math.max(0, Number(event.target.value) || 0)
                          return { ...prev, demandSeries: nextSeries }
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label>
            Supplier Split Strategy
            <select
              value={scenario.strategyId}
              onChange={(event) => setScenario((prev) => ({ ...prev, strategyId: event.target.value }))}
            >
              {STRATEGIES.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.label}
                </option>
              ))}
            </select>
          </label>

          <div className="editor-card demand-view-card">
            <h3>Demand Time Series View</h3>
            <DemandSeriesMiniChart rows={result.demandTrendRows} />
          </div>

          <div className="kpi-list">
            <div className="objective-focus"><span>Objective Function</span><strong>{formatCurrency(result.objectiveFunction)}</strong></div>
            <div><span>Production Penalty</span><strong>{formatCurrency(result.productionPenalty)}</strong></div>
            <div><span>Transportation Penalty</span><strong>{formatCurrency(result.transportationPenalty)}</strong></div>
            <div><span>Inventory Penalty</span><strong>{formatCurrency(result.inventoryPenalty)}</strong></div>
            <div><span>Missed Demand Penalty</span><strong>{formatCurrency(result.missedDemandPenalty)}</strong></div>
            <div><span>Missed Demand Units</span><strong>{formatNumber(result.missedDemandUnits)}</strong></div>
            <div><span>Fill Rate</span><strong>{formatPct(result.fillRate)}</strong></div>
            <div><span>Expected Lead Time</span><strong>{formatNumber(result.avgLeadTime, 1)} days</strong></div>
            <div><span>Risk Score</span><strong>{formatNumber(result.weightedRisk, 2)}</strong></div>
            <div><span>Peak Weekly Demand</span><strong>{formatNumber(result.peakWeeklyDemand)}</strong></div>
            <div><span>Demand Volatility</span><strong>{formatPct(result.demandVolatility)}</strong></div>
            <div><span>Days of Supply</span><strong>{formatNumber(result.daysOfSupply, 1)}</strong></div>
            <div><span>DC Days of Supply</span><strong>{formatNumber(result.dcDaysOfSupply, 1)}</strong></div>
            <div><span>Plant Utilization</span><strong>{formatPct(result.plantUtilization)}</strong></div>
            <div><span>Service Target Feasible</span><strong>{result.serviceTargetFeasible ? 'Yes' : 'No'}</strong></div>
            <div><span>MOQ Overstock</span><strong>{formatNumber(result.overstockFromMoq)} units</strong></div>
            <div><span>Projected Stockout</span><strong>{formatNumber(result.projectedStockoutDays, 1)} days</strong></div>
            <div><span>Inventory in 2 Weeks</span><strong>{formatNumber(result.projectedInventoryInTwoWeeks)} units</strong></div>
            <div><span>2-Week Shortfall</span><strong>{formatNumber(result.projectedInventoryShortfallInTwoWeeks)} units</strong></div>
            <div><span>Prebuild Recommendation</span><strong>{formatNumber(result.prebuildUnits)} units</strong></div>
          </div>

          <h3>Alerts</h3>
          <ul className="text-list">
            {result.alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>

          <h3>Recommendations</h3>
          <ul className="text-list">
            {result.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </aside>
      </main>

      <section className="bottom-strip">
        <article className="panel">
          <h2>Supplier Allocation (Active Strategy)</h2>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Share</th>
                <th>Unit Penalty</th>
                <th>Lead Time</th>
              </tr>
            </thead>
            <tbody>
              {result.allocations.map((allocation) => (
                <tr key={allocation.supplierId}>
                  <td>{allocation.supplierName}</td>
                  <td>{formatNumber(allocation.quantity)}</td>
                  <td>{formatPct(allocation.share)}</td>
                  <td>{formatCurrency(allocation.unitCost)}</td>
                  <td>{formatNumber(allocation.leadTimeDays, 1)}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <h2>Demand Time Series and Fulfillment ({DEMAND_PLANNING_WEEKS} Weeks)</h2>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Demand</th>
                <th>Fulfilled</th>
                <th>Unmet</th>
              </tr>
            </thead>
            <tbody>
              {result.demandTrendRows.map((item) => (
                <tr key={`demand-${item.week}`}>
                  <td>W{item.week}</td>
                  <td>{formatNumber(item.demand)}</td>
                  <td>{formatNumber(item.fulfilled)}</td>
                  <td>{formatNumber(item.unmet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <h2>Strategy Comparison</h2>
          {strategyRows.length === 0 ? (
            <p className="muted">Click "Compare Strategies" to populate this table.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Objective Function</th>
                  <th>Fill Rate</th>
                  <th>Lead Time</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {strategyRows.map((row) => (
                  <tr key={row.strategyId}>
                    <td>{row.strategyLabel}</td>
                    <td>{formatCurrency(row.totalLandedCost)}</td>
                    <td>{formatPct(row.fillRate)}</td>
                    <td>{formatNumber(row.avgLeadTime, 1)}d</td>
                    <td>{formatNumber(row.weightedRisk, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="panel scenario-pack-panel">
          <h2>All Required Scenario Deltas vs Baseline</h2>
          {scenarioPackRows.length === 0 ? (
            <p className="muted">Click "Run All 12 Scenarios" to generate this comparison.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Objective Delta</th>
                  <th>Fill Delta</th>
                  <th>Lead Delta</th>
                  <th>Risk Delta</th>
                </tr>
              </thead>
              <tbody>
                {scenarioPackRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.scenarioLabel}</td>
                    <td>{formatSigned(row.objectiveDelta, formatCurrency)}</td>
                    <td>{formatSigned(row.fillDelta, formatPct)}</td>
                    <td>{formatSigned(row.leadTimeDelta, (value) => `${formatNumber(value, 1)}d`)}</td>
                    <td>{formatSigned(row.riskDelta, (value) => formatNumber(value, 2))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>

      {isGraphModalOpen ? (
        <div className="graph-modal-overlay" onClick={() => setIsGraphModalOpen(false)}>
          <div className="graph-modal" onClick={(event) => event.stopPropagation()}>
            <header className="graph-modal-header">
              <h2>Demand Time Series Graph View</h2>
              <button type="button" className="secondary" onClick={() => setIsGraphModalOpen(false)}>
                Close
              </button>
            </header>
            <div className="graph-grid">
              <DemandTimeSeriesChart rows={result.demandTrendRows} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
