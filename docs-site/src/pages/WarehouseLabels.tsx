export default function WarehouseLabels() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Print Labels</h1>
      <p className="text-lg text-surface-400 mb-8">
        Generate professional PDF labels with Code 128 barcodes for your bin locations.
        Supports Zebra thermal printers and standard letter-size paper.
      </p>

      <h2>Overview</h2>
      <p>
        Every bin location can have a physical label with a scannable barcode. Labels are
        generated as PDF files that you can print on thermal label printers (like Zebra) or
        standard inkjet/laser printers on letter-size paper.
      </p>
      <p>
        Access the label printer from two places:
      </p>
      <ul>
        <li><strong>Zone detail page</strong> &mdash; Print labels for a single zone's bins</li>
        <li><strong>Warehouse header</strong> &mdash; <strong>Print All Labels</strong> button
          to generate labels for every bin in the warehouse at once</li>
      </ul>

      <h2>Label Sizes</h2>
      <p>
        Five size options across two categories:
      </p>

      <h3>Direct Print (Thermal / Zebra)</h3>
      <p>
        For dedicated label printers. One label per page on thermal paper rolls:
      </p>
      <div className="doc-card-grid">
        <div className="doc-card">
          <h4>4&times;6" Label</h4>
          <p>Standard shipping-size label with large barcode and full location details.
            Most readable from a distance. Ideal for aisle signs and pallet positions.</p>
        </div>
        <div className="doc-card">
          <h4>2&times;1" Label</h4>
          <p>Compact shelf label with barcode and location code. Fits on shelf edges.
            Best for high-density shelving racks.</p>
        </div>
      </div>

      <h3>Sheet Labels (Letter Paper)</h3>
      <p>
        For standard printers. Multiple labels per US Letter (8.5&times;11") sheet:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Size</th>
            <th>Per Page</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Small</td>
            <td>30 per page</td>
            <td>Shelf edge labels &mdash; compact, barcode + code only</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Medium</td>
            <td>10 per page</td>
            <td>Rack labels &mdash; barcode + location breakdown</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Large</td>
            <td>6 per page</td>
            <td>Aisle signs &mdash; large text, readable from several feet away</td>
          </tr>
        </tbody>
      </table>

      <h2>What's on Each Label</h2>
      <p>
        Every label includes:
      </p>
      <ul>
        <li>A scannable <strong>Code 128 barcode</strong> &mdash; compatible with all standard
          barcode scanners</li>
        <li>The <strong>location code</strong> in large bold text (e.g., <code>SHE-01-03</code>)</li>
        <li><strong>Zone and warehouse name</strong> for context</li>
        <li>A <strong>human-readable breakdown</strong> (e.g., "Shelf 01 &middot; Pos 03")</li>
        <li>A <strong>color stripe</strong> on the left edge matching the zone type color
          (blue for Storage, violet for Picking, etc.) for quick visual identification</li>
      </ul>

      <div className="doc-callout-emerald">
        <p>
          <strong>Pro tip:</strong> Print labels right after generating locations. Stick them
          on your physical shelves before receiving any stock &mdash; this makes the put-away
          process much faster since workers can scan or read the bin code directly.
        </p>
      </div>

      <h2>Label &amp; Bin Settings</h2>
      <p>
        Configure default label and bin behavior in{' '}
        <strong>Settings &rarr; Bins &amp; Labels</strong>. These settings are saved to your
        account and applied automatically whenever you print or create bins.
      </p>

      <h3>Label Printing Defaults</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Default label size</td>
            <td>Pre-selects your preferred size when opening the print dialog</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Show warehouse name</td>
            <td>Include or hide the warehouse name text on each label</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Show location breakdown</td>
            <td>Show or hide the parsed breakdown text (e.g., "Shelf 01 &middot; Pos 03")</td>
          </tr>
        </tbody>
      </table>

      <h3>Default Bin Properties</h3>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Options</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Default size</td>
            <td>Small (25), Medium (50), Large (100), X-Large (200)</td>
            <td>Applied to all newly created bins</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pickable</td>
            <td>On / Off</td>
            <td>Whether new bins are available for order picking by default</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Sellable</td>
            <td>On / Off</td>
            <td>Whether stock in new bins counts toward available inventory</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-callout">
        <p>
          <strong>Note:</strong> These are global defaults. You can override the label size
          each time you print, and you can edit individual bin properties after creation.
        </p>
      </div>
    </article>
  );
}
