# Advanced Base64 Repair & Normalization Engine Report

## 1. Executive Summary

FormatNook Hub provides a comprehensive, production-grade **Base64 Repair & Normalization Engine** designed to solve encoding corruption, wrapper pollution, missing padding, and false-positive extraction issues commonly encountered when working with Base64 images.

Unlike naive string-replacement tools or cloud-based decoders that upload user payloads to remote servers, FormatNook executes 100% client-side in the browser, adhering to zero-knowledge privacy principles while delivering robust extraction accuracy, strict RFC 4648 compliance checking, binary file signature inspection, and round-trip integration with the Base64 to Image Decoder.

---

## 2. Architecture & Pipeline Overview

The repair engine operates as a sequential, multi-stage pipeline:

```
[Raw Malformed Input]
         │
         ▼
 Stage A: Input Format Inspection
         │
         ▼
 Stage B: Intelligent Payload Extraction
         │
         ▼
 Stage C: Safe Normalization (Lossless Pass)
         │
         ▼
 Stage D: Controlled Aggressive Repair (Optional User-Selected Mode)
         │
         ▼
 Stage E: Strict Base64 & Binary Signature Validation
         │
         ▼
[Structured Result & Live Image Preview]
```

---

## 3. Pipeline Stages Detailed Specification

### Stage A — Input Format Inspection
The engine categorizes the incoming payload into one of 9 recognized input formats without mutating the raw input:
- `plain_base64`: Unwrapped Base64 sequence.
- `data_uri`: Complete RFC 2397 Data URI (`data:[mediatype][;base64],<data>`).
- `json_object`: JSON object containing one or more fields.
- `json_string`: JSON string literal containing an encoded payload.
- `escaped_json`: JSON string with escaped quotes (`\"`) and newlines (`\n`).
- `key_value`: Assignment statements (e.g. `banner_image = data:...` or `image: "..."`).
- `url_safe`: RFC 4648 §5 URL and Filename Safe alphabet (`-` and `_`).
- `embedded_text`: Mixed documents, markdown `![]()`, HTML `<img>`, or server logs.
- `empty`: Blank or whitespace-only input.

### Stage B — Intelligent Payload Extraction
Addresses false-positive extraction (such as treating JSON property names like `banner_image` as `banner/image`):
- **Structured JSON Traversal**: Parses JSON objects and arrays recursively. Extracts string values while strictly ignoring property keys.
- **Natural Language Discrimination**: Distinguishes English text sentences from Base64 payloads based on word boundaries, spaces between lowercase words, and character frequencies.
- **Data URI Isolation**: Isolates `data:...;base64,` prefixes and captures declared MIME types while preserving payload integrity.
- **Key-Value Parsing**: Extracts property names and values separately with bounded identifier matching to prevent catastrophic backtracking.
- **Multi-Candidate Preservation**: When multiple Base64 images exist in one document (e.g., thumbnail and full banner), both are extracted as distinct candidates, allowing the user to select which payload to repair and decode.

### Stage C — Safe Normalization (Lossless)
Transforms the payload into canonical RFC 4648 Base64 without altering underlying byte data:
1. **BOM Removal**: Strips UTF-8 Byte Order Marks (`\uFEFF`, `\uFFFE`).
2. **Data URI Normalization**: Strips `data:[<mime>];base64,` header while preserving declared MIME metadata. Maps common aliases (e.g. `image/jpg` $\rightarrow$ `image/jpeg`).
3. **JSON String Escaping**: Safely parses and normalizes escaped newlines (`\r\n`, `\n`) and backslashes (`\/` $\rightarrow$ `/`).
4. **Whitespace & Break Stripping**: Removes tabs, newlines, carriage returns, non-breaking spaces (`\u00A0`), and zero-width spaces (`\u200B`).
5. **URL-Safe Conversion**: Converts `-` to `+` and `_` to `/` only when URL-safe alphabet is explicitly identified or requested.
6. **Mathematical Padding Repair**:
   - Computes unpadded length modulo 4:
     - Remainder 0: Clean, no padding needed.
     - Remainder 2: Appends `==`.
     - Remainder 3: Appends `=`.
     - Remainder 1: Reports unrecoverable truncated length (cannot guess missing byte).
   - Cleans misplaced internal `=` characters located in the middle of a corrupted string.

### Stage D — Controlled Aggressive Repair (Advanced Mode)
- Destructive character removal is strictly isolated to **Advanced Repair Mode**.
- Default Safe Normalization mode never discards characters silently.
- When enabled by the user:
  - Strips non-alphabet foreign characters (e.g. `$`, `@`, `#`, `!`).
  - Re-computes padding alignment.
  - Logs every removed character and its occurrence count.
  - Generates clear user warnings explaining that decoded bytes may be altered.

### Stage E — Validation & Binary Image Signatures
Separates syntactic Base64 validity from binary image validity:
1. **RFC 4648 Syntax Check**: Verifies alphabet, modulo 4 length, and padding placement.
2. **Byte Decoding & Canonical Round-Trip**: Decodes to `Uint8Array`, re-encodes, and flags non-canonical padding bits.
3. **Magic Number Inspection**: Detects real file format from decoded bytes:
   - **PNG**: `89 50 4E 47 0D 0A 1A 0A` (IHDR dimensions, color type, bit depth).
   - **JPEG**: `FF D8 FF` (SOF0/SOF1/SOF2 marker dimensions and truecolor sampling).
   - **GIF**: `47 49 46 38` (GIF87a / GIF89a screen descriptors).
   - **WebP**: `RIFF` .... `WEBP` (VP8 lossy / lossless dimensions).
   - **BMP**: `42 4D` (Bitmap file header).
   - **SVG**: Sandboxed XML parsing.
4. **MIME Alias Reconciliation**: Reconciles declared vs detected MIME types (e.g., declared `image/png` but detected `image/jpeg`).

---

## 4. End-to-End User Workflow

The complete seamless round-trip between the Base64 to Image Decoder and the Repair & Normalize workspace:

```
┌──────────────────────────────────────┐
│       Base64 to Image Decoder        │
│   (User pastes malformed payload)    │
└──────────────────┬───────────────────┘
                   │  Decode error occurs
                   ▼
┌──────────────────────────────────────┐
│      Validation Error Banner         │
│  [Wrench] Repair & Normalize Payload │
└──────────────────┬───────────────────┘
                   │  Click action: Transfers input ephemerally
                   ▼
┌──────────────────────────────────────┐
│      Base64 Repair Workspace         │
│  - Intelligent JSON Extraction       │
│  - Safe Normalization Applied        │
│  - Format & Dimension Detection      │
│  - Live Repaired Image Preview       │
│  [Arrow] Use Repaired Base64         │
└──────────────────┬───────────────────┘
                   │  Click action: Sends canonical Base64 back
                   ▼
┌──────────────────────────────────────┐
│       Base64 to Image Decoder        │
│  - Input replaced with clean Base64  │
│  - Decodes automatically             │
│  - Live image rendered in preview    │
└──────────────────────────────────────┘
```

---

## 5. Privacy & Security Guarantees

1. **Zero Network Transmission**: Processing is 100% client-side in the browser. No Base64 data is ever transmitted to remote APIs.
2. **Ephemeral Memory Transfer**: Payloads transferred between Decoder and Repair tabs reside solely in active React component state. No Base64 payloads are written to URL query strings or browser `localStorage`.
3. **SVG Sandboxing**: Decoded SVG images are rendered via sandboxed `Blob` URLs (`URL.createObjectURL`) within standard `<img>` tags, strictly preventing script execution from untrusted SVG payloads.
4. **Memory Management**: All generated object URLs are tracked in component refs and revoked on unmount or payload change to prevent browser heap leaks.
