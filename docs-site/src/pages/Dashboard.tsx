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
        greeting based on time of day and a high-level summary of your warehouse operations.
      </p>

      <h2>Metric Cards</h2>
      <p>
        Four primary metric cards sit at the top of the dashboard. Click any card to navigate
        to the relevant page:
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
            <td className="font-medium text-surface-800">Total Orders</td>
            <td>Total number of orders across all connected stores</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Needs Attention</td>
            <td>Orders in PENDING or PROCESSING status that need fulfillment action</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Products</td>
            <td>Total active products in your inventory</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Low Stock</td>
            <td>Products below their configured low-stock threshold</td>
          </tr>
        </tbody>
      </table>

      <h2>Inventory Summary</h2>
      <p>
        Below the metric cards, a summary strip shows real-time inventory aggregates:
        <strong> Total Stock</strong> (all units in inventory),
        <strong> Reserved</strong> (allocated to orders),
        <strong> Incoming</strong> (expected from purchase orders), and
        <strong> Free to Sell</strong> (available for new orders).
      </p>

      <h2>Quick Actions</h2>
      <p>
        Six shortcut cards provide fast navigation to the most common areas:
        <strong> Orders, Picking, Shipping, Purchase Orders, Warehouse</strong>, and
        <strong> Cycle Counts</strong>. Each card shows the area name and a brief description.
      </p>

      <h2>Recent Orders</h2>
      <p>
        A list of the 5 most recent orders shows order number, customer name, total amount,
        relative date, and status badge. Click any row to jump directly to the order detail page.
        A skeleton loading state is displayed while data loads.
      </p>

      <h2>Resources Sidebar</h2>
      <p>
        The right column shows connected store count, contextual alerts for pending orders and
        low stock items (only shown when action is needed), and quick links to documentation.
      </p>
    </article>
  );
}
