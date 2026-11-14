# JSON Workspace Architecture Map

This document details the architectural layout, component hierarchy, service dependencies, data flow, and privacy boundaries for the JSON Workspace in FormatNook Hub.

---

## 1. High-Level Architectural Diagram

```
                              Next.js 14 App Router
                       (/tools/json-minifier | -formatter | -validator)
                                     │
                                     ▼
                      ┌───────────────────────────────┐
                      │        JsonWorkspace          │
                      │  (Master State & Controller)  │
                      └───────┬───────────────┬───────┘
                              │               │
       ┌──────────────────────┼───────────────┼──────────────────────┐
       ▼                      ▼               ▼                      ▼
┌─────────────┐       ┌──────────────┐ ┌──────────────┐       ┌─────────────┐
│ JsonToolbar │       │  Code View   │ │  Tree View   │       │ Table View  │
│ (Controls)  │       │ (CodeEditor) │ │(JsonTreeView)│       │(JsonTableVw)│
└──────┬──────┘       └──────┬───────┘ └──────┬───────┘       └──────┬──────┘
       │                     │                │                      │
       ▼                     ▼                ▼                      ▼
┌─────────────┐       ┌──────────────┐ ┌──────────────┐       ┌─────────────┐
│ Modals &    │       │ Monaco vs    │ │ In-place     │       │ Sort, Filter│
│ Drawers (9) │       │ Standalone   │ │ Edit & Nav   │       │ & CSV Export│
└─────────────┘       └──────────────┘ └──────────────┘       └─────────────┘
                               │
                               ▼
        ┌───────────────────────────────────────────┐
        │            JSON Services Layer            │
        │  Formatting • Validation • Workers        │
        │  Folding • Palette • Transform • CodeGen  │
        │  Diff • Schema • Path • Stats • Storage   │
        └───────────────────────────────────────────┘
```

---

## 2. Component Hierarchy & Responsibilities

### Root Controller: `JsonWorkspace.tsx`
- **State Management**:
  - `input`: Raw input JSON string (initialized with `DEFAULT_SAMPLE_JSON` or route sample).
  - `output`: Processed, formatted, or minified JSON string.
  - `viewMode`: Active view (`code` | `tree` | `table`).
  - `indent`: Selected indentation (`2`, `3`, `4`, `6`, `8`, `tab`).
  - `useMonaco`: Editor engine selection (`true` = Monaco, `false` = Standalone).
  - `inputCollapsedLines` & `outputCollapsedLines`: Persistent sets of folded line numbers.
  - `panelsRatio`: Split ratio between input and output panels (20%–80%).
  - `validationState`: `{ isValid: boolean | null, issues: ValidationIssue[] }`.
  - `isOutdated`: Indicates whether input was modified after last format.
  - `palettePreferences`: Theme selection and custom syntax colors for Light and Dark modes.
  - `isJson5Mode`: Relaxed parsing mode toggle.
  - `autoFormat`: 350ms debounced auto-formatting toggle.

---

### UI Sub-Components & Modals

1. **`JsonToolbar.tsx`**:
   - View mode pills (`Code`, `Tree View`, `Table`).
   - Primary action buttons (`Beautify`, `Minify`, `Validate`, `Auto Repair`).
   - Secondary tool drawer triggers (`Transform`, `JSONPath`, `Schema`, `Stats`, `Compare`, `Code Models`, `JSON5 Mode`).
   - Gutter options (`Indent`, `Samples`, `Font Size`, `Wrap`, `Auto Format`, `Editor Mode`, `Folding Menu`, `Palette`).
   - Quick utility buttons (`Sort Keys`, `One-Line`, `Stringify`, `Unstringify`).
   - Right utility actions (`FileDropzone`, `ResetButton`, `Recents & Favorites`, `Full Screen`, `Shortcuts`).

2. **`JsonFoldingMenu.tsx`**:
   - Compact dropdown offering `Expand All`, `Collapse All`, and `Fold to Level 1–5`.
   - Dispatches non-destructively to `JsonWorkspace` state and both editor adapters.

3. **`CodeEditor.tsx` (Dual Instance: Input & Output)**:
   - **Monaco Engine Adapter**: Integrates `@monaco-editor/react`, registers custom themes dynamically via `monaco.editor.defineTheme`, and synchronizes fold regions with `foldingController`.
   - **Standalone Engine Adapter**: Gutter line numbers with fold chevrons (`▼` and `▶`), tokenized syntax highlighting with palette colors, and inline summary pills (`{ ... N props }` / `[ ... N items ]`).
   - **Footer Status Bar**: Ln, Col, Total Lines, Char count, Byte size.

4. **`JsonTreeView.tsx`**:
   - Renders visual collapsible DOM tree.
   - Allows in-place value editing with instant synchronization back to raw input.
   - Live query search with Next/Previous match navigation and key/value filter.
   - Copy JSONPath or value per node.

5. **`JsonTableView.tsx`**:
   - Tabular grid displaying arrays of objects or key-value entries.
   - Type-aware multi-column sorting (numeric vs string).
   - Real-time row filtering and configurable pagination (25, 50, 100, 250 rows).
   - One-click CSV export download.

6. **`JsonPathPanel.tsx`**:
   - Real-time JSONPath query evaluator.
   - Curated template presets (`$`, `$.*`, `$..name`, `$..skills[*]`).
   - Extract matching values directly into the main workspace editor.

7. **Modal Dialogs (9 Dedicated Workbenches)**:
   - `JsonTransformModal.tsx`: Converts JSON to CSV, TSV, XML, YAML; flattens, un-flattens, filters, deduplicates, sorts, merges, splits, and escapes.
   - `JsonRepairModal.tsx`: Visual diff preview of automated syntax repairs.
   - `JsonSchemaModal.tsx`: Draft-07 JSON Schema validator with path error pointers.
   - `JsonStatsModal.tsx`: Sizing, max depth, object/array counts, and type breakdown.
   - `JsonRecentModal.tsx`: Recent file history and favorite snippets manager with quota handling.
   - `JsonCodeGenModal.tsx`: Generates classes and interfaces for 12 programming languages.
   - `JsonDiffModal.tsx`: Myers diff comparison with added/removed line statistics.
   - `JsonColorPaletteModal.tsx`: 7 built-in themes and 10 custom HEX syntax token pickers.
   - `JsonShortcutsModal.tsx`: Full keyboard shortcut reference table.

---

## 3. Services Layer Architecture

```
FormatNookHub/features/json/services/
├── json-service.ts             # Core formatJson, minifyJson, validateJson, repairJson, stringify
├── json-folding-service.ts     # Single-pass O(N) quote-aware AST range scanner
├── json-folding-controller.ts  # Pure visible lines computation & fold state manipulators
├── json-palette-service.ts     # Theme definitions, custom HEX palettes, localStorage persistence
├── json-transform-service.ts   # CSV, TSV, XML, YAML, flatten, deduplicate, filter, merge, split
├── json-codegen-service.ts     # Type generation for 12 programming languages
├── json-path-service.ts        # In-browser JSONPath query engine
├── json-schema-service.ts      # Draft-07 JSON Schema conformance engine
├── json-stats-service.ts       # Structural depth, object/array counts, and type metrics
├── json-storage-service.ts     # Safe localStorage with QuotaExceededError protection
├── json-worker-client.ts       # Background Web Worker controller for files > 2.5MB
├── json5-service.ts            # Relaxed JSON5 parser & standard JSON converter
└── json-samples.ts             # 7 curated demonstration datasets
```

---

## 4. Privacy & Execution Boundaries

FormatNook enforces a strict **Zero-Knowledge Client-Side Architecture**:
- **Zero Server Processing**: No JSON payloads, snippets, or diffs are transmitted over the network.
- **Zero Telemetry on Input**: Analytics and tracking scripts do not read editor contents or keystrokes.
- **Local Web Workers**: When processing large JSON documents (>2.5MB), payloads are transferred to dedicated in-browser Web Workers using structured cloning, remaining strictly within the user's browser sandbox.
- **Local Storage Isolation**: Saved snippets and preferences are stored exclusively in the browser's origin `localStorage` with explicit quota safeguards.
