export default function Inventory() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Inventory</h1>
      <p className="text-lg text-surface-400 mb-8">
        Track stock levels, manage products, and keep your warehouse in sync with WooCommerce.
      </p>

      <h2>Product Types</h2>
      <p>
        PickNPack handles two types of products from WooCommerce:
      </p>
      <ul>
        <li>
          <strong>Simple products</strong> — Single items with one SKU, price, and stock level.
          These are imported directly.
        </li>
        <li>
          <strong>Variations</strong> — Individual options of a variable product (e.g., "T-Shirt -
          Large / Red"). Each variation has its own SKU, price, stock quantity, and image. The
          parent "variable" product is not imported since it isn't a sellable item.
        </li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>How variations work:</strong> When WooCommerce has a "T-Shirt" variable product with
          sizes S/M/L and colors Red/Blue, PickNPack creates 6 individual inventory items like
          "T-Shirt - Small / Red", "T-Shirt - Medium / Blue", etc. Each has independent stock tracking.
        </p>
      </div>

      <h2>Inventory Table</h2>
      <p>
        The main inventory view shows all active products in a sortable table with columns for
        product name (with thumbnail), SKU, price, on-hand stock, reserved stock, and available
        quantity. Each row includes a color-coded stock level progress bar.
      </p>

      <h3>Stock Level Indicators</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Color</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>Green</td>
            <td>Stock is above the low-stock threshold</td>
          </tr>
          <tr>
            <td><span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span>Amber</td>
            <td>Stock is at or below the low-stock threshold</td>
          </tr>
          <tr>
            <td><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>Red</td>
            <td>Out of stock (0 quantity)</td>
          </tr>
        </tbody>
      </table>

      <h2>Quick Filters</h2>
      <p>
        Filter pills at the top let you quickly view: <strong>All</strong>, <strong>In Stock</strong>,
        <strong>Low Stock</strong>, or <strong>Out of Stock</strong> products. Counts next to each
        filter are calculated server-side across your entire catalog, not just the current page.
      </p>

      <h2>Syncing Products</h2>
      <p>
        Click the <strong>Sync</strong> button to open the sync options modal with three modes:
      </p>
      <ul>
        <li><strong>Add only</strong> — Import new products without updating existing ones</li>
        <li><strong>Update only</strong> — Update existing products without adding new ones</li>
        <li><strong>Add & Update</strong> — Full sync (default)</li>
      </ul>
      <p>
        The optional <strong>Import stock quantities</strong> toggle overwrites local stock counts
        with WooCommerce values. Use with caution if you manage stock primarily in PickNPack.
      </p>

      <h2>Product Detail</h2>
      <p>
        Click any product to open its detail page with 5 tabs:
      </p>
      <ul>
        <li><strong>Overview</strong> — Image, description, dimensions, weight, stock stats</li>
        <li><strong>Orders</strong> — All orders containing this product</li>
        <li><strong>Purchase Orders</strong> — POs matching this product's SKU</li>
        <li><strong>Stock History</strong> — Full movement history (received, picked, adjusted, etc.)</li>
        <li><strong>Settings</strong> — Per-product WooCommerce sync overrides</li>
      </ul>

      <h2>Editing Products</h2>
      <p>
        From the product detail page, click <strong>Edit</strong> to modify the description, price,
        weight, dimensions, and low-stock threshold. If the "Push product edits to WooCommerce"
        setting is enabled, changes are automatically synced back to your store.
      </p>

      <h2>Stock Push to WooCommerce</h2>
      <p>
        PickNPack can push stock levels back to WooCommerce. Configure this in
        Settings &rarr; Inventory Defaults with options for:
      </p>
      <ul>
        <li><strong>Out-of-stock behavior</strong> — Hide product, show as sold out, allow backorders, or allow backorders with notification</li>
        <li><strong>Per-product overrides</strong> — Override the global settings for individual products via the Settings tab on the product detail page</li>
        <li><strong>Bulk push</strong> — Push all active product stock levels at once</li>
      </ul>

      <h2>Sorting</h2>
      <p>
        Click any sortable column header (Product, SKU, Price, On Hand, Reserved) to sort
        ascending or descending. Sorting is handled server-side so it works across your full
        catalog, not just the current page.
      </p>

      <h2>Barcodes</h2>
      <p>
        Each product can have multiple barcodes (EAN13, UPC, CODE128, or Custom). One barcode
        can be set as primary. Barcodes are searchable — use the inventory search or the
        global Cmd+K search to find products by barcode.
      </p>

      <h2>Bundles</h2>
      <p>
        Mark a product as a bundle to define component products and their quantities. The
        "available bundle count" is automatically computed from the lowest available quantity
        across all components.
      </p>
    </article>
  );
}
