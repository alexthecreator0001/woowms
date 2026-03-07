export default function CycleCounts() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Cycle Counts</h1>
      <p className="text-lg text-surface-400 mb-8">
        Verify inventory accuracy without shutting down operations.
      </p>

      <h2>Overview</h2>
      <p>
        Cycle counting lets you count subsets of inventory on a rotating schedule instead of
        performing a full physical inventory. Create a count, assign it to a team member,
        record actual quantities, review variances, and reconcile stock — all within PickNPack.
      </p>

      <h2>Count Types</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Zone</td>
            <td>Count all stock locations in a warehouse zone</td>
            <td>Systematic coverage of entire areas</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Location</td>
            <td>Count specific bins you select</td>
            <td>Targeted spot checks of high-value or high-movement bins</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Product</td>
            <td>Count specific products across the warehouse</td>
            <td>ABC analysis — counting A-class items more frequently</td>
          </tr>
        </tbody>
      </table>

      <h2>Workflow</h2>
      <ol>
        <li><strong>Create</strong> — Select count type, warehouse, zone/bins/products. Optionally enable blind count and assign to a team member.</li>
        <li><strong>Start Counting</strong> — Move the count from Planned to In Progress. Items are sorted by bin label for efficient warehouse walking.</li>
        <li><strong>Record Counts</strong> — Enter the actual quantity for each item. The system calculates variance automatically.</li>
        <li><strong>Submit for Review</strong> — Once all items are counted, submit the count for manager review.</li>
        <li><strong>Review Variances</strong> — Managers accept or dismiss each variance. Use "Accept All" / "Dismiss All" for bulk resolution.</li>
        <li><strong>Reconcile</strong> — Apply accepted variances to stock. The system adjusts StockLocation quantities, Product stock totals, creates stock movements, and pushes to WooCommerce if sync is enabled.</li>
      </ol>

      <h2>Blind Counting</h2>
      <p>
        When blind count is enabled, counters cannot see the expected quantity for each item.
        This prevents bias and encourages accurate physical counting rather than confirming
        system values.
      </p>

      <h2>Variance Management</h2>
      <p>
        After counting, items with differences between expected and actual quantities are
        flagged as variance items. Managers can:
      </p>
      <ul>
        <li><strong>Accept</strong> — The counted quantity will replace the system quantity during reconciliation.</li>
        <li><strong>Dismiss</strong> — The system quantity is kept unchanged (e.g., if the counter made an error).</li>
      </ul>

      <h2>Reconciliation</h2>
      <p>
        Reconciliation is the final step. For each accepted variance item, the system:
      </p>
      <ul>
        <li>Reads the <em>current</em> stock (not the snapshot from count creation) to handle changes since the count began</li>
        <li>Updates StockLocation and Product quantities</li>
        <li>Creates a stock movement record for audit trail</li>
        <li>Triggers low stock alerts if applicable</li>
        <li>Pushes updated stock to WooCommerce if sync is enabled</li>
      </ul>

      <h2>Navigation</h2>
      <p>
        Access Cycle Counts from the sidebar under the Warehouse section, or press{' '}
        <code>G</code> then <code>C</code> from anywhere in the app. The page is
        available at <code>/cycle-counts</code>.
      </p>

      <h2>Settings</h2>
      <p>
        Configure default preferences at <strong>Settings → Cycle Counts</strong>:
      </p>
      <ul>
        <li><strong>Default blind count</strong> — New counts will use blind counting by default.</li>
        <li><strong>Default count type</strong> — Pre-select Zone, Location, or Product as the default type.</li>
      </ul>
    </article>
  );
}
