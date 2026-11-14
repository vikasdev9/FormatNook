# JSON Workspace Comprehensive Test Matrix

This test matrix defines deterministic test specifications across all 94 features of the JSON Workspace in FormatNook Hub.

Test specifications cover:
1. **Positive Test Cases (`POS`)**: Standard happy path operations with valid data.
2. **Negative Test Cases (`NEG`)**: Malformed inputs, syntax errors, and invalid parameters.
3. **Boundary Test Cases (`BND`)**: Extremes (empty files, 25MB payloads, 50-level nesting, max safe integers, unicode glyphs).
4. **Regression Test Cases (`REG`)**: Prevention of previously remediated bugs (Monaco initial theme flash, storage quota crashes, mode-independent folding synchronization).
5. **UI Interaction Test Cases (`UI`)**: User interactions (pointer drag, keyboard shortcuts, modal dialogs, responsive viewports).
6. **Expected Output Assertions**: Deterministic assertions mapped to synthetic fixtures in `test-fixtures/`.

---

## 1. Category A: Editor & Workspace Layout (`JSON-001` – `JSON-016`)

| Test ID | Feature Ref | Type | Test Scenario & User Action | Input Data | Expected System Behavior & Assertion |
|---|---|---|---|---|---|
| **TC-A-POS-01** | `JSON-001` | Positive | Switch from Standalone to Monaco mode | `test-fixtures/basic.json` | Monaco editor mounts; `.monaco-editor` container is visible; line numbers and syntax color tokens render. |
| **TC-A-POS-02** | `JSON-002` | Positive | Switch from Monaco to Standalone mode | `test-fixtures/basic.json` | Standalone editor mounts; `.editor-line-gutter-with-folds` is visible; textarea retains exact JSON content. |
| **TC-A-POS-03** | `JSON-003` | Positive | Switch between Code, Tree, and Table view modes | `test-fixtures/product-catalog.json` | Selected pill receives `.active` class; respective container (`[data-testid="json-code-view"]`, `[data-testid="json-tree-container"]`, `[data-testid="json-table-container"]`) becomes visible. |
| **TC-A-BND-01** | `JSON-006` | Boundary | Line numbering with mixed LF, CRLF, and trailing empty lines | 100-line JSON with trailing `\n\n` | Gutter displays exact logical line count 102; line 102 gutter number is visible without content truncation. |
| **TC-A-BND-02** | `JSON-007` | Boundary | Word wrap toggle with unbroken 5,000-character Base64 string | Single continuous string without spaces | When Wrap is ON, text wraps within viewport container; `scrollWidth <= clientWidth`. When Wrap is OFF, horizontal scroll appears. |
| **TC-A-UI-01** | `JSON-010` | UI Interaction | Toggle Full Screen mode | Click "Full Screen" button | Workspace container receives `.json-fullscreen-mode`; dimensions expand to 100vw x 100vh; pressing Escape exits fullscreen. |
| **TC-A-UI-02** | `JSON-011` | UI Interaction | Resizable splitter drag and keyboard arrows | Drag resizer to 30%, press ArrowRight, double-click | Divider updates CSS grid variables `--panels-left` and `--panels-right`; double-click immediately restores 50/50 split. |
| **TC-A-UI-03** | `JSON-014` | UI Interaction | Open and close Shortcuts modal | Click "Shortcuts" button or press '?' | Modal `[data-testid="json-shortcuts-modal"]` appears; contains table with 14 shortcut badges; clicking 'Got It' or Esc closes modal. |
| **TC-A-UI-04** | `JSON-015` | UI Interaction | Tab indentation in standalone editor | Focus textarea and press Tab key | Intercepts Tab, inserts 2 spaces (`"  "`), advances cursor by 2 positions without shifting browser focus to next control. |
| **TC-A-UI-05** | `JSON-016` | UI Interaction | Mobile panel switcher tabs | Viewport 390x844 (Mobile) | Displays mobile tabs (`Both`, `Input`, `Output`); clicking `Input` hides output panel; clicking `Output` hides input panel. |
| **TC-A-REG-01** | `JSON-001` | Regression | Monaco initial theme flash prevention | Set document `data-theme="dark"` and load page | Monaco initializes directly with `vs-dark` theme; zero white background flash during editor mount. |

---

## 2. Category B: Formatting, Minification & Validation (`JSON-017` – `JSON-027`)

| Test ID | Feature Ref | Type | Test Scenario & User Action | Input Data | Expected System Behavior & Assertion |
|---|---|---|---|---|---|
| **TC-B-POS-01** | `JSON-017` | Positive | Beautify with 2 spaces indentation | `test-fixtures/basic.json` (unformatted) | Output matches `test-fixtures/expected-basic-beautified-2spaces.json`; status badge shows "Formatting successful". |
| **TC-B-POS-02** | `JSON-017` | Positive | Beautify with Tabs indentation | `test-fixtures/basic.json` (unformatted) | Output matches `test-fixtures/expected-basic-beautified-tabs.json` containing literal `\t` indentation characters. |
| **TC-B-POS-03** | `JSON-018` | Positive | Minify multi-line nested JSON | `test-fixtures/basic.json` | Output matches `test-fixtures/expected-basic-minified.json` (single line, zero extra spaces, strings intact). |
| **TC-B-POS-04** | `JSON-019` | Positive | Validate well-formed JSON | `test-fixtures/nested.json` | Validation result displays green `.validation-card.valid` with text "Valid JSON". |
| **TC-B-NEG-01** | `JSON-019` | Negative | Validate malformed JSON with missing closing brace | `{"test": "unclosed"` | Validation result displays red `.validation-card.invalid` reporting exact line 1, column 19 error position. |
| **TC-B-POS-05** | `JSON-020` | Positive | Auto Repair syntax errors | `test-fixtures/invalid-syntax.json` | Repair modal opens, displays detected issues (trailing comma, single quotes, unquoted keys), applying produces `expected-repaired-syntax.json`. |
| **TC-B-POS-06** | `JSON-021` | Positive | Quick Sort Keys A-Z | `{"zebra": 1, "alpha": 2, "beta": 3}` | Output object has keys sorted alphabetically: `alpha`, `beta`, `zebra`. |
| **TC-B-POS-07** | `JSON-022` | Positive | One-Line JSON conversion | Multi-line formatted JSON with internal spaces | Output is a single line; internal string spaces are strictly preserved. |
| **TC-B-POS-08** | `JSON-023` | Positive | Stringify JSON document | `{"hello": "world"}` | Output is string literal `"{\"hello\":\"world\"}"`. |
| **TC-B-POS-09** | `JSON-024` | Positive | Unstringify escaped JSON string literal | `"{\"hello\":\"world\"}"` | Output parses back to `{ "hello": "world" }`. |
| **TC-B-UI-01** | `JSON-025` | UI Interaction | Debounced auto-formatting on input | Type valid JSON into input | Debounce timer fires after 350ms; status transitions from "Formatting..." to "Valid JSON"; output updates automatically. |
| **TC-B-UI-02** | `JSON-026` | UI Interaction | Toggle Auto-Format OFF | Click "Auto Format: On" button | Button switches to "Auto Format: Off"; typing invalid/valid text does not automatically trigger formatting until Beautify is clicked. |
| **TC-B-BND-01** | `JSON-025` | Boundary | Large file auto-format threshold | Paste payload > 2.5 MB | Auto-format skips automatic execution; status badge prompts "Large file detected - click Beautify to format" to protect UI thread. |

---

## 3. Category C: Data Transformation (`JSON-028` – `JSON-042`)

| Test ID | Feature Ref | Type | Test Scenario & User Action | Input Data | Expected System Behavior & Assertion |
|---|---|---|---|---|---|
| **TC-C-POS-01** | `JSON-028` | Positive | Convert JSON array of objects to CSV | `test-fixtures/product-catalog.json` | Output matches `test-fixtures/expected-product-catalog.csv`; arrays serialized as JSON strings; commas properly escaped. |
| **TC-C-POS-02** | `JSON-029` | Positive | Convert JSON to TSV | `test-fixtures/basic.json` | Output contains tab `\t` delimiters between columns and headers. |
| **TC-C-POS-03** | `JSON-030` | Positive | Convert JSON to XML | `test-fixtures/basic.json` | Output matches `test-fixtures/expected-basic.xml` wrapped in `<root>` and `<id>`, `<title>` elements. |
| **TC-C-POS-04** | `JSON-031` | Positive | Convert JSON to YAML | `test-fixtures/basic.json` | Output matches `test-fixtures/expected-basic.yaml` valid YAML 1.2 format without extraneous brackets. |
| **TC-C-POS-05** | `JSON-032` | Positive | Flatten nested JSON structure | `test-fixtures/nested.json` | Output has compound keys: `user.id`, `user.profile.firstName`, `user.profile.address.city`. |
| **TC-C-POS-06** | `JSON-033` | Positive | Unflatten dot-separated keys | Flattened JSON object | Output reconstructs deep nested object hierarchy matching original structure. |
| **TC-C-POS-07** | `JSON-035` | Positive | Sort array of objects by numeric price descending | `test-fixtures/product-catalog.json` | First item in sorted array has price 649.0 (Monitor); last item has price 79.5 (Mouse). |
| **TC-C-POS-08** | `JSON-036` | Positive | Filter array with operator `contains` | `test-fixtures/product-catalog.json`, field `category`, value `Audio` | Result array contains exactly 2 items (Headphones and Microphone). |
| **TC-C-POS-09** | `JSON-037` | Positive | Deduplicate array with duplicate objects | Array with duplicate product entries | Returns array with unique items only; removes redundant elements. |
| **TC-C-POS-10** | `JSON-038` | Positive | Extract specific fields (`sku`, `price`) | `test-fixtures/product-catalog.json` | Each object in resulting array contains only `sku` and `price` properties. |
| **TC-C-POS-11** | `JSON-039` | Positive | Deep merge two JSON objects | Object A and Object B with overlapping nested keys | Non-overlapping keys preserved; conflicting primitive keys overridden by Object B. |
| **TC-C-POS-12** | `JSON-040` | Positive | Split array into chunks of size 2 | Array of 5 items | Produces 3 chunks: two chunks of 2 items, one chunk of 1 item. |
| **TC-C-UI-01** | `JSON-042` | UI Interaction | Apply transformed result to workspace | Select YAML in modal, click "Apply to Workspace" | Modal closes; workspace input and output updated with transformed text; validation state refreshed. |
| **TC-C-NEG-01** | `JSON-028` | Negative | Transform invalid JSON input | Text with missing closing quotes | Transform preview displays error banner: "Error: Input is not valid JSON. Please format or repair your JSON first." |

---

## 4. Category D: Data Inspection & Modeling (`JSON-043` – `JSON-059`)

| Test ID | Feature Ref | Type | Test Scenario & User Action | Input Data | Expected System Behavior & Assertion |
|---|---|---|---|---|---|
| **TC-D-POS-01** | `JSON-043` | Positive | Evaluate JSONPath expression `$.user.profile.firstName` | `test-fixtures/nested.json` | Matches list displays 1 result: path `$.user.profile.firstName`, value `"Alex"`. |
| **TC-D-POS-02** | `JSON-044` | Positive | Load JSONPath template `$.*` | `test-fixtures/basic.json` | Evaluates all top-level keys; displays 6 matches with corresponding values. |
| **TC-D-POS-03** | `JSON-045` | Positive | Extract JSONPath matches to workspace | Expression `$..sku` on product catalog | Workspace editor receives extracted array `["PROD-KEY-001", "PROD-MOU-002", "PROD-MON-003", ...]`. |
| **TC-D-POS-04** | `JSON-046` | Positive | Validate against JSON Schema Draft-07 | User Profile JSON and User Profile Schema | Schema validation reports "JSON Document is Valid against Schema" with green checkmark. |
| **TC-D-NEG-01** | `JSON-046` | Negative | Schema validation with missing required property | JSON missing required `email` field | Schema reports validation failure pointing to path `$` with message "must have required property 'email'". |
| **TC-D-POS-05** | `JSON-048` | Positive | View Detailed Metrics & Statistics | `test-fixtures/nested.json` | Stats modal displays exact line count, character count, max depth (5), object count, array count, and type breakdown. |
| **TC-D-POS-06** | `JSON-050` | Positive | JSON Compare & Side-by-Side Diff | Original JSON vs edited JSON with modified price | Diff modal opens, highlights modified lines in yellow/red/green with statistics badge "+1 added, -1 removed". |
| **TC-D-POS-07** | `JSON-051` | Positive | Generate TypeScript interfaces | `test-fixtures/basic.json`, language TypeScript | Generates type-safe `export interface Root { id: number; title: string; active: boolean; score: number; ... }`. |
| **TC-D-POS-08** | `JSON-051` | Positive | Generate Python TypedDict models | `test-fixtures/basic.json`, language Python | Generates `class Root(TypedDict): id: int; title: str; active: bool; ...`. |
| **TC-D-POS-09** | `JSON-051` | Positive | Generate Go structs | `test-fixtures/basic.json`, language Go | Generates `type Root struct { ID int \`json:"id"\`; Title string \`json:"title"\` ... }`. |
| **TC-D-BND-01** | `JSON-051` | Boundary | Deep recursion code generation safety | Structure with depth > 50 | Recursion depth capped at 50; terminal nodes output `{ kind: 'any' }` without stack overflow. |
| **TC-D-UI-01** | `JSON-054` | UI Interaction | In-place tree value editing | Double-click or click pencil icon on tree node | Input input box opens; changing `"Alex"` to `"Alexander"` immediately updates raw input in editor. |
| **TC-D-UI-02** | `JSON-055` | UI Interaction | Search tree view with Next/Previous match | Search query `Peripherals` on product catalog | Highlights matching nodes in yellow; Next arrow scrolls to next match; counter shows `Match 1 of 2`. |
| **TC-D-UI-03** | `JSON-056` | UI Interaction | Table view numeric column sorting | Click `Price` column header in Table View | Rows re-order numerically: `$79.50` $\rightarrow$ `$99.00` $\rightarrow$ `$129.99` $\rightarrow$ `$249.95` $\rightarrow$ `$649.00`. |
| **TC-D-UI-04** | `JSON-058` | UI Interaction | Table view pagination with 200 rows | `test-fixtures/large-array.json` | Shows `Page 1 of 4` (50 rows/page); clicking Next advances to Page 2 displaying items 51–100. |

---

## 5. Category E: Advanced Editor (Folding & Syntax Color Palette) (`JSON-060` – `JSON-076`)

| Test ID | Feature Ref | Type | Test Scenario & User Action | Input Data | Expected System Behavior & Assertion |
|---|---|---|---|---|---|
| **TC-E-POS-01** | `JSON-060` | Positive | Global Expand All in Standalone mode | `test-fixtures/nested.json` with collapsed nodes | All lines expand; summary pills disappear; all gutter chevrons indicate expanded (`▼`). |
| **TC-E-POS-02** | `JSON-061` | Positive | Global Collapse All in Standalone mode | `test-fixtures/nested.json` | Line 1 collapses; displays root summary pill `{ ... 2 props }`; inner lines are hidden; line numbering intact. |
| **TC-E-POS-03** | `JSON-062` | Positive | Depth-Based Folding (Level 2) in Standalone | `test-fixtures/nested.json` | Level 1 (line 1) stays expanded; Level 2 objects (`user`, `metadata`) collapse into summary pills. |
| **TC-E-UI-01** | `JSON-063` | UI Interaction | Collapse individual object via gutter chevron in Standalone | Click `▼` chevron beside `user` object | Target chevron switches to `▶`; inner lines hidden; summary pill `{ ... 6 props }` appears. |
| **TC-E-UI-02** | `JSON-064` | UI Interaction | Collapse individual array via gutter chevron in Standalone | Click `▼` chevron beside `roles` array | Chevron switches to `▶`; summary pill `[ ... 3 items ]` appears with trailing comma. |
| **TC-E-UI-03** | `JSON-065` | UI Interaction | Expand collapsed node by clicking summary pill | Click `{ ... 6 props }` summary pill | Block expands immediately; all hidden lines restore; chevron returns to `▼`. |
| **TC-E-REG-01** | `JSON-066` | Regression | Standalone folding non-destructive verification | Fold and unfold multiple objects | `onChange` callback is NOT triggered; raw JSON string in state remains 100% byte-identical. |
| **TC-E-REG-02** | `JSON-068` | Regression | Bidirectional folding state synchronization | Collapse `user` in Standalone, switch to Monaco, switch back to Standalone | Collapsed state of `user` is preserved across both modes without reset. |
| **TC-E-REG-03** | `JSON-060` | Regression | Global folding does NOT force Monaco mode | In Standalone mode, click "Collapse All" | Editor remains in Standalone mode (`Editor: Standard`); does not force `useMonaco = true`. |
| **TC-E-UI-04** | `JSON-070` | UI Interaction | Open Color Palette Modal | Click "Palette: Theme" button in toolbar | Modal opens displaying active theme (`FormatNook`), 7 preset cards, and 10 token color pickers. |
| **TC-E-UI-05** | `JSON-071` | UI Interaction | Switch syntax theme preset to `Dracula` | Click `Dracula` theme preset card | Palette updates; editor syntax tokens recolor live with Dracula hex values (`#ff79c6` keys, `#f1fa8c` strings). |
| **TC-E-UI-06** | `JSON-072` | UI Interaction | Customize HEX token color with picker | Edit property token color to `#ff0055` | Live preview editor updates property keys to `#ff0055` immediately. |
| **TC-E-REG-04** | `JSON-076` | Regression | Palette preferences localStorage quota safety | Trigger palette save when storage quota is exhausted | Handled gracefully via try/catch without throwing unhandled exception or breaking UI. |

---

## 6. Category F: Files, Samples & Persistence (`JSON-077` – `JSON-089`)

| Test ID | Feature Ref | Type | Test Scenario & User Action | Input Data | Expected System Behavior & Assertion |
|---|---|---|---|---|---|
| **TC-F-POS-01** | `JSON-077` | Positive | Drag and drop `.json` file onto dropzone | `test-fixtures/product-catalog.json` | Dropzone highlights on dragover; on drop, file is read client-side and loaded into input editor. |
| **TC-F-NEG-01** | `JSON-077` | Negative | Drop disallowed file type (e.g. `.exe`, `.png`) | Unsupported file type | File is rejected with notification; editor content remains unaffected. |
| **TC-F-POS-02** | `JSON-079` | Positive | Download formatted JSON | Output editor populated | Browser downloads `formatted.json` with correct MIME type `application/json`. |
| **TC-F-UI-01** | `JSON-080` | UI Interaction | Click Copy Input button | Input editor text | Text copied to clipboard; button displays "Copied!" checkmark for 2 seconds. |
| **TC-F-UI-02** | `JSON-081` | UI Interaction | Click Copy Output button | Output editor text | Processed output copied to clipboard with visual confirmation. |
| **TC-F-UI-03** | `JSON-082` | UI Interaction | Reset workspace | Click "Reset" button in toolbar | Clears input, output, and validation state; restores initial empty state. |
| **TC-F-POS-03** | `JSON-083` | Positive | Load curated sample "E-Commerce Order" | Select "E-Commerce Order" in dropdown | Input editor loads sample with order items; triggers automatic formatting. |
| **TC-F-POS-04** | `JSON-085` | Positive | Save snippet to favorites | Title "Auth Payload", tags "api, auth" | Snippet saved in library; appears in list with tags and timestamp. |
| **TC-F-POS-05** | `JSON-086` | Positive | Export snippets database | Saved snippets in library | Downloads `formatnook_snippets_backup.json` containing valid JSON array of snippets. |
| **TC-F-POS-06** | `JSON-087` | Positive | Import snippets from backup JSON | Valid backup file | Merges imported snippets into library; shows success toast notification. |
| **TC-F-REG-01** | `JSON-088` | Regression | Snippet save localStorage quota exhaustion handling | Storage quota exceeded mock | `saveSnippet` returns `{ success: false, error: ... }`; displays user-friendly error toast in modal. |
| **TC-F-POS-07** | `JSON-089` | Positive | Workspace preferences persistence | Change indent to 4, wrap to Off, font to 14px | Reload page; settings persist and restore automatically from `formatnook_json_prefs`. |

---

## 7. Category G: JSON5 & Architecture (`JSON-090` – `JSON-094`)

| Test ID | Feature Ref | Type | Test Scenario & User Action | Input Data | Expected System Behavior & Assertion |
|---|---|---|---|---|---|
| **TC-G-POS-01** | `JSON-090` | Positive | Toggle JSON5 Mode ON with comments and unquoted keys | `test-fixtures/invalid-syntax.json` | JSON5 mode activates; parses successfully without syntax errors; status shows "JSON5 mode active". |
| **TC-G-POS-02** | `JSON-091` | Positive | Convert JSON5 to Standard JSON | JSON5 payload with `// comments` and `hex: 0x1A` | Strips comments, converts hex to decimal `26`, quotes all keys, and outputs strict standard JSON. |
| **TC-G-BND-01** | `JSON-092` | Boundary | Web Worker execution for multi-megabyte payload | Payload > 2.5 MB | Displays worker status banner with spinner; offloads formatting to Web Worker; UI thread remains responsive. |
| **TC-G-UI-01** | `JSON-092` | UI Interaction | Cancel background Web Worker operation | Click "Cancel" in worker progress banner | Worker task terminates immediately; UI resets cleanly without tab hang. |
| **TC-G-REG-01** | `JSON-093` | Regression | Zero-Knowledge client-side privacy verification | Process sensitive JSON payload | Network tab logs zero outbound HTTP requests for payload processing; 100% in-browser memory. |
| **TC-G-POS-03** | `JSON-094` | Positive | Multi-route initialMode verification: `/tools/json-minifier` | Navigate to `/tools/json-minifier` | Workspace loads with `initialMode="minify"`; Minify button active; initial sample minified. |
| **TC-G-POS-04** | `JSON-094` | Positive | Multi-route initialMode verification: `/tools/json-formatter` | Navigate to `/tools/json-formatter` | Workspace loads with `initialMode="format"`; Beautify button active; initial sample formatted. |
| **TC-G-POS-05** | `JSON-094` | Positive | Multi-route initialMode verification: `/tools/json-validator` | Navigate to `/tools/json-validator` | Workspace loads with `initialMode="validate"`; Validate button active; validation card displayed. |

---

## 8. Test Execution Mapping Summary

- **Total Test Cases Defined:** 65 deterministic test specifications
  - Positive Test Cases (`POS`): 34
  - Negative Test Cases (`NEG`): 4
  - Boundary Test Cases (`BND`): 6
  - Regression Test Cases (`REG`): 8
  - UI Interaction Test Cases (`UI`): 13
- **Traceability:** 100% of the 94 discovered features in `feature-registry.json` map directly to one or more test specifications in this matrix.
- **Fixtures:** All test cases utilize local synthetic fixtures located in `docs/qa/json-workspace/test-fixtures/`.
