export default function Warehouse() {
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

      {/* ─── HIERARCHY ─── */}
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

      {/* ─── NAVIGATION ─── */}
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

      {/* ─── CREATING A WAREHOUSE ─── */}
      <h2>Creating a Warehouse</h2>
      <p>
        Go to{' '}
        <a href="/warehouse" className="text-brand-600 underline underline-offset-2">/warehouse</a>{' '}
        and click <strong>Add Warehouse</strong>. Enter a name (e.g., "Main Warehouse") and
        optionally an address. The warehouse is created immediately and you can start adding
        zones or building a floor plan.
      </p>

      {/* ─── TWO WAYS TO ADD RACKS ─── */}
      <h2>Adding Racks &amp; Zones</h2>
      <p>
        There are two ways to set up your warehouse. Both create the same underlying data
        (zones + bins), they're just different interfaces:
      </p>

      <h3>Option A: Zones Tab (Quick Setup)</h3>
      <p>
        Best for getting started fast when you don't need a visual layout.
      </p>
      <ul>
        <li>Click the <strong>Zones</strong> tab on your warehouse, then <strong>Add Element</strong></li>
        <li>Choose a rack type: <strong>Shelving Rack</strong>, <strong>Pallet Rack</strong>, or{' '}
          <strong>Pallet Storage</strong></li>
        <li>Configure the label, prefix, shelf count, positions per shelf, and bin size</li>
        <li>Click <strong>Create</strong> &mdash; the zone is created with all bin locations generated instantly</li>
      </ul>
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
        Best when you want a 2D visual representation of your warehouse.
      </p>
      <ul>
        <li>Click the <strong>Floor Plan</strong> tab. If no floor plan exists, set your unit
          system (<strong>ft</strong> or <strong>m</strong>), width, and height, then click{' '}
          <strong>Create Floor Plan</strong></li>
        <li>Select an element from the left palette (Shelving Rack, Pallet Rack, Packing Table,
          Dock Door, etc.) and click on the grid to place it</li>
        <li>Click a placed element to select it. The right panel shows its properties: label,
          size, rotation, and storage setup (shelves + positions)</li>
        <li>Click <strong>Save</strong> &mdash; zones are automatically created for all unlinked
          elements, and bins are generated based on the storage setup</li>
      </ul>
      <p>
        Elements can be dragged to reposition, resized (with decimal precision, e.g.,{' '}
        <code>12.5 ft</code>), rotated, or duplicated (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>D</kbd>).
        Overlap is prevented automatically. The editor supports undo (up to 20 steps).
      </p>

      <h3>Two Views, One Data Model</h3>
      <p>
        The Zones tab and Floor Plan tab show the <strong>same data</strong>. Creating a rack
        from either tab creates it in both. Zone cards in the list view show the linked element
        name and type. Floor plan elements show their zone's bin count and utilization.
      </p>
      <ul>
        <li>
          <strong>Zone &rarr; Floor Plan:</strong> Click the floor plan button on any zone card
          to switch to the Floor Plan tab with that element selected
        </li>
        <li>
          <strong>Floor Plan &rarr; Zone:</strong> Click the "View" link in the element properties
          panel to switch to the Zones tab filtered to that zone's type
        </li>
      </ul>

      {/* ─── ELEMENT TYPES ─── */}
      <h2>Element Types</h2>
      <p>
        The floor plan supports 8 placeable element types plus walls:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Element</th>
            <th>Size</th>
            <th>Zone Type</th>
            <th>Has Bins</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Shelving Rack</td>
            <td>1&times;4</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>Storage</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pallet Rack</td>
            <td>2&times;3</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>Storage</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pallet Storage</td>
            <td>2&times;2</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>Storage</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Packing Table</td>
            <td>2&times;2</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></span>Packing</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Receiving Area</td>
            <td>3&times;3</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>Receiving</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shipping Area</td>
            <td>3&times;3</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>Shipping</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Dock Door</td>
            <td>3&times;1</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>Receiving</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Staging Area</td>
            <td>2&times;3</td>
            <td><span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500 mr-1.5"></span>Picking</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Wall</td>
            <td>1&times;1</td>
            <td>&mdash;</td>
            <td>No</td>
          </tr>
        </tbody>
      </table>
      <p>
        Open space on the grid naturally represents walkways and aisles &mdash; there is no
        dedicated aisle element.
      </p>

      {/* ─── ZONE TYPES ─── */}
      <h2>Zone Types</h2>
      <p>
        Each zone has a type that determines its color throughout the interface &mdash; on the
        floor plan, zone cards, grid view, and printed labels:
      </p>
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
            <td>Main area where products live on shelves. Most of your bins will be here.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Picking</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-violet-500 mr-1"></span> Violet</td>
            <td>Forward-pick area for high-velocity items, close to packing stations.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Receiving</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span> Amber</td>
            <td>Inbound dock where shipments arrive. PO items can be received into these bins.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Packing</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1"></span> Orange</td>
            <td>Stations for packing orders into shipping boxes.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Shipping</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-1"></span> Emerald</td>
            <td>Outbound dock staging area for packed orders awaiting carrier pickup.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Returns</td>
            <td><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span> Red</td>
            <td>Processing area for returned items. Inspect, restock, or dispose.</td>
          </tr>
        </tbody>
      </table>

      {/* ─── LOCATION GENERATOR ─── */}
      <h2>Bulk Location Generator</h2>
      <p>
        For warehouses with many aisles and racks, the <strong>Generate Locations</strong> wizard
        creates hundreds of bin locations in one click. Open it from any zone detail page.
      </p>
      <p>
        Configure:
      </p>
      <ul>
        <li><strong>Aisles</strong> &mdash; Number of parallel rows (1&ndash;26) with naming
          style: letters (A, B, C) or numbers (01, 02, 03)</li>
        <li><strong>Racks per aisle</strong> &mdash; How many shelving units along each aisle (1&ndash;99)</li>
        <li><strong>Shelf levels per rack</strong> &mdash; Vertical levels on each rack, counted
          from floor up (1&ndash;20)</li>
        <li><strong>Positions per shelf</strong> &mdash; Individual bin slots across each
          shelf, numbered left to right (1&ndash;20)</li>
        <li><strong>Location size</strong> &mdash; Bin size category for all generated locations
          (Small, Medium, Large, or X-Large)</li>
      </ul>
      <p>
        A live <strong>rack preview</strong> shows what the first rack will look like with sample
        labels. A summary at the bottom shows the total count, first and last label, and warns
        if you exceed the 2,000 location limit per batch.
      </p>

      {/* ─── BIN SIZING ─── */}
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

      {/* ─── PRODUCT SIZE ─── */}
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

      {/* ─── STOCK TO BIN ─── */}
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

      {/* ─── GRID VS LIST ─── */}
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

      {/* ─── EDITING A BIN ─── */}
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

      {/* ─── EDITING RACKS ─── */}
      <h2>Editing Racks</h2>
      <p>
        Click on a zone card (or a floor plan element) to edit its rack configuration:
      </p>
      <ul>
        <li><strong>Name</strong> &mdash; The display label for this rack/zone</li>
        <li><strong>Shelves</strong> &mdash; Number of vertical levels (1&ndash;20), counted floor to top</li>
        <li><strong>Positions per shelf</strong> &mdash; Number of horizontal slots (1&ndash;20), left to right</li>
        <li><strong>Bin size</strong> &mdash; Default size for all bins in this rack</li>
      </ul>
      <p>
        If you change the shelf or position count and no bins have stock, the system will
        automatically <strong>delete the old bins and regenerate new ones</strong> matching the
        updated configuration. An amber warning appears when the numbers differ from existing
        locations.
      </p>

      {/* ─── PRINT LABELS ─── */}
      <h2>Print Labels</h2>
      <p>
        Generate professional PDF labels with <strong>Code 128 barcodes</strong>, zone-type
        color stripes, and clear location information. Open the print modal from any zone detail
        page, or use <strong>Print All Labels</strong> in the warehouse header for all zones.
      </p>

      <h3>Label Sizes</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Size</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800" rowSpan={2}>Direct Print (Zebra)</td>
            <td>4&times;6"</td>
            <td>Standard shipping-size label with large barcode and full location details.
              1 label per page on 4&times;6" thermal paper.</td>
          </tr>
          <tr>
            <td>2&times;1"</td>
            <td>Compact shelf label with barcode and location code. 1 label per page on
              2&times;1" thermal paper.</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800" rowSpan={3}>Sheet Labels (Letter)</td>
            <td>Small</td>
            <td>30 per page &mdash; for shelf edge labels</td>
          </tr>
          <tr>
            <td>Medium</td>
            <td>10 per page &mdash; for rack labels</td>
          </tr>
          <tr>
            <td>Large</td>
            <td>6 per page &mdash; for aisle signs</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each label includes a scannable barcode, the location code in large bold text, zone and
        warehouse name, and a human-readable breakdown (e.g., "Row A &middot; Shelf 01 &middot; Pos 03").
        A color stripe on the left edge matches the zone type color for quick visual identification.
      </p>

      {/* ─── CUSTOM PREFIX ─── */}
      <h2>Custom Location Prefix</h2>
      <p>
        When creating or editing an element, you can set a custom <strong>prefix</strong> that
        determines how location codes are generated. The prefix replaces the default aisle
        letter in the label format.
      </p>
      <ul>
        <li>Maximum 5 characters, auto-uppercased</li>
        <li>Default: first 3 alphanumeric characters of the element label (e.g., "Shelving Rack" &rarr; <code>SHE</code>)</li>
        <li>Example: prefix <code>RACK</code> produces <code>RACK-01-01</code>, <code>RACK-01-02</code></li>
      </ul>
      <p>
        A live preview in the modal shows what location codes will look like as you type.
      </p>

      {/* ─── FLOOR PLAN DETAILS ─── */}
      <h2>Floor Plan Builder</h2>
      <p>
        The Floor Plan tab provides a 2D visual editor for designing your warehouse layout.
      </p>

      <h3>Getting Started</h3>
      <ul>
        <li>Navigate to a warehouse and click the <strong>Floor Plan</strong> tab</li>
        <li>If no floor plan exists, choose <strong>ft</strong> or <strong>m</strong>, set
          width and height, and click <strong>Create Floor Plan</strong></li>
        <li>The sidebar auto-collapses when you open the Floor Plan tab to give maximum
          editing space</li>
      </ul>

      <h3>Placing Elements</h3>
      <ul>
        <li>Select an element from the left palette, then click anywhere on the grid to place it</li>
        <li>Click a placed element to select it &mdash; the right panel shows its properties</li>
        <li>Drag elements to reposition (snaps to 0.1-unit precision)</li>
        <li>Use <strong>Duplicate</strong> (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>D</kbd>) to
          copy the selected element</li>
        <li>Overlap is prevented automatically</li>
        <li>The editor supports undo (up to 20 steps)</li>
      </ul>

      <h3>Storage Setup</h3>
      <p>
        In the element properties panel, the <strong>Storage Setup</strong> section lets you
        configure how many shelves and positions the element should have:
      </p>
      <ul>
        <li><strong>Shelves</strong> &mdash; Vertical levels, numbered from floor up</li>
        <li><strong>Positions per shelf</strong> &mdash; Horizontal slots, numbered left to right</li>
        <li><strong>Bin size</strong> &mdash; Default capacity for all locations in this element</li>
      </ul>
      <p>
        The summary shows the total location count. When you click <strong>Save</strong>, zones
        and bins are created automatically for any elements that don't have them yet.
      </p>

      <h3>Scale Legend</h3>
      <p>
        A scale legend in the bottom-left corner of the grid shows what one square represents
        (e.g., "= 1 m" or "= 1 ft"), so you can design to real-world dimensions.
      </p>

      {/* ─── SEARCH & FILTER ─── */}
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

      {/* ─── EDITING & DELETING ─── */}
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

      {/* ─── TYPICAL WORKFLOW ─── */}
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
