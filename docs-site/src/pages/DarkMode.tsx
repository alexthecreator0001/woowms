export default function DarkMode() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Dark Mode</h1>
      <p className="text-lg text-surface-400 mb-8">
        Switch between light, dark, and system themes.
      </p>

      <h2>Overview</h2>
      <p>
        PickNPack supports three theme modes: <strong>Light</strong>, <strong>Dark</strong>, and{' '}
        <strong>System</strong>. Your preference is saved in your browser and persists across sessions.
      </p>

      <h2>How to Switch</h2>
      <p>There are two ways to change the theme:</p>
      <ul>
        <li>
          <strong>Sidebar footer</strong> — Click the theme toggle button (Sun, Moon, or Monitor icon)
          at the bottom of the sidebar to cycle through Light → Dark → System.
        </li>
        <li>
          <strong>Settings → Appearance</strong> — Go to Settings, click "Appearance", and choose your
          preferred theme from the three radio cards.
        </li>
      </ul>

      <h2>Theme Modes</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Mode</th>
            <th>Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Light</td>
            <td>Classic light appearance with white backgrounds</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Dark</td>
            <td>Dark backgrounds with light text — easy on the eyes in low-light environments</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">System</td>
            <td>Automatically follows your operating system's dark mode setting. Changes in real-time when your OS switches.</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-callout">
        <p>
          <strong>Note:</strong> Dark mode is a per-browser setting stored in localStorage.
          Each browser and device can have its own theme preference.
        </p>
      </div>
    </article>
  );
}
