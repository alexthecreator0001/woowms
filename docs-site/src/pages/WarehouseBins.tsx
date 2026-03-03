export default function WarehouseBins() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Bins & Stock</h1>
      <p className="text-lg text-surface-400 mb-8">
        Manage individual bin locations, stock placement, and product-to-bin assignments.
      </p>

      <h2>Bin Sizing</h2>
      <p>
        Every bin has a <strong>size category</strong> that sets its default capacity &mdash; how
        many items it can hold. This is based on real WMS practices from systems like ShipHero
        and ShipBob:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Size</th>
            <th>Default Capacity</th>
            <th>Typical Use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Small</td>
            <td>25 items</td>
            <td>Small parts, accessories, jewelry, screws</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Medium</td>
            <td>50 items</td>
            <td>Standard products, clothing, electronics, books</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Large</td>
            <td>100 items</td>
            <td>Bulkier items, multi-packs, boxed goods</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">X-Large</td>
            <td>200 items</td>
            <td>Pallet positions, oversized goods, bulk storage</td>
          </tr>
        </tbody>
      </table>
      <p>
        Bin size is set when generating locations, creating zones, or editing individual bins.
        You can also <strong>override the capacity</strong> on any individual bin for special cases.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Soft limits:</strong> Capacity limits are warnings, not hard blocks. The system
          highlights bins that are over capacity in red, but never prevents you from assigning
          stock. Real warehouses overflow bins all the time &mdash; blocking would halt operations.
        </p>
      </div>

      <h3>Bin Flags</h3>
      <p>
        Each bin has two boolean flags that control how its inventory is counted:
      </p>
      <ul>
        <li>
          <strong>Pickable</strong> &mdash; Whether this bin's inventory appears in pick lists.
          Turn off for overflow, reserve, or quarantine storage. Enabled by default.
        </li>
        <li>
          <strong>Sellable</strong> &mdash; Whether this bin's inventory counts toward available
          stock. Turn off for damaged goods, QA holds, or display items. Enabled by default.
        </li>
      </ul>

      <h2>Product Size Categories</h2>
      <p>
        Products are automatically classified by size based on their WooCommerce dimensions
        (length &times; width &times; height). This helps identify mismatches &mdash; the system
        warns when you put an oversized product into a small bin.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Volume (L &times; W &times; H)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Small</td>
            <td>&le; 500 cubic units</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Medium</td>
            <td>&le; 3,000 cubic units</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Large</td>
            <td>&le; 15,000 cubic units</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">X-Large</td>
            <td>&le; 50,000 cubic units</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Oversized</td>
            <td>&gt; 50,000 cubic units</td>
          </tr>
        </tbody>
      </table>
      <p>
        Size is calculated automatically during WooCommerce product sync and when product
        dimensions are edited. It can also be set manually via the product edit page.
      </p>

      <h2>Stock-to-Bin Assignment</h2>
      <p>
        Stock is linked to physical bin locations via <strong>StockLocation</strong> records.
        One product can be in many bins, and one bin can hold many products. There are three
        ways stock gets into bins:
      </p>

      <h3>1. During PO Receiving</h3>
      <p>
        When receiving a purchase order, each line item has a <strong>"Put to Bin"</strong>{' '}
        dropdown. Select a bin, enter the received quantity, and click Save. The stock is
        automatically recorded in that bin location. This is the primary way stock enters
        your warehouse.
      </p>

      <h3>2. Manual Assign</h3>
      <p>
        Use the assign-bin API to place existing stock into a specific bin. The system returns
        warnings if the bin would be over capacity or if there's a product/bin size mismatch.
      </p>

      <h3>3. Transfer Between Bins</h3>
      <p>
        Move stock from one bin to another. The system validates that the source bin has enough
        stock, decrements the source, and adds to the target. If the source quantity reaches
        zero, the stock location is automatically cleaned up.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Audit trail:</strong> Every stock movement (receive, assign, transfer) is
          recorded as a <strong>StockMovement</strong> entry with source/destination bin labels,
          quantity, and timestamp. View a product's full movement history on its Stock History tab.
        </p>
      </div>

      <h2>Grid vs. List View</h2>
      <p>
        The Zone Detail page (<code>/warehouse/:id/zones/:zoneId</code>) offers two view modes,
        toggled with the grid/list buttons in the header:
      </p>

      <h3>Grid View (Default)</h3>
      <p>
        A visual rack representation. Aisles are collapsible sections, each containing rack
        units displayed as vertical shelf grids. Each cell represents one bin and shows:
      </p>
      <ul>
        <li>The bin label (or last 5 characters if the label is long)</li>
        <li>Current stock count (or a dash if empty)</li>
        <li>Capacity fraction (e.g., <code>/50</code>) below the stock count</li>
        <li>Red ring highlight when the bin is over capacity</li>
      </ul>
      <p>
        Click any bin cell to open the edit panel. Aisles with many racks show the first 5 by
        default with a "Show more" button.
      </p>

      <h3>List View</h3>
      <p>
        A sortable data table with columns for Label, Aisle, Shelf, Position, Stock, Size,
        Capacity, and Status. Click any column header to sort ascending/descending. Paginated
        at 25 rows. Ideal for zones with 500+ locations.
      </p>

      <h2>Editing a Bin</h2>
      <p>
        Click any bin (in either grid or list view) to open the edit slide-over panel. You can change:
      </p>
      <ul>
        <li><strong>Bin size</strong> &mdash; Select Small, Medium, Large, or X-Large. Changing
          the size updates the capacity to the default for that size.</li>
        <li><strong>Capacity override</strong> &mdash; Set a custom capacity that overrides the
          size default.</li>
        <li><strong>Pickable</strong> &mdash; Toggle whether this bin's stock appears in pick lists.</li>
        <li><strong>Sellable</strong> &mdash; Toggle whether this bin's stock counts as available.</li>
        <li><strong>Active</strong> &mdash; Deactivate a bin to hide it from operations without deleting.</li>
      </ul>
      <p>
        Below the form, a <strong>Contents</strong> section shows all products currently stored
        in this bin with their quantities, SKUs, and images.
      </p>

      <h2>Search &amp; Filters</h2>
      <p>
        The Zone Detail page provides several filtering options:
      </p>
      <ul>
        <li><strong>Search</strong> &mdash; Type to filter bins by label (instant)</li>
        <li><strong>Aisle filter</strong> &mdash; Click aisle pills to show only bins from
          specific aisles</li>
        <li><strong>Status filter</strong> &mdash; Show All, Occupied (has stock), or Empty bins</li>
        <li><strong>View toggle</strong> &mdash; Switch between Grid and List view</li>
      </ul>

      <h2>Editing &amp; Deleting</h2>
      <p>
        Warehouses, zones, and bins can all be edited using right-anchored slide-over panels.
      </p>
      <ul>
        <li><strong>Warehouses</strong> &mdash; Edit name and address from the overview page</li>
        <li><strong>Zones</strong> &mdash; Edit name, shelf count, positions, and bin size.
          Changing rack config regenerates bins if none have stock.</li>
        <li><strong>Bins</strong> &mdash; Edit size, capacity, pickable/sellable flags, and
          active status. View bin contents.</li>
      </ul>
      <div className="doc-callout">
        <p>
          <strong>Deletion safety:</strong> You cannot delete a bin that has stock &mdash; move
          or adjust the stock first, then delete. This prevents accidental data loss.
        </p>
      </div>
    </article>
  );
}
