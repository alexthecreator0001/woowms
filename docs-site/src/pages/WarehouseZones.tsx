export default function WarehouseZones() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Zones &amp; Racks</h1>
      <p className="text-lg text-surface-400 mb-8">
        Organize your warehouse with a four-level hierarchy: Warehouse &rarr; Zone &rarr;
        Rack &rarr; Bin. Zones define functional areas, racks define physical storage units.
      </p>

      <h2>Data Model</h2>
      <p>
        Every warehouse uses a four-level hierarchy. Zones group racks by function,
        and racks contain the actual bin locations where products are stored.
      </p>
      <div className="doc-hierarchy">
        <span className="doc-hierarchy-node bg-brand-100 text-brand-700">Warehouse</span>
        <span className="doc-hierarchy-arrow">&rarr;</span>
        <span className="doc-hierarchy-node bg-blue-100 text-blue-700">Zone</span>
        <span className="doc-hierarchy-arrow">&rarr;</span>
        <span className="doc-hierarchy-node bg-violet-100 text-violet-700">Rack</span>
        <span className="doc-hierarchy-arrow">&rarr;</span>
        <span className="doc-hierarchy-node bg-emerald-100 text-emerald-700">Bin</span>
      </div>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Warehouse</td>
            <td>The physical building or facility</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Zone</td>
            <td>A functional area &mdash; Storage, Picking, Receiving, Packing, Shipping, or Returns. Each zone has a type that determines its color across the UI.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Rack</td>
            <td>A shelving or pallet rack inside a zone. Each rack has its own shelf/position configuration and generates bins automatically.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Bin</td>
            <td>An individual storage position on a rack (e.g., <code>SHE-01-03</code>). This is where products physically live.</td>
          </tr>
        </tbody>
      </table>

      <h2>Rack Types</h2>
      <p>
        Each rack has a type that determines its intended use:
      </p>
      <div className="doc-card-grid">
        <div className="doc-card">
          <div className="doc-card-icon bg-blue-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
          </div>
          <h4>Shelving Rack</h4>
          <p>For picking. Each bin holds one product location with a defined capacity (S/M/L/XL). Standard rack for most warehouses.</p>
        </div>
        <div className="doc-card">
          <div className="doc-card-icon bg-violet-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22"/><path d="M1 14h22"/><path d="M6 6v12"/><path d="M12 6v12"/><path d="M18 6v12"/></svg>
          </div>
          <h4>Pallet Rack</h4>
          <p>For bulk storage. Pallet positions that can hold multiple SKUs. Larger bin footprint, fewer positions per shelf.</p>
        </div>
      </div>
      <p>
        A third option, <strong>Pallet Storage</strong>, is available when placing elements
        via the floor plan. It creates a compact floor-level pallet area (2&times;2 footprint)
        with Storage-type zone and Pallet rack type.
      </p>

      <h2>Zone Types</h2>
      <p>
        Each zone has a type that determines its color throughout the interface &mdash; on
        the floor plan, zone cards, bin grid view, and printed labels:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
          <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
          <div>
            <span className="text-sm font-semibold text-surface-800 block leading-tight">Storage</span>
            <span className="text-[11px] text-surface-500">Main shelving area</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100">
          <span className="w-3 h-3 rounded-full bg-violet-500 shrink-0"></span>
          <div>
            <span className="text-sm font-semibold text-surface-800 block leading-tight">Picking</span>
            <span className="text-[11px] text-surface-500">Forward-pick area</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
          <div>
            <span className="text-sm font-semibold text-surface-800 block leading-tight">Receiving</span>
            <span className="text-[11px] text-surface-500">Inbound dock</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-100">
          <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
          <div>
            <span className="text-sm font-semibold text-surface-800 block leading-tight">Packing</span>
            <span className="text-[11px] text-surface-500">Pack stations</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
          <div>
            <span className="text-sm font-semibold text-surface-800 block leading-tight">Shipping</span>
            <span className="text-[11px] text-surface-500">Outbound staging</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
          <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
          <div>
            <span className="text-sm font-semibold text-surface-800 block leading-tight">Returns</span>
            <span className="text-[11px] text-surface-500">RMA processing</span>
          </div>
        </div>
      </div>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5 align-middle"></span>
              Storage
            </td>
            <td>Main area where products live on shelves. Most of your bins will be here. Shelving and pallet racks.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500 mr-1.5 align-middle"></span>
              Picking
            </td>
            <td>Forward-pick area for high-velocity items, positioned close to packing stations for fast fulfillment.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5 align-middle"></span>
              Receiving
            </td>
            <td>Inbound dock where shipments arrive. PO items can be received directly into bins in this zone.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5 align-middle"></span>
              Packing
            </td>
            <td>Stations for packing orders into shipping boxes before handoff to carriers.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5 align-middle"></span>
              Shipping
            </td>
            <td>Outbound staging area for packed orders awaiting carrier pickup.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5 align-middle"></span>
              Returns
            </td>
            <td>Processing area for returned items. Inspect, restock, or dispose of returned goods.</td>
          </tr>
        </tbody>
      </table>

      <h2>Adding Racks &amp; Zones</h2>
      <p>
        There are two ways to set up your warehouse. Both create the same underlying data
        (zones + racks + bins) &mdash; they're just different interfaces:
      </p>

      <h3>Option A: Zones Tab (Quick Setup)</h3>
      <p>
        Best for getting started fast when you don't need a visual layout.
      </p>
      <ol>
        <li>Click the <strong>Zones</strong> tab on your warehouse, then <strong>Add Element</strong></li>
        <li>Choose a rack type: <strong>Shelving Rack</strong>, <strong>Pallet Rack</strong>,
          or <strong>Pallet Storage</strong></li>
        <li>Configure the label, custom prefix, shelf count, positions per shelf, and bin size</li>
        <li>Click <strong>Create</strong> &mdash; the zone + rack + bins are created in one step</li>
      </ol>
      <div className="doc-callout">
        <p>
          <strong>Zones tab = racks only.</strong> Non-storage elements like Packing Tables,
          Dock Doors, Receiving Areas, Staging Areas, and Shipping Areas are placed from the
          Floor Plan tab, since they represent physical space on your warehouse floor rather
          than racked storage with bin locations.
        </p>
      </div>

      <h3>Option B: Floor Plan Tab (Visual Layout)</h3>
      <p>
        Best when you want a 2D visual representation. Drag elements onto a to-scale grid
        and configure storage setup from the properties panel. See the{' '}
        <a href="/warehouse/floor-plan" className="text-brand-600 underline underline-offset-2">Floor Plan</a>{' '}
        docs for full details.
      </p>

      <h3>Two Views, One Data Model</h3>
      <p>
        The Zones tab and Floor Plan tab show the <strong>same data</strong>. Creating a rack
        from either tab creates a Zone + Rack + Bins in one step. Zone cards show rack count
        and total location count. Floor plan elements show their zone's bin count and utilization.
      </p>
      <ul>
        <li>
          <strong>Zone &rarr; Floor Plan:</strong> Click the floor plan icon on any zone card
          to switch to the Floor Plan tab with that element selected
        </li>
        <li>
          <strong>Floor Plan &rarr; Zone:</strong> Click the "View" link in the element properties
          panel to switch to the Zones tab filtered to that zone's type
        </li>
      </ul>

      <h2>Element Types</h2>
      <p>
        The floor plan supports 8 placeable element types plus walls. Storage elements
        (Shelving Rack, Pallet Rack, Pallet Storage) can also be created from the Zones tab:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Element</th>
            <th>Size</th>
            <th>Zone Type</th>
            <th>Bins</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Shelving Rack</td>
            <td>1&times;4</td>
            <td><span className="doc-badge bg-blue-100 text-blue-700">Storage</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pallet Rack</td>
            <td>2&times;3</td>
            <td><span className="doc-badge bg-blue-100 text-blue-700">Storage</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pallet Storage</td>
            <td>2&times;2</td>
            <td><span className="doc-badge bg-blue-100 text-blue-700">Storage</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Packing Table</td>
            <td>2&times;2</td>
            <td><span className="doc-badge bg-orange-100 text-orange-700">Packing</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Receiving Area</td>
            <td>3&times;3</td>
            <td><span className="doc-badge bg-amber-100 text-amber-700">Receiving</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shipping Area</td>
            <td>3&times;3</td>
            <td><span className="doc-badge bg-emerald-100 text-emerald-700">Shipping</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Dock Door</td>
            <td>3&times;1</td>
            <td><span className="doc-badge bg-amber-100 text-amber-700">Receiving</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Staging Area</td>
            <td>2&times;3</td>
            <td><span className="doc-badge bg-violet-100 text-violet-700">Picking</span></td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Wall</td>
            <td>1&times;1</td>
            <td><span className="text-surface-400">&mdash;</span></td>
            <td>No</td>
          </tr>
        </tbody>
      </table>
      <p>
        Open space on the grid naturally represents walkways and aisles &mdash; there is no
        dedicated aisle element.
      </p>

      <h2>Editing Racks</h2>
      <p>
        Click on a zone card (or a floor plan element) to edit its rack configuration:
      </p>
      <ul>
        <li><strong>Name</strong> &mdash; The display label for this rack/zone</li>
        <li><strong>Shelves</strong> &mdash; Number of vertical levels (1&ndash;20), counted from floor to top</li>
        <li><strong>Positions per shelf</strong> &mdash; Number of horizontal slots (1&ndash;20), left to right</li>
        <li><strong>Bin size</strong> &mdash; Default size for all bins in this rack (Small, Medium, Large, X-Large)</li>
      </ul>
      <div className="doc-callout-amber">
        <p>
          <strong>Regeneration warning:</strong> If you change the shelf or position count
          and no bins currently have stock, the system will automatically delete the old bins
          and regenerate new ones matching the updated configuration. An amber warning appears
          when the numbers differ from existing locations.
        </p>
      </div>

      <h2>Bulk Location Generator</h2>
      <p>
        For warehouses with many aisles and racks, the <strong>Generate Locations</strong>{' '}
        wizard creates hundreds of bin locations in one click. Open it from any zone detail page.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Range</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Aisles</td>
            <td>1&ndash;26</td>
            <td>Number of parallel rows. Naming style: letters (A, B, C) or numbers (01, 02, 03)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Racks per aisle</td>
            <td>1&ndash;99</td>
            <td>How many shelving units along each aisle</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shelf levels</td>
            <td>1&ndash;20</td>
            <td>Vertical levels on each rack, counted from floor up</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Positions per shelf</td>
            <td>1&ndash;20</td>
            <td>Individual bin slots across each shelf, numbered left to right</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Location size</td>
            <td>&mdash;</td>
            <td>Bin size category for all generated locations (Small, Medium, Large, or X-Large)</td>
          </tr>
        </tbody>
      </table>
      <p>
        A live <strong>rack preview</strong> shows what the first rack will look like with
        sample labels. A summary at the bottom shows the total count, first and last label,
        and warns if you exceed the 2,000 location limit per batch.
      </p>

      <h2>Custom Location Prefix</h2>
      <p>
        When creating or editing an element, you can set a custom <strong>prefix</strong>{' '}
        that determines how location codes are generated. The prefix replaces the default
        aisle letter in the label format.
      </p>
      <ul>
        <li>Maximum 5 characters, auto-uppercased</li>
        <li>Default: first 3 alphanumeric characters of the element label (e.g., "Shelving Rack" &rarr; <code>SHE</code>)</li>
        <li>Example: prefix <code>RACK</code> produces <code>RACK-01-01</code>, <code>RACK-01-02</code></li>
      </ul>
      <p>
        A live preview in the modal shows what location codes will look like as you type.
      </p>

      <h2>Deleting Zones &amp; Racks</h2>
      <ul>
        <li><strong>Delete a rack</strong> &mdash; Only possible if all bins in the rack are empty
          (no stock assigned). The system checks and blocks deletion if any bin has stock.</li>
        <li><strong>Delete a zone</strong> &mdash; Checks all racks within the zone. If any bin
          in any rack has stock, deletion is blocked. Move or adjust stock first.</li>
      </ul>
      <div className="doc-callout-emerald">
        <p>
          <strong>Safe by default:</strong> The system never lets you accidentally delete locations
          that have inventory. You'll always get a clear error message explaining which bins
          still have stock.
        </p>
      </div>
    </article>
  );
}
