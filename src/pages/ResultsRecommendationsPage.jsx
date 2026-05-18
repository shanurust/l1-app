import { AlertPanel } from '../components/common/AlertPanel'
import { DataTable } from '../components/common/DataTable'
import { RecommendationList } from '../components/common/RecommendationList'
import { SectionCard } from '../components/common/SectionCard'

export function ResultsRecommendationsPage({ activeResult, alerts, recommendations }) {
  if (!activeResult) {
    return null
  }

  const costBreakdown = [
    { id: 'procurement', metric: 'Procurement Cost', value: activeResult.cost.procurement_cost },
    { id: 'transport', metric: 'Transport Cost', value: activeResult.cost.transport_cost },
    { id: 'inventory', metric: 'Inventory Carrying Cost', value: activeResult.cost.inventory_carrying_cost },
    { id: 'conversion', metric: 'Conversion Cost', value: activeResult.cost.conversion_cost },
    { id: 'stockout', metric: 'Stockout Penalty', value: activeResult.cost.stockout_penalty_cost },
    { id: 'landed', metric: 'Total Landed Cost', value: activeResult.cost.total_landed_cost },
  ]

  const allocationRows = activeResult.allocations.map((item) => ({
    id: item.supplier_id,
    supplier_id: item.supplier_id,
    quantity: item.quantity,
    share: item.share,
    expected_unit_cost: item.expected_unit_cost,
    expected_lead_time_days: item.expected_lead_time_days,
  }))

  const inventoryRows = [
    { id: 'beginning_inventory', metric: 'Beginning Inventory', value: activeResult.inventory.beginning_inventory },
    { id: 'ending_inventory', metric: 'Ending Inventory', value: activeResult.inventory.ending_inventory },
    { id: 'safety_stock', metric: 'Safety Stock', value: activeResult.inventory.safety_stock },
    { id: 'reorder_point', metric: 'Reorder Point', value: activeResult.inventory.reorder_point },
    { id: 'days_of_supply', metric: 'Days of Supply', value: activeResult.inventory.days_of_supply },
    { id: 'prebuild_units', metric: 'Prebuild Recommendation Units', value: activeResult.inventory.prebuild_units },
  ]

  return (
    <div className="page-grid one-col">
      <SectionCard title="Total Landed Cost Breakdown" subtitle="Cost-to-serve and operating cost visibility">
        <DataTable
          columns={[
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value', format: 'currency' },
          ]}
          rows={costBreakdown}
        />
      </SectionCard>

      <SectionCard title="Sourcing Recommendation Snapshot" subtitle="Allocation and supplier performance">
        <DataTable
          columns={[
            { key: 'supplier_id', label: 'Supplier' },
            { key: 'quantity', label: 'Quantity', format: 'number' },
            { key: 'share', label: 'Share', format: 'percent' },
            { key: 'expected_unit_cost', label: 'Unit Cost', format: 'currency' },
            { key: 'expected_lead_time_days', label: 'Lead Time (days)' },
          ]}
          rows={allocationRows}
        />
      </SectionCard>

      <SectionCard title="Inventory and Prebuild" subtitle="Plant vs DC inventory tradeoff and prebuild guidance">
        <DataTable
          columns={[
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value' },
          ]}
          rows={inventoryRows}
        />
      </SectionCard>

      <RecommendationList recommendations={recommendations} />
      <AlertPanel alerts={alerts} />
    </div>
  )
}
