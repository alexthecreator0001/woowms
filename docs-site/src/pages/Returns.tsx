export default function Returns() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Returns / RMA</h1>
      <p className="text-lg text-surface-400 mb-8">
        Process return merchandise authorizations, receive returned items, inspect their condition,
        and manage restocking or disposal with full inventory impact tracking.
      </p>

      <h2>RMA Lifecycle</h2>
      <p>
        Returns follow a defined lifecycle from request to completion:
      </p>
      <ul>
        <li><strong>Requested</strong> &mdash; Return request created, awaiting authorization</li>
        <li><strong>Authorized</strong> &mdash; Return approved, customer can ship items back</li>
        <li><strong>Receiving</strong> &mdash; Items arriving at warehouse, being inspected</li>
        <li><strong>Completed</strong> &mdash; All items processed, stock adjustments applied</li>
        <li><strong>Rejected</strong> &mdash; Return request was denied</li>
        <li><strong>Cancelled</strong> &mdash; Return was cancelled</li>
      </ul>

      <h3>Status Transitions</h3>
      <ul>
        <li><strong>Requested</strong> &rarr; Authorized, Rejected, Cancelled</li>
        <li><strong>Authorized</strong> &rarr; Receiving, Cancelled</li>
        <li><strong>Receiving</strong> &rarr; Completed, Cancelled</li>
      </ul>

      <h2>Creating a Return</h2>
      <p>
        Navigate to <strong>Returns &rarr; New Return</strong>. The process:
      </p>
      <ul>
        <li><strong>Search for the order</strong> &mdash; Find the original order by order number, customer name, or email</li>
        <li><strong>Select items</strong> &mdash; Check which items the customer is returning</li>
        <li><strong>Set quantities</strong> &mdash; Specify how many of each item are being returned (up to the ordered quantity)</li>
        <li><strong>Set condition</strong> &mdash; Mark each item as New, Opened, Damaged, or Defective</li>
        <li><strong>Add details</strong> &mdash; Return reason, internal notes, and optional refund amount</li>
      </ul>

      <h2>Authorizing Returns</h2>
      <p>
        When a return is in <strong>Requested</strong> status, an admin or manager can:
      </p>
      <ul>
        <li><strong>Authorize</strong> &mdash; Approve the return, allowing the customer to ship items back</li>
        <li><strong>Reject</strong> &mdash; Deny the return request</li>
      </ul>

      <h2>Receiving &amp; Inspecting Items</h2>
      <p>
        Once authorized, transition the return to <strong>Receiving</strong> status. Then click
        <strong> Inspect Items</strong> to enter receive mode. For each item:
      </p>
      <ul>
        <li><strong>Received quantity</strong> &mdash; How many were actually returned</li>
        <li><strong>Condition</strong> &mdash; Reassess the condition after inspection (New, Opened, Damaged, Defective)</li>
        <li><strong>Resolution</strong> &mdash; Decide what to do with the item:
          <ul>
            <li><strong>Restock</strong> &mdash; Add back to inventory (stock quantity increases)</li>
            <li><strong>Dispose</strong> &mdash; Discard the item (no stock impact)</li>
            <li><strong>Damaged</strong> &mdash; Record as damaged (creates a DAMAGED stock movement for audit)</li>
          </ul>
        </li>
      </ul>

      <h2>Completing a Return</h2>
      <p>
        Click <strong>Complete Return</strong> when all items have a resolution. This:
      </p>
      <ul>
        <li>Applies stock adjustments for restocked items (increments product stock quantity)</li>
        <li>Creates <strong>RETURNED</strong> stock movements for restocked items</li>
        <li>Creates <strong>DAMAGED</strong> stock movements for damaged items</li>
        <li>Pushes updated stock to WooCommerce if stock sync is enabled</li>
        <li>Sends an in-app notification</li>
        <li>Logs the activity in the audit trail</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>Stock impact is only applied on completion</strong>, not during the receiving step.
          This ensures you can inspect and adjust all items before any inventory changes take effect.
        </p>
      </div>

      <h2>Refund Tracking</h2>
      <p>
        The optional <strong>Refund Amount</strong> field tracks the refund value for reference.
        PickNPack does not automatically process refunds through WooCommerce &mdash; it&apos;s a
        tracking field to keep your records in sync.
      </p>

      <h2>CSV Export</h2>
      <p>
        Click <strong>Export</strong> on the returns list to download all returns as a CSV file
        with configurable columns.
      </p>

      <h2>Keyboard Shortcut</h2>
      <p>
        Press <strong>G</strong> then <strong>R</strong> to navigate to the Returns page from anywhere
        in the app.
      </p>
    </article>
  );
}
