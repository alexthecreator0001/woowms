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

      <h2>Shipping Plugins</h2>
      <p>
        Shipping plugins connect PickNPack to shipping label providers. Only one shipping plugin
        can be installed at a time. When installed, the packing station's "Print Label & Ship"
        button will generate labels through the connected provider.
      </p>

      <h3>Shippo</h3>
      <p>
        Connect your Shippo account to generate shipping labels and track shipments directly
        from PickNPack. Shippo supports USPS, UPS, FedEx, DHL, and 80+ other carriers.
      </p>
      <ul>
        <li>Click <strong>Install</strong> on the Shippo card in the Plugins page</li>
        <li>Enter your Shippo API token (found in your Shippo dashboard under API settings)</li>
        <li>Click <strong>Connect</strong> — your key is validated and encrypted</li>
        <li>Go to <strong>Settings &rarr; Shipping</strong> to map your WooCommerce shipping methods to Shippo carriers</li>
      </ul>

      <h3>EasyPost</h3>
      <p>
        Connect your EasyPost account for multi-carrier shipping labels and tracking. EasyPost
        supports USPS, UPS, FedEx, DHL, and many regional carriers with competitive rates.
      </p>
      <ul>
        <li>Click <strong>Install</strong> on the EasyPost card in the Plugins page</li>
        <li>Enter your EasyPost API key (found in your EasyPost dashboard)</li>
        <li>Click <strong>Connect</strong> — your key is validated and encrypted</li>
        <li>Go to <strong>Settings &rarr; Shipping</strong> to map your WooCommerce shipping methods to EasyPost carriers</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>One at a time:</strong> Only one shipping plugin can be active. To switch providers,
          uninstall the current one first, then install the new one.
        </p>
      </div>

      <h3>Managing Shipping Plugins</h3>
      <p>
        After installing a shipping plugin, click <strong>Configure</strong> on its card to:
      </p>
      <ul>
        <li>View connection status</li>
        <li>Update your API key without reinstalling</li>
        <li>Navigate to Settings &rarr; Shipping for carrier mapping</li>
        <li>Uninstall the plugin (clears your API key and disconnects)</li>
      </ul>

      <h2>Automation Plugins</h2>

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

      <h2>Notification Plugins</h2>

      <h3>Slack</h3>
      <p>
        Receive real-time warehouse notifications in your Slack channel. PickNPack sends
        formatted messages via a Slack Incoming Webhook when key events happen in your warehouse.
      </p>

      <h4>Notification Types</h4>
      <ul>
        <li><strong>New Orders</strong> — When a new order is synced from WooCommerce (customer name, total, item count, payment status)</li>
        <li><strong>Low Stock Alerts</strong> — When a product's stock drops below its low stock threshold after a stock adjustment</li>
        <li><strong>Shipping Labels</strong> — When a shipping label is created from the packing station (carrier, tracking number)</li>
        <li><strong>PO Received</strong> — When a purchase order is fully received (supplier, item count, total quantity)</li>
      </ul>

      <h4>Setting Up Slack</h4>
      <ul>
        <li>Go to <strong>api.slack.com/apps</strong> and create a new app from scratch</li>
        <li>Enable <strong>Incoming Webhooks</strong> in your app settings</li>
        <li>Click <strong>Add New Webhook to Workspace</strong> and select the channel for notifications</li>
        <li>Copy the webhook URL (starts with <code>https://hooks.slack.com/services/...</code>)</li>
        <li>In PickNPack, go to <strong>Plugins</strong>, click <strong>Install</strong> on the Slack card, and paste the webhook URL</li>
        <li>Click <strong>Connect</strong> — a confirmation message is sent to your Slack channel</li>
      </ul>

      <h4>Managing Slack</h4>
      <p>
        After installing, click <strong>Configure</strong> on the Slack card to:
      </p>
      <ul>
        <li>Toggle individual notification types on/off</li>
        <li>Send a test notification to verify the webhook</li>
        <li>Update the webhook URL (to change the Slack channel)</li>
        <li>View the setup guide for creating a new webhook</li>
        <li>Uninstall the plugin to stop all notifications</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>No OAuth required:</strong> Slack notifications use a simple Incoming Webhook URL.
          No bot tokens, no OAuth flows — just paste the URL and you're connected.
        </p>
      </div>

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
            <td className="font-medium text-surface-800">QuickBooks</td>
            <td>Sync inventory costs and PO data with QuickBooks accounting</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
