# Base64 Repair Engine — Technical Capabilities & Known Limitations

## 1. Technical Boundary & Design Philosophy

Base64 is a deterministic binary-to-text encoding scheme defined by RFC 4648. Each Base64 character represents exactly 6 bits of data, with 4 characters encoding 3 bytes (24 bits).

**FormatNook's Repair Engine guarantees data integrity over false promises:**
The engine will repair any structural, wrapper, padding, or whitespace defect that is mathematically recoverable. However, it will never fabricate missing bytes, guess random characters, or claim a corrupted payload is healthy when the underlying image data cannot be decoded.

---

## 2. Recoverable Corruption Types

The following categories of defects are fully recoverable:

| Defect Type | Cause | Recovery Mechanism | Safety Level |
|---|---|---|:---:|
| **Wrapper Pollution** | Base64 copied from JSON API responses (`{"image": "..."}`) | Structured JSON traversal extracts the payload while discarding keys | **100% Lossless** |
| **Data URI Headers** | Payload prefixed with `data:image/...;base64,` | Strips prefix header; extracts and preserves declared MIME metadata | **100% Lossless** |
| **Embedded Newlines** | Line breaks inserted by email clients or terminal wrapping | Normalizes `\r\n` and `\n` to a contiguous stream | **100% Lossless** |
| **Escaped Sequences** | JSON string escaping (`\\n`, `\\/`, `\\\"`) | Normalizes escaped characters via JSON-safe unescaping | **100% Lossless** |
| **Unicode & Spaces** | Non-breaking spaces (`\u00A0`), zero-width spaces, or tabs | Purges whitespace characters without altering Base64 alphabet | **100% Lossless** |
| **Missing Padding (Rem 2)** | Length % 4 = 2 (missing 2 padding characters) | Mathematically appends `==` | **100% Lossless** |
| **Missing Padding (Rem 3)** | Length % 4 = 3 (missing 1 padding character) | Mathematically appends `=` | **100% Lossless** |
| **Misplaced Padding** | `=` characters copied in the middle of a string | Cleans internal misplaced padding; re-aligns trailing `=` | **100% Lossless** |
| **URL-Safe Encoding** | Characters `-` and `_` used instead of `+` and `/` | Translates alphabet to standard RFC 4648 | **100% Lossless** |
| **Percent-Encoding** | URL-encoded symbols (`%2B`, `%2F`, `%3D`) | Decodes symbols to their standard Base64 equivalents | **100% Lossless** |
| **Foreign Characters** | Inadvertent symbols (`$`, `@`, `#`) mixed into payload | **Advanced Mode Only**: Discards foreign characters and logs count | **Controlled Recovery** |

---

## 3. Unrecoverable Corruption Types

The following conditions cannot be mathematically reconstructed without the original source file:

### 1. Truncated Length Remainder 1 ($N \equiv 1 \pmod 4$)
- **Why it is unrecoverable**: In Base64, a single character represents only 6 bits. Since the smallest unit of digital data is 1 byte (8 bits), 6 bits cannot represent even a single complete byte. Appending padding (`=`) to a single character is invalid under RFC 4648 §4.
- **Engine Behavior**: The engine flags an unrecoverable remainder 1 error and refuses to invent random characters.

### 2. Missing Compressed Bitstream Data
- **Why it is unrecoverable**: Modern image formats (PNG, JPEG, WebP) rely on compression algorithms (DEFLATE / LZ77, Huffman, Discrete Cosine Transform). If 100 characters in the middle of an image stream are deleted during copy-paste, the decompression dictionaries lose sync, causing decoder decompression failure.
- **Engine Behavior**: Base64 syntax validation succeeds (`isBase64Valid: true`), but image signature validation correctly reports `isImageValid: false` with an explicit corruption warning.

### 3. Missing File Signatures
- **Why it is unrecoverable**: If the first 8–16 bytes of an image (e.g. PNG signature `89 50 4E 47` or JPEG marker `FF D8 FF`) are missing, browsers cannot determine the canvas dimensions or color space.
- **Engine Behavior**: The engine indicates that while the Base64 decodes into raw bytes, it does not match any recognized image format.

### 4. Bit Shift from Arbitrary Character Removal
- **Caution with Advanced Repair Mode**: Base64 is a 6-bit packed bitstream. If 1 valid character was accidentally removed by the user before pasting, every subsequent character's 6 bits shift by 6 positions, corrupting all downstream bytes.
- **Engine Behavior**: Advanced mode clearly warns the user: `"Warning: X foreign characters were removed. Underlying decoded bytes may be altered."`

---

## 4. User Troubleshooting Guide

1. **If the status shows "Unrecoverable length remainder 1"**:
   - Check the end of your pasted string. Ensure the final characters were not accidentally cut off during copy-paste.
2. **If the status shows "Valid Base64, but not an image"**:
   - The payload may be plain UTF-8 text, an encrypted token (JWT), a PDF, or a binary file rather than an image. Switch to the **Smart Inspector** tab to view the true payload category.
3. **If multiple candidates are detected**:
   - Click each candidate pill (e.g. `thumbnail` vs `full_banner`) to preview each image before selecting **Use Repaired Base64**.
