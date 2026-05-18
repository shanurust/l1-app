const network = {
  suppliers: [
    {
      id: 'SUP1',
      name: 'Supplier Alpha',
      cost_per_unit: 11,
      capacity: 8000,
      min_order_qty: 500,
      lead_time_days: 16,
      risk_score: 0.42,
      active: true,
    },
    {
      id: 'SUP2',
      name: 'Supplier Beta',
      cost_per_unit: 12.2,
      capacity: 6500,
      min_order_qty: 350,
      lead_time_days: 9,
      risk_score: 0.24,
      active: true,
    },
  ],
  plants: [
    {
      id: 'PLT1',
      name: 'Plant East',
      production_rate: 700,
      capacity: 10000,
      inventory_on_hand: 2900,
      storage_limit: 9000,
      conversion_cost_per_unit: 1.8,
    },
  ],
  dcs: [
    {
      id: 'DC01',
      name: 'DC North',
      inventory_on_hand: 1800,
      storage_limit: 6000,
      handling_cost_per_unit: 0.65,
      service_level_target: 0.96,
    },
    {
      id: 'DC02',
      name: 'DC South',
      inventory_on_hand: 1200,
      storage_limit: 5000,
      handling_cost_per_unit: 0.73,
      service_level_target: 0.94,
    },
  ],
  customers: [
    { id: 'CUST1', name: 'Retail Group A', priority: 1 },
    { id: 'CUST2', name: 'Retail Group B', priority: 2 },
    { id: 'CUST3', name: 'E-Com Channel', priority: 1 },
  ],
  skus: [
    {
      id: 'SKU-100',
      name: 'Essential Care 100',
      demand_per_period: 9800,
      unit_volume: 0.8,
      service_level_target: 0.95,
    },
  ],
  lanes: [
    {
      id: 'LN-SUP1-PLT1',
      from_node: 'SUP1',
      to_node: 'PLT1',
      mode: 'ocean',
      transport_cost: 0.9,
      lead_time_days: 6,
      capacity: 9000,
      disrupted: false,
    },
    {
      id: 'LN-SUP2-PLT1',
      from_node: 'SUP2',
      to_node: 'PLT1',
      mode: 'truck',
      transport_cost: 1.4,
      lead_time_days: 3,
      capacity: 7000,
      disrupted: false,
    },
    {
      id: 'LN-PLT1-DC01',
      from_node: 'PLT1',
      to_node: 'DC01',
      mode: 'truck',
      transport_cost: 1.1,
      lead_time_days: 2,
      capacity: 9000,
      disrupted: false,
    },
    {
      id: 'LN-PLT1-DC02',
      from_node: 'PLT1',
      to_node: 'DC02',
      mode: 'rail',
      transport_cost: 0.95,
      lead_time_days: 3,
      capacity: 8500,
      disrupted: false,
    },
    {
      id: 'LN-DC01-CUST',
      from_node: 'DC01',
      to_node: 'CUST1',
      mode: 'truck',
      transport_cost: 0.75,
      lead_time_days: 2,
      capacity: 7000,
      disrupted: false,
    },
    {
      id: 'LN-DC02-CUST',
      from_node: 'DC02',
      to_node: 'CUST2',
      mode: 'truck',
      transport_cost: 0.82,
      lead_time_days: 2,
      capacity: 6500,
      disrupted: false,
    },
  ],
  inventory_policies: [
    {
      node_id: 'PLT1',
      sku_id: 'SKU-100',
      safety_days: 4,
      reorder_days: 3,
      carrying_rate: 0.18,
      target_days_supply: 11,
      max_days_supply: 18,
    },
    {
      node_id: 'DC01',
      sku_id: 'SKU-100',
      safety_days: 7,
      reorder_days: 4,
      carrying_rate: 0.21,
      target_days_supply: 14,
      max_days_supply: 22,
    },
    {
      node_id: 'DC02',
      sku_id: 'SKU-100',
      safety_days: 6,
      reorder_days: 4,
      carrying_rate: 0.2,
      target_days_supply: 13,
      max_days_supply: 21,
    },
  ],
  demand_profiles: [
    { customer_id: 'CUST1', sku_id: 'SKU-100', demand_per_period: 4200, variability: 0.14 },
    { customer_id: 'CUST2', sku_id: 'SKU-100', demand_per_period: 3300, variability: 0.11 },
    { customer_id: 'CUST3', sku_id: 'SKU-100', demand_per_period: 2300, variability: 0.2 },
  ],
}

const strategies = [
  {
    id: 'cheapest',
    name: 'Cheapest Supplier Only',
    description: 'Allocate to lowest unit-cost supplier first, then spillover.',
    splits: [{ supplier_id: 'SUP1', share: 1 }],
    risk_bias: 0.1,
  },
  {
    id: 'split_70_30',
    name: 'Split Sourcing 70/30',
    description: 'Primary supplier 70%, secondary 30%.',
    splits: [
      { supplier_id: 'SUP1', share: 0.7 },
      { supplier_id: 'SUP2', share: 0.3 },
    ],
    risk_bias: 0.35,
  },
  {
    id: 'split_50_50',
    name: 'Split Sourcing 50/50',
    description: 'Equal mix to balance disruption exposure.',
    splits: [
      { supplier_id: 'SUP1', share: 0.5 },
      { supplier_id: 'SUP2', share: 0.5 },
    ],
    risk_bias: 0.5,
  },
  {
    id: 'risk_balanced',
    name: 'Risk Balanced',
    description: 'Bias toward lead-time and lower-risk supplier.',
    splits: [],
    risk_bias: 0.85,
  },
]

const scenarios = [
  {
    id: 'baseline',
    name: 'Baseline',
    strategy_id: 'split_70_30',
    description: 'Nominal demand and transport assumptions.',
    adjustments: {
      supplier_cost_delta_pct: 0,
      supplier_lead_time_delta_pct: 0,
      supplier_capacity_delta_pct: 0,
      demand_delta_pct: 0,
      transport_cost_delta_pct: 0,
      transport_disruption_ids: [],
      plant_outage_ids: [],
    },
  },
  {
    id: 'supplier_delay',
    name: 'Supplier Delay Shock',
    strategy_id: 'split_70_30',
    base_scenario_id: 'baseline',
    description: 'Lead-time spike and moderate demand uplift.',
    adjustments: {
      supplier_cost_delta_pct: 0,
      supplier_lead_time_delta_pct: 0.35,
      supplier_capacity_delta_pct: 0,
      demand_delta_pct: 0.08,
      transport_cost_delta_pct: 0,
      transport_disruption_ids: [],
      plant_outage_ids: [],
    },
  },
]

const clone = (value) => JSON.parse(JSON.stringify(value))

function strategyShares(strategy, suppliers) {
  if (strategy.splits?.length) {
    const total = strategy.splits.reduce((acc, item) => acc + item.share, 0)
    const splitMap = Object.fromEntries(strategy.splits.map((item) => [item.supplier_id, item.share]))
    return Object.fromEntries(suppliers.map((supplier) => [supplier.id, (splitMap[supplier.id] || 0) / (total || 1)]))
  }

  const weighted = suppliers.map((supplier) => {
    const score = supplier.cost_per_unit * (1 - strategy.risk_bias)
      + supplier.lead_time_days * strategy.risk_bias * 0.45
      + supplier.risk_score * strategy.risk_bias * 10
    return {
      supplier,
      weight: 1 / Math.max(score, 0.01),
    }
  })

  const totalWeight = weighted.reduce((acc, item) => acc + item.weight, 0)
  return Object.fromEntries(weighted.map((item) => [item.supplier.id, item.weight / (totalWeight || 1)]))
}

export function simulateScenario(networkData, scenario, strategy) {
  const adjustments = scenario.adjustments || {}
  const demandMultiplier = 1 + (adjustments.demand_delta_pct || 0)
  const totalDemand = networkData.demand_profiles.reduce((acc, item) => acc + item.demand_per_period, 0) * demandMultiplier

  const suppliers = networkData.suppliers
    .filter((supplier) => supplier.active)
    .map((supplier) => ({
      ...supplier,
      cost_per_unit: supplier.cost_per_unit * (1 + (adjustments.supplier_cost_delta_pct || 0)),
      lead_time_days: supplier.lead_time_days * (1 + (adjustments.supplier_lead_time_delta_pct || 0)),
      capacity: supplier.capacity * (1 + (adjustments.supplier_capacity_delta_pct || 0)),
    }))

  const plantOutagePenalty = (adjustments.plant_outage_ids || []).length > 0 ? 0.65 : 1
  const plantCapacity = networkData.plants.reduce((acc, plant) => acc + plant.capacity, 0) * plantOutagePenalty
  const effectiveDemand = Math.min(totalDemand, plantCapacity)

  const shares = strategyShares(strategy, suppliers)
  const allocations = []

  let fulfilled = 0
  suppliers.forEach((supplier) => {
    const targetQty = effectiveDemand * (shares[supplier.id] || 0)
    let qty = Math.min(targetQty, supplier.capacity)
    if (qty > 0 && qty < supplier.min_order_qty) {
      qty = Math.min(supplier.min_order_qty, supplier.capacity)
    }
    qty = Math.max(qty, 0)

    if (!qty) {
      return
    }

    fulfilled += qty
    allocations.push({
      supplier_id: supplier.id,
      quantity: qty,
      share: 0,
      expected_unit_cost: supplier.cost_per_unit,
      expected_lead_time_days: supplier.lead_time_days,
    })
  })

  const demandGap = Math.max(effectiveDemand - fulfilled, 0)
  if (demandGap > 0) {
    const ranked = [...suppliers].sort((a, b) => (a.cost_per_unit + a.lead_time_days * 0.25) - (b.cost_per_unit + b.lead_time_days * 0.25))
    let remaining = demandGap

    ranked.forEach((supplier) => {
      if (!remaining) {
        return
      }
      const existing = allocations.find((item) => item.supplier_id === supplier.id)
      const already = existing?.quantity || 0
      const extra = Math.min(remaining, Math.max(supplier.capacity - already, 0))
      if (extra <= 0) {
        return
      }
      if (existing) {
        existing.quantity += extra
      } else {
        allocations.push({
          supplier_id: supplier.id,
          quantity: extra,
          share: 0,
          expected_unit_cost: supplier.cost_per_unit,
          expected_lead_time_days: supplier.lead_time_days,
        })
      }
      fulfilled += extra
      remaining -= extra
    })
  }

  const totalAllocated = allocations.reduce((acc, item) => acc + item.quantity, 0)
  allocations.forEach((item) => {
    item.share = item.quantity / (totalAllocated || 1)
  })

  const unmet = Math.max(totalDemand - fulfilled, 0)
  const fillRate = fulfilled / (totalDemand || 1)
  const avgLead = allocations.reduce((acc, item) => acc + item.expected_lead_time_days * item.share, 0)

  const supplierMap = Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier]))
  const avgRisk = allocations.reduce((acc, item) => acc + (supplierMap[item.supplier_id]?.risk_score || 0.5) * item.share, 0)

  const lanePenalty = (adjustments.transport_disruption_ids || []).length ? 0.12 : 0
  const transportMultiplier = 1 + (adjustments.transport_cost_delta_pct || 0) + lanePenalty

  const avgTransportPerUnit = networkData.lanes.reduce((acc, lane) => acc + lane.transport_cost, 0) / networkData.lanes.length
  const procurementCost = allocations.reduce((acc, item) => acc + item.quantity * item.expected_unit_cost, 0)
  const transportCost = fulfilled * avgTransportPerUnit * transportMultiplier
  const conversionCost = fulfilled * (networkData.plants[0]?.conversion_cost_per_unit || 0)

  const beginningInv = networkData.plants.reduce((acc, item) => acc + item.inventory_on_hand, 0)
    + networkData.dcs.reduce((acc, item) => acc + item.inventory_on_hand, 0)
  const endingInv = Math.max(beginningInv + fulfilled - totalDemand, 0)
  const carryingRate = networkData.inventory_policies.reduce((acc, item) => acc + item.carrying_rate, 0) / networkData.inventory_policies.length
  const avgUnitCost = allocations.reduce((acc, item) => acc + item.expected_unit_cost * item.share, 0)
  const inventoryCost = ((beginningInv + endingInv) / 2) * avgUnitCost * (carryingRate / 12)

  const stockoutPenalty = unmet * 4.2
  const totalCost = procurementCost + transportCost + conversionCost + inventoryCost + stockoutPenalty

  const dailyDemand = totalDemand / 30
  const safetyDays = networkData.inventory_policies.reduce((acc, item) => acc + item.safety_days, 0) / networkData.inventory_policies.length
  const reorderDays = networkData.inventory_policies.reduce((acc, item) => acc + item.reorder_days, 0) / networkData.inventory_policies.length
  const safetyStock = dailyDemand * safetyDays * 1.95

  const result = {
    scenario_id: scenario.id,
    strategy_id: strategy.id,
    total_demand: totalDemand,
    fulfilled_demand: fulfilled,
    fill_rate: fillRate,
    expected_lead_time_days: avgLead,
    risk_score: avgRisk,
    allocations,
    cost: {
      procurement_cost: procurementCost,
      transport_cost: transportCost,
      inventory_carrying_cost: inventoryCost,
      conversion_cost: conversionCost,
      stockout_penalty_cost: stockoutPenalty,
      total_landed_cost: totalCost,
      by_supplier: Object.fromEntries(allocations.map((item) => [item.supplier_id, item.quantity * item.expected_unit_cost])),
      by_plant: { PLT1: conversionCost },
      by_dc: { DC01: (transportCost + inventoryCost) * 0.51, DC02: (transportCost + inventoryCost) * 0.49 },
      by_sku: { 'SKU-100': totalCost },
    },
    inventory: {
      beginning_inventory: beginningInv,
      ending_inventory: endingInv,
      safety_stock: safetyStock,
      reorder_point: dailyDemand * (avgLead + reorderDays) + safetyStock,
      days_of_supply: endingInv / (dailyDemand || 1),
      stock_coverage: (fulfilled + beginningInv) / (totalDemand || 1),
      plant_inventory: endingInv * (avgLead > 10 ? 0.45 : 0.35),
      dc_inventory: endingInv * (avgLead > 10 ? 0.55 : 0.65),
      prebuild_units: totalDemand * (Math.max(adjustments.demand_delta_pct || 0, 0) * 0.3 + Math.max(0.95 - fillRate, 0) * 0.5),
      inventory_carrying_cost: inventoryCost,
    },
    alerts: [],
    recommendations: [],
  }

  if (result.fill_rate < 0.93) {
    result.alerts.push({
      id: 'alert-service-risk',
      severity: 'critical',
      title: 'Service Target At Risk',
      detail: 'Current assumptions cannot satisfy target fill rate for the period.',
      recommended_action: 'Shift allocation to faster supplier and prebuild critical SKU to DC01.',
    })
  }

  if ((adjustments.transport_disruption_ids || []).length) {
    result.alerts.push({
      id: 'alert-lane-disruption',
      severity: 'warning',
      title: 'Transport Lane Disruption',
      detail: 'One or more lanes are disrupted, increasing landed cost and lead-time volatility.',
      recommended_action: 'Use alternate lane and prioritize high-priority customers.',
    })
  }

  if (!result.alerts.length) {
    result.alerts.push({
      id: 'alert-stable-network',
      severity: 'info',
      title: 'Network Stable',
      detail: 'No major edge-case alert triggered in this run.',
      recommended_action: 'Keep monitoring and rerun when assumptions change.',
    })
  }

  if (result.fill_rate < 0.95) {
    result.recommendations.push({
      id: 'rec-shift-volume',
      title: 'Shift 20% Volume to Faster Supplier',
      rationale: 'Lead-time weighted allocation is driving service risk.',
      impact_area: 'service',
      action: 'Move 20% of planned volume from slowest source to lower lead-time source for priority demand.',
    })
  }

  if (result.inventory.prebuild_units > 0) {
    result.recommendations.push({
      id: 'rec-prebuild',
      title: 'Prebuild to DC01',
      rationale: 'Demand shock and service gap trigger prebuild threshold.',
      impact_area: 'inventory',
      action: `Prebuild ${Math.round(result.inventory.prebuild_units)} units to DC01 before next demand cycle.`,
    })
  }

  result.recommendations.push({
    id: 'rec-expedite',
    title: 'Expedite Priority Customers Only',
    rationale: 'Selective expedite protects margin while preserving service for key accounts.',
    impact_area: 'service',
    action: 'Allow expedited replenishment only for priority-1 customers when fill-rate drops below 95%.',
  })

  return result
}

export function getMockBootstrap() {
  const baseScenario = scenarios.find((item) => item.id === 'baseline')
  const strategy = strategies.find((item) => item.id === baseScenario.strategy_id)
  const baseline_result = simulateScenario(network, baseScenario, strategy)
  return {
    network: clone(network),
    strategies: clone(strategies),
    scenarios: clone(scenarios),
    baseline_result,
  }
}

export const mockSeeds = {
  network,
  strategies,
  scenarios,
}

