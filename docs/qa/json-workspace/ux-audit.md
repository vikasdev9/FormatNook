# Phase 5 QA Report: JSON Workspace Developer UX Audit

**Module:** JSON Workspace (`features/json/`)\
**Auditor:** Senior Developer Tools Architect / Principal QA Engineer\
**Audit Date:** November 2026\
**Scope:** Human-centric developer workflow audit across Code, Tree, Table views, modals, and toolbars.

---

## 1. Executive Summary

The FormatNook Hub JSON Workspace provides a high-utility, developer-first environment featuring real-time formatting, dual-engine editing (Monaco & Standalone), AST folding, JSONPath evaluation, JSON Schema validation, and TypeScript/Python/Rust code generation.

This audit evaluates the real-world ergonomics, discoverability, feedback loops, error resilience, and edge-case handling from the perspective of an engineering team using FormatNook daily.

---

## 2. Comprehensive UX Findings & Issue Register

### UX-01: Destructive "Clear" Action Lacks Soft-Undo or Confirmation
- **User Problem:** Clicking the "Clear" button (`ResetButton`) instantly clears both input and output editors without confirmation or a temporary undo toast. If a developer accidentally clicks Clear on uncommitted code, they can experience data loss.
- **Reproduction Steps:**
  1. Paste an unformatted JSON document into the input editor.
  2. Click the "Clear" button in the upper right toolbar.
  3. Both input and output are immediately purged to `""`.
- **Impact:** High frustration and data loss risk if user has no external backup of the pasted snippet.
- **Suggested Improvement:**
  - Option A: Add a lightweight confirmation modal if document size $> 500$ characters.
  - Option B: Display an undo toast notification (`"Workspace cleared — Undo (Ctrl+Z)"`) that temporarily preserves the cleared string in memory for 10 seconds.
- **Priority:** **P2 (Recommended)** | **Optional before production** (Standard Ctrl+Z restores in Standalone/Monaco, but explicit UI feedback is preferred).

---

### UX-02: Stale Output Indicator Visibility When Auto-Format is Disabled
- **User Problem:** When `autoFormat` is toggled OFF (to optimize performance or preserve manual indentation), editing the input editor leaves the output editor in an outdated state. While the footer status changes to `outdated`, the output panel itself does not visually communicate that its contents no longer match the input.
- **Reproduction Steps:**
  1. Disable auto-format via `toggle-auto-format-btn`.
  2. Type new keys in the input editor.
  3. Notice that the output editor displays the old JSON output without visible differentiation.
- **Impact:** Developers might copy or download stale output thinking it includes their latest edits.
- **Suggested Improvement:** Apply a subtle opacity drop (`opacity: 0.65`) to the output panel or render an overlay badge: `"Output is outdated — Click Beautify to recompute"`.
- **Priority:** **P2 (Recommended)** | **Optional before production**.

---

### UX-03: Standalone Syntax Error Banner Does Not Auto-Scroll to Line
- **User Problem:** In Standalone mode, when a syntax error occurs (e.g. `Line 18, Column 4: Unexpected token }`), clicking the error banner does not automatically scroll the editor to Line 18 or focus the caret at that position.
- **Reproduction Steps:**
  1. Paste a 200-line JSON document with a trailing comma on line 140.
  2. The validation banner reports `"Line 140, Column 22"`.
  3. Click the error message.
  4. The editor does not scroll to line 140; user must manually scroll down.
- **Impact:** Decreased debugging efficiency on large JSON documents.
- **Suggested Improvement:** Add an `onClick` handler on the error pill that calculates character offset from line/column and sets `textarea.setSelectionRange(offset, offset)` and `textarea.focus()`.
- **Priority:** **P2 (Recommended)** | **Optional before production**.

---

### UX-04: Toolbar Feature Density on Laptops (1024px – 1366px)
- **User Problem:** The JSON Workspace provides 14+ distinct actions (Beautify, Minify, Validate, Auto Repair, Transform, JSONPath, Schema, Stats, Compare, Code Models, JSON5, Palette, Recents, Shortcuts). On 13-inch laptops or split-screen windows, this causes toolbar buttons to wrap onto multiple rows or push editor height down.
- **Reproduction Steps:**
  1. Set browser viewport to 1024x768.
  2. Open the JSON Workspace.
  3. Observe that the toolbar consumes up to 3 vertical lines of screen real estate.
- **Impact:** Reduces vertical code editing area.
- **Suggested Improvement:** Consolidate secondary utilities into categorized dropdown groups:
  - **Transform Menu:** Convert to CSV, XML, YAML, Flatten, Unflatten, One-Line, Stringify.
  - **Inspect Menu:** JSONPath, Schema, Stats, Code Models.
  - **Settings Menu:** Palette, Shortcuts, Recents.
- **Priority:** **P3 (Nice to Have)** | **Optional before production**.

---

### UX-05: Tree View Multi-Match Navigation Chevrons
- **User Problem:** Searching inside Tree View highlights matching keys and values, but if there are 15 occurrences of `"status"`, the user cannot cycle through matches using Next / Previous buttons.
- **Reproduction Steps:**
  1. Load a product catalog with 50 items.
  2. Switch to Tree View and enter `"price"` in the tree search bar.
  3. Matching nodes highlight in orange, but there is no arrow to jump to the next matching node.
- **Impact:** Users must manually scroll through the entire tree to find subsequent matches.
- **Suggested Improvement:** Add `"Prev"` and `"Next"` arrow buttons next to `tree-search-input` that increment `activeMatchIndex` and scroll the active node into view.
- **Priority:** **P3 (Nice to Have)** | **Optional before production**.

---

## 3. Positive UX Highlights

1. **Dual-Editor Freedom:** Developers can switch freely between Monaco (heavyweight, feature-rich) and Standalone (lightweight, instant-load) with zero configuration loss.
2. **Instant Auto Repair:** The Auto Repair engine fixes common JSON syntax bugs (trailing commas, comments, single quotes) in a single click, saving developers from tedious manual cleanup.
3. **Multi-Model Code Generation:** Direct generation of TypeScript types, Python dataclasses, and Rust structs saves substantial boilerplate creation time.
4. **Relational Table View:** Automatically parsing JSON arrays into sortable, searchable tables with one-click CSV export eliminates the need for separate spreadsheet converter tools.
