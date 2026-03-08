export default function CycleCounts() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Cycle Counts</h1>
      <p className="text-lg text-surface-400 mb-8">
        Verify inventory accuracy without shutting down operations. Count subsets of
        inventory on a rotating schedule instead of a full physical inventory.
      </p>

      <h2>Overview</h2>
      <p>
        Cycle counting lets you count small portions of inventory regularly, catching
        discrepancies early before they compound. Create a count, assign it to a team member,
        record actual quantities, review variances, and reconcile stock &mdash; all within
        PickNPack.
      </p>

      <h2>Count Types</h2>
      <p>
        Three counting strategies, each optimized for different use cases:
      </p>
      <div className="doc-card-grid">
        <div className="doc-card">
          <div className="doc-card-icon bg-blue-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <h4>Zone Count</h4>
          <p>Count all stock locations in a warehouse zone. Best for systematic coverage of entire areas on a rotating schedule.</p>
        </div>
        <div className="doc-card">
          <div className="doc-card-icon bg-violet-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h4>Location Count</h4>
          <p>Count specific bins you select. Best for targeted spot checks of high-value or high-movement bins.</p>
        </div>
        <div className="doc-card">
          <div className="doc-card-icon bg-emerald-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
          </div>
          <h4>Product Count</h4>
          <p>Count specific products across the entire warehouse. Best for ABC analysis &mdash; counting A-class items more frequently.</p>
        </div>
      </div>

      <h2>Workflow</h2>
      <p>
        Every cycle count follows a six-step lifecycle:
      </p>
      <div className="doc-steps">
        <div className="doc-step">
          <div className="doc-step-number">1</div>
          <h4>Create</h4>
          <p>
            Select count type, warehouse, zone/bins/products. Optionally enable blind
            count and assign to a team member.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">2</div>
          <h4>Start Counting</h4>
          <p>
            Move the count from Planned to In Progress. Items are sorted by bin label
            for efficient warehouse walking order.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">3</div>
          <h4>Record Counts</h4>
          <p>
            Enter the actual quantity for each item. The system calculates variance
            (difference between expected and actual) automatically.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">4</div>
          <h4>Submit for Review</h4>
          <p>
            Once all items are counted, submit the count for manager review. The count
            moves to Pending Review status.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">5</div>
          <h4>Review Variances</h4>
          <p>
            Managers accept or dismiss each variance. Use "Accept All" or "Dismiss All"
            buttons for bulk resolution when appropriate.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">6</div>
          <h4>Reconcile</h4>
          <p>
            Apply accepted variances to stock. The system adjusts quantities, creates
            stock movements, triggers alerts, and pushes to WooCommerce if sync is enabled.
          </p>
        </div>
      </div>

      <h2>Blind Counting</h2>
      <p>
        When blind count is enabled, counters <strong>cannot see the expected quantity</strong>{' '}
        for each item. This prevents confirmation bias and encourages accurate physical
        counting rather than just confirming system values.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Best practice:</strong> Enable blind counting for your regular cycle counts.
          Studies show blind counts catch 2&ndash;3x more discrepancies than non-blind counts
          because counters actually count rather than glancing and confirming.
        </p>
      </div>

      <h2>Variance Management</h2>
      <p>
        After counting, items with differences between expected and actual quantities are
        flagged as variance items. For each variance, managers can:
      </p>
      <div className="doc-card-grid">
        <div className="doc-card">
          <h4>Accept Variance</h4>
          <p>The counted quantity will replace the system quantity during reconciliation. Use when the physical count is correct and the system was wrong.</p>
        </div>
        <div className="doc-card">
          <h4>Dismiss Variance</h4>
          <p>The system quantity is kept unchanged. Use when the counter likely made an error or the discrepancy has already been resolved.</p>
        </div>
      </div>

      <h2>Reconciliation</h2>
      <p>
        Reconciliation is the final step that actually changes inventory levels. For each
        accepted variance item, the system:
      </p>
      <ol>
        <li>Reads the <em>current</em> stock (not the snapshot from count creation) to handle
          any changes that occurred since the count began</li>
        <li>Updates StockLocation and Product quantities to match the counted amounts</li>
        <li>Creates a stock movement record for the audit trail</li>
        <li>Triggers low stock alerts if the new quantity falls below thresholds</li>
        <li>Pushes updated stock to WooCommerce if automatic sync is enabled</li>
      </ol>
      <div className="doc-callout-amber">
        <p>
          <strong>Irreversible:</strong> Reconciliation cannot be undone. Once applied, the
          stock quantities are permanently updated. Review variances carefully before
          reconciling.
        </p>
      </div>

      <h2>Navigation</h2>
      <p>
        Access Cycle Counts from the sidebar under the <strong>Warehouse</strong> section,
        or use the keyboard shortcut <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">G</kbd>{' '}
        then <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">C</kbd>{' '}
        from anywhere in the app. The page is available at <code>/cycle-counts</code>.
      </p>

      <h2>Settings</h2>
      <p>
        Configure default preferences at <strong>Settings &rarr; Cycle Counts</strong>:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Default blind count</td>
            <td>When enabled, new counts will use blind counting by default (counters won't see expected quantities)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Default count type</td>
            <td>Pre-select Zone, Location, or Product as the default type when creating new counts</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
