export default function GettingStarted() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Getting Started</h1>
      <p className="text-lg text-surface-400 mb-8">
        Set up PickNPack and connect your WooCommerce store in under 5 minutes.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Prerequisites:</strong> You need a WooCommerce store with REST API access enabled.
          Make sure you have admin access to generate API keys.
        </p>
      </div>

      <h2>1. Create Your Account</h2>
      <p>
        Visit <code>app.picknpack.io</code> and click <strong>Create Account</strong>. Enter your
        email, company name, and a secure password. You'll receive a verification email with a
        6-digit code to confirm your account.
      </p>

      <h2>2. Connect Your WooCommerce Store</h2>
      <p>
        After verifying your email, you'll be guided to connect your WooCommerce store. You'll need
        three things from your WooCommerce dashboard:
      </p>
      <ul>
        <li>
          <strong>Store URL</strong> — Your WooCommerce site address (e.g., <code>https://mystore.com</code>)
        </li>
        <li>
          <strong>Consumer Key</strong> — Generated from WooCommerce &rarr; Settings &rarr; REST API
        </li>
        <li>
          <strong>Consumer Secret</strong> — Generated alongside the consumer key
        </li>
      </ul>

      <h3>Generating API Keys in WooCommerce</h3>
      <p>
        In your WooCommerce admin panel, go to <strong>WooCommerce &rarr; Settings &rarr;
        Advanced &rarr; REST API</strong>. Click <strong>Add Key</strong>, give it a description
        like "PickNPack", set permissions to <strong>Read/Write</strong>, and click Generate.
        Copy both the Consumer Key and Consumer Secret.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Important:</strong> The Consumer Secret is only shown once. Save it somewhere safe
          before navigating away from the page.
        </p>
      </div>

      <h2>3. Initial Product Sync</h2>
      <p>
        Once connected, PickNPack automatically syncs your products. Simple products are imported
        directly. <strong>Variable products</strong> (e.g., a T-shirt with size/color options) are
        expanded into individual variations — each with its own SKU, price, and stock level.
      </p>
      <p>
        The initial sync runs immediately. After that, automatic sync checks for new changes every
        few minutes (configurable in Settings).
      </p>

      <h2>4. Configure Your Warehouse</h2>
      <p>
        Head to the <strong>Warehouse</strong> page to set up your physical layout. Create zones
        (Storage, Picking, Receiving, etc.) and use the location generator to create bin locations
        following the <code>Aisle-Rack-Shelf-Position</code> naming convention.
      </p>

      <h2>5. You're Ready</h2>
      <p>
        With your store connected and warehouse configured, orders will flow in automatically.
        Use the <strong>Orders</strong> page to manage fulfillment, <strong>Picking</strong> to
        create pick lists, and <strong>Shipping</strong> to track outbound packages.
      </p>

      <div className="mt-10 flex items-center gap-3 p-5 rounded-xl bg-surface-50 border border-surface-100">
        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-brand-600">
            <path d="M10 3L17 17H3L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-surface-800 text-sm mb-0.5">Need help?</p>
          <p className="text-sm text-surface-500 mb-0">
            Check the module-specific guides in the sidebar, or reach out to support for hands-on setup assistance.
          </p>
        </div>
      </div>
    </article>
  );
}
