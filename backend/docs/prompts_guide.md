# Analytics System: Working Prompt Guide

The system now supports multi-dimensional analysis across transactions. Use these patterns to get the most accurate results.

## 1. Revenue Analysis (Value)
*   **Simple**: "What is the total revenue for this month?"
*   **Ranked**: "Top 10 devices by revenue."
*   **Threshold (New)**: "Show me the devices which has revenue less than 1500000."
*   **Comparison**: "List devices with revenue above 500000 last week."

## 2. Transaction Volume (Counts)
*   **Simple**: "How many transactions were successful today?"
*   **Ranked**: "Which 5 devices have the most transactions?"
*   **By Mode**: "Show volume for UPI vs Card transactions."
*   **Trends**: "Daily transaction volume for the last 30 days."

## 3. Operational & Health Metrics
*   **Failures**: "Which devices are failing most often?"
*   **Success Rate**: "What is the success rate for UPI transactions yesterday?"
*   **Latency**: "Average audio delay (latency) for the last 24 hours."
*   **Error Codes**: "List failure reasons (error codes) for deviceId 107020."

## 4. Time-Based Trends
*   **Peak Hours**: "Peak hours of transaction volume in the last 7 days."
*   **Day of Week**: "Revenue by day of week for this month."
*   **Specific Windows**: "Total revenue between Feb 1st and Feb 20th."

## 5. Advanced Combined Queries
*   **Targeted Stats**: "Average ticket size (transaction value) for deviceId 107020."
*   **Filtered Volume**: "How many UPI transactions above 10000 happened this month?"
*   **Operational Risk**: "Devices with more than 50 failures but revenue less than 10000."

---

## Pro-Tips for Accuracy
1.  **Use specific IDs**: If you know the `deviceId` (e.g., 104419), include it for precise filtering.
2.  **Define the window**: Always include a time range (e.g., "last 7 days", "yesterday", "Jan 2026") for faster and more relevant results.
3.  **Specify "Less/More"**: The system now explicitly understands thresholds. Use phrases like "above," "below," "more than," or "less than."
