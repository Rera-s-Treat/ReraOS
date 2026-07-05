export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Overview
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome to Rera&apos;s Treat. Here is a quick summary of your
          operations.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">0</h2>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">₦0</h2>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Products</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">0</h2>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">0</h2>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Activity
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          No recent activity yet.
        </p>
      </section>
    </div>
  );
}