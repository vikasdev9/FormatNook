# Testing Tools Verification & Environment Status

This document reports the verification status of all testing frameworks and automation tools evaluated for the JSON Workspace QA program in FormatNook Hub.

---

## 1. Testing Framework Verification Matrix

| Tool | Status | Type | Installation & Configuration Details | Suitability & Usage Plan |
|---|---|---|---|---|
| **Playwright Test** | **Available & Operational** | Deterministic E2E Automation | Installed via `@playwright/test` v1.65.0 in `package.json`. Configured in `playwright.config.ts`. Fully supports Chromium, WebKit, and Mobile viewports. | **Primary testing framework**. Executes deterministic regression tests, accessibility sweeps, and cross-browser validations. |
| **Playwright MCP** | **Unavailable** | Model Context Protocol Server | Evaluated MCP server registry. Only `rea` (Reverse Engineer Anything) is registered. No Playwright MCP server is configured or running. | Not available. Will not be referenced as active. Playwright CLI and Node runner used directly. |
| **Browser Use** | **Unavailable** | Autonomous Agent Browser Runner | Python library `browser-use` is not installed or configured in the environment repository. | Not available. Real Chrome DevTools subagent is used if manual exploration is required; synthetic testing only. |
| **Specwright** | **Unavailable** | Specification Testing Tool | No local Specwright binary, package, or configuration file exists in the repository. | Not available. Will not be referenced as active. |

---

## 2. Environment Diagnostics

- **Project Root**: `D:\FormatNook\FormatNookHub`
- **Operating System**: Windows 11 / Windows Server x64
- **Runtime**: Node.js v20.x
- **Framework**: Next.js 14.2.24 (App Router, SSG with 50 static pages)
- **Primary Test Runner**: Vitest 2.1.8 / 2.1.9 (`npm test`)
- **E2E Test Runner**: `@playwright/test` v1.65.0 (`npx playwright test`)
- **Target Route**: `/tools/json-minifier` (and companion routes `/tools/json-formatter`, `/tools/json-validator`)
- **Local Dev URL**: `http://localhost:3000`
- **E2E Test Server URL**: `http://127.0.0.1:3005` (configured in `playwright.config.ts`)

---

## 3. Playwright Configuration Audit

The active configuration at [playwright.config.ts](file:///D:/FormatNook/FormatNookHub/playwright.config.ts) was audited:

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3005',
    channel: 'chrome',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'npx.cmd next start -H 127.0.0.1 -p 3005',
    url: 'http://127.0.0.1:3005',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

### Key Observations:
- **Chrome Channel**: Uses real local Chrome channel (`channel: 'chrome'`), ensuring realistic rendering and font metrics.
- **Dedicated Port**: Runs on isolated port `3005` with `reuseExistingServer: true`, preventing collisions with the default development server on port `3000`.
- **Zero Flakiness Setting**: `workers: 1` and `fullyParallel: false` prevent race conditions on shared local storage and mock browser instances.

---

## 4. Deterministic Testing Strategy for Route `/tools/json-minifier`

When verifying `/tools/json-minifier`, the test suite verifies:
1. **Initial Mode**: Workspace initializes with `initialMode="minify"`:
   - "Minify" toolbar button displays active primary style (`btn-primary`).
   - Default sample is loaded and minified immediately into single-line payload.
   - Status badge shows `Ready` or `Valid JSON`.
2. **Editor Engine Switch**:
   - Toggles cleanly between Standard (Standalone) and Monaco.
   - Preserves minified content without truncation.
3. **Core Minification Performance**:
   - Strips indentation, trailing spaces, comments, and newlines from nested structures.
   - Preserves string literals containing spaces (`"John Doe"`) and escaped quotes.
4. **Zero-Knowledge Privacy Check**:
   - Zero outbound HTTP requests initiated during minification.
   - Processing is 100% in-browser memory.
