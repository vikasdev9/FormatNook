# FormatNook 🛠️

> **Modern Developer Utilities & Online Formatting Platform**  
> Fast, client-side, privacy-first developer tools running 100% locally in your browser.

---

## 🌟 Overview

FormatNook is an open-source suite of developer utilities designed for maximum speed, security, and developer ergonomics. Sensitive data (source code, JSON, tokens, credentials, images, SQL) is processed entirely within the browser via client-side JavaScript. Zero payload transmission or server-side logging.

## 📦 Project Structure

```text
FormatNook/
├── FormatNookHub/          # Next.js 14 Web Application (App Router, React 18, TypeScript)
│   ├── app/                # Route handlers, pages, metadata, and dynamic category views
│   ├── components/         # Shared UI components, header, footer, editors, command palette
│   ├── config/             # Typed central registries (tools, categories, site config)
│   ├── features/           # Modular tool suites
│   │   ├── diff/           # Text Comparison & Diff Checker (Myers Diff algorithm)
│   │   ├── json/           # JSON Formatter, Minifier, Validator
│   │   ├── xml/            # XML Formatter & Syntax Validator
│   │   ├── yaml/           # YAML Formatter & Indentation Validator
│   │   ├── base64/         # Text & Image Base64 Converters
│   │   ├── encoders-decoders/ # Hex, PDF, Audio, Video, Basic Auth, HTML, CSS Encoders
│   │   └── beautifiers/    # HTML, CSS, JavaScript, and SQL Code Beautifiers
│   ├── e2e/                # Playwright end-to-end test suites
│   ├── styles/             # Modular CSS design system (tokens, themes, workspace)
│   └── types/              # TypeScript definitions & schemas
└── FormatNookBackend/      # Backend microservices and API integration workspace
```

## 🚀 Key Features

- **Text Comparison / Diff Checker**: Side-by-side & unified inline text comparison powered by Myers Diff Algorithm. Features line, word, and character-level difference highlighting, live statistics, whitespace/case filtering, and unified diff export.
- **Code Formatters & Beautifiers**: Instant formatting with customizable indentation for JSON, XML, YAML, HTML, CSS, JavaScript, and SQL.
- **Encoders & Decoders**: Comprehensive suite for Base64, Hexadecimal, Basic Auth headers, Files, PDFs, Audio, Video, and Data URIs.
- **100% Local Processing**: No external API dependencies for utility operations. Your code stays private on your machine.
- **Theme Support**: Seamless dark and light modes with system auto-detection.
- **Responsive Layout**: Optimized for desktop, tablet, and mobile screens.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17+ or 20+
- npm, pnpm, or yarn

### Installation & Development

```bash
# Navigate to the frontend hub
cd FormatNookHub

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
cd FormatNookHub

# Run Vitest unit & integration tests
npm test

# Run Playwright end-to-end tests
npm run test:e2e
```

## 📄 License

MIT License. Built for developers with privacy and speed.

