export default function MobileApp() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Mobile App</h1>
      <p className="text-lg text-surface-400 mb-8">
        Android picking app for warehouse staff — scan barcodes, pick items, and update orders from the floor.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Open source.</strong> The PickNPack mobile app is a standalone Android project that
          connects to your PickNPack backend API. Source code and full developer documentation live at{' '}
          <a
            href="https://github.com/alexthecreator0001/woowmsapp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 underline"
          >
            github.com/alexthecreator0001/woowmsapp
          </a>.
        </p>
      </div>

      <h2>What the App Does</h2>
      <p>
        The mobile app is purpose-built for warehouse pickers. It replaces paper pick sheets with a
        real-time digital workflow on an Android device. Pickers see their assigned pick lists, navigate
        to bin locations, scan product barcodes to confirm picks, and mark items as picked — all syncing
        instantly with the PickNPack backend.
      </p>

      <h2>Core Features</h2>
      <ul>
        <li><strong>Pick list queue</strong> — View all pending and in-progress pick lists assigned to you</li>
        <li><strong>Guided picking</strong> — Items sorted by bin location for efficient warehouse walks</li>
        <li><strong>Barcode scanning</strong> — Camera-based barcode scanner to verify the correct product</li>
        <li><strong>Quantity confirmation</strong> — Tap to confirm picked quantities, partial picks supported</li>
        <li><strong>Real-time sync</strong> — Every pick action updates the server immediately</li>
        <li><strong>Progress tracking</strong> — Visual progress bars per pick list</li>
        <li><strong>Offline queue</strong> — Pick actions cached locally when offline, synced on reconnect</li>
        <li><strong>Multi-tenant</strong> — Automatically scoped to your organization via JWT auth</li>
      </ul>

      <h2>Screens</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Screen</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">Login</td>
            <td>Email + password authentication against PickNPack API</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pick Queue</td>
            <td>List of PENDING and IN_PROGRESS pick lists with order reference, item count, and progress</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pick List Detail</td>
            <td>All items in a pick list — shows bin location, SKU, product name, quantity, and pick status</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Barcode Scanner</td>
            <td>Camera-based scanner that matches scanned barcode to the current pick list item</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">Pick Summary</td>
            <td>Completion screen showing what was picked, with option to move to next pick list</td>
          </tr>
        </tbody>
      </table>

      <h2>API Endpoints Used</h2>
      <p>The app communicates with three main endpoints on the PickNPack backend:</p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">POST</td>
            <td><code>/api/v1/auth/login</code></td>
            <td>Authenticate and receive JWT token</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">GET</td>
            <td><code>/api/v1/picking</code></td>
            <td>Fetch pick lists (filterable by status)</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">PATCH</td>
            <td><code>/api/v1/picking/:id/pick-item</code></td>
            <td>Mark an item as picked with quantity</td>
          </tr>
        </tbody>
      </table>

      <h2>Picking Workflow</h2>
      <p>The picking flow on the mobile app follows these steps:</p>
      <ul>
        <li><strong>1. Login</strong> — Picker enters email and password. App stores the JWT token.</li>
        <li><strong>2. View queue</strong> — App fetches pick lists with status PENDING or IN_PROGRESS.</li>
        <li><strong>3. Start picking</strong> — Picker taps a pick list to see all items sorted by bin location.</li>
        <li><strong>4. Navigate to bin</strong> — Each item shows the bin label (e.g. <code>A-01-03-02</code>) so the picker knows where to go.</li>
        <li><strong>5. Scan or confirm</strong> — Picker scans the product barcode to verify, or manually taps to confirm.</li>
        <li><strong>6. Record pick</strong> — App sends <code>PATCH /picking/:id/pick-item</code> with the item ID and picked quantity.</li>
        <li><strong>7. Auto-complete</strong> — When all items are picked, the backend auto-completes the pick list and moves the order to PICKED status.</li>
      </ul>

      <h2>Authentication</h2>
      <p>
        The app uses the same JWT authentication as the web dashboard. After login, the token is stored
        in the device's secure storage and attached to every API request as a <code>Bearer</code> token
        in the <code>Authorization</code> header.
      </p>
      <p>
        Pickers need at least the <strong>PICKER</strong> role to access picking endpoints. Roles are managed
        in the PickNPack web dashboard under Settings → Team.
      </p>

      <h2>Pick List Statuses</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-surface-800">PENDING</td>
            <td>Created from an order, waiting for a picker to start</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">IN_PROGRESS</td>
            <td>A picker is actively collecting items</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">COMPLETED</td>
            <td>All items picked — order moves to PICKED status</td>
          </tr>
          <tr>
            <td className="font-medium text-surface-800">CANCELLED</td>
            <td>Pick list was cancelled by a manager</td>
          </tr>
        </tbody>
      </table>

      <h2>Tech Stack</h2>
      <ul>
        <li><strong>Kotlin</strong> — Primary language</li>
        <li><strong>Jetpack Compose</strong> — Modern declarative UI toolkit</li>
        <li><strong>Material 3</strong> — Google's latest design system</li>
        <li><strong>Retrofit + OkHttp</strong> — HTTP client for API communication</li>
        <li><strong>ML Kit Barcode Scanning</strong> — Camera-based barcode reading</li>
        <li><strong>DataStore</strong> — Encrypted token storage</li>
        <li><strong>Hilt</strong> — Dependency injection</li>
        <li><strong>Kotlin Coroutines + Flow</strong> — Async operations and reactive data</li>
      </ul>

      <h2>Developer Setup</h2>
      <p>
        See the full setup guide in the{' '}
        <a
          href="https://github.com/alexthecreator0001/woowmsapp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 underline"
        >
          GitHub repository
        </a>. Requirements:
      </p>
      <ul>
        <li>Android Studio Hedgehog (2023.1.1) or newer</li>
        <li>JDK 17</li>
        <li>Android SDK 34 (min SDK 26 / Android 8.0)</li>
        <li>A running PickNPack backend instance</li>
      </ul>

      <div className="mt-10 flex items-center gap-3 p-5 rounded-xl bg-surface-50 border border-surface-100">
        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-surface-800 text-sm mb-0.5">Multi-picker support</p>
          <p className="text-sm text-surface-500 mb-0">
            Multiple pickers can work simultaneously on different pick lists. The backend handles
            concurrency and prevents double-picking through tenant-scoped locking.
          </p>
        </div>
      </div>
    </article>
  );
}
