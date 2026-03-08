export default function WarehouseBins() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Bins &amp; Stock</h1>
      <p className="text-lg text-surface-400 mb-8">
        Manage individual bin locations, track stock placement, transfer inventory between
        bins, and monitor capacity across your warehouse.
      </p>

      <h2>Bin Sizing</h2>
      <p>
        Every bin has a <strong>size category</strong> that sets its default capacity &mdash;
        how many items it can hold. These sizes match real WMS industry standards:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div className="text-center p-3 rounded-xl bg-surface-50 border border-surface-100">
          <div className="text-2xl font-display text-surface-800 mb-0.5">25</div>
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Small</div>
          <div className="text-[11px] text-surface-400 mt-1">Parts, jewelry, screws</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface-50 border border-surface-100">
          <div className="text-2xl font-display text-surface-800 mb-0.5">50</div>
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Medium</div>
          <div className="text-[11px] text-surface-400 mt-1">Clothing, electronics</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface-50 border border-surface-100">
          <div className="text-2xl font-display text-surface-800 mb-0.5">100</div>
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Large</div>
          <div className="text-[11px] text-surface-400 mt-1">Multi-packs, boxes</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface-50 border border-surface-100">
          <div className="text-2xl font-display text-surface-800 mb-0.5">200</div>
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">X-Large</div>
          <div className="text-[11px] text-surface-400 mt-1">Pallets, oversized</div>
        </div>
      </div>
      <p>
        Bin size is set when generating locations, creating racks, or editing individual bins.
        You can also <strong>override the capacity</strong> on any individual bin for special cases.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Soft limits:</strong> Capacity limits are warnings, not hard blocks. The
          system highlights bins that are over capacity with a red ring, but never prevents
          you from assigning stock. Real warehouses overflow bins all the time &mdash; blocking
          would halt operations.
        </p>
      </div>

      <h2>Bin Flags</h2>
      <p>
        Each bin has two boolean flags that control how its inventory is counted:
      </p>
      <div className="doc-card-grid">
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="doc-badge bg-emerald-100 text-emerald-700">Default: On</span>
          </div>
          <h4>Pickable</h4>
          <p>Whether this bin's inventory appears in pick lists. Turn off for overflow, reserve, or quarantine storage.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="doc-badge bg-emerald-100 text-emerald-700">Default: On</span>
          </div>
          <h4>Sellable</h4>
          <p>Whether this bin's inventory counts toward available stock. Turn off for damaged goods, QA holds, or display items.</p>
        </div>
      </div>

      <h2>Product Size Categories</h2>
      <p>
        Products are automatically classified by size based on their WooCommerce dimensions
        (length &times; width &times; height). This helps identify mismatches &mdash; the
        system warns when you put an oversized product into a small bin.
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

      <div className="doc-steps">
        <div className="doc-step">
          <div className="doc-step-number">1</div>
          <h4>During PO Receiving</h4>
          <p>
            When receiving a purchase order, each line item has a "Put to Bin" dropdown. Select
            a bin, enter the received quantity, and click Save. Stock is automatically recorded
            in that bin location. This is the primary way stock enters your warehouse.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">2</div>
          <h4>Manual Assign</h4>
          <p>
            Use the assign-bin feature to place existing stock into a specific bin. The system
            returns warnings if the bin would be over capacity or if there's a product/bin size
            mismatch.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">3</div>
          <h4>Transfer Between Bins</h4>
          <p>
            Move stock from one bin to another. The system validates that the source bin has
            enough stock, decrements the source, and adds to the target. If the source quantity
            reaches zero, the stock location is automatically cleaned up.
          </p>
        </div>
      </div>

      <div className="doc-callout">
        <p>
          <strong>Audit trail:</strong> Every stock movement (receive, assign, transfer) is
          recorded as a <strong>StockMovement</strong> entry with source/destination bin labels,
          quantity, and timestamp. View a product's full movement history on its Stock History tab.
        </p>
      </div>

      <h2>Grid vs. List View</h2>
      <p>
        The Zone Detail page (<code>/warehouse/:id/zones/:zoneId</code>) offers two view
        modes, toggled with the grid/list buttons in the header:
      </p>

      <div className="doc-card-grid">
        <div className="doc-card">
          <h4>Grid View (Default)</h4>
          <p className="mb-3">
            A visual rack representation. Racks are shown as collapsible sections, each
            displaying a vertical shelf grid.
          </p>
          <ul className="text-[13px] text-surface-500 leading-relaxed space-y-1 pl-4 mb-0">
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Bin label (or last 5 chars)</li>
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Current stock count</li>
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Capacity fraction (e.g., /50)</li>
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Red ring when over capacity</li>
          </ul>
        </div>
        <div className="doc-card">
          <h4>List View</h4>
          <p className="mb-3">
            A sortable data table, ideal for zones with hundreds of locations.
          </p>
          <ul className="text-[13px] text-surface-500 leading-relaxed space-y-1 pl-4 mb-0">
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Columns: Label, Shelf, Position, Stock, Size, Capacity, Status</li>
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Click any column header to sort</li>
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Paginated at 25 rows</li>
            <li className="relative before:content-[''] before:absolute before:-left-3 before:top-[0.6em] before:w-1 before:h-1 before:rounded-full before:bg-surface-300">Best for 500+ locations</li>
          </ul>
        </div>
      </div>

      <h2>Editing a Bin</h2>
      <p>
        Click any bin (in either grid or list view) to open the edit slide-over panel:
      </p>
      <ul>
        <li><strong>Bin size</strong> &mdash; Select Small, Medium, Large, or X-Large.
          Changing the size updates the capacity to the default for that size.</li>
        <li><strong>Capacity override</strong> &mdash; Set a custom capacity that overrides
          the size default.</li>
        <li><strong>Pickable</strong> &mdash; Toggle whether this bin's stock appears in pick lists.</li>
        <li><strong>Sellable</strong> &mdash; Toggle whether this bin's stock counts as available.</li>
        <li><strong>Active</strong> &mdash; Deactivate a bin to hide it from operations without deleting.</li>
      </ul>
      <p>
        Below the form, a <strong>Contents</strong> section shows all products currently stored
        in this bin with their quantities, SKUs, and product images.
      </p>

      <h2>Search &amp; Filters</h2>
      <p>
        The Zone Detail page provides several filtering options for quickly finding bins:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Filter</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Search</td>
            <td>Type to filter bins by label (instant, as you type)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Rack filter</td>
            <td>Click rack pills to show only bins from specific racks</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Status filter</td>
            <td>Show All, Occupied (has stock), or Empty bins</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">View toggle</td>
            <td>Switch between Grid and List view</td>
          </tr>
        </tbody>
      </table>

      <h2>Editing &amp; Deleting</h2>
      <p>
        Warehouses, zones, racks, and bins can all be edited using right-anchored slide-over panels:
      </p>
      <ul>
        <li><strong>Warehouses</strong> &mdash; Edit name and address from the overview page</li>
        <li><strong>Zones</strong> &mdash; Edit zone type and associated racks</li>
        <li><strong>Racks</strong> &mdash; Edit name, shelf count, positions per shelf, and bin size.
          Changing rack config regenerates bins if none have stock.</li>
        <li><strong>Bins</strong> &mdash; Edit size, capacity, pickable/sellable flags, and
          active status. View bin contents.</li>
      </ul>
      <div className="doc-callout-amber">
        <p>
          <strong>Deletion safety:</strong> You cannot delete a bin, rack, or zone that has stock.
          Move or adjust the stock first, then delete. This prevents accidental inventory loss.
        </p>
      </div>
    </article>
  );
}
