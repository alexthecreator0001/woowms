export default function Suppliers() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Suppliers</h1>
      <p className="text-lg text-surface-400 mb-8">
        Manage your supplier relationships and product mappings.
      </p>

      <h2>Overview</h2>
      <p>
        The Suppliers module lets you maintain a directory of your product suppliers with contact
        details and product-level mappings. This data integrates with Purchase Orders for
        streamlined reordering.
      </p>

      <h2>Supplier Records</h2>
      <p>
        Each supplier stores:
      </p>
      <ul>
        <li><strong>Name</strong> — Company or supplier name</li>
        <li><strong>Email</strong> — Primary contact email</li>
        <li><strong>Phone</strong> — Contact phone number</li>
        <li><strong>Address</strong> — Physical address</li>
        <li><strong>Notes</strong> — Internal notes about the supplier</li>
        <li><strong>Active status</strong> — Toggle to deactivate suppliers without deleting</li>
      </ul>

      <h2>Product Mappings</h2>
      <p>
        Link products to suppliers with additional metadata:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Supplier SKU</td>
            <td>The SKU the supplier uses for this product (may differ from your internal SKU)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Supplier Price</td>
            <td>Cost price from this supplier</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Lead Time</td>
            <td>Typical delivery time in days</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-callout">
        <p>
          <strong>Multiple suppliers per product:</strong> A product can be mapped to multiple
          suppliers. The Product Detail page shows all linked suppliers with their SKUs and pricing
          under the "Supplier SKUs" section.
        </p>
      </div>

      <h2>Supplier Detail Page</h2>
      <p>
        Click any supplier in the list to view their detail page. Here you can edit supplier
        information and manage product mappings using the searchable product dropdown with
        thumbnails, SKU badges, and stock levels.
      </p>

      <h2>Creating Purchase Orders</h2>
      <p>
        When creating a Purchase Order, select a supplier from the dropdown. The supplier's
        product mappings are available for quick item addition. The supplier's contact details
        are automatically included in the PO for easy reference.
      </p>
    </article>
  );
}
