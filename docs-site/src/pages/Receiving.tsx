export default function Receiving() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Receiving</h1>
      <p className="text-lg text-surface-400 mb-8">
        Manage purchase orders and receive inbound stock into your warehouse.
      </p>

      <h2>Purchase Order Lifecycle</h2>
      <p>
        Purchase orders (POs) track inbound inventory from suppliers. They follow a defined
        lifecycle:
      </p>
      <ul>
        <li><strong>Draft</strong> — PO is being prepared, items can be added/removed/edited</li>
        <li><strong>Ordered</strong> — PO sent to supplier, awaiting delivery</li>
        <li><strong>Partially Received</strong> — Some items have arrived and been checked in</li>
        <li><strong>Received</strong> — All items received and stock updated</li>
        <li><strong>Cancelled</strong> — PO was cancelled</li>
      </ul>

      <h2>Creating a Purchase Order</h2>
      <p>
        Navigate to <strong>Receiving &rarr; New PO</strong>. Fill in:
      </p>
      <ul>
        <li><strong>PO Number</strong> — Auto-generated (e.g., PO-001), editable</li>
        <li><strong>Supplier</strong> — Select from your supplier list (searchable dropdown)</li>
        <li><strong>Expected Date</strong> — When the shipment is expected to arrive</li>
        <li><strong>Tracking</strong> — Tracking number and URL (optional)</li>
        <li><strong>Notes</strong> — Internal notes about the order</li>
        <li><strong>Line Items</strong> — SKU, product name, ordered quantity, unit cost</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>Pack quantity hints:</strong> If a product has a configured package quantity
          (e.g., comes in packs of 36), the PO form shows whether you&apos;re ordering full packs.
          If not, it prompts &ldquo;Order 2 full packs (72 pcs)?&rdquo; to round up.
          When qty is already a full-pack multiple, it confirms with a green indicator.
        </p>
      </div>

      <div className="doc-callout">
        <p>
          <strong>Bundle products are excluded:</strong> The product search in PO creation
          automatically filters out bundle products, since bundles are assembled internally
          and not ordered from suppliers.
        </p>
      </div>

      <h3>Product Detail Popup</h3>
      <p>
        Click any <strong>SKU</strong> or <strong>product name</strong> in the items table to
        open a product detail popup showing the product image, stock levels (in stock / reserved
        / available), pack size, sell price, weight, and linked supplier info. From the popup
        you can navigate to the full product detail page.
      </p>

      <h3>Product Images</h3>
      <p>
        Each item row displays a small product thumbnail. Images are loaded automatically when
        you add a product via the search dropdown.
      </p>

      <h2>Receiving Items</h2>
      <p>
        From the PO Detail page, click <strong>Receive</strong> to enter receive mode. For each
        line item, enter the actual quantity received. The received quantity is tracked separately
        from the ordered quantity, allowing partial receives.
      </p>
      <p>
        When items are received, stock is automatically:
      </p>
      <ul>
        <li>Added to the product's on-hand quantity</li>
        <li>Logged as a RECEIVED stock movement in the product's history</li>
        <li>Pushed to WooCommerce if stock push is enabled for that product</li>
      </ul>

      <h2>PO Detail Page</h2>
      <p>
        The PO detail page uses a two-column layout:
      </p>
      <ul>
        <li>
          <strong>Left column:</strong> Items table with ordered/received quantities and
          progress indicators, cost summary with subtotal
        </li>
        <li>
          <strong>Right column:</strong> Status transitions, supplier info, tracking details,
          PDF export, and delete (draft only)
        </li>
      </ul>

      <h2>PDF Export</h2>
      <p>
        Click <strong>Download PDF</strong> on any PO to generate a professional purchase order
        document with header, supplier info, items table, totals, and notes. Useful for sending
        to suppliers or archiving.
      </p>

      <h2>Search & Filters</h2>
      <p>
        The receiving list page supports searching by PO number or supplier name, filtering by
        status, and pagination (25 per page). Total cost is shown for each PO in the table.
      </p>
    </article>
  );
}
