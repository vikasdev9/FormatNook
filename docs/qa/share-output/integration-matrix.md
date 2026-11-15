# FormatNook Hub — Universal Share Output System
**Universal Tool Integration & Compatibility Matrix**

---

## 1. Tool-by-Tool Integration Summary

| Workspace Module | Route | Action Bar Location | Button Sequence | Adapter Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **Base64 Repair & Normalize** | `/tools/base64-to-image` (Tab: Repair) | Right Editor Panel Header | `[Share] [Copy Repaired] [Download] [Use Repaired]` | `features/encoders-decoders/adapters/base64-repair-share.adapter.ts` |
| **Base64 to Image Decoder** | `/tools/base64-to-image` (Tab: Decoder) | Decoded Media Preview Header | `[Share] [Download]` | `features/encoders-decoders/adapters/base64-decoder-share.adapter.ts` |
| **Base64 Encoder Suite** | `/tools/encoders-decoders` | Output Panel Header | `[Share] [Wrap] [Copy Output] [Download]` | `features/encoders-decoders/adapters/base64-decoder-share.adapter.ts` |
| **JSON Workspace** | `/tools/json-formatter` | Output Panel Header | `[Share] [Copy Output] [Download]` | `features/json/adapters/json-share.adapter.ts` |
| **YAML Workspace** | `/tools/yaml-formatter` | Output Panel Header | `[Share] [Copy Output] [Download]` | `features/yaml/adapters/yaml-share.adapter.ts` |
| **XML Workspace** | `/tools/xml-formatter` | Output Panel Header | `[Share] [Copy Output] [Download]` | `features/xml/adapters/xml-share.adapter.ts` |
| **Text Diff Checker** | `/tools/diff-checker` | Main Toolbar Right Group | `[Settings] [Share] [Copy Diff] [Download Diff]` | `features/diff/adapters/diff-share.adapter.ts` |
| **Code Beautifiers** | `/tools/sql-formatter`, `/tools/html-formatter`, etc. | Output Panel Header | `[Share] [Copy Output] [Download]` | `features/beautifiers/adapters/beautifier-share.adapter.ts` |

---

## 2. Format Capabilities Matrix

### 2.1 Base64 Repair & Normalize
1. **Repaired Base64 Text**: `.txt` (UTF-8) — Direct Web Share, Direct Download, Clipboard Copy.
2. **Decoded Image File**: `.${detectedFormat}` (`image/*`) — Direct Web Share (as `File`), Direct Download.
3. **Image & Repair PDF Report**: `.pdf` (`application/pdf`) with embedded Image XObject (`/Filter /DCTDecode`), dimension table, bytes count, and repair transformations.
4. **Image Metadata JSON**: `.json` (`application/json`) — Machine-readable validation and dimension diagnostics.
5. **Repair Summary Report**: `.txt` (`text/plain`) — Human-readable transformations audit log.

### 2.2 Base64 to Image Decoder (Decoder Mode)
1. **Decoded Image File**: `.${ext}` (`image/*`) — Direct Web Share (as `File`), Direct Download.
2. **Image & Decode PDF Report**: `.pdf` (`application/pdf`) with embedded decoded image preview, dimensions (`W × H px`), file size, and decoding verification status.
3. **Base64 Source String**: `.txt` (`text/plain`) — Original input Base64 string for quick clipboard reuse.
4. **Image Metadata JSON**: `.json` (`application/json`) — Full structured metadata report.

### 2.3 JSON Workspace
1. **Formatted JSON**: `.json` (`application/json`) — Standardized 2-space indented payload.
2. **Minified JSON**: `.json` (`application/json`) — Stripped whitespace optimized for network transfer.
3. **JSON Metrics & Structure Report**: `.json` (`application/json`) — Key counts, max depth, type distributions, and compression savings percentage.

### 2.4 YAML Workspace
1. **Clean YAML Document**: `.yaml` (`text/yaml`) — Standardized YAML configuration payload.
2. **YAML Audit & Structure Summary**: `.txt` (`text/plain`) — Document count, line count, and byte size.

### 2.5 XML Workspace
1. **Formatted XML Document**: `.xml` (`application/xml`) — Standardized 2-space indented XML.
2. **Minified XML**: `.xml` (`application/xml`) — Compressed XML string.
3. **XML Structure & Metrics Report**: `.json` (`application/json`) — Tag counts, attribute frequencies, and size comparison.

### 2.6 Text Diff Checker
1. **Unified Diff Patch**: `.patch` (`text/plain`) — Standard unified diff patch compatible with `git apply` and GNU `patch`.
2. **Comparison Summary Report**: `.txt` (`text/plain`) — Additions (+), removals (-), modifications (~), and difference ratio percentage.

### 2.7 Code Beautifiers (SQL, HTML, CSS, JavaScript)
1. **Beautified File**: `.${langExt}` (`text/*`) — Normalized, syntax-indented code output.
2. **Metrics & Audit Log**: `.txt` (`text/plain`) — Line count, character length, and validation confirmation.

---

## 3. Platform Compatibility & Edge-Case Safety

| Test Scenario | Web Share API | Direct Download | Clipboard Copy | Verified Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Chrome / Safari** | Native OS Share Sheet | Fallback | Available | Passes file attachment to system apps |
| **Desktop Edge / Chrome** | Native Windows/macOS Share | Available | Available | Native window with email/messaging apps |
| **Desktop Firefox (No Web Share)** | Graceful Fallback | Triggered via Blob | Available | Directly starts download with toast |
| **User Abort / Cancel** | Handled silently | **Suppressed** | **Suppressed** | No download, no false success, no error banner |
| **Binary to Clipboard Request** | N/A | Available | Blocked with guidance | Prompts user to choose "Download" for binary files |
