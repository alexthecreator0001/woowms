export default function Receiving() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Purchase Orders</h1>
      <p className="text-lg text-surface-400 mb-8">
        Manage purchase orders, send them to suppliers, track invoices, and receive inbound stock into your warehouse.
      </p>

      <h2>Purchase Order Lifecycle</h2>
      <p>
        Purchase orders (POs) track inbound inventory from suppliers. They follow a defined
        lifecycle:
      </p>
      <ul>
        <li><strong>Draft</strong> &mdash; PO is being prepared, items can be added/removed/edited</li>
        <li><strong>Ordered</strong> &mdash; PO sent to supplier, awaiting shipment</li>
        <li><strong>Shipped</strong> &mdash; Supplier has shipped the goods, in transit</li>
        <li><strong>Partially Received</strong> &mdash; Some items have arrived and been checked in</li>
        <li><strong>Received</strong> &mdash; All items received and stock updated</li>
        <li><strong>Received with Issues</strong> &mdash; Items received but with discrepancies, damage, or missing items</li>
        <li><strong>Cancelled</strong> &mdash; PO was cancelled</li>
      </ul>

      <h3>Status Transitions</h3>
      <p>The allowed status transitions are:</p>
      <ul>
        <li><strong>Draft</strong> &rarr; Ordered, Cancelled</li>
        <li><strong>Ordered</strong> &rarr; Shipped, Partially Received, Received, Received with Issues, Cancelled</li>
        <li><strong>Shipped</strong> &rarr; Partially Received, Received, Received with Issues, Cancelled</li>
        <li><strong>Partially Received</strong> &rarr; Received, Received with Issues, Cancelled</li>
      </ul>

      <h2>Creating a Purchase Order</h2>
      <p>
        Navigate to <strong>Purchase Orders &rarr; New PO</strong>. Fill in:
      </p>
      <ul>
        <li><strong>PO Number</strong> &mdash; Auto-generated (e.g., PO-001), editable</li>
        <li><strong>Supplier</strong> &mdash; Select from your supplier list (searchable dropdown)</li>
        <li><strong>Expected Date</strong> &mdash; When the shipment is expected to arrive</li>
        <li><strong>Tracking</strong> &mdash; Tracking number and URL (optional)</li>
        <li><strong>Notes</strong> &mdash; Internal notes about the order</li>
        <li><strong>Line Items</strong> &mdash; SKU, product name, ordered quantity, unit cost</li>
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

      <h2>Send to Supplier</h2>
      <p>
        Once a PO is in <strong>Ordered</strong> or <strong>Shipped</strong> status, you can
        send it directly to the supplier via email. The system generates a professional PDF
        and attaches it to the email.
      </p>
      <ul>
        <li>Click <strong>Send</strong> in the header action bar</li>
        <li>The supplier must have an email address configured (the button is disabled if no email is set)</li>
        <li>The email includes a summary of the PO and the PDF as an attachment</li>
        <li>After sending, the sent date is recorded and shown on the PO</li>
        <li>You can resend the PO at any time using the <strong>Resend to Supplier</strong> button</li>
      </ul>

      <h2>Receiving Items</h2>
      <p>
        From the PO Detail page, click <strong>Receive Items</strong> to enter receive mode. For each
        line item, enter the actual quantity received. The received quantity is tracked separately
        from the ordered quantity, allowing partial receives.
      </p>
      <p>
        Receiving is available when the PO is in <strong>Ordered</strong>, <strong>Shipped</strong>,
        or <strong>Partially Received</strong> status.
      </p>
      <p>
        When items are received, stock is automatically:
      </p>
      <ul>
        <li>Added to the product&apos;s on-hand quantity</li>
        <li>Logged as a RECEIVED stock movement in the product&apos;s history</li>
        <li>Pushed to WooCommerce if stock push is enabled for that product</li>
      </ul>

      <h2>Invoice Tracking</h2>
      <p>
        The PO detail page includes an <strong>Invoice</strong> card for tracking supplier invoices:
      </p>
      <ul>
        <li><strong>Invoice Number</strong> &mdash; The supplier&apos;s invoice reference number</li>
        <li><strong>Invoice Date</strong> &mdash; Date on the supplier&apos;s invoice</li>
        <li><strong>Invoice Amount</strong> &mdash; Total amount on the invoice</li>
        <li><strong>Invoice File</strong> &mdash; Upload a PDF, JPG, PNG, or WEBP file (max 10 MB)</li>
      </ul>
      <p>
        All invoice fields auto-save on blur. The uploaded file can be previewed/downloaded
        and deleted at any time.
      </p>

      <h2>PO Detail Page</h2>
      <p>
        The PO detail page features a header with inline actions, a summary stat strip,
        and a two-column layout:
      </p>

      <h3>Header &amp; Actions</h3>
      <p>
        All primary actions are accessible directly in the page header &mdash; no scrolling
        required. The header shows the PO number, status badge, supplier name, and action buttons:
      </p>
      <ul>
        <li><strong>Status transitions</strong> &mdash; Mark as Ordered, Mark as Shipped, Receive Items, or Mark Received with Issues (shown based on current status)</li>
        <li><strong>Send / Resend</strong> &mdash; Send the PO to the supplier via email (Ordered/Shipped status only)</li>
        <li><strong>Download PDF</strong> &mdash; Icon button to export the PO as PDF</li>
        <li><strong>More menu (&hellip;)</strong> &mdash; Cancel Order and Delete Purchase Order (destructive actions tucked away in a dropdown)</li>
      </ul>
      <p>
        When in <strong>receive mode</strong>, the header buttons are replaced with Save and Cancel actions.
      </p>

      <h3>Summary Stat Strip</h3>
      <p>
        Below the header, a 4-column stat strip provides at-a-glance metrics:
      </p>
      <ul>
        <li><strong>Items</strong> &mdash; Total number of line items</li>
        <li><strong>Total Cost</strong> &mdash; Sum of all item costs</li>
        <li><strong>Received</strong> &mdash; Received/ordered count with percentage and progress bar</li>
        <li><strong>Expected</strong> &mdash; Expected arrival date</li>
      </ul>

      <h3>Two-Column Layout</h3>
      <ul>
        <li>
          <strong>Left column:</strong> Items list with product thumbnails, ordered/received
          quantities, progress indicators, and cost summary with subtotal. Supplier SKU and
          EAN columns appear automatically when any item has those fields populated.
        </li>
        <li>
          <strong>Right column:</strong> PO info (supplier, status, dates, tracking)
          and Invoice tracking (number, date, amount, file upload).
        </li>
      </ul>

      <h3>Product Thumbnails</h3>
      <p>
        Each item row in the PO detail items list displays a small 40&times;40 product
        thumbnail loaded via the image proxy. If a product has no image, a placeholder
        package icon is shown instead.
      </p>

      <h2>PDF Export</h2>
      <p>
        Click <strong>Download PDF</strong> on any PO to generate a professional purchase order
        document. Useful for sending to suppliers or archiving.
      </p>
      <p>
        Three distinct PDF templates are available, configurable in <strong>Settings &gt; Branding</strong>:
      </p>
      <ul>
        <li>
          <strong>Modern</strong> &mdash; Color accent bar, logo + &quot;PURCHASE ORDER&quot; header, barcode,
          three colored info boxes (Supplier, Deliver To, From), table with alternating row
          tints, accent-colored total box, and stamp/signature support.
        </li>
        <li>
          <strong>Classic</strong> &mdash; Traditional bordered layout with company info and PO details
          in a header box, bordered supplier/delivery boxes, full-grid table with gray header,
          right-aligned subtotal/total text, and stamp/signature support.
        </li>
        <li>
          <strong>Minimal</strong> &mdash; Ultra-clean design with large PO number, inline metadata,
          simple labeled text blocks (no boxes), light table with bottom borders only (Product
          column first), and minimal footer showing only page numbers.
        </li>
      </ul>
      <p>
        All templates include your company details (address, email, phone, VAT ID, website) when
        configured in Branding settings. If a company stamp image is uploaded, it appears above
        the signature line on the PDF.
      </p>

      <h3>Editing Ordered/Shipped POs</h3>
      <p>
        While only Draft POs allow full editing (supplier, items), POs in Ordered or Shipped status
        also support editing the <strong>expected date</strong>, <strong>notes</strong>,
        <strong>tracking number</strong>, and <strong>tracking URL</strong>. These fields
        can be updated inline from the PO detail page.
      </p>

      <h2>Search & Filters</h2>
      <p>
        The purchase orders list page supports searching by PO number or supplier name, filtering by
        status (including the new Shipped and Received with Issues statuses), and pagination (25 per page).
        Total cost is shown for each PO in the table.
      </p>
    </article>
  );
}
