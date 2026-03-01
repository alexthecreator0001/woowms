export default function Dashboard() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Dashboard</h1>
      <p className="text-lg text-surface-400 mb-8">
        Your central hub for monitoring warehouse performance at a glance.
      </p>

      <h2>Overview</h2>
      <p>
        The Dashboard is the first screen you see after logging in. It provides a personalized
        greeting and a high-level summary of your warehouse operations.
      </p>

      <h2>Metric Cards</h2>
      <p>
        Four primary metric cards sit at the top of the dashboard, each showing a real-time count:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Pending Orders</td>
            <td>Orders awaiting fulfillment (status: PENDING, PROCESSING, ON_HOLD)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Products</td>
            <td>Total active products in your inventory</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Low Stock</td>
            <td>Products below their configured low-stock threshold</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Active Pick Lists</td>
            <td>Pick lists currently in progress</td>
          </tr>
        </tbody>
      </table>

      <h2>Quick Shortcuts</h2>
      <p>
        A row of 5 shortcut buttons provides fast navigation to common actions:
        <strong> New Order, Sync Products, Create Pick List, Receive Shipment</strong>, and
        <strong> Warehouse Map</strong>.
      </p>

      <h2>Recent Orders</h2>
      <p>
        A table of the most recent orders shows order number, customer, status, total, and date.
        Click any row to jump directly to the order detail page. The table auto-refreshes with
        each page load.
      </p>

      <h2>Resources Sidebar</h2>
      <p>
        The right column shows helpful resources including quick links to this documentation,
        connected store count, and total order count. This section helps new users discover
        features they haven't tried yet.
      </p>
    </article>
  );
}
