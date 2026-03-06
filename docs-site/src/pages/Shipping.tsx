export default function Shipping() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Shipping</h1>
      <p className="text-lg text-surface-400 mb-8">
        Generate shipping labels, track shipments, and manage carrier mappings.
      </p>

      <h2>Overview</h2>
      <p>
        The Shipping module tracks outbound packages from your warehouse. Each shipment is linked
        to an order and contains carrier information, tracking details, and delivery status.
        Shipping labels are generated through a connected shipping plugin (Shippo or EasyPost).
      </p>

      <h2>Connecting a Shipping Provider</h2>
      <p>
        Shipping label generation requires a shipping plugin. Go to the <strong>Plugins</strong> page
        and install either <strong>Shippo</strong> or <strong>EasyPost</strong>. You'll enter your API
        key during installation, and PickNPack will validate it before connecting.
      </p>
      <p>
        Once connected, the Settings &rarr; Shipping page shows your provider status and lets you
        manage carrier mappings. To change providers or update your API key, use the Plugins page.
      </p>

      <h2>Shipping Method Mapping</h2>
      <p>
        In <strong>Settings &rarr; Shipping</strong>, map your WooCommerce shipping methods to carrier
        services from your connected provider:
      </p>
      <ul>
        <li>Click <strong>Refresh from WooCommerce</strong> to pull your shipping methods</li>
        <li>For each WooCommerce method, select the corresponding carrier from the dropdown</li>
        <li>Click <strong>Save Mappings</strong></li>
      </ul>
      <p>
        When a packer clicks "Print Label & Ship" in the packing station, PickNPack looks up the
        order's WooCommerce shipping method, finds the mapped carrier, and creates a label through
        your connected provider.
      </p>

      <h2>Shipment Statuses</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Pending</td>
            <td>Order is packed and ready for carrier pickup</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Label Created</td>
            <td>Shipping label has been generated via Shippo or EasyPost</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shipped</td>
            <td>Package handed to carrier</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">In Transit</td>
            <td>Package is en route to customer</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Delivered</td>
            <td>Package confirmed delivered</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Returned</td>
            <td>Package returned to warehouse</td>
          </tr>
        </tbody>
      </table>

      <h2>Shipment Details</h2>
      <p>
        Each shipment record tracks:
      </p>
      <ul>
        <li><strong>Carrier</strong> — Shipping carrier name (UPS, FedEx, USPS, etc.)</li>
        <li><strong>Tracking number</strong> — Carrier-provided tracking code</li>
        <li><strong>Tracking URL</strong> — Link to carrier's tracking page</li>
        <li><strong>Label URL</strong> — Link to download the shipping label (PDF)</li>
        <li><strong>Weight</strong> — Package weight for carrier billing</li>
        <li><strong>Timestamps</strong> — Shipped at, delivered at dates</li>
      </ul>

      <h2>Shipping Table</h2>
      <p>
        The Shipping page displays all shipments in a sortable table with columns for order
        reference, carrier, tracking number, status, and dates. Tracking numbers are displayed
        as clickable chips that link to the carrier's tracking page.
      </p>
    </article>
  );
}
