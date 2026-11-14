---
name: FormatNook Hub
description: Fast, client-side, privacy-first developer utilities and code formatters
colors:
  # Light Theme Base Tokens
  light-bg-primary: "#ffffff"
  light-bg-secondary: "#f8fafc"
  light-bg-tertiary: "#f1f5f9"
  light-bg-card: "#ffffff"
  light-bg-card-hover: "#f8fafc"
  light-bg-elevated: "#ffffff"
  light-text-primary: "#0f172a"
  light-text-secondary: "#475569"
  light-text-muted: "#64748b"
  light-text-subtle: "#94a3b8"
  light-border-subtle: "#e2e8f0"
  light-border-default: "#cbd5e1"
  light-border-strong: "#94a3b8"
  light-accent-primary: "#0284c7"
  light-accent-primary-hover: "#0369a1"
  light-accent-secondary: "#0d9488"
  light-accent-soft: "rgba(2, 132, 199, 0.08)"
  light-accent-border: "rgba(2, 132, 199, 0.25)"
  light-accent-contrast: "#ffffff"

  # Dark Theme Base Tokens
  dark-bg-primary: "#0b0f19"
  dark-bg-secondary: "#111827"
  dark-bg-tertiary: "#1f2937"
  dark-bg-card: "#131c2e"
  dark-bg-card-hover: "#1b263b"
  dark-bg-elevated: "#162032"
  dark-text-primary: "#f8fafc"
  dark-text-secondary: "#cbd5e1"
  dark-text-muted: "#94a3b8"
  dark-text-subtle: "#64748b"
  dark-border-subtle: "#1e293b"
  dark-border-default: "#334155"
  dark-border-strong: "#475569"
  dark-accent-primary: "#38bdf8"
  dark-accent-primary-hover: "#7dd3fc"
  dark-accent-secondary: "#2dd4bf"
  dark-accent-soft: "rgba(56, 189, 248, 0.12)"
  dark-accent-border: "rgba(56, 189, 248, 0.3)"
  dark-accent-contrast: "#0f172a"

  # Semantic & Status Tokens
  color-success: "#10b981"
  color-success-bg-light: "#ecfdf5"
  color-success-bg-dark: "rgba(16, 185, 129, 0.12)"
  color-error: "#ef4444"
  color-error-bg-light: "#fef2f2"
  color-error-bg-dark: "rgba(239, 68, 68, 0.12)"
  color-warning: "#f59e0b"
  color-warning-bg-light: "#fffbeb"
  color-warning-bg-dark: "rgba(245, 158, 11, 0.12)"
  color-info: "#3b82f6"
  color-info-bg-light: "#eff6ff"
  color-info-bg-dark: "rgba(59, 130, 246, 0.12)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  subtitle:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.light-accent-primary}"
    textColor: "{colors.light-accent-contrast}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.light-bg-tertiary}"
    textColor: "{colors.light-text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-sm:
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  badge:
    rounded: "{rounded.full}"
    padding: "3px 10px"
  editor-panel:
    rounded: "{rounded.lg}"
---

## Overview

FormatNook Hub visual design embodies high-density, restrained developer-tool craft. The interface is engineered for high productivity, scanability, and complete trust: developers paste proprietary code, database queries, JWT tokens, and credentials with zero visual ambiguity about what runs where.

**The Zero-Knowledge Surface Rule.** The interface never mimics cloud-processing behaviors: no mock upload bars, no artificial progress spinners, and no delayed states. Every interaction reflects instantaneous local JavaScript execution.

**The No-Glassmorphism Rule.** Workspaces, editor panels, toolbars, and cards use solid, high-contrast surface fills with crisp 1px borders. Translucent frosted glass, heavy blurs, and floating dropshadows are forbidden on data surfaces to guarantee zero optical distortion and maximum code legibility.

**The Global Width Rule.** Layouts deliberately expand to utilize 96% to 98% of the browser viewport width (capped at `1920px`). Full-screen code diffing and multiline formatters have no unnecessary gutters or claustrophobic padding.

---

## Colors

Color is deployed with functional discipline. Backgrounds establish clear hierarchy across page backdrop, secondary toolbar ribbons, and editor cards. Accent color guides focus to primary actions without visual fatigue.

**The Dual-Palette Inversion Rule.** Light and dark themes are designed as independent high-contrast visual systems rather than mathematical color inversions:
- **Light Theme**: Built on sterile surgical white surfaces (`#ffffff`) and cool slate card fills (`#f8fafc`, `#f1f5f9`), anchored by deep slate typography (`#0f172a`, `#475569`) and crisp cerulean blue accents (`#0284c7`, hover `#0369a1`).
- **Dark Theme**: Built on deep obsidian navy (`#0b0f19`) and tinted midnight containers (`#111827`, `#131c2e`, `#162032`), paired with ice-white text (`#f8fafc`, `#cbd5e1`) and vibrant electric sky blue accents (`#38bdf8`, hover `#7dd3fc`).

### Light Theme Role Hierarchy
- **Canvas (`--bg-primary`)**: `#ffffff` — clean, neutral backdrop for page content.
- **Secondary Surfaces (`--bg-secondary`)**: `#f8fafc` — gutter backgrounds, tool headers, and active dropdown items.
- **Tertiary Controls (`--bg-tertiary`)**: `#f1f5f9` — secondary button fills and inactive pill chips.
- **Card & Editor (`--bg-card`)**: `#ffffff` — main code editing surfaces and tool cards.
- **Text Primary (`--text-primary`)**: `#0f172a` — headings, high-priority labels, and editor code text.
- **Text Secondary (`--text-secondary`)**: `#475569` — subheadings, metadata labels, and toolbar controls.
- **Text Muted / Subtle (`--text-muted`, `--text-subtle`)**: `#64748b` / `#94a3b8` — placeholders, line gutters, and helper notes.
- **Borders (`--border-subtle`, `--border-default`, `--border-strong`)**: `#e2e8f0` / `#cbd5e1` / `#94a3b8` — crisp structural dividers and panel framing.
- **Accent Primary (`--accent-primary`, `--accent-primary-hover`)**: `#0284c7` / `#0369a1` — interactive primary buttons, focus rings, and active tabs.
- **Accent Soft (`--accent-soft`, `--accent-border`)**: `rgba(2, 132, 199, 0.08)` / `rgba(2, 132, 199, 0.25)` — badge backgrounds and active selection highlights.

### Dark Theme Role Hierarchy
- **Canvas (`--bg-primary`)**: `#0b0f19` — deep dark void preventing eye strain in low-light environments.
- **Secondary Surfaces (`--bg-secondary`)**: `#111827` — toolbars, gutters, and search headers.
- **Tertiary Controls (`--bg-tertiary`)**: `#1f2937` — inactive tab backgrounds and hover states.
- **Card & Editor (`--bg-card`)**: `#131c2e` — prominent elevated panels and workspace editors.
- **Text Primary (`--text-primary`)**: `#f8fafc` — crisp, high-contrast code and header text.
- **Text Secondary (`--text-secondary`)**: `#cbd5e1` — readable toolbar labels and tab titles.
- **Text Muted / Subtle (`--text-muted`, `--text-subtle`)**: `#94a3b8` / `#64748b` — line numbers and disabled actions.
- **Borders (`--border-subtle`, `--border-default`, `--border-strong`)**: `#1e293b` / `#334155` / `#475569` — precise panel separation lines.
- **Accent Primary (`--accent-primary`, `--accent-primary-hover`)**: `#38bdf8` / `#7dd3fc` — electric cyan interactive elements.
- **Accent Soft (`--accent-soft`, `--accent-border`)**: `rgba(56, 189, 248, 0.12)` / `rgba(56, 189, 248, 0.3)` — subtle tinted badges.

### Semantic Status Colors
- **Success (`--color-success`)**: `#10b981` (Light) / `#34d399` (Dark) — valid syntax checks, copy confirmations, and format success.
- **Error (`--color-error`)**: `#ef4444` (Light) / `#f87171` (Dark) — syntax parse errors, malformed tokens, and line coordinate callouts.
- **Warning (`--color-warning`)**: `#f59e0b` (Light) / `#fbbf24` (Dark) — large file processing alerts and performance ceiling notices.
- **Info (`--color-info`)**: `#3b82f6` (Light) / `#60a5fa` (Dark) — encoding tips and educational guidance.

---

## Typography

Typography establishes an unambiguous distinction between human-readable UI copy and machine-readable data payloads.

**The Strict Font Separation Rule.** UI copy (navigation, titles, labels, badges) uses modern system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`). Code editors, diff lines, line gutters, byte counters, and raw payloads strictly use monospace (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`).

### Scale & Hierarchy
- **Hero Display (`3.25rem` / `52px`, weight 800, line-height `1.15`, tracking `-0.035em`)**: High-impact marketing headline on the homepage.
- **Tool Header (`1.875rem` / `30px`, weight 700, line-height `1.25`, tracking `-0.025em`)**: Main tool titles at the top of every workspace.
- **Section Title (`1.75rem` / `28px`, weight 700, line-height `1.3`, tracking `-0.02em`)**: Category headers and homepage section titles.
- **Panel Header (`0.8125rem` / `13px`, weight 600, line-height `1.4`)**: Compact titles inside workspace editor headers ("Input", "Output", "Decoded Credentials").
- **Body UI (`0.875rem` / `14px`, weight 400–500, line-height `1.6`)**: Descriptions, options labels, button text, and modal navigation.
- **Code Editor & Payload (`0.8125rem` / `13px`, weight 400, line-height `1.5rem` / `24px`)**: Textareas, diff engines, and code gutters. Line height is explicitly locked to `1.5rem` (`24px`) to ensure 1-to-1 vertical synchronization with line number gutters.
- **Micro UI & Badges (`0.75rem` / `12px` to `0.6875rem` / `11px`, weight 600)**: Keyboard shortcut badges, line/column stats, and status pills.

---

## Layout

Layout structure balances maximum working canvas for developers with consistent global navigation.

**The Split-Editor Parity Rule.** Workspace grids enforce a 50/50 two-column split (`.editor-workspace-grid`) on desktop viewports (`> 900px`). Both Input and Output panels have identical minimum height (`min-height: 420px; height: 460px;`) and identical line-height metrics (`1.5rem`) so users can scan side-by-side without visual displacement.

### Viewport Adaptation & Breakpoints
- **Desktop (1024px–1920px)**: Global width set to `min(97%, 1920px)`. Editors render side-by-side in a 2-column grid (`1fr 1fr`) with a `1.25rem` (`20px`) gap.
- **Tablet (768px–1023px)**: Editors stack or adapt to split resizer. Top nav links collapse into quick search.
- **Mobile (375px–767px)**: Two-column grids stack vertically into 1 column (`grid-template-columns: 1fr`). Horizontal format pills scroll cleanly with `overflow-x: auto; scrollbar-width: none;`.

### Structural Rhythm
- Header height: `64px` (`var(--header-height)`).
- Workspace top padding: `1.5rem` (`24px`), bottom padding: `4rem` (`64px`).
- Spacing between tool header and action toolbar: `1rem` (`16px`).
- Gap between toolbar controls: `0.5rem` (`8px`).

---

## Elevation & Depth

FormatNook Hub intentionally rejects artificial skeuomorphism and excessive blur. Depth is communicated primarily through surface color shifts and crisp 1px borders, reinforced by subtle ambient shadows.

**The Border-First Elevation Rule.** Every card, panel, modal, and button uses a solid 1px border (`var(--border-subtle)` or `var(--border-default)`) to delineate edges. Shadows serve only as secondary ambient depth cues.

### Shadow Scale
- **`--shadow-xs` (`0 1px 2px rgba(0,0,0,0.04)` [Light] / `rgba(0,0,0,0.2)` [Dark])**: Subtly grounds editor panels and static cards.
- **`--shadow-sm` (`0 1px 3px rgba(0,0,0,0.08)` [Light] / `rgba(0,0,0,0.3)` [Dark])**: Applied to interactive primary buttons and pill chips.
- **`--shadow-md` (`0 4px 6px -1px rgba(0,0,0,0.08)` [Light] / `rgba(0,0,0,0.4)` [Dark])**: Hover elevation for category cards and toolbar popovers.
- **`--shadow-lg` (`0 10px 15px -3px rgba(0,0,0,0.08)` [Light] / `rgba(0,0,0,0.5)` [Dark])**: Active input focus elevation and floating drawers.
- **`--shadow-xl` (`0 20px 25px -5px rgba(0,0,0,0.08)` [Light] / `rgba(0,0,0,0.6)` [Dark])**: Global command palette modal backdrop overlay.

---

## Shapes

Corners are calibrated to soften technical interfaces while maintaining a disciplined, professional grid.

**The Radius Hierarchy Rule.** Small interactive elements receive smaller radii; large grouping containers receive larger radii:
- **`--radius-sm` (`6px`)**: Compact buttons (`.btn-sm`), keyboard shortcut badges, and scrollbar thumbs.
- **`--radius-md` (`10px`)**: Standard buttons (`.btn`), form inputs, select dropdowns, and search triggers.
- **`--radius-lg` (`14px`)**: Toolbars, editor panels (`.editor-panel`), category cards, and modal dialogs.
- **`--radius-xl` (`20px`)**: Hero search container and large highlight callouts.
- **`--radius-full` (`9999px`)**: Status badges (`.badge`), format pills, and tag counters.

---

## Components

### 1. Buttons (`.btn`)
- **Primary (`.btn-primary`)**: Solid accent background (`#0284c7` Light / `#38bdf8` Dark), contrasting text (`#ffffff` Light / `#0f172a` Dark), `font-weight: 500`, `border-radius: 10px`. On hover: lifts `-1px` with darker/lighter accent.
- **Secondary (`.btn-secondary`)**: Surface background (`var(--bg-tertiary)`), subtle 1px border (`var(--border-subtle)`), text `var(--text-primary)`.
- **Outline (`.btn-outline`)**: Transparent fill with `1px solid var(--border-default)`.
- **Ghost (`.btn-ghost`)**: Fully transparent fill, text `var(--text-secondary)`, hover background `var(--bg-tertiary)`.
- **Sizes**: Standard (`padding: 0.5rem 1rem; font-size: 0.875rem`), Small (`padding: 0.25rem 0.625rem; font-size: 0.75rem`), Large (`padding: 0.75rem 1.5rem; font-size: 1rem`).

### 2. Status Badges (`.badge`)
- Rounded pills (`border-radius: 9999px; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; line-height: 1`).
- **Accent (`.badge-accent`)**: Soft tint background (`rgba(2, 132, 199, 0.08)`), text `var(--accent-primary)`, border `var(--accent-border)`.
- **Success (`.badge-success`)**: Light green background, text `#10b981` / `#34d399`.
- **Error (`.badge-error`)**: Light red background, text `#ef4444` / `#f87171`.
- **Warning (`.badge-warning`)**: Light amber background, text `#f59e0b` / `#fbbf24`.

### 3. Toolbars & Symmetrical Mode Switchers
- Symmetrical mode switcher tabs (`ToolModeTabs`): active mode receives `.btn-primary` with `<Check size={14} />` and `disabled`; inactive mode receives `.btn-secondary` with `<ArrowRightLeft size={14} />` for 1-click pivot.
- Format Ribbon (`aria-label="Base64 Format Selection"`): horizontal pill group with format-specific icons (`ImageIcon`, `FileCode`, `Music`, `Video`, `Binary`, `FileText`, `Code`, `Key`), active badge highlight, and smooth horizontal scrolling.
- Quick Format Dropdown (`select#base64-format-select`): native grouped `<select>` control for instant jump across 11 formats.

### 4. Code & Textarea Editors
- Integrated line gutter (`48px` width, `background: var(--bg-secondary)`, right-aligned line numbers).
- Textarea body (`font-family: var(--font-mono)`, `font-size: 0.8125rem`, `line-height: 1.5rem`).
- Word wrap support: `.editor-textarea.wrap-text` sets `white-space: pre-wrap !important; word-break: break-all !important; overflow-wrap: anywhere !important; overflow-y: auto !important; overflow-x: hidden !important;` to gracefully wrap long unbroken Base64 strings.
- Interactive `[Wrap]` toggle button located in panel headers next to `[Copy]`.
- Status bar footer: real-time Ln, Col, Total Lines, Char count, and Byte size (`formatByteSize`).

### 5. Quick Command Palette Modal (`Ctrl+K`)
- Fixed full-screen backdrop (`rgba(0, 0, 0, 0.5)` with `backdrop-filter: blur(4px)`).
- Centered modal container (`max-width: 600px; border-radius: 14px; background: var(--bg-card)`).
- Instant search input with category groupings, arrow key selection, and enter navigation.

---

## Do's and Don'ts

### Do's
- **Do** preserve the solid, high-contrast flat aesthetic. Rely on 1px borders and surface tone steps.
- **Do** maintain separate, fully tested palettes for Light and Dark themes.
- **Do** lock code line heights to exactly `1.5rem` (`24px`) whenever paired with numeric gutters.
- **Do** wrap continuous unbroken strings (Base64, hex dumps, hashes) using `word-break: break-all` and `overflow-wrap: anywhere`.
- **Do** expand workspaces to utilize global width (`min(97%, 1920px)`) to provide developers maximum working canvas.
- **Do** place accessible focus rings (`outline: 2px solid var(--accent-primary); outline-offset: 2px;`) on all interactive controls.
- **Do** reserve dedicated non-intrusive placeholders for ads (`.ad-slot-wrapper`) outside primary code-editing flow.

### Don'ts
- **Don't** introduce translucent glassmorphism, noisy frosted glass, or background blurs on code editing panels.
- **Don't** use rainbow gradients or multi-color glow effects on workspace headers, buttons, or editors.
- **Don't** write inline styles for layouts, colors, or typography; all styling must use design tokens and modular CSS.
- **Don't** display mock progress bars or upload spinners that imply user payloads are uploaded to a cloud server.
- **Don't** allow unbroken Base64 strings to overflow horizontally without wrapping and vertical scrolling.
- **Don't** create asymmetric mode buttons where inactive states look active.
