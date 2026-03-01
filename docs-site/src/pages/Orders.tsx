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

      <h2>Order Detail</h2>
      <p>
        Click any order row to open the full detail page. The two-column layout shows:
      </p>
      <ul>
        <li>
          <strong>Left column:</strong> Line items with product thumbnails, quantities, picked
          status badges, line totals, payment summary, shipment tracking, and order notes
        </li>
        <li>
          <strong>Right column:</strong> Customer info, shipping and billing addresses, and
          an order timeline showing key events
        </li>
      </ul>
      <p>
        You can change the order status directly from the detail page using the status dropdown.
      </p>

      <h2>Column Customization</h2>
      <p>
        Click the <strong>Columns</strong> button above the orders table to toggle which columns
        are visible. Your preferences are saved to your account and persist across sessions.
        A minimum of 2 columns is enforced.
      </p>
    </article>
  );
}
