export default function Warehouse() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Warehouse</h1>
      <p className="text-lg text-surface-400 mb-8">
        Organize your physical space with zones, aisles, racks, and bin locations.
      </p>

      <h2>Hierarchy</h2>
      <p>
        PickNPack follows a standard WMS location hierarchy:
      </p>
      <pre><code>Warehouse &rarr; Zone &rarr; Aisle &rarr; Rack &rarr; Shelf &rarr; Position</code></pre>
      <p>
        Locations use the naming format <code>A-01-03-02</code> which reads as:
        Aisle A, Rack 01, Shelf 03, Position 02.
      </p>

      <h2>Three-Level Navigation</h2>
      <p>
        The warehouse module uses a drill-down architecture:
      </p>
      <ul>
        <li>
          <strong>Warehouse Overview</strong> — Dashboard showing all warehouses with stat cards
          (total locations, occupied, empty, utilization %) and warehouse summary cards in a grid
        </li>
        <li>
          <strong>Warehouse Detail</strong> — Per-warehouse view with all zones, utilization bars
          colored by zone type, and zone filter pills
        </li>
        <li>
          <strong>Zone Detail</strong> — Per-zone view with individual bin locations, search,
          aisle/status filters, grid/list toggle, and collapsible aisle sections
        </li>
      </ul>

      <h2>Zone Types</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Color</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Storage</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span> Blue</td>
            <td>Main area where products live on shelves</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Picking</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-violet-500 mr-1"></span> Violet</td>
            <td>Forward-pick area for high-velocity items</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Receiving</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span> Amber</td>
            <td>Inbound dock where shipments arrive</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Packing</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1"></span> Orange</td>
            <td>Stations for packing orders into boxes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shipping</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-1"></span> Emerald</td>
            <td>Outbound dock staging area</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Returns</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span> Red</td>
            <td>Processing area for returned items</td>
          </tr>
        </tbody>
      </table>

      <h2>Location Generator</h2>
      <p>
        The location generator wizard creates locations in bulk. Configure:
      </p>
      <ul>
        <li><strong>Aisles</strong> — Number of aisles and naming style (letters or numbers)</li>
        <li><strong>Racks per aisle</strong> — How many rack units per aisle</li>
        <li><strong>Shelf levels</strong> — Shelves per rack (numbered from floor up)</li>
        <li><strong>Positions per shelf</strong> — Individual positions across each shelf</li>
      </ul>
      <p>
        A live preview shows sample labels and the total location count before generating.
        Up to 2,000 locations can be created per batch.
      </p>

      <h2>Grid vs. List View</h2>
      <p>
        The Zone Detail page offers two views:
      </p>
      <ul>
        <li>
          <strong>Grid view</strong> — Visual rack visualization with collapsible aisle sections.
          Aisles show each rack as a vertical unit, shelved from floor to top.
        </li>
        <li>
          <strong>List view</strong> — Sortable data table with columns for label, aisle, shelf,
          position, stock, and status. Ideal for zones with 500+ locations.
        </li>
      </ul>

      <h2>Print Labels</h2>
      <p>
        Generate PDF labels for your location bins in three sizes:
      </p>
      <ul>
        <li><strong>Small</strong> (30 per page) — For shelf edge labels</li>
        <li><strong>Medium</strong> (10 per page) — For rack labels</li>
        <li><strong>Large</strong> (6 per page) — For aisle signs</li>
      </ul>
      <p>
        Select individual locations or check all, then click Print Labels. Each label shows
        the location code in bold with zone and warehouse name.
      </p>

      <h2>Editing & Deleting</h2>
      <p>
        Warehouses, zones, and bins can be edited using slide-over panels (right-anchored).
        Deletion is blocked if a bin has stock — move or adjust stock first, then delete.
      </p>
    </article>
  );
}
