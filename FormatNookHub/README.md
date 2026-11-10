# FormatNook Hub 🛠️

> **Next-Generation Modular Developer Tools & Online Utilities Platform**  
> Ultra-fast, privacy-first, 100% client-side processing in your browser with zero server data collection.

---

## 🌟 Overview & Architecture

**FormatNook** is an enterprise-grade, feature-driven developer utility platform built with Next.js App Router, React, and strict TypeScript. It delivers instantaneous code formatting, syntax validation, Base64 encoding/decoding, and text processing directly on the client machine.

### Key Architectural Pillars:

1. **100% Client-Side Privacy**: Code snippets, payloads, images, and SQL queries are processed locally by client JavaScript. Zero sensitive data is uploaded or logged.
2. **Feature-Driven Modular Architecture**: Every tool belongs to an isolated, self-contained feature module (`features/json`, `features/xml`, `features/yaml`, `features/base64`, `features/beautifiers`).
3. **Typed Central Tool Registry**: All routes, metadata, SEO configurations, category groupings, and search indexes are centrally registered in `config/tools.ts`.
4. **Zero-Inline-CSS Strict Styling**: All design tokens, theme variables, component styles, and workspace grids reside in dedicated CSS files (`styles/tokens.css`, `styles/globals.css`, `styles/components.css`, `styles/workspace.css`, `styles/home.css`, `styles/adslot.css`).
5. **SEO & AdSense Ready**: Automatic JSON-LD schema generation (`WebApplication`, `BreadcrumbList`, `FAQPage`), dynamic XML sitemap (`/sitemap.xml`), robots.txt, and reserved, non-intrusive AdSense placeholders.

---

## 🚀 Fully Working Tools (29 Implemented & Tested)

### 🔐 Encoders & Decoders Suite (Directory: `/tools/encoders-decoders`)

| Direction | Tool | Route | Description |
| :--- | :--- | :--- | :--- |
| **Decoder** | **Base64 to Text** | `/tools/base64-to-text` | Decode standard and URL-safe Base64, UTF-8 text with binary hex preview |
| **Decoder** | **Base64 to Image** | `/tools/base64-to-image` | Reconstruct PNG, JPG, WebP, SVG from Base64 with safe sandbox preview |
| **Decoder** | **Base64 to File** | `/tools/base64-to-file` | Reconstruct binary files with magic byte format detection and safe naming |
| **Decoder** | **Base64 to PDF** | `/tools/base64-to-pdf` | Validates `%PDF-` signature with PDF preview and download |
| **Decoder** | **Base64 to Audio** | `/tools/base64-to-audio` | MP3, WAV, OGG decoding with interactive audio player preview |
| **Decoder** | **Base64 to Video** | `/tools/base64-to-video` | MP4, WebM decoding with interactive video player preview |
| **Decoder** | **Base64 to Hex** | `/tools/base64-to-hex` | Decodes Base64 into formatted hex bytes (uppercase, space/colon separated) |
| **Decoder** | **Basic Auth Decoder** | `/tools/basic-auth-decoder` | Decodes HTTP Basic Authorization headers locally. Never logs or persists secrets |
| **Encoder** | **Text to Base64** | `/tools/text-to-base64` | Standard and URL-safe Base64 UTF-8 encoder |
| **Encoder** | **Image to Base64** | `/tools/image-to-base64` | File drag-and-drop, preview, Data URI & raw Base64 outputs |
| **Encoder** | **File to Base64** | `/tools/file-to-base64` | Encodes arbitrary binary files with large output streaming & download |
| **Encoder** | **PDF to Base64** | `/tools/pdf-to-base64` | Encodes PDF documents into Base64 and application/pdf Data URIs |
| **Encoder** | **Audio to Base64** | `/tools/audio-to-base64` | Encodes audio files (MP3, WAV, OGG) with expansion warnings |
| **Encoder** | **Video to Base64** | `/tools/video-to-base64` | Encodes short video clips (MP4, WebM) with memory-safe download handling |
| **Encoder** | **Hex to Base64** | `/tools/hex-to-base64` | Converts hexadecimal strings to Base64 (cleans spaces, 0x, colons) |
| **Encoder** | **HTML to Base64** | `/tools/html-to-base64` | Encodes HTML code into Data URIs and sandboxed iframe snippets |
| **Encoder** | **CSS to Base64** | `/tools/css-to-base64` | Encodes CSS stylesheets into Data URIs and inline `<link>` snippets |
| **Encoder** | **URL to Base64** | `/tools/url-to-base64` | Encodes target URL string bytes locally without fetching |

### 📄 Code Formatters, Beautifiers & Parsers

| Category | Tool | Route | Description |
| :--- | :--- | :--- | :--- |
| **JSON** | **JSON Formatter & Beautifier** | `/tools/json-formatter` | Indentation (2, 4, tab), beautify, upload/download, copy |
| **JSON** | **JSON Validator** | `/tools/json-validator` | Strict RFC 8259 syntax checker with line & column diagnostics |
| **JSON** | **JSON Minifier** | `/tools/json-minifier` | Strips whitespace without altering string contents |
| **XML** | **XML Formatter** | `/tools/xml-formatter` | Clean indentation and tag alignment |
| **XML** | **XML Validator** | `/tools/xml-validator` | Well-formedness inspector detecting unclosed tags |
| **YAML** | **YAML Formatter** | `/tools/yaml-formatter` | Formats Docker and K8s YAML configurations |
| **YAML** | **YAML Validator** | `/tools/yaml-validator` | Strict YAML 1.2 parser catching bad indentation & illegal tabs |
| **Beautifiers** | **HTML Formatter** | `/tools/html-formatter` | Indents DOM hierarchies and standardizes void tags |
| **Beautifiers** | **CSS Formatter** | `/tools/css-formatter` | Structures style declarations, selectors, and properties |
| **Beautifiers** | **JavaScript Formatter** | `/tools/javascript-formatter` | Normalizes function blocks, statements, and indentation |
| **Beautifiers** | **SQL Formatter** | `/tools/sql-formatter` | Uppercases standard keywords, aligns clauses (SELECT, FROM, WHERE, JOIN) |

---

## 📂 Project Directory Structure

```text
FormatNookHub/
├── app/                              # Next.js App Router
│   ├── category/[slug]/page.tsx      # Category landing pages (SSG)
│   ├── tools/[slug]/page.tsx         # Tool workspace pages (SSG with SEO)
│   ├── privacy/page.tsx              # Privacy policy guarantee
│   ├── terms/page.tsx                # Terms of service
│   ├── layout.tsx                    # Root layout with tokens & providers
│   ├── page.tsx                      # Modern SaaS homepage
│   ├── not-found.tsx                 # 404 page
│   ├── robots.ts                     # Search engine crawler config
│   └── sitemap.ts                    # Dynamic XML sitemap
├── components/                       # Shared UI Components
│   ├── home/                         # Homepage components (Hero, Grid, Directory, FAQ)
│   ├── shared/                       # Header, Footer, ThemeToggle, CommandMenu, AdSlot, Breadcrumbs
│   └── workspace/                    # Shared workspace layout, CodeEditor, FileDropzone, Copy/Download
├── config/                           # Central configuration
│   ├── categories.ts                 # 10 comprehensive category definitions
│   ├── site.ts                       # Domain metadata & AdSense configuration
│   └── tools.ts                      # Central typed Tool Registry
├── features/                         # Feature Modules (Isolated & Testable)
│   ├── base64/                       # Base64 services, workspaces & tests
│   ├── beautifiers/                  # HTML, CSS, JS, SQL formatters & tests
│   ├── json/                         # JSON formatter, validator, minifier, repair & tests
│   ├── xml/                          # XML formatter, validator & tests
│   └── yaml/                         # YAML formatter, validator & tests
├── hooks/                            # Reusable hooks (useTheme, useClipboard, useToolHistory)
├── lib/                              # Shared helpers (clipboard, download, file-reader, seo, storage)
├── styles/                           # Separate Modular CSS Architecture
│   ├── tokens.css                    # Design tokens (Light/Dark themes, colors, radiuses)
│   ├── globals.css                   # Resets, baseline typography, scrollbars
│   ├── components.css                # Button, badge, card, modal, nav styles
│   ├── workspace.css                 # Tool split panels, toolbar, stats
│   ├── home.css                      # Hero, directory tabs, FAQ accordion
│   └── adslot.css                    # Reserved AdSense layouts without CLS
├── types/                            # TypeScript interfaces (tool.ts, ad.ts)
├── vitest.config.ts                  # Vitest test runner configuration
├── vitest.setup.ts                   # DOM and clipboard testing mocks
└── tsconfig.json                     # Strict TypeScript config
```

---

## 🛠️ How to Add a New Tool Module

Adding a new tool takes just 4 simple steps without modifying any unrelated code:

### Step 1: Create the Feature Module
Under `features/<module-name>/`:
- `services/<tool>-service.ts`: Pure parser, validator, and formatter functions.
- `components/<Tool>Workspace.tsx`: Interactive client workspace using shared components (`CodeEditor`, `CopyButton`, `DownloadButton`, `FileDropzone`).
- `tests/<tool>-service.test.ts`: Unit tests covering valid, invalid, empty, and edge-case inputs.
- `index.ts`: Public module exports.

### Step 2: Register in `config/tools.ts`
Add the tool's typed definition to `toolRegistry`:
```typescript
{
  id: 'my-new-tool',
  name: 'My New Tool',
  slug: 'my-new-tool',
  description: 'Clean description of what the tool accomplishes.',
  category: 'developer',
  icon: 'Wrench',
  keywords: ['keyword 1', 'keyword 2'],
  searchAliases: ['alias-1'],
  route: '/tools/my-new-tool',
  relatedToolIds: ['json-formatter'],
  status: 'implemented', // or 'planned'
  seoTitle: 'My New Tool Online - FormatNook',
  seoDescription: 'SEO meta description under 160 characters.',
  supportsFileUpload: true,
  supportsDownload: true,
  processesLocally: true,
  educationalContent: {
    overview: 'Educational background and guide...',
    howTo: [...],
    examples: [...],
    faqs: [...]
  }
}
```

### Step 3: Wire into `app/tools/[slug]/page.tsx`
Add a case branch returning your workspace component:
```typescript
case 'my-new-tool':
  return <MyNewToolWorkspace />;
```

### Step 4: Run Tests & Build
```bash
npm test
npm run build
```
Your tool is now automatically included in the homepage directory, search dialog (Ctrl+K), category page, and dynamic sitemap.xml!

---

## 🧪 Testing

Run all unit and integration tests with Vitest:

```bash
npm test
```

Watch mode during development:
```bash
npm run test:watch
```

---

## 🚢 Production Build & Deployment

### Local Development:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build:
```bash
npm run build
npm start
```

### Vercel / Cloud Deployment:
1. Connect repository to [Vercel](https://vercel.com).
2. Set Environment Variables:
   - `NEXT_PUBLIC_SITE_URL`: `https://yourdomain.com`
   - `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`: `ca-pub-XXXXXXXXXXXXXXXX` (Optional)
3. Deploy! Next.js will prerender all 33+ static pages with zero server dependencies.

---

## 📄 License
MIT License. Built with ❤️ for developers by the FormatNook team.
