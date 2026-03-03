export default function WarehouseOverview() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Warehouse</h1>
      <p className="text-lg text-surface-400 mb-8">
        Design your physical warehouse layout, generate bin locations, manage stock placement,
        and print labels &mdash; all from a visual interface.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Quick start:</strong> Go to{' '}
          <a href="/warehouse" className="text-brand-600 underline underline-offset-2">Warehouse</a>{' '}
          in the app, create a warehouse, then either use the <strong>Zones tab</strong> to add
          racks with one click, or use the <strong>Floor Plan tab</strong> to visually place
          elements on a 2D grid. Both create the same data &mdash; just two views.
        </p>
      </div>

      <h2>Location Hierarchy</h2>
      <p>
        PickNPack follows the standard warehouse management hierarchy used by systems like
        ShipHero and ShipBob:
      </p>
      <pre><code>Warehouse &rarr; Zone &rarr; Aisle &rarr; Rack &rarr; Shelf &rarr; Position (Bin)</code></pre>
      <p>
        Each physical location where a product can be stored is called a <strong>bin</strong> (or
        location). Bins are identified by a label like <code>A-01-03-02</code>, which reads as:
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
            <td className="font-medium text-surface-800">Aisle</td>
            <td><code>A</code></td>
            <td>The parallel row in your warehouse (A, B, C or 01, 02, 03)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Rack</td>
            <td><code>01</code></td>
            <td>Which shelving unit along the aisle</td>
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
        You can also set a <strong>custom prefix</strong> (up to 5 characters) to replace the
        aisle letter. For example, a rack named "Main Shelves" with prefix <code>MSH</code> would
        generate locations like <code>MSH-01-01</code>, <code>MSH-01-02</code>, etc.
      </p>

      <h2>Three-Level Navigation</h2>
      <p>
        The warehouse module uses a drill-down architecture. Each level links to the next:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>URL</th>
            <th>What You See</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Warehouse Overview</td>
            <td><code>/warehouse</code></td>
            <td>Dashboard with stat cards (total locations, occupied, empty, utilization %) and
              warehouse summary cards. Click a warehouse to drill in.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Warehouse Detail</td>
            <td><code>/warehouse/:id</code></td>
            <td>Two tabs: <strong>Zones</strong> (list of all zones with utilization bars) and{' '}
              <strong>Floor Plan</strong> (2D visual editor). Click a zone to drill in.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Zone Detail</td>
            <td><code>/warehouse/:id/zones/:zoneId</code></td>
            <td>Individual bin locations shown as a visual rack grid or sortable data table.
              Click any bin to edit it.</td>
          </tr>
        </tbody>
      </table>

      <h2>Creating a Warehouse</h2>
      <p>
        Go to{' '}
        <a href="/warehouse" className="text-brand-600 underline underline-offset-2">/warehouse</a>{' '}
        and click <strong>Add Warehouse</strong>. Enter a name (e.g., "Main Warehouse") and
        optionally an address. The warehouse is created immediately and you can start adding
        zones or building a floor plan.
      </p>

      <h2>Typical Workflow</h2>
      <p>
        Here's how most warehouses get set up end-to-end:
      </p>
      <ol className="text-surface-600 leading-relaxed mb-4 pl-5 space-y-1.5" style={{ listStyleType: 'decimal' }}>
        <li>Go to{' '}
          <a href="/warehouse" className="text-brand-600 underline underline-offset-2">/warehouse</a>{' '}
          and create a warehouse</li>
        <li>Add racks from the Zones tab (quick) or design your layout in the Floor Plan tab (visual)</li>
        <li>Configure each rack's shelf count, positions per shelf, and bin size</li>
        <li>Print labels and stick them on your physical shelves</li>
        <li>Create a purchase order in{' '}
          <a href="/receiving" className="text-brand-600 underline underline-offset-2">Receiving</a>{' '}
          and mark it as Ordered</li>
        <li>When the shipment arrives, click Receive &mdash; enter quantities and select a bin for
          each item</li>
        <li>Stock is now linked to physical bin locations. View bin contents from the grid or
          edit panel.</li>
        <li>Use the transfer feature to reorganize stock between bins as needed</li>
      </ol>
    </article>
  );
}
