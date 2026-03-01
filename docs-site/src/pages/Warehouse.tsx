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

      <h2>Visual Floor Plan Builder</h2>
      <p>
        The <strong>Floor Plan</strong> tab on the Warehouse Detail page lets you design a 2D visual
        layout of your warehouse. Choose your unit system (feet or meters), set dimensions, then
        place elements on a grid. The sidebar auto-collapses when you open the Floor Plan tab to
        give you maximum editing space.
      </p>

      <h3>Unit System</h3>
      <p>
        When creating a new floor plan, use the <strong>ft / m</strong> toggle to select your
        preferred unit. The unit is displayed in the toolbar, property panel, and setup form.
        Dimensions support decimal values (e.g., <code>12.5 ft</code>) with 0.1 precision.
      </p>

      <h3>Placeable Elements</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Element</th>
            <th>Default Size</th>
            <th>Zone Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Shelving Rack</td>
            <td>1 &times; 4</td>
            <td>Storage</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pallet Rack</td>
            <td>2 &times; 3</td>
            <td>Storage</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Packing Table</td>
            <td>2 &times; 2</td>
            <td>Packing</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Receiving Area</td>
            <td>3 &times; 3</td>
            <td>Receiving</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shipping Area</td>
            <td>3 &times; 3</td>
            <td>Shipping</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Wall</td>
            <td>1 &times; 1</td>
            <td><em>None</em> (barrier)</td>
          </tr>
        </tbody>
      </table>
      <p>
        <em>Note:</em> The Aisle element has been removed — open space on the grid naturally
        represents walkways and aisles.
      </p>

      <h3>How to Use</h3>
      <ol>
        <li>Navigate to a warehouse and click the <strong>Floor Plan</strong> tab</li>
        <li>If no floor plan exists, choose <strong>ft</strong> or <strong>m</strong>, set width and height, then click <strong>Create Floor Plan</strong></li>
        <li>Select an element from the left palette, then click on the grid to place it</li>
        <li>Click a placed element to select it — the right panel shows its properties</li>
        <li>Edit the element label, resize (decimal values supported), rotate, or link it to an existing zone</li>
        <li>Use <strong>Duplicate</strong> (or <kbd>Ctrl/Cmd+D</kbd>) to copy the selected element</li>
        <li>Configure <strong>Storage Setup</strong> — set the number of shelves and positions per shelf (shown below the zone link section). The summary shows the total locations that will be created.</li>
        <li>Use <strong>Create Zone</strong> to auto-create a zone with bins matching your storage config</li>
        <li>Click <strong>Save</strong> to persist your floor plan</li>
      </ol>
      <p>
        Elements can be dragged to new positions on the grid with 0.1-unit snap precision.
        Overlap is prevented automatically. The editor includes undo support (up to 20 steps).
      </p>

      <h3>Cross-Tab Navigation</h3>
      <p>
        Floor plan elements and zones are connected bidirectionally:
      </p>
      <ul>
        <li>
          <strong>Zone → Floor Plan</strong> — on zone cards that are linked to a floor plan element,
          click the <strong>Floor Plan</strong> button to switch to the Floor Plan tab with the linked
          element automatically selected.
        </li>
        <li>
          <strong>Floor Plan → Zone</strong> — when viewing a linked element's properties, click
          the <strong>View</strong> link next to the zone stats to switch back to the Zones tab,
          filtered to the zone's type.
        </li>
      </ul>

      <h2>Editing & Deleting</h2>
      <p>
        Warehouses, zones, and bins can be edited using slide-over panels (right-anchored).
        Deletion is blocked if a bin has stock — move or adjust stock first, then delete.
      </p>
    </article>
  );
}
