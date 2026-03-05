export default function WarehouseLabels() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Print Labels</h1>
      <p className="text-lg text-surface-400 mb-8">
        Generate professional PDF labels with barcodes for your bin locations.
      </p>

      <h2>Overview</h2>
      <p>
        Generate professional PDF labels with <strong>Code 128 barcodes</strong>, zone-type
        color stripes, and clear location information. Open the print modal from any zone detail
        page, or use <strong>Print All Labels</strong> in the warehouse header for all zones.
      </p>

      <h2>Label Sizes</h2>
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

      <h2>Label Contents</h2>
      <p>
        Each label includes:
      </p>
      <ul>
        <li>A scannable <strong>Code 128 barcode</strong></li>
        <li>The location code in large bold text</li>
        <li>Zone and warehouse name</li>
        <li>A human-readable breakdown (e.g., "Row A &middot; Shelf 01 &middot; Pos 03")</li>
        <li>A color stripe on the left edge matching the zone type color for quick visual identification</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>Tip:</strong> Print labels right after generating locations. Stick them on
          your physical shelves before receiving any stock &mdash; this makes the put-away
          process much faster since workers can scan or read the bin code directly.
        </p>
      </div>

      <h2>Label &amp; Bin Settings</h2>
      <p>
        Configure default label and bin behavior in <strong>Settings &rarr; Bins &amp; Labels</strong>.
        These settings are remembered and applied automatically.
      </p>

      <h3>Label Printing Defaults</h3>
      <ul>
        <li><strong>Default label size</strong> &mdash; pre-selects your preferred size when opening the print dialog</li>
        <li><strong>Show warehouse name</strong> &mdash; include or hide the warehouse name on each label</li>
        <li><strong>Show location breakdown</strong> &mdash; show or hide the parsed breakdown text (e.g., "Aisle A &middot; Rack 01 &middot; Shelf 02 &middot; Pos 03")</li>
      </ul>

      <h3>Default Bin Properties</h3>
      <ul>
        <li><strong>Default size</strong> &mdash; Small (25), Medium (50), Large (100), or X-Large (200) capacity</li>
        <li><strong>Pickable</strong> &mdash; whether new bins are available for order picking by default</li>
        <li><strong>Sellable</strong> &mdash; whether stock in new bins counts toward available inventory by default</li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>Note:</strong> These are global defaults. You can override the label size each
          time you print, and you can edit individual bin properties after creation.
        </p>
      </div>
    </article>
  );
}
