export default function WarehouseFloorPlan() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Floor Plan Builder</h1>
      <p className="text-lg text-surface-400 mb-8">
        Design your warehouse layout visually on a 2D grid with drag-and-drop elements.
      </p>

      <h2>Getting Started</h2>
      <ul>
        <li>Navigate to a warehouse and click the <strong>Floor Plan</strong> tab</li>
        <li>If no floor plan exists, choose <strong>ft</strong> or <strong>m</strong>, set
          width and height, and click <strong>Create Floor Plan</strong></li>
        <li>The sidebar auto-collapses when you open the Floor Plan tab to give maximum
          editing space</li>
      </ul>

      <h2>Placing Elements</h2>
      <ul>
        <li>Select an element from the left palette, then click anywhere on the grid to place it</li>
        <li>Click a placed element to select it &mdash; the right panel shows its properties</li>
        <li>Drag elements to reposition (snaps to 0.1-unit precision)</li>
        <li>Use <strong>Duplicate</strong> (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>D</kbd>) to
          copy the selected element</li>
        <li>Overlap is prevented automatically</li>
        <li>The editor supports undo (up to 20 steps)</li>
      </ul>

      <h2>Storage Setup</h2>
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

      <h2>Element Sizing &amp; Rotation</h2>
      <p>
        Elements can be resized with decimal precision (e.g., <code>12.5 ft</code>) and rotated
        to fit your layout. Each element type has a default footprint but can be adjusted:
      </p>
      <ul>
        <li>Click an element to select it, then edit the width and height in the properties panel</li>
        <li>Use the rotation control to rotate 90 degrees</li>
        <li>The grid snaps to 0.1-unit increments for precise placement</li>
      </ul>

      <h2>Scale Legend</h2>
      <p>
        A scale legend in the bottom-left corner of the grid shows what one square represents
        (e.g., "= 1 m" or "= 1 ft"), so you can design to real-world dimensions.
      </p>

      <h2>Syncing with Zones</h2>
      <p>
        The Floor Plan and Zones tab show the <strong>same data</strong>. When you save the floor
        plan, zones are automatically created for all unlinked elements, and bin locations are
        generated based on the storage setup. See{' '}
        <a href="/warehouse/zones" className="text-brand-600 underline underline-offset-2">Zones &amp; Racks</a>{' '}
        for more details on the two-view data model.
      </p>
    </article>
  );
}
