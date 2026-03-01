export default function Plugins() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Plugins</h1>
      <p className="text-lg text-surface-400 mb-8">
        Extend PickNPack with third-party integrations from the plugin marketplace.
      </p>

      <h2>Plugin Marketplace</h2>
      <p>
        The Plugins page shows available integrations in a card grid layout. Filter by category
        to find the integration you need. Each card shows the plugin name, description, status
        (available or coming soon), and install/uninstall button.
      </p>

      <h2>Available Plugins</h2>

      <h3>Zapier</h3>
      <p>
        Connect PickNPack to 5,000+ apps through Zapier. The Zapier plugin provides webhook
        endpoints for:
      </p>
      <ul>
        <li><strong>New Orders</strong> — Trigger when new orders arrive from WooCommerce</li>
        <li><strong>Low Stock Alerts</strong> — Trigger when products drop below their threshold</li>
        <li><strong>Order Status Changes</strong> — Trigger when order status is updated</li>
        <li><strong>Shipping Updates</strong> — Trigger when shipments are created or updated</li>
      </ul>

      <h3>Setting Up Zapier</h3>
      <ul>
        <li>Install the Zapier plugin from the marketplace</li>
        <li>An API key is automatically generated — copy it (shown only once)</li>
        <li>In Zapier, create a new Zap using the "Webhooks by Zapier" trigger</li>
        <li>Set up a webhook pointing to your PickNPack webhook URL</li>
        <li>Add the API key in the <code>X-API-Key</code> header</li>
        <li>Configure the webhook action (new_orders, low_stock, order_status)</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>API Key Security:</strong> API keys are hashed (SHA-256) before storage. Only the
          key prefix is saved for display. If you lose the key, use Regenerate to create a new one.
        </p>
      </div>

      <h3>Plugin Settings</h3>
      <p>
        Each plugin has configurable settings. For Zapier, toggle which event types you want to
        send: order notifications, low stock alerts, and shipping updates.
      </p>

      <h2>Coming Soon</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Plugin</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Slack</td>
            <td>Real-time warehouse notifications in your Slack channels</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">QuickBooks</td>
            <td>Sync inventory costs and PO data with QuickBooks accounting</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">ShipStation</td>
            <td>Automated shipping label generation and carrier rate shopping</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
