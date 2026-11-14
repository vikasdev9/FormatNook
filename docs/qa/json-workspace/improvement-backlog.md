# FormatNook Hub: JSON Workspace Improvement Backlog

**Module:** JSON Workspace (`features/json/`)\
**Compiled From:** Phase 1 (Discovery), Phase 2 (Planning), Phase 3 (Functional), Phase 4 (Interaction), and Phase 5 (Production Audit).\
**Status:** Post-Audit Engineering Roadmap

---

## 1. Prioritization Matrix

```
┌─────────────────────────────────────────────────────────────┐
│ PRIORITY 1 (P1): Production Blockers                        │ ◄── 0 Items Remaining (All Prior P1s Resolved)
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ PRIORITY 2 (P2): Recommended Quality & Ergonomics Upgrades   │ ◄── 3 High-Impact Developer Improvements
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ PRIORITY 3 (P3): Nice-to-Have Enhancements & Refinements    │ ◄── 3 Future Roadmap Enhancements
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Priority 1 — Production Blockers
*(None. All baseline functional, security, quota handling, and privacy blockers have been resolved and certified).*

---

## 3. Priority 2 — Recommended Quality & Ergonomics Upgrades

### `BL-P2-01`: Destructive "Clear" Soft-Undo Notification
- **Subsystem:** Workspace Lifecycle / Data Safety
- **Target File:** `FormatNookHub/features/json/components/JsonWorkspace.tsx`, `components/workspace/ResetButton.tsx`
- **Problem Statement:** Clicking "Clear" resets both input and output editors to empty strings instantly without confirmation. While standard browser `Ctrl+Z` can restore content in Standalone, users without keyboard focus or on touch devices face accidental data loss risk.
- **Recommended Implementation:**
  ```typescript
  // Capture cleared content in temporary ref
  const lastClearedRef = useRef<{ input: string; output: string } | null>(null);

  const handleClear = () => {
    if (input.trim().length > 100) {
      lastClearedRef.current = { input, output };
      showToast({
        message: 'Workspace cleared',
        actionLabel: 'Undo',
        onAction: () => {
          if (lastClearedRef.current) {
            setInput(lastClearedRef.current.input);
            setOutput(lastClearedRef.current.output);
          }
        },
        durationMs: 8000
      });
    }
    setInput('');
    setOutput('');
  };
  ```
- **Estimated Effort:** Small (1-2 hours)

---

### `BL-P2-02`: Stale Output Panel Visual De-emphasis When Auto-Format is Disabled
- **Subsystem:** Formatting / Visual Feedback Loop
- **Target File:** `FormatNookHub/features/json/components/JsonWorkspace.tsx`
- **Problem Statement:** When `autoFormat` is toggled off, editing the input leaves the output panel showing prior formatted data. The `isOutdated` state is set, but the output panel does not visually communicate that it is out of sync.
- **Recommended Implementation:**
  - When `isOutdated && !autoFormat`, apply `opacity: 0.65` and `transition-opacity` to the output editor container.
  - Render an absolute-positioned floating pill in the upper right of the output editor:
    ```tsx
    {isOutdated && !autoFormat && (
      <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-medium animate-pulse">
        <span>Output Outdated</span>
        <button onClick={handleFormat} className="underline hover:text-amber-300">Update</button>
      </div>
    )}
    ```
- **Estimated Effort:** Small (1 hour)

---

### `BL-P2-03`: Error Banner Click-to-Jump Navigation in Standalone Mode
- **Subsystem:** Standalone Editor / Error Diagnostics
- **Target File:** `FormatNookHub/features/json/components/JsonWorkspace.tsx`, `components/workspace/ValidationResult.tsx`
- **Problem Statement:** When a syntax error occurs (e.g. `Line 140, Column 12`), the error badge displays the coordinates, but clicking it does not navigate or scroll the standalone `<textarea>` to the offending line.
- **Recommended Implementation:**
  - Pass an `onErrorClick` callback to `ValidationResult`.
  - Calculate character index of line/column:
    ```typescript
    const handleJumpToError = (line: number, column: number) => {
      const textarea = standaloneTextareaRef.current;
      if (!textarea) return;
      const lines = input.split('\n');
      let charOffset = 0;
      for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
        charOffset += lines[i].length + 1; // +1 for \n
      }
      charOffset += Math.max(0, column - 1);
      textarea.focus();
      textarea.setSelectionRange(charOffset, charOffset + 1);

      // Calculate scroll line
      const lineHeight = 20; // px
      textarea.scrollTop = Math.max(0, (line - 5) * lineHeight);
    };
    ```
- **Estimated Effort:** Small (2 hours)

---

## 4. Priority 3 — Nice-to-Have Future Roadmap Enhancements

### `BL-P3-01`: Grouped Toolbar Dropdown Menus for Medium/Small Desktop Viewports
- **Subsystem:** Toolbar / Layout Ergonomics
- **Target File:** `FormatNookHub/features/json/components/JsonToolbar.tsx`
- **Problem Statement:** On 1024px – 1366px screens, 14+ action buttons wrap across multiple rows, reducing editor height.
- **Recommended Implementation:**
  - Group secondary actions into dropdown menus:
    - `Transform`: CSV, XML, YAML, Flatten, Unflatten, One-Line, Stringify.
    - `Inspect`: JSONPath, Schema, Stats, Code Models.
    - `Settings`: Palette, Shortcuts, Recents.
- **Estimated Effort:** Medium (3-4 hours)

---

### `BL-P3-02`: Next / Previous Search Match Chevrons in Tree View
- **Subsystem:** AST Tree View
- **Target File:** `FormatNookHub/features/json/components/JsonTreeView.tsx`
- **Problem Statement:** When searching for repeated keys (e.g. `"id"`), matching nodes highlight, but users must manually scroll through the entire tree to locate them.
- **Recommended Implementation:**
  - Track `matchedPaths: string[]`.
  - Add `<button aria-label="Previous match">` and `<button aria-label="Next match">` beside `tree-search-input`.
  - Auto-expand ancestor paths of the active match and call `nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- **Estimated Effort:** Medium (2-3 hours)

---

### `BL-P3-03`: Streaming & Chunked Parsing for > 50 MB Payloads
- **Subsystem:** Performance / Big Data Handling
- **Target File:** `FormatNookHub/features/json/services/json-worker-client.ts`
- **Problem Statement:** Files exceeding 50 MB can hit V8 engine string limits during JSON.parse in the main thread or worker.
- **Recommended Implementation:**
  - Integrate a streaming JSON parser (e.g. Clarinet or stream-json) inside the Web Worker for datasets exceeding 50 MB.
- **Estimated Effort:** Large (1-2 days)
