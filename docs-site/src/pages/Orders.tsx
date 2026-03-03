export default function Orders() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Orders</h1>
      <p className="text-lg text-surface-400 mb-8">
        Manage your entire order fulfillment pipeline from incoming to shipped.
      </p>

      <h2>How Orders Arrive</h2>
      <p>
        Orders are automatically synced from your connected WooCommerce store. When a customer
        places an order, it appears in PickNPack within minutes (or instantly via webhooks).
        Each order includes customer details, line items, shipping address, and payment totals.
      </p>

      <h2>Order Statuses</h2>
      <p>
        PickNPack uses its own internal WMS statuses that map from WooCommerce statuses:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>WMS Status</th>
            <th>WooCommerce Status</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">PENDING</td>
            <td>pending</td>
            <td>Awaiting payment or processing</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">PROCESSING</td>
            <td>processing</td>
            <td>Payment received, ready for fulfillment</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">ON_HOLD</td>
            <td>on-hold</td>
            <td>Temporarily paused</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">PICKING</td>
            <td>-</td>
            <td>Pick list created, items being collected</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">PACKING</td>
            <td>-</td>
            <td>Items picked, being packed</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">SHIPPED</td>
            <td>completed</td>
            <td>Package handed to carrier</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">DELIVERED</td>
            <td>completed</td>
            <td>Confirmed delivery</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-callout">
        <p>
          <strong>Custom Statuses:</strong> Admins can create custom WMS statuses in
          Settings &rarr; Order Workflow. Custom statuses appear in all status dropdowns
          and filters throughout the app.
        </p>
      </div>

      <h2>Searching & Filtering</h2>
      <p>
        Use the search bar at the top of the Orders page to search by order number, customer name,
        or email address. The status filter dropdown lets you view orders in a specific state.
        Pagination shows 25 orders per page.
      </p>

      <h2>Column Customization</h2>
      <p>
        Click the <strong>Columns</strong> button to show or hide table columns. Default columns
        are Order, Customer, Status, Items, Total, and Date. Additional columns you can enable:
      </p>
      <ul>
        <li><strong>Email</strong> — Customer email address</li>
        <li><strong>Payment</strong> — Payment method used (e.g. "Credit Card", "PayPal")</li>
        <li><strong>Shipping</strong> — Shipping method (e.g. "Flat Rate", "Free Shipping")</li>
        <li><strong>Priority</strong> — Order priority level (Low / Normal / High)</li>
      </ul>
      <p>
        Column preferences are saved to your account and persist across page reloads and devices.
        At least 2 columns must remain visible. You can also manage columns from
        Settings &rarr; Table Configuration.
      </p>

      <h2>Order Detail</h2>
      <p>
        Click any order row to open the full detail page. The rich two-column layout shows:
      </p>
      <ul>
        <li>
          <strong>Left column:</strong>
          <ul>
            <li>Line items with large product thumbnails (clickable — navigates to the product in Inventory), per-item picking progress bars, and a totals row</li>
            <li>Shipments &amp; Tracking — each shipment shows carrier, status badge, monospace tracking number with copy button, "Track Package" button (links to carrier tracking or ParcelsApp fallback), "Download Label" button if available, weight, and shipped/delivered dates</li>
            <li>Order notes (shown only if present)</li>
          </ul>
        </li>
        <li>
          <strong>Right column:</strong>
          <ul>
            <li>Customer card with avatar initials, email (mailto link), phone number, lifetime order count, total revenue, and auto-generated customer tags (e.g. "VIP", "Loyal") based on rules configured in Settings &rarr; Rules</li>
            <li>Shipping address with an embedded Google Maps preview and "Open in Google Maps" link</li>
            <li>Billing address (shown only when different from shipping)</li>
            <li>Visual timeline with colored dots — emerald for completed steps, blue for current, gray/dashed for pending (Order Placed &rarr; Synced &rarr; Shipped &rarr; Delivered)</li>
            <li>Payment summary with method, subtotal, total, and Paid/COD badge</li>
          </ul>
        </li>
      </ul>
      <p>
        You can change the order status directly from the detail page using the status dropdown.
      </p>

      <h2>Order Rules</h2>
      <p>
        Admins can define automation rules in Settings &rarr; Rules. Rules automate actions when
        orders arrive or are viewed. There are four rule types:
      </p>
      <ul>
        <li>
          <strong>Customer Tag</strong> &mdash; Assigns a colored badge to orders based on
          customer lifetime metrics (total revenue, order count) or the current order total.
          Tags appear in the Customer card on each order detail page, helping warehouse staff
          quickly identify VIP or high-value customers. Evaluated at view time.
        </li>
        <li>
          <strong>Free Gift</strong> &mdash; Automatically adds a free item (price $0) to
          the order when a condition is met (e.g. order total over $100). Fires once when
          the order first syncs from WooCommerce. Duplicate gifts are prevented automatically.
        </li>
        <li>
          <strong>Auto Priority</strong> &mdash; Sets the order priority (Low / Normal / High)
          based on order total, item count, or payment method. If multiple rules match, the
          highest priority wins. Fires once on initial sync.
        </li>
        <li>
          <strong>Auto Note</strong> &mdash; Appends a note to the order when a condition is
          met (e.g. &ldquo;Collect payment on delivery&rdquo; for COD orders). Fires once on
          initial sync.
        </li>
      </ul>

      <h2>Column Customization</h2>
      <p>
        Click the <strong>Columns</strong> button above the orders table to toggle which columns
        are visible. Your preferences are saved to your account and persist across sessions.
        A minimum of 2 columns is enforced.
      </p>
    </article>
  );
}
