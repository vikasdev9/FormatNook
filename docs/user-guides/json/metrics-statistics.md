# User Guide: JSON Detailed Metrics & Structural Statistics

![JSON Stats Modal](screenshots/json-stats-modal.png)

## 1. Feature Overview
The **JSON Detailed Metrics & Statistics** analyzer computes deep structural and scalar telemetry for any JSON document: file byte size, line count, character count, maximum nesting depth, total keys, total values, and complete breakdown of primitive types (strings, numbers, booleans, nulls, empty objects, empty arrays).

## 2. Purpose
Audit payload size and complexity, verify nesting depth limits for API gateways, check for sparse/empty arrays, and gather telemetry for technical performance reviews.

## 3. When to Use It
- Checking if a payload exceeds API gateway payload limits (e.g. AWS API Gateway 10 MB or Cloudflare 100 MB).
- Analyzing nesting depth to prevent stack overflow issues in downstream parsers.
- Profiling memory footprint before caching payloads in Redis.

## 4. Step-by-Step Instructions
1. Load or paste JSON into the workspace.
2. In the secondary toolbar, click the **Stats** button (`json-stats-btn`).
3. The **JSON Detailed Metrics & Statistics** modal opens.
4. Review the structural analysis:
   - **File Size:** Exact byte and human-readable size (e.g. `24.3 KB`).
   - **Hierarchy:** Total Lines, Characters, Max Nesting Depth.
   - **Collections:** Total Objects (including count of empty `{}`), Total Arrays (including count of empty `[]`).
   - **Primitives:** Breakdown of Strings, Numbers, Booleans, Nulls.
5. Click **Copy Summary** to place a Markdown-formatted summary table onto your clipboard.

## 5. Input Example
```json
{
  "orderId": "ORD-2026-99",
  "total": 149.95,
  "paid": true,
  "discountCode": null,
  "items": [
    { "sku": "A1", "price": 49.95 },
    { "sku": "B2", "price": 100.00 }
  ],
  "notes": {}
}
```

## 6. Expected Metrics Display
- **Max Nesting Depth:** 3
- **Total Keys:** 8
- **Total Objects:** 3 (1 empty)
- **Total Arrays:** 1 (0 empty)
- **Strings:** 3
- **Numbers:** 3
- **Booleans:** 1
- **Nulls:** 1

## 7. Available Options
- **One-Click Markdown Copy:** Formats metrics as a clean GitHub-style Markdown list ready for PR descriptions or bug tickets.

## 8. Keyboard Shortcuts
- `Escape`: Close Stats modal.

## 9. Error Handling
- If the document contains syntax errors, the Stats button informs the user to correct syntax first.

## 10. Limitations
- Computations are calculated in-memory; for payloads $> 10\text{ MB}$, computation takes ~15–30ms.

## 11. Troubleshooting
- **Depth seems higher than expected:** Arrays count as a nesting level; an object inside an array inside an object has a depth of 3.

## 12. Related Features
- [Syntax Validator](syntax-validator.md)
- [Interactive Tree View](tree-view.md)
- [Code Models](code-model-generator.md)
