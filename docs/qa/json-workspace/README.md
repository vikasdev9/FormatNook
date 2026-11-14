# JSON Workspace QA Documentation & Architecture

## 1. Overview & Objective

This directory contains the comprehensive Quality Assurance (QA) documentation, feature inventory, architectural mapping, and test tracking for the **JSON Workspace** module of **FormatNook Hub**.

- **Module**: JSON Workspace (`features/json`)
- **Primary Routes**:
  - `/tools/json-minifier` (Default target route; launches in `minify` mode)
  - `/tools/json-formatter` (Launches in `format` mode)
  - `/tools/json-validator` (Launches in `validate` mode)
- **Development URL**: `http://localhost:3000` (E2E server: `http://127.0.0.1:3005`)
- **Core Principle**: 100% Client-Side Zero-Knowledge Privacy Architecture. Payloads never leave local browser memory.

---

## 2. Scope Boundaries

This QA documentation and audit are **strictly restricted to the JSON Workspace**.

### In Scope:
- JSON Workspace root container (`features/json/components/JsonWorkspace.tsx`)
- JSON Toolbar, menus, options, and actions (`JsonToolbar.tsx`, `JsonFoldingMenu.tsx`)
- Code Editor integrations (Monaco Editor & Custom Standalone Editor in `components/workspace/CodeEditor.tsx`)
- Interactive Tree View (`JsonTreeView.tsx`) and Tabular Grid View (`JsonTableView.tsx`)
- JSONPath Evaluator drawer (`JsonPathPanel.tsx`)
- All JSON Modals: Transform (`JsonTransformModal.tsx`), Auto-Repair (`JsonRepairModal.tsx`), Schema Validation (`JsonSchemaModal.tsx`), Metrics (`JsonStatsModal.tsx`), Recents/Favorites (`JsonRecentModal.tsx`), CodeGen Models (`JsonCodeGenModal.tsx`), Diff/Compare (`JsonDiffModal.tsx`), Color Palette (`JsonColorPaletteModal.tsx`), Shortcuts (`JsonShortcutsModal.tsx`)
- Supporting Services: formatting, validation, folding, palette, worker client, storage, codegen, diff, samples, and JSON5.

### Out of Scope:
- XML Workspace (`features/xml`)
- YAML Workspace (`features/yaml`)
- Base64 Tools (`features/encoders-decoders`)
- Text Diff standalone tool (`features/diff`)
- Homepage and navigation shell redesign

---

## 3. Directory Contents

| File | Description |
|---|---|
| [README.md](file:///D:/FormatNook/docs/qa/json-workspace/README.md) | Entrypoint guide, scope boundaries, and QA overview. |
| [feature-inventory.md](file:///D:/FormatNook/docs/qa/json-workspace/feature-inventory.md) | Comprehensive human-readable inventory of all 94 discovered features with IDs, actions, status, and test coverage. |
| [feature-registry.json](file:///D:/FormatNook/docs/qa/json-workspace/feature-registry.json) | Machine-readable JSON database of all 94 features for automation and test runner mapping. |
| [qa-progress.md](file:///D:/FormatNook/docs/qa/json-workspace/qa-progress.md) | QA execution status, phase milestones, coverage metrics, and identified edge-case testing gaps. |
| [tool-status.md](file:///D:/FormatNook/docs/qa/json-workspace/tool-status.md) | Verification and status matrix of testing tools (Playwright Test, Playwright MCP, Browser Use, Specwright). |
| [architecture-map.md](file:///D:/FormatNook/docs/qa/json-workspace/architecture-map.md) | Architectural diagrams, component hierarchy, service dependencies, data flow, and privacy guarantees. |

---

## 4. Testing Frameworks Status

In compliance with project QA standards:
1. **Playwright Test (@playwright/test v1.65.0)**: **Available & Primary**. 31 dedicated E2E tests in `e2e/json-workspace.spec.ts`.
2. **Playwright MCP**: **Unavailable** (not configured in workspace MCP server registry).
3. **Browser Use**: **Unavailable** (framework not installed locally).
4. **Specwright**: **Unavailable** (framework not installed locally).

---

## 5. Verification Commands

```bash
# Run all JSON unit and integration tests (17 test suites, 140 tests)
npm test -- features/json/tests/

# Run complete Vitest suite (38 test files, 406 tests)
npm test

# Run Playwright E2E suite for JSON Workspace
npx playwright test e2e/json-workspace.spec.ts

# Run TypeScript typecheck
npx tsc --noEmit

# Run Next.js production build
npm run build
```
