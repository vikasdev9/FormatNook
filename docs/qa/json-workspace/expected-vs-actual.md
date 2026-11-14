# JSON Workspace Expected vs Actual Output Comparisons

| Feature ID | Operation | Input Fixture | Output Match | Expected Excerpt | Actual Excerpt | Notes |
|---|---|---|---|---|---|---|
| `JSON-017` | Beautify (2 spaces) | `expected-basic-minified.json` | âœ… PASS | `{   "id": 101,   "title": "Synthetic Test Ite...` | `{   "id": 101,   "title": "Synthetic Test Ite...` | - |
| `JSON-018` | Minify | `basic.json` | âœ… PASS | `{"id":101,"title":"Synthetic Test Item","acti...` | `{"id":101,"title":"Synthetic Test Item","acti...` | - |
| `JSON-022` | Auto Repair (Standard) | `brokenInput` | âœ… PASS | `Valid RFC 8259 JSON without comments, single ...` | `{      "name": "Synthetic Broken Record",   "...` | Hexadecimal numbers (e.g. 0x1A) are not converted by repairJson; requires JSON5 conversion. |
| `JSON-028` | JSON to CSV | `product-catalog.json` | âœ… PASS | `id,sku,name,category,price,inStock,rating,tag...` | `id,sku,name,category,price,inStock,rating,tag...` | - |
| `JSON-029` | JSON to XML | `basic.json` | âœ… PASS | `<?xml version="1.0" encoding="UTF-8"?> <root>...` | `<?xml version="1.0" encoding="UTF-8"?> <root>...` | - |
| `JSON-030` | JSON to YAML | `basic.json` | âœ… PASS | `id: 101 title: Synthetic Test Item active: tr...` | `id: 101 title: Synthetic Test Item active: tr...` | - |
