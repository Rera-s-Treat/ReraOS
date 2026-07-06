'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  getActionQueue,
  getDashboardOverview,
  getInventoryAlerts,
  getOrderStatusSummary,
  getSalesTrend,
  getTopProducts,
} from '@/services/dashboard.services';
import {
  ActionQueue,
  DashboardOverview,
  InventoryAlerts,
  OrderStatusSummary,
  SalesTrendPoint,
  TopProduct,
} from '@/types/dashboard';

const CHART_COLORS = {
  orange: '#e8621a',
  green: '#1c4a1c',
  peach: '#f5a07a',
};

const STATUS_LABELS: Record<keyof OrderStatusSummary, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#c0392b' },
  confirmed: { label: 'Confirmed', color: '#e8621a' },
  preparing: { label: 'Preparing', color: '#f5a07a' },
  ready: { label: 'Ready', color: '#7ec87e' },
  completed: { label: 'Completed', color: '#1c4a1c' },
  cancelled: { label: 'Cancelled', color: '#6b7280' },
};

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function formatDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <h2 className="mt-3 text-3xl font-bold text-gray-900">{value}</h2>
    </div>
  );
}

function ActionQueueList({
  title,
  orders,
  emptyLabel,
}: {
  title: string;
  orders: ActionQueue['recentOrders'];
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>

      <div className="mt-2 space-y-2">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyLabel}</p>
        ) : (
          orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {order.orderNumber} — {order.customerName}
                </p>
                <p className="text-xs text-gray-500">{order.unifiedStatus}</p>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {formatNaira(order.totalAmount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [statusSummary, setStatusSummary] = useState<OrderStatusSummary | null>(null);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlerts | null>(null);
  const [actionQueue, setActionQueue] = useState<ActionQueue | null>(null);

  const [trendRange, setTrendRange] = useState<7 | 30>(7);
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  const [topProductsMetric, setTopProductsMetric] = useState<'quantity' | 'revenue'>(
    'quantity',
  );
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(true);

  useEffect(() => {
    async function loadCore() {
      try {
        const [overviewData, statusData, alertsData, queueData] = await Promise.all([
          getDashboardOverview(),
          getOrderStatusSummary(),
          getInventoryAlerts(),
          getActionQueue(),
        ]);

        setOverview(overviewData);
        setStatusSummary(statusData);
        setInventoryAlerts(alertsData);
        setActionQueue(queueData);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    void loadCore();
  }, []);

  useEffect(() => {
    async function loadTrend() {
      setTrendLoading(true);
      try {
        const data = await getSalesTrend(trendRange);
        setSalesTrend(data);
      } catch {
        setError('Failed to load sales trend.');
      } finally {
        setTrendLoading(false);
      }
    }

    void loadTrend();
  }, [trendRange]);

  useEffect(() => {
    async function loadTopProducts() {
      setTopProductsLoading(true);
      try {
        const data = await getTopProducts(trendRange, topProductsMetric, 5);
        setTopProducts(data);
      } catch {
        setError('Failed to load top products.');
      } finally {
        setTopProductsLoading(false);
      }
    }

    void loadTopProducts();
  }, [trendRange, topProductsMetric]);

  const statusEntries = statusSummary
    ? (Object.keys(STATUS_LABELS) as Array<keyof OrderStatusSummary>).map((key) => ({
        key,
        count: statusSummary[key],
        ...STATUS_LABELS[key],
      }))
    : [];

  const maxStatusCount = Math.max(1, ...statusEntries.map((entry) => entry.count));

  const outOfStockAndLowStock = [
    ...(inventoryAlerts?.outOfStock ?? []),
    ...(inventoryAlerts?.lowStock ?? []),
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome to Rera&apos;s Treat. Here is a quick summary of your operations.
        </p>
      </section>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Overview cards */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <OverviewCard
          label="Orders Today"
          value={loading ? '—' : String(overview?.ordersToday ?? 0)}
        />
        <OverviewCard
          label="Revenue Today"
          value={loading ? '—' : formatNaira(overview?.revenueToday ?? 0)}
        />
        <OverviewCard
          label="Average Order Value"
          value={loading ? '—' : formatNaira(overview?.averageOrderValue ?? 0)}
        />
        <OverviewCard
          label="Pending Orders"
          value={loading ? '—' : String(overview?.pendingOrders ?? 0)}
        />
        <OverviewCard
          label="Completed Orders"
          value={loading ? '—' : String(overview?.completedOrders ?? 0)}
        />
        <OverviewCard
          label="Cancelled Orders"
          value={loading ? '—' : String(overview?.cancelledOrders ?? 0)}
        />
      </section>

      {/* Sales trend */}
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>

          <div className="flex gap-2">
            {([7, 30] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTrendRange(range)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  trendRange === range
                    ? 'bg-(--color-brand-orange) text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 h-80">
          {trendLoading ? (
            <p className="text-sm text-gray-500">Loading sales trend...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Revenue' ? formatNaira(Number(value)) : String(value)
                  }
                  labelFormatter={(label) => formatDateLabel(String(label))}
                />
                <Legend />
                <Bar
                  yAxisId="orders"
                  dataKey="orderCount"
                  name="Orders"
                  fill={CHART_COLORS.peach}
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={CHART_COLORS.green}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Order status summary */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Order Status Summary</h3>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              statusEntries.map((entry) => (
                <div key={entry.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{entry.label}</span>
                    <span className="text-gray-500">{entry.count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(entry.count / maxStatusCount) * 100}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>

            <div className="flex gap-2">
              {(['quantity', 'revenue'] as const).map((metric) => (
                <button
                  key={metric}
                  type="button"
                  onClick={() => setTopProductsMetric(metric)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    topProductsMetric === metric
                      ? 'bg-(--color-brand-green) text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {metric === 'quantity' ? 'By Quantity' : 'By Revenue'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {topProductsLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">
                No sales in the last {trendRange} days yet.
              </p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-brand-pale-orange) text-sm font-semibold text-(--color-brand-orange)">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {product.name}
                    </span>
                  </div>

                  <span className="text-sm text-gray-500">
                    {topProductsMetric === 'quantity'
                      ? `${product.quantitySold} sold`
                      : formatNaira(product.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Inventory alerts */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>

          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md bg-(--color-brand-pale-orange) py-3">
                  <p className="text-xl font-bold text-(--color-brand-orange)">
                    {inventoryAlerts?.lowStock.length ?? 0}
                  </p>
                  <p className="text-xs text-gray-600">Low Stock</p>
                </div>
                <div className="rounded-md bg-red-50 py-3">
                  <p className="text-xl font-bold text-red-600">
                    {inventoryAlerts?.outOfStock.length ?? 0}
                  </p>
                  <p className="text-xs text-gray-600">Out of Stock</p>
                </div>
                <div className="rounded-md bg-(--color-brand-pale-green) py-3">
                  <p className="text-xl font-bold text-(--color-brand-green)">
                    {inventoryAlerts?.needingRestockCount ?? 0}
                  </p>
                  <p className="text-xs text-gray-600">Needing Restock</p>
                </div>
              </div>

              <div className="mt-5 max-h-64 space-y-2 overflow-y-auto">
                {outOfStockAndLowStock.length === 0 ? (
                  <p className="text-sm text-gray-500">All items are well-stocked.</p>
                ) : (
                  outOfStockAndLowStock.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.quantityInStock <= 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-(--color-brand-pale-orange) text-(--color-brand-orange)'
                        }`}
                      >
                        {item.quantityInStock} in stock (reorder at {item.reorderLevel})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Recent orders / action queue */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Action Queue</h3>

          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="mt-4 space-y-5">
              <ActionQueueList
                title={`Unpaid Orders (${actionQueue?.unpaidOrders.length ?? 0})`}
                orders={actionQueue?.unpaidOrders ?? []}
                emptyLabel="No unpaid orders."
              />
              <ActionQueueList
                title={`Awaiting Kitchen Confirmation (${
                  actionQueue?.pendingConfirmationOrders.length ?? 0
                })`}
                orders={actionQueue?.pendingConfirmationOrders ?? []}
                emptyLabel="Nothing awaiting kitchen confirmation."
              />
              <ActionQueueList
                title="Latest Orders"
                orders={actionQueue?.recentOrders ?? []}
                emptyLabel="No orders yet."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
