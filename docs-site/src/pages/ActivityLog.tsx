export default function ActivityLog() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Activity Log</h1>
      <p className="text-lg text-surface-400 mb-8">
        Audit trail of all changes across your workspace.
      </p>

      <h2>Overview</h2>
      <p>
        The Activity page shows a chronological log of all significant actions taken
        in your workspace. Every order status change, stock adjustment, PO creation,
        and supplier update is recorded with who did it and when.
      </p>

      <h2>Accessing the Activity Log</h2>
      <p>
        Click <strong>Activity</strong> in the sidebar under the Overview section,
        or press <code>G</code> then <code>A</code> from anywhere in the app.
        The activity log is available at <code>/activity</code>.
      </p>

      <h2>Tracked Actions</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Orders</td>
            <td>Status changes (e.g., Pending → Processing → Shipped)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Products</td>
            <td>Stock adjustments via manual entry or CSV import</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Purchase Orders</td>
            <td>PO created, status changed, items received</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Suppliers</td>
            <td>Supplier created</td>
          </tr>
        </tbody>
      </table>

      <h2>Filtering</h2>
      <p>
        Use the filter buttons at the top to narrow results by resource type:
        All, Order, Product, Purchase Order, Supplier, or Settings.
      </p>

      <h2>Details</h2>
      <p>
        Each log entry shows:
      </p>
      <ul>
        <li><strong>When</strong> — Relative timestamp (Today at 2:30 PM, Yesterday, etc.)</li>
        <li><strong>User</strong> — The team member who performed the action</li>
        <li><strong>Action</strong> — Human-readable description of what changed</li>
        <li><strong>Resource</strong> — Clickable link to the affected order, product, PO, or supplier</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>Tip:</strong> Click on a resource link in the activity log to jump directly
          to the detail page of the affected item.
        </p>
      </div>
    </article>
  );
}
