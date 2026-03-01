export default function Search() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Global Search</h1>
      <p className="text-lg text-surface-400 mb-8">
        Find anything in your warehouse with the Cmd+K command palette.
      </p>

      <h2>Overview</h2>
      <p>
        Press <code>Cmd+K</code> (Mac) or <code>Ctrl+K</code> (Windows/Linux) from anywhere
        in the app to open the global search command palette. This searches across all your
        data in real-time.
      </p>

      <h2>What's Searchable</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Searchable Fields</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Orders</td>
            <td>Order number, customer name, customer email, tracking number</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Products</td>
            <td>Product name, SKU, barcode, description</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Purchase Orders</td>
            <td>PO number, supplier name, tracking number</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Suppliers</td>
            <td>Supplier name, email, phone number</td>
          </tr>
        </tbody>
      </table>

      <h2>Features</h2>
      <ul>
        <li>
          <strong>Real-time results</strong> — Results appear as you type, no need to press Enter
        </li>
        <li>
          <strong>Keyboard navigation</strong> — Use arrow keys to move between results, Enter to
          select, Esc to close
        </li>
        <li>
          <strong>Category grouping</strong> — Results are grouped by type (Orders, Products, etc.)
          for easy scanning
        </li>
        <li>
          <strong>Status badges</strong> — Order statuses and stock levels are shown inline with results
        </li>
        <li>
          <strong>Recent searches</strong> — Your recent search terms are saved for quick re-use
        </li>
        <li>
          <strong>Quick navigation</strong> — Selecting a result navigates directly to the detail page
        </li>
      </ul>

      <h2>Sidebar Shortcut</h2>
      <p>
        A search button in the sidebar shows the <code>Cmd+K</code> keyboard shortcut hint.
        Click it to open the search palette, or use the keyboard shortcut from anywhere.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Performance:</strong> The global search queries all categories in parallel on
          the server, returning results in a single response for fast, responsive searching
          across your entire dataset.
        </p>
      </div>
    </article>
  );
}
