export default function WarehouseOverview() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Warehouse</h1>
      <p className="text-lg text-surface-400 mb-8">
        Design your physical warehouse layout, organize storage into zones and racks,
        assign products to bin locations, and print scannable labels &mdash; all from a
        visual, drag-and-drop interface.
      </p>

      {/* Hero feature cards */}
      <div className="doc-card-grid">
        <div className="doc-card">
          <div className="doc-card-icon bg-blue-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <h4>Visual Floor Plan</h4>
          <p>Drag-and-drop 2D editor. Place racks, packing tables, dock doors, and more on a to-scale grid.</p>
        </div>
        <div className="doc-card">
          <div className="doc-card-icon bg-violet-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <h4>Zones &amp; Racks</h4>
          <p>Organize storage with typed zones (Storage, Picking, Receiving) and shelving or pallet racks inside each zone.</p>
        </div>
        <div className="doc-card">
          <div className="doc-card-icon bg-emerald-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
          </div>
          <h4>Bin Management</h4>
          <p>Generate hundreds of bin locations in one click. Track stock per bin with capacity warnings and size matching.</p>
        </div>
        <div className="doc-card">
          <div className="doc-card-icon bg-amber-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h4"/></svg>
          </div>
          <h4>Label Printing</h4>
          <p>Generate PDF labels with Code 128 barcodes for Zebra printers or standard paper. Five size options.</p>
        </div>
      </div>

      <h2>Location Hierarchy</h2>
      <p>
        PickNPack uses a four-level hierarchy to model your warehouse. Every physical location
        where a product can be stored is called a <strong>bin</strong>.
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
            <th>What It Represents</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Warehouse</td>
            <td>Your physical building or facility</td>
            <td><code>Main Warehouse</code></td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Zone</td>
            <td>A functional area within the warehouse (Storage, Picking, Receiving, Packing, Shipping, Returns)</td>
            <td><code>Storage Zone A</code></td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Rack</td>
            <td>A shelving unit or pallet rack inside a zone. Two types: <strong>Shelving</strong> (for picking) and <strong>Pallet</strong> (for bulk storage)</td>
            <td><code>Shelving Rack 1</code></td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Bin</td>
            <td>An individual storage position on a rack &mdash; where products physically live</td>
            <td><code>SHE-01-03</code></td>
          </tr>
        </tbody>
      </table>

      <h3>Bin Label Format</h3>
      <p>
        Bins are identified by a structured label. The default format is{' '}
        <code>PREFIX-SHELF-POSITION</code>, but when using the bulk generator with aisles
        and multiple racks, the format expands to <code>AISLE-RACK-SHELF-POSITION</code>:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Segment</th>
            <th>Example</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Prefix / Aisle</td>
            <td><code>A</code> or <code>SHE</code></td>
            <td>The aisle letter (A&ndash;Z) or custom prefix (up to 5 characters)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Rack</td>
            <td><code>01</code></td>
            <td>Which shelving unit along the aisle (01&ndash;99)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shelf</td>
            <td><code>03</code></td>
            <td>Vertical level on the rack, counted from floor up (01 = ground level)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Position</td>
            <td><code>02</code></td>
            <td>Horizontal slot on the shelf, numbered left to right</td>
          </tr>
        </tbody>
      </table>
      <p>
        You can set a <strong>custom prefix</strong> (up to 5 characters, auto-uppercased)
        when creating or editing a rack. For example, prefix <code>MSH</code> produces
        locations like <code>MSH-01-01</code>, <code>MSH-01-02</code>, etc.
      </p>

      <h2>Three-Level Navigation</h2>
      <p>
        The warehouse module uses a drill-down architecture. Each level links to the next:
      </p>
      <div className="doc-steps">
        <div className="doc-step">
          <div className="doc-step-number">1</div>
          <h4>Warehouse Overview &mdash; <code>/warehouse</code></h4>
          <p>
            Dashboard with stat cards (total locations, occupied, empty, utilization %)
            and warehouse summary cards. Click a warehouse to drill in.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">2</div>
          <h4>Warehouse Detail &mdash; <code>/warehouse/:id</code></h4>
          <p>
            Two tabs: <strong>Zones</strong> (list of all zones with rack counts and
            utilization bars) and <strong>Floor Plan</strong> (2D visual editor).
            Click a zone card to drill in.
          </p>
        </div>
        <div className="doc-step">
          <div className="doc-step-number">3</div>
          <h4>Zone Detail &mdash; <code>/warehouse/:id/zones/:zoneId</code></h4>
          <p>
            Individual racks shown as collapsible sections. Each rack displays a visual
            shelf grid or sortable data table. Click any bin to edit it.
          </p>
        </div>
      </div>

      <h2>Creating a Warehouse</h2>
      <p>
        Go to <code>/warehouse</code> and click <strong>Add Warehouse</strong>. Enter a
        name (e.g., "Main Warehouse") and optionally an address. The warehouse is created
        immediately and you can start adding zones or building a floor plan.
      </p>

      <h2>Typical Setup Workflow</h2>
      <p>
        Here's the recommended end-to-end workflow for setting up a new warehouse:
      </p>
      <ol>
        <li>Create a warehouse from the <code>/warehouse</code> page</li>
        <li>Add racks from the <strong>Zones tab</strong> (quick) or design your layout in
          the <strong>Floor Plan tab</strong> (visual)</li>
        <li>Configure each rack's shelf count, positions per shelf, and bin size</li>
        <li>Print barcode labels and stick them on your physical shelves</li>
        <li>Create a purchase order in{' '}
          <a href="/receiving" className="text-brand-600 underline underline-offset-2">Receiving</a>{' '}
          and mark it as Ordered</li>
        <li>When the shipment arrives, click <strong>Receive</strong> &mdash; enter
          quantities and select a bin for each item</li>
        <li>Stock is now linked to physical bin locations &mdash; view contents from the
          grid or edit panel</li>
        <li>Use the <strong>transfer</strong> feature to reorganize stock between bins as needed</li>
      </ol>

      <div className="doc-callout">
        <p>
          <strong>Two ways to set up:</strong> The Zones tab and Floor Plan tab show the{' '}
          <strong>same data</strong>. Creating a rack from either tab creates a Zone + Rack + Bins
          in one step. Use whichever interface suits your preference &mdash; they stay perfectly
          in sync.
        </p>
      </div>

      <h2>Module Pages</h2>
      <p>
        The warehouse section includes six documentation pages covering every aspect:
      </p>
      <div className="doc-card-grid">
        <a href="/warehouse/zones" className="doc-card group no-underline">
          <h4 className="group-hover:text-brand-600 transition-colors">Zones &amp; Racks &rarr;</h4>
          <p>Zone types, rack types (shelving vs. pallet), creating and editing racks, bulk location generator</p>
        </a>
        <a href="/warehouse/floor-plan" className="doc-card group no-underline">
          <h4 className="group-hover:text-brand-600 transition-colors">Floor Plan &rarr;</h4>
          <p>2D visual editor, element types, drag-and-drop placement, sizing, rotation, and syncing</p>
        </a>
        <a href="/warehouse/bins" className="doc-card group no-underline">
          <h4 className="group-hover:text-brand-600 transition-colors">Bins &amp; Stock &rarr;</h4>
          <p>Bin sizing, stock assignment, transfers, grid vs. list views, editing bins</p>
        </a>
        <a href="/warehouse/labels" className="doc-card group no-underline">
          <h4 className="group-hover:text-brand-600 transition-colors">Labels &rarr;</h4>
          <p>PDF label generation, Zebra thermal printing, barcode types, label settings</p>
        </a>
        <a href="/cycle-counts" className="doc-card group no-underline">
          <h4 className="group-hover:text-brand-600 transition-colors">Cycle Counts &rarr;</h4>
          <p>Inventory verification, blind counting, variance management, reconciliation</p>
        </a>
      </div>
    </article>
  );
}
