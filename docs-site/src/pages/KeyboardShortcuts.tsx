export default function KeyboardShortcuts() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Keyboard Shortcuts</h1>
      <p className="text-lg text-surface-400 mb-8">
        Navigate the app without touching your mouse.
      </p>

      <h2>Overview</h2>
      <p>
        PickNPack supports keyboard shortcuts for fast navigation and common actions.
        Press <code>Shift + ?</code> from anywhere in the app to view all available shortcuts.
      </p>

      <h2>General</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800"><code>⌘ K</code> / <code>Ctrl K</code></td>
            <td>Open global search</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800"><code>Shift ?</code></td>
            <td>Show keyboard shortcuts help</td>
          </tr>
        </tbody>
      </table>

      <h2>Navigation (G then ...)</h2>
      <p>
        Press <code>G</code> and then a second key within 1 second to navigate to a page.
        This is a "chord" shortcut — two keys pressed in sequence.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Destination</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>D</code></td><td>Dashboard</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>O</code></td><td>Orders</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>I</code></td><td>Inventory</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>P</code></td><td>Purchase Orders</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>S</code></td><td>Suppliers</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>H</code></td><td>Shipping</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>W</code></td><td>Warehouse</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>K</code></td><td>Picking</td></tr>
          <tr><td className="font-medium text-surface-800"><code>G</code> then <code>X</code></td><td>Settings</td></tr>
        </tbody>
      </table>

      <div className="doc-callout">
        <p>
          <strong>Note:</strong> Keyboard shortcuts are automatically disabled when you are
          typing in an input field, textarea, or dropdown to avoid interfering with text entry.
        </p>
      </div>
    </article>
  );
}
