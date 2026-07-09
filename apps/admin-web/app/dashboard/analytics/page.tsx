'use client';

import { useEffect, useMemo, useState } from 'react';
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
  getAllTimeOverview,
  getMonthlyAnalytics,
} from '@/services/dashboard.services';
import { AllTimeOverview, MonthlyAnalytics } from '@/types/dashboard';

const CHART_COLORS = {
  orange: '#e8621a',
  green: '#1c4a1c',
  peach: '#f5a07a',
  leaf: '#7ec87e',
  gray: '#9ca3af',
  red: '#c0392b',
};

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-NG', {
    month: 'short',
    year: 'numeric',
  });
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <h2 className="mt-3 text-3xl font-bold text-gray-900">{value}</h2>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [allTime, setAllTime] = useState<AllTimeOverview | null>(null);
  const [monthly, setMonthly] = useState<MonthlyAnalytics[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const [allTimeData, monthlyData] = await Promise.all([
          getAllTimeOverview(),
          getMonthlyAnalytics(),
        ]);

        setAllTime(allTimeData);
        setMonthly(monthlyData);
        setSelectedMonth(monthlyData[monthlyData.length - 1]?.month ?? '');
      } catch {
        setError('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const selectedMonthData = useMemo(
    () => monthly.find((entry) => entry.month === selectedMonth) ?? null,
    [monthly, selectedMonth],
  );

  const chartData = monthly.map((entry) => ({
    month: entry.month,
    revenue: entry.revenue,
    orders: entry.orders,
  }));

  const customerChartData = monthly.map((entry) => ({
    month: entry.month,
    'New Customers': entry.newCustomers,
    'Returning Customers': entry.returningCustomers,
  }));

  const paymentChartData = monthly.map((entry) => ({
    month: entry.month,
    Confirmed: entry.paymentBreakdown.confirmed,
    Pending: entry.paymentBreakdown.pendingConfirmation,
    Failed: entry.paymentBreakdown.failed,
    Refunded: entry.paymentBreakdown.refunded,
  }));

  const daysActive =
    allTime?.firstOrderAt && allTime?.lastOrderAt
      ? Math.max(
          1,
          Math.ceil(
            (new Date(allTime.lastOrderAt).getTime() -
              new Date(allTime.firstOrderAt).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-gray-900">All-Time Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Full lifetime performance and month-on-month trends across orders, payments,
          and customers.
        </p>
      </section>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* All-time overview cards */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Total Orders (All Time)"
          value={loading ? '—' : String(allTime?.totalOrders ?? 0)}
        />
        <OverviewCard
          label="Total Revenue (All Time)"
          value={loading ? '—' : formatNaira(allTime?.totalRevenue ?? 0)}
        />
        <OverviewCard
          label="Total Customers"
          value={loading ? '—' : String(allTime?.totalCustomers ?? 0)}
        />
        <OverviewCard
          label="Average Order Value"
          value={loading ? '—' : formatNaira(allTime?.averageOrderValue ?? 0)}
        />
      </section>

      {allTime?.firstOrderAt && (
        <p className="text-sm text-gray-500">
          Since {new Date(allTime.firstOrderAt).toLocaleDateString()} — {daysActive} days
          of operations.
        </p>
      )}

      {/* Orders & revenue trend, all months */}
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Orders &amp; Revenue — Month on Month
        </h3>

        <div className="mt-6 h-80">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-gray-500">No order history yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontSize: 12 }} />
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
                  labelFormatter={(label) => formatMonthLabel(String(label))}
                />
                <Legend />
                <Bar
                  yAxisId="orders"
                  dataKey="orders"
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
        {/* Customer acquisition */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            New vs Returning Customers
          </h3>

          <div className="mt-6 h-72">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : customerChartData.length === 0 ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={customerChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={(label) => formatMonthLabel(String(label))} />
                  <Legend />
                  <Bar
                    dataKey="New Customers"
                    stackId="customers"
                    fill={CHART_COLORS.orange}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Returning Customers"
                    stackId="customers"
                    fill={CHART_COLORS.leaf}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment status breakdown */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment Status Breakdown
          </h3>

          <div className="mt-6 h-72">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : paymentChartData.length === 0 ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paymentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonthLabel}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={(label) => formatMonthLabel(String(label))} />
                  <Legend />
                  <Bar dataKey="Confirmed" stackId="payments" fill={CHART_COLORS.green} />
                  <Bar dataKey="Pending" stackId="payments" fill={CHART_COLORS.peach} />
                  <Bar dataKey="Failed" stackId="payments" fill={CHART_COLORS.red} />
                  <Bar
                    dataKey="Refunded"
                    stackId="payments"
                    fill={CHART_COLORS.gray}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Month drill-down */}
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Month Drill-Down</h3>

          {monthly.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-(--color-brand-orange)"
            >
              {monthly
                .slice()
                .reverse()
                .map((entry) => (
                  <option key={entry.month} value={entry.month}>
                    {formatMonthLabel(entry.month)}
                  </option>
                ))}
            </select>
          )}
        </div>

        {selectedMonthData && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Orders</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {selectedMonthData.orders}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNaira(selectedMonthData.revenue)}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Avg Order Value</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNaira(selectedMonthData.averageOrderValue)}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-xs text-gray-500">New / Returning</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {selectedMonthData.newCustomers} / {selectedMonthData.returningCustomers}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-700">
                  Top Products This Month
                </h4>
                <div className="mt-3 space-y-2">
                  {selectedMonthData.topProducts.length === 0 ? (
                    <p className="text-sm text-gray-500">No sales this month.</p>
                  ) : (
                    selectedMonthData.topProducts.map((product, index) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--color-brand-pale-orange) text-xs font-semibold text-(--color-brand-orange)">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-800">{product.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {product.quantitySold} sold · {formatNaira(product.revenue)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700">
                  Top Customers This Month
                </h4>
                <div className="mt-3 space-y-2">
                  {selectedMonthData.topCustomers.length === 0 ? (
                    <p className="text-sm text-gray-500">No customers this month.</p>
                  ) : (
                    selectedMonthData.topCustomers.map((customer, index) => (
                      <div
                        key={customer.phone}
                        className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--color-brand-pale-green) text-xs font-semibold text-(--color-brand-green)">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-800">{customer.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatNaira(customer.totalSpend)} · {customer.orders} orders
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
