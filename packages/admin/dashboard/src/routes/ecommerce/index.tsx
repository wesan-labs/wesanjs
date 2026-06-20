import { ChartPanel, DashboardHeader, Widget } from "../dashboards/kit"
import { NewCustomers } from "./components/new-customers"
import { RecentOrders } from "./components/recent-orders"
import { StatCards } from "./components/stat-cards"

export const Component = () => {
  return (
    <div className="flex flex-col gap-y-3">
      <DashboardHeader title="E-Commerce" subtitle="Mağaza genel bakışı" />

      <StatCards />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Widget title="Son Siparişler" className="xl:col-span-2">
          <RecentOrders />
        </Widget>
        <Widget title="Son Müşteriler">
          <NewCustomers />
        </Widget>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Widget title="Gelir">
          <ChartPanel />
        </Widget>
        <Widget title="En Çok Satan">
          <ChartPanel />
        </Widget>
      </div>
    </div>
  )
}
