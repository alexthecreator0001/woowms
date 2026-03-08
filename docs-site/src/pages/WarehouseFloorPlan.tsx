export default function WarehouseFloorPlan() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Floor Plan Builder</h1>
      <p className="text-lg text-surface-400 mb-8">
        Design your warehouse layout visually on a to-scale 2D grid. Drag and drop racks,
        packing tables, dock doors, and more — then save to auto-generate zones and bin locations.
      </p>

      <h2>Getting Started</h2>
      <ol>
        <li>Navigate to a warehouse and click the <strong>Floor Plan</strong> tab</li>
        <li>If no floor plan exists, choose your unit system (<strong>ft</strong> or{' '}
          <strong>m</strong>), set the width and height, and click{' '}
          <strong>Create Floor Plan</strong></li>
        <li>The app sidebar auto-collapses when you open the Floor Plan tab to give maximum
          editing space</li>
      </ol>
      <div className="doc-callout">
        <p>
          <strong>Real-world dimensions:</strong> The grid represents your actual warehouse
          floor. One grid cell equals one unit (foot or meter). A scale legend in the
          bottom-left corner confirms what one cell represents.
        </p>
      </div>

      <h2>Placing Elements</h2>
      <p>
        The left palette shows all available element types. Click one to select it, then
        click anywhere on the grid to place it:
      </p>
      <ul>
        <li>Select an element type from the left palette</li>
        <li>Click on the grid to place it &mdash; the element snaps to position</li>
        <li>Click a placed element to select it &mdash; the right panel shows its properties</li>
        <li>Drag elements to reposition (snaps to 0.1-unit precision for fine placement)</li>
        <li>Overlap is prevented automatically &mdash; the editor won't let you stack elements</li>
      </ul>

      <h3>Keyboard Shortcuts</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Shortcut</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Duplicate element</td>
            <td><kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Ctrl</kbd> / <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">D</kbd></td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Delete element</td>
            <td><kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Delete</kbd> / <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Backspace</kbd></td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Undo</td>
            <td><kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Ctrl</kbd> / <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Z</kbd></td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Deselect</td>
            <td><kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-xs font-mono">Esc</kbd></td>
          </tr>
        </tbody>
      </table>
      <p>
        The editor supports up to 20 undo steps, so you can freely experiment with placement.
      </p>

      <h2>Element Properties Panel</h2>
      <p>
        Click any placed element to open the properties panel on the right side. The panel
        shows two sections:
      </p>

      <h3>Position &amp; Size</h3>
      <ul>
        <li><strong>Width &amp; Height</strong> &mdash; Resize the element with decimal precision
          (e.g., <code>12.5 ft</code>). Each type has a default footprint but can be adjusted.</li>
        <li><strong>Rotation</strong> &mdash; Rotate 90&deg; to fit your layout. Useful for
          placing racks along different walls.</li>
        <li><strong>X &amp; Y position</strong> &mdash; Fine-tune placement numerically instead
          of dragging.</li>
      </ul>

      <h3>Storage Setup</h3>
      <p>
        Configure how many shelves and positions the element should have. This determines
        the number of bin locations generated:
      </p>
      <ul>
        <li><strong>Shelves</strong> &mdash; Vertical levels, numbered from floor up (1&ndash;20)</li>
        <li><strong>Positions per shelf</strong> &mdash; Horizontal slots, numbered left to right (1&ndash;20)</li>
        <li><strong>Bin size</strong> &mdash; Default capacity for all locations in this element
          (Small, Medium, Large, X-Large)</li>
        <li><strong>Custom prefix</strong> &mdash; Up to 5 characters for location code generation</li>
      </ul>
      <p>
        The summary shows the total location count. For example, 5 shelves &times; 4 positions
        = 20 bins.
      </p>

      <h2>Saving &amp; Auto-Zone Creation</h2>
      <p>
        When you click <strong>Save</strong>, the system processes all elements:
      </p>
      <ol>
        <li>Elements without a zone get one created automatically (zone type is based on the
          element type)</li>
        <li>A rack is created inside the zone with the configured shelf/position setup</li>
        <li>Bin locations are generated based on the storage setup configuration</li>
        <li>Element positions and sizes are saved to the floor plan</li>
      </ol>
      <div className="doc-callout">
        <p>
          <strong>One step, full setup:</strong> Placing a Shelving Rack on the floor plan and
          clicking Save creates a Storage zone + Shelving rack + all bins in one operation.
          No separate zone or rack creation needed.
        </p>
      </div>

      <h2>Syncing with the Zones Tab</h2>
      <p>
        The Floor Plan and Zones tab show the <strong>same data</strong>. Changes on one
        tab are immediately visible on the other:
      </p>
      <ul>
        <li>
          <strong>Floor Plan &rarr; Zones:</strong> Click the "View" link in the element
          properties panel to jump to the Zones tab filtered to that element's zone type
        </li>
        <li>
          <strong>Zones &rarr; Floor Plan:</strong> Click the floor plan icon on any zone
          card to switch to the Floor Plan tab with that element selected and scrolled into view
        </li>
      </ul>

      <h2>Element Types Reference</h2>
      <p>
        Eight placeable element types plus walls:
      </p>
      <div className="doc-card-grid">
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h4 className="mb-0">Shelving Rack</h4>
          </div>
          <p>Standard pick-and-pack rack. Default 1&times;4 footprint. Storage zone. Most common element in typical warehouses.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h4 className="mb-0">Pallet Rack</h4>
          </div>
          <p>Heavy-duty racking for palletized goods. Default 2&times;3 footprint. Storage zone. Fewer, larger positions.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h4 className="mb-0">Pallet Storage</h4>
          </div>
          <p>Floor-level pallet area. Default 2&times;2 footprint. Storage zone. For overflow or bulk floor storage.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <h4 className="mb-0">Packing Table</h4>
          </div>
          <p>Workstation for packing orders. Default 2&times;2 footprint. Packing zone. Place near shipping area.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h4 className="mb-0">Receiving Area</h4>
          </div>
          <p>Inbound staging for shipments. Default 3&times;3 footprint. Receiving zone. Place near dock doors.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h4 className="mb-0">Shipping Area</h4>
          </div>
          <p>Outbound staging for packed orders. Default 3&times;3 footprint. Shipping zone. Near carrier pickup.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h4 className="mb-0">Dock Door</h4>
          </div>
          <p>Loading dock entrance. Default 3&times;1 footprint. Receiving zone. Place along exterior walls.</p>
        </div>
        <div className="doc-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
            <h4 className="mb-0">Staging Area</h4>
          </div>
          <p>Temporary holding for picked orders. Default 2&times;3 footprint. Picking zone. Between racks and packing.</p>
        </div>
      </div>
      <p>
        <strong>Walls</strong> (1&times;1) can be placed to outline your building boundaries.
        Open space on the grid naturally represents walkways and aisles.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>Start by placing walls to outline your building, then fill in racks and areas</li>
        <li>Use <strong>Duplicate</strong> (<kbd className="px-1 py-0.5 bg-surface-100 rounded text-xs font-mono">Cmd+D</kbd>)
          to quickly create rows of identical racks</li>
        <li>Leave 1&ndash;2 cell gaps between parallel racks to represent aisles</li>
        <li>Place packing tables between storage racks and the shipping area for efficient flow</li>
        <li>Dock doors should go along the exterior walls where trucks access your building</li>
      </ul>
    </article>
  );
}
