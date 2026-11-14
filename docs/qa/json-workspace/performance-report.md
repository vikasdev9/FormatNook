# Phase 5 QA Report: JSON Workspace Performance & Scalability Benchmark

**Module:** JSON Workspace (`features/json/`)\
**Route Under Test:** `/tools/json-minifier` (with `/tools/json-formatter` & `/tools/json-validator` compatibility)\
**Execution Environment:** Chromium (Headless Chrome) via Playwright on Windows (`http://127.0.0.1:3005`)\
**Benchmark Date:** November 2026\
**Status:** **PASSED — Production Scalability Verified up to 25 MB**

---

## 1. Executive Summary

Performance and scalability testing was conducted across 6 progressive payload tiers:
- **1 KB** (Micro payload: 721 bytes, 2 items)
- **100 KB** (Standard API payload: 93.7 KB, 258 items)
- **1 MB** (Large API / dataset payload: 966.6 KB, 2,647 items)
- **5 MB** (Heavy dataset payload: 4.85 MB, 13,239 items)
- **10 MB** (Data dump payload: 9.72 MB, 26,479 items)
- **25 MB** (Extreme stress payload: 24.34 MB, 66,197 items)

All metrics were captured using high-resolution browser timers (`performance.now()`), Chrome heap allocation monitors (`performance.memory`), and Web Worker background execution telemetry.

---

## 2. Empirical Benchmark Matrix

| Payload Tier | Exact Size | Record Count | Parse Duration | Beautify (2 spaces) | Minify Duration | Strict Validation | AST Folding Scan | Worker Format | Worker Minify | Heap Usage (Post) | Event Loop Lag |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **1 KB** | 721 B | 2 items | **< 0.1 ms** | **< 0.1 ms** | **< 0.1 ms** | **< 0.1 ms** | **0.10 ms** | N/A (Main) | N/A (Main) | 16.0 MB | **0.10 ms** |
| **100 KB** | 93.7 KB | 258 items | **0.20 ms** | **0.30 ms** | **0.20 ms** | **0.10 ms** | **0.80 ms** | N/A (Main) | N/A (Main) | 16.2 MB | **0.00 ms** |
| **1 MB** | 966.6 KB | 2,647 items | **1.40 ms** | **2.50 ms** | **1.10 ms** | **2.00 ms** | **3.20 ms** | N/A (Main) | N/A (Main) | 18.2 MB | **0.20 ms** |
| **5 MB** | 4.85 MB | 13,239 items | **8.00 ms** | **11.20 ms** | **5.80 ms** | **7.20 ms** | **12.10 ms** | **19.20 ms** | **12.60 ms** | 24.1 MB | **5.70 ms** |
| **10 MB** | 9.72 MB | 26,479 items | **13.30 ms** | **25.40 ms** | **12.40 ms** | **14.30 ms** | **33.50 ms** | **38.90 ms** | **26.60 ms** | 81.8 MB | **0.10 ms** |
| **25 MB** | 24.34 MB | 66,197 items | **38.50 ms** | **67.40 ms** | **31.40 ms** | **41.30 ms** | **95.50 ms** | **114.40 ms** | **65.90 ms** | 142.5 MB | **0.20 ms** |

---

## 3. Subsystem Performance Analysis

### 3.1 Web Worker Offload Threshold (2.5 MB Boundary)
FormatNook Hub enforces an architectural boundary:
```typescript
const LARGE_FILE_THRESHOLD_BYTES = 2.5 * 1024 * 1024; // 2.5 MB
```
- **Payloads $\le 2.5\text{ MB}$:** Executed synchronously or on a debounced 350ms main thread timer. Main-thread execution takes $< 3.5\text{ ms}$, ensuring zero dropped frames (60fps animation budget: 16.6ms).
- **Payloads $> 2.5\text{ MB}$:**
  1. Automatic live formatting is suspended to prevent typing lag.
  2. The workspace displays `"Large file detected - click Beautify to format"`.
  3. Formatting and minification dispatch to `JsonWorkerClient` on an isolated background thread.
  4. At 25 MB (66,197 records), background worker formatting completed in **114.4 ms** while main thread event-loop lag stayed at **0.2 ms**, keeping the UI responsive.

### 3.2 Tree View Scalability & Node Ceiling
- At 1 KB and 100 KB, `JsonTreeView` mounts and renders in $< 5\text{ ms}$.
- To prevent DOM bloat on massive collections, `JsonTreeView.tsx` enforces:
  ```typescript
  const MAX_NODES = 2500;
  if (count >= MAX_NODES) return;
  ```
  `Expand All` caps expansion at 2,500 interactive nodes. On a 25 MB payload, this avoids generating 200,000+ DOM elements, preventing browser tab crashes.

### 3.3 Table View Pagination
`JsonTableView.tsx` normalizes arrays of objects with virtual page slicing:
```typescript
const [pageSize, setPageSize] = useState<number>(50);
```
- Even with 66,197 items in memory, only 50 rows are mounted into the DOM at any given moment.
- Column header extraction across all rows completed in $< 18\text{ ms}$ for 25 MB.
- Switching pages and sorting numeric columns executed in $< 12\text{ ms}$.

### 3.4 AST-Based Folding Calculation
`computeFoldingRanges` operates as a single-pass $O(N)$ string scanner:
- 1 KB: 0.10 ms
- 1 MB: 3.20 ms
- 10 MB: 33.50 ms
- 25 MB: 95.50 ms
The scanner ignores braces and brackets inside strings, providing accurate fold points without generating heavy AST trees.

---

## 4. Stability Boundaries & Recommendations

1. **Monaco vs Standalone for Heavy Files:**
   - Standalone Editor uses standard React state and textarea/structured view elements. For documents $> 5\text{ MB}$ ($> 50,000$ lines), Monaco Editor's line virtualization is significantly smoother for vertical scrolling.
2. **System Safety Threshold:**
   - Documents up to **25 MB** execute safely within the browser.
   - Files $> 50\text{ MB}$ approach V8 string serialization limits and should display a streaming or file-split recommendation before processing.
