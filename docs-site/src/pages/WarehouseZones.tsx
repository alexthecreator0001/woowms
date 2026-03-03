export default function WarehouseZones() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Zones & Racks</h1>
      <p className="text-lg text-surface-400 mb-8">
        Add storage racks and organize your warehouse into typed zones.
      </p>

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
        Best when you want a 2D visual representation. See the{' '}
        <a href="/warehouse/floor-plan" className="text-brand-600 underline underline-offset-2">Floor Plan</a>{' '}
        docs for full details.
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
    </article>
  );
}
