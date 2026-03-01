export default function Picking() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Picking</h1>
      <p className="text-lg text-surface-400 mb-8">
        Create pick lists and manage the warehouse picking workflow.
      </p>

      <h2>Overview</h2>
      <p>
        The Picking module helps warehouse staff efficiently collect items from shelves to
        fulfill orders. Pick lists are created from orders and guide pickers to the exact
        bin location of each item.
      </p>

      <h2>Pick List Statuses</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Pending</td>
            <td>Created but not yet started</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">In Progress</td>
            <td>A picker is actively collecting items</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Completed</td>
            <td>All items picked and verified</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Cancelled</td>
            <td>Pick list was cancelled</td>
          </tr>
        </tbody>
      </table>

      <h2>Creating a Pick List</h2>
      <p>
        Click <strong>Create Pick List</strong> on an order to generate a pick list. Each line
        item in the order becomes a pick list item with:
      </p>
      <ul>
        <li><strong>SKU</strong> — Product identifier</li>
        <li><strong>Product name</strong> — For quick visual identification</li>
        <li><strong>Bin location</strong> — Exact warehouse location to pick from</li>
        <li><strong>Quantity</strong> — How many to pick</li>
        <li><strong>Picked quantity</strong> — Running count of items picked so far</li>
      </ul>

      <h2>Picking Items</h2>
      <p>
        As items are picked from shelves, mark each one as picked. The pick list shows
        progress bars indicating completion percentage. Once all items are marked as
        picked, the pick list status automatically moves to Completed.
      </p>

      <h2>Pick List Cards</h2>
      <p>
        The Picking page shows pick lists as cards with:
      </p>
      <ul>
        <li>Order reference and assigned picker</li>
        <li>Visual progress bar showing picked vs. total items</li>
        <li>Status badge (color-coded)</li>
        <li>Individual item checkboxes with pick/unpick toggle</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>Coming soon:</strong> Wave picking — batch multiple orders into a single
          pick run for greater efficiency. This allows pickers to collect items for several
          orders in one pass through the warehouse.
        </p>
      </div>
    </article>
  );
}
