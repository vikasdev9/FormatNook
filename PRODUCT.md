# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary [inferred from repo evidence]**: Software engineers (frontend, backend, full-stack), DevOps/SREs, QA engineers, and security analysts manipulating structured data, configs, diffs, and encoded assets during daily development, API integration, and debugging.
- **Secondary [inferred from repo evidence]**: Enterprise engineers and privacy-conscious developers who cannot upload proprietary source code, confidential customer records, credentials, or production tokens to third-party cloud formatting websites.

## Product Purpose
FormatNook is an ultra-fast, privacy-first, client-side developer utility platform. It provides instantaneous formatting, validation, diffing, conversion, and inspection for JSON, XML, YAML, SQL, HTML, CSS, JavaScript, Diff, and Base64 payloads directly in the browser with 100% local processing and zero server-side data retention.

## Positioning
**100% Client-Side Zero-Knowledge Privacy**: Unlike legacy ad-heavy online utility websites (e.g. JSONLint, Base64Guru, Diffchecker) that transmit user data to remote servers or log queries, FormatNook executes all parsers, diff algorithms, encoders, and inspectors locally in browser memory. Sensitive code, database queries, JWT claims, and credentials never touch a server.

## Operating Context
- **Environment**: Modern web browsers (Chrome, Firefox, Safari, Edge) across Desktop (1024px–1920px+), Tablet (768px), and Mobile (375px–430px).
- **Workflows**:
  - Daily iterative payload formatting, minification, and syntax repair.
  - Line, word, and character-level side-by-side or inline text comparison (Myers Diff).
  - Multi-format Base64 workbench: inspect unknown payloads, decode images/audio/video/PDFs, extract embedded Base64 from server logs, and generate Basic Auth headers.
  - Multi-document YAML editing (K8s / Docker Compose) and XML XPath exploration.
- **Interaction Model**: Dual-panel side-by-side code editors, resizable split views, real-time status bar (lines, columns, character/byte counters), copy-to-clipboard, file drag-and-drop, and client-side binary downloads.

## Capabilities and Constraints
- **Core Capabilities**:
  - 29 fully implemented, static-rendered tool workspaces (Next.js 14 SSG, 51 static pages).
  - Background Web Worker parsing for large documents (>100KB JSON) to keep the UI thread responsive.
  - Real-time word wrap with break-all protection for continuous unbroken Base64 strings.
  - Dark and Light theme support with system auto-detection.
  - Central typed Tool Registry with SEO metadata, JSON-LD schemas, and dynamic XML sitemaps.
- **Constraints**:
  - Zero-Knowledge Client-Side Only: No backend processing or storage of user payloads allowed.
  - Main-thread safety ceilings: Myers diff search distance cutoff ($D \ge 2000$) to prevent browser heap exhaustion on adversarial divergent inputs.
  - Zero inline styles for layout: strict adherence to modular CSS architecture (`tokens.css`, `globals.css`, `components.css`, `workspace.css`, `home.css`).
  - Reserved, non-intrusive ad placeholders (AdSense compliant, tool-top/sidebar separation without disrupting editor workflow).

## Brand Commitments
- **Name**: FormatNook (FormatNook Hub).
- **Tagline**: Modern, Private, All-in-One Developer Tools & Utilities.
- **Voice**: Restrained, pragmatic, developer-first, transparent, and authoritative. No marketing fluff, no deceptive claims.
- **Typography & Aesthetics**: Clean high-contrast developer theme (`var(--bg-primary)`, `var(--bg-secondary)`, `var(--accent-primary)`), Inter for UI typography, JetBrains Mono for editor and code surfaces.

## Evidence on Hand
- Full Next.js 14 codebase at `FormatNookHub/` with 344/344 passing Vitest unit tests and 123/123 passing Playwright E2E tests.
- Central Tool Registry at `FormatNookHub/config/tools.ts`.
- Modular CSS design tokens at `FormatNookHub/styles/tokens.css`.
- Site metadata at `FormatNookHub/config/site.ts`.
- Privacy Policy at `FormatNookHub/app/privacy/page.tsx` confirming 100% local client-side processing.

## Product Principles
1. **Zero-Knowledge Privacy as the Non-Negotiable Contract**: User data never leaves the client's device. No telemetry or analytics may ever ingest user input or payload content.
2. **Immediate Utility & Zero Friction**: Every tool must be interactive on first render with curated samples, instant paste, copy, and download actions.
3. **Scanability Over Expression**: Editors, line numbers, error markers, and stats take precedence over decorative UI. Brand personality lives in crisp craft, typography, and precision details.
4. **Resilience on Edge Cases**: Large files, malformed syntax, unbroken Base64 strings, and divergent diffs must fail gracefully with diagnostics rather than freezing or crashing the tab.

## Accessibility & Inclusion
- WCAG AA contrast compliance across both Light and Dark themes.
- Full keyboard navigation for editor actions, tabs, modal dialogs, and format selectors.
- Screen-reader accessible status announcements, tablists (`role="tab"`, `aria-selected`), and descriptive button labels.
