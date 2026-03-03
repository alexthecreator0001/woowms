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
        performance. It shows key metrics, a sales-over-time chart, and a
        geographic order map &mdash; all in one view.
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
        the same length (e.g. if viewing 30 days, it compares to the 30 days
        before that). Green indicates improvement, red indicates decline.
      </p>

      <h3>Customizing Cards</h3>
      <p>
        Click the <strong>Customize</strong> button to toggle which metric cards
        are visible. Your selection is saved to your browser. At least one card
        must remain visible.
      </p>

      <h2>Sales Over Time Chart</h2>
      <p>
        A full-width area chart shows daily sales totals for the selected
        period. The chart includes grid lines, Y-axis values (formatted as
        &ldquo;1.2k&rdquo; etc.), and X-axis date labels. Data points are
        shown as dots when the period has 60 or fewer days.
      </p>

      <h2>Order Map</h2>
      <p>
        A dark-themed geographic visualization plots order origins across the
        globe. Each dot represents a country where orders were shipped. Dot
        size and brightness scale with order volume. The highest-traffic
        countries display animated pulse rings and order count labels.
      </p>
      <p>
        Country data is extracted from the shipping address on each order. Only
        countries with at least one order appear as active dots; all other
        reference countries are shown as faint markers to provide geographic
        context.
      </p>

      <h2>Top Countries</h2>
      <p>
        A sidebar list ranks the top 10 countries by order count. Each entry
        shows the country flag, name, a proportional bar, order count, and
        total revenue. This complements the map for quick at-a-glance
        geographic insights.
      </p>
    </article>
  );
}
