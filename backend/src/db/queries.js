const queries = {
  REVENUE_BY_REGION: `
    SELECT region, SUM(amount + tax - discount) as total_revenue
    FROM transactions
    WHERE status = 'COMPLETED'
    GROUP BY region
    ORDER BY total_revenue DESC;
  `,
  FAILURE_BY_FIRMWARE: `
    SELECT firmware_version, COUNT(*) as failure_count
    FROM device_health
    WHERE status = 'FAILED'
    GROUP BY firmware_version
    ORDER BY failure_count DESC;
  `,
  TOP_MERCHANTS: `
    SELECT m.name as merchant_name, SUM(t.amount + t.tax - t.discount) as total_revenue
    FROM merchants m
    JOIN transactions t ON m.id = t.merchant_id
    WHERE t.status = 'COMPLETED'
    GROUP BY m.name
    ORDER BY total_revenue DESC
    LIMIT 10;
  `,
  SALES_BY_CATEGORY: `
    SELECT p.category as metric_name, SUM(t.amount + t.tax - t.discount) as total_value
    FROM products p
    JOIN transactions t ON p.id = t.product_id
    WHERE t.status = 'COMPLETED'
    GROUP BY p.category
    ORDER BY total_value DESC;
  `
};

module.exports = queries;
