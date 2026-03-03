export default function Analytics() {
  return (
    <article className="doc-prose">
      <h1 className="doc-heading text-4xl mb-2">Analytics</h1>
      <p className="text-lg text-surface-400 mb-8">
        Visualize sales performance, order geography, and key business metrics.
      </p>

      <h2>Overview</h2>
      <p>
        The Analytics page provides a real-time dashboard of your fulfillment
        performance. It shows key metrics, interactive charts, order geography,
        and breakdowns by status, payment method, and top products.
      </p>

      <h2>Time Period Selector</h2>
      <p>
        Use the period pills in the top-right corner to switch between
        <strong> 7 days</strong>, <strong>30 days</strong>,
        <strong> 90 days</strong>, or <strong>1 year</strong>. All metrics,
        charts, and the map update automatically when the period changes.
      </p>

      <h2>Metric Cards</h2>
      <p>
        Four configurable stat cards are displayed at the top of the page:
      </p>
      <ul>
        <li><strong>Total Sales</strong> &mdash; Sum of all order totals for the selected period, with a sparkline chart.</li>
        <li><strong>Total Orders</strong> &mdash; Number of orders received, with a sparkline chart.</li>
        <li><strong>Avg Order Value</strong> &mdash; Average order total (total sales / total orders), with a sparkline chart.</li>
        <li><strong>Items Sold</strong> &mdash; Total quantity of line items sold across all orders.</li>
      </ul>
      <p>
        Each card shows a percentage comparison against the previous period of
        the same length. Green indicates improvement, red indicates decline.
      </p>

      <h3>Customizing Cards</h3>
      <p>
        Click the <strong>Customize</strong> button to toggle which metric cards
        are visible. Your selection is saved to your browser. At least one card
        must remain visible.
      </p>

      <h2>Interactive Charts</h2>
      <p>Two side-by-side charts visualize order data over time:</p>
      <ul>
        <li><strong>Sales Over Time</strong> &mdash; A bar chart showing daily revenue. Hover over any bar to see the exact total, order count, and date in a tooltip.</li>
        <li><strong>Orders Over Time</strong> &mdash; A line/area chart showing daily order count. Hover for tooltips with exact counts.</li>
      </ul>
      <p>
        Charts aggregate by day (7d/30d), week (90d), or month (1y) for
        readable data at any scale.
      </p>

      <h2>Status, Payments &amp; Top Products</h2>
      <p>Three cards provide categorical breakdowns:</p>
      <ul>
        <li><strong>Orders by Status</strong> &mdash; Horizontal bar chart showing how many orders are in each fulfillment status (Pending, Processing, Shipped, etc.).</li>
        <li><strong>Payment Methods</strong> &mdash; Horizontal bar chart with order count and revenue per payment method.</li>
        <li><strong>Top Products</strong> &mdash; Ranked list of the 10 best-selling products by quantity in the selected period, with SKU and quantity sold.</li>
      </ul>

      <h2>Order Map</h2>
      <p>
        A full-width dotted world map shows where your orders come from. Each
        order country is marked with a pulsing indigo dot. Dot size scales with
        order volume &mdash; countries with more orders have larger markers.
      </p>
      <p>
        Country data is extracted from the shipping address on each order. The
        map uses the <code>dotted-map</code> library&apos;s own Mercator
        projection to ensure accurate pin placement.
      </p>

      <h2>Top Countries</h2>
      <p>
        An inline sidebar next to the map ranks the top 10 countries by order
        count. Each entry shows the country flag, name, a proportional bar,
        order count, and total revenue.
      </p>
    </article>
  );
}
