export default function Suppliers() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Suppliers</h1>
      <p className="text-lg text-surface-400 mb-8">
        Manage your supplier relationships, product sourcing, and purchase order history.
      </p>

      <h2>Supplier List</h2>
      <p>
        The suppliers page shows all your suppliers in a table with avatar initials, contact info
        (email and phone), linked product count, purchase order count, and active/inactive status.
      </p>
      <p>
        A <strong>stat strip</strong> at the top shows key metrics at a glance:
      </p>
      <ul>
        <li><strong>Total Suppliers</strong> &mdash; Total number of suppliers in the system</li>
        <li><strong>Active</strong> &mdash; Count of active suppliers</li>
        <li><strong>Products Linked</strong> &mdash; Total product-supplier mappings across all suppliers</li>
        <li><strong>Purchase Orders</strong> &mdash; Total POs across all suppliers</li>
      </ul>

      <h3>Filtering</h3>
      <p>
        Use the search bar to find suppliers by name or email. Quick-filter pills let you toggle
        between <strong>All</strong>, <strong>Active</strong>, and <strong>Inactive</strong> suppliers.
      </p>

      <h2>Adding a Supplier</h2>
      <p>
        Click <strong>Add Supplier</strong> to open the creation modal. Only the name is required;
        email, phone, address, and notes are optional. After creation you'll be taken to the
        supplier's detail page.
      </p>

      <h2>Supplier Detail Page</h2>
      <p>
        Click any supplier row to open their detail page. The page has a two-column layout:
      </p>
      <ul>
        <li>
          <strong>Left column:</strong> Products table (linked products with supplier SKU, price,
          and lead time) and Purchase Orders table (all POs for this supplier with status badges)
        </li>
        <li>
          <strong>Right column:</strong> Supplier info card with editable fields (name, email,
          phone, address, notes)
        </li>
      </ul>
      <p>
        A summary strip shows Products count, Purchase Orders count, Average Lead Time, and Open POs.
      </p>

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

      <h2>Editing Supplier Info</h2>
      <p>
        Click the <strong>Edit</strong> button in the header to switch the info card into edit mode.
        All fields (name, email, phone, address, notes) become editable inline. Click <strong>Save</strong>
        to persist or <strong>Cancel</strong> to discard changes.
      </p>

      <h2>Creating Purchase Orders</h2>
      <p>
        When creating a Purchase Order in the Receiving module, select a supplier from the dropdown.
        The supplier's product mappings are available for quick item addition with pre-filled SKUs
        and pricing. The supplier's contact details are included in the PO for easy reference.
      </p>
    </article>
  );
}
