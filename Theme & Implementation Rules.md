````markdown
# WPC | WeaponpowerCloud App Theme — Implementation Rules  
*(Night Mode & Dark Mode, English & Arabic support)*  

These rules are the single source of truth that **every front‑end agent** must follow when building or extending the WPC | WeaponpowerCloud App website.  
Keep this file handy and reference it before writing any component, style sheet, or media‑query logic.

---

## 0  Bilingual & Direction‑Aware Design  *(NEW)*  

| Requirement | Rule |
|-------------|------|
| **Switching** | Every page must be able to toggle between **English (LTR)** and **Arabic (RTL)** at runtime without reload. Expose an `i18n.toggleLanguage()` helper (or equivalent) that updates both the **`lang`** (`en` / `ar`) and **`dir`** (`ltr` / `rtl`) attributes on `<html>`. |
| **Text** | All static strings **must come from translation files** (e.g. `/src/i18n/en.json`, `/src/i18n/ar.json`). Never hard‑code copy in components. |
| **Fonts** | Load Google Font *Inter* for English and *Tajawal* for Arabic (weights 300 / 400 / 600). Swap families via `lang` attribute:```css[lang="ar"]{font-family:"Tajawal",sans-serif}```|
| **Layout mirroring** | Use **CSS logical properties** (`margin-inline-start`, `padding-inline-end`, `border-inline-start`) so layouts auto‑flip when `dir="rtl"`. If absolute positioning is unavoidable, add a `[dir="rtl"]` override block inside the same `.module.css`. |
| **Icons & arrows** | Provide RTL variants for directional glyphs (chevrons, progress steps). |
| **Numbers & dates** | Format through the i18n layer (`Intl.NumberFormat`, `Intl.DateTimeFormat`). Arabic uses Arabic‑Indic numerals where appropriate. |
| **Testing matrix** | Verify every component in **LTR** and **RTL** across the six breakpoints defined in §4. Use screenshots for visual diff checks. |

---

## 1  Color Palette (hard‑coded hex)

> **Important:** **DO NOT** rely on `var(--token‑name)` in production CSS.  
> You may keep the token names in comments for readability, but every declaration must use the **raw hex value** shown below.

| Token name (for docs / comments) | Hex value | Intended use |
|----------------------------------|-----------|--------------|
| **LIGHT** |
| `bg‑light‑primary`   | #F5F3EE | page background |
| `bg‑light‑surface`   | #FFFFFF | cards / panels |
| `brand‑green`        | #997A51 | primary actions |
| `brand‑gold`         | #CFA365 | secondary accents |
| `accent‑neon`        | #AE5D5A | hover / glow |
| `accent‑cyan`        | #E5D2BA | info / badges |
| `text‑light‑high`    | #262626 | headings |
| `text‑light‑muted`   | #5E4E3F | body text |
| `border‑light`       | #E5D2BA | dividers |
| **NIGHT** |
| `bg‑night‑primary`   | #262626 | page background |
| `bg‑night‑surface`   | #42403B | cards / panels |
| `brand‑green`        | #997A51 | primary actions |
| `brand‑gold`         | #CFA365 | secondary accents |
| `accent‑neon`        | #AE5D5A | hover / glow |
| `accent‑cyan`        | #E5D2BA | info / badges |
| `text‑night‑high`    | #F5F3EE | headings |
| `text‑night‑muted`   | #909090 | body text |
| `border‑night`       | #5E4E3F | dividers |



### Usage pattern

```css
/* ❌  Don’t do this
button { background: var(--brand-green); }
*/

/* ✅  Do this  —— token kept as a comment */
button {
  /* brand‑green */
  background: #007E31;
  color: #E8EDF2; /* text‑night‑high */
}
````

---

## 2  CSS Authoring Rules

1. **No Tailwind, no utility frameworks.** Use vanilla CSS only.
2. **File naming:** every stylesheet is a **CSS Module** and **must** end with `.module.css`

   ```
   Header.module.css
   Card.module.css
   ```
3. **Scope:** rely on the local scoping provided by CSS Modules; avoid `!important`.
4. **Organise** – group related selectors, keep one component per file.
5. **RTL overrides:** place them at the end of the same module:

   ```css
   /* Left padding for LTR/RTL */
   .panel{padding-inline-start:24px;}
   [dir="rtl"] .panel{padding-inline-start:0;padding-inline-end:24px;}
   ```

---

## 3  Component Tokens → Hard‑coded Hex

### Buttons & Interactive Elements

```css
/* Primary Button (Futuristic Glow) */
.primaryButton {
  background: linear-gradient(135deg, #997A51 0%, #CFA365 100%);
  border: 1px solid #AE5D5A;
  color: #F5F3EE;
  box-shadow: 0 0 20px rgba(174, 93, 90, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.primaryButton:hover {
  box-shadow: 0 0 30px rgba(174, 93, 90, 0.6);
  transform: translateY(-2px);
}

/* Secondary Button (Minimalist) */
.secondaryButton {
  background: transparent;
  border: 2px solid #E5D2BA;
  color: #997A51;
  backdrop-filter: blur(10px);
}

/* Night mode button variants */
[data-theme="night"] .primaryButton {
  background: linear-gradient(135deg, #997A51 0%, #CFA365 100%);
  border: 1px solid #AE5D5A;
  color: #F5F3EE;
}

[data-theme="night"] .secondaryButton {
  border-color: #5E4E3F;
  color: #E5D2BA;
}
```

### Cards & Surfaces

```css
/* Glass morphism cards */
.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(229, 210, 186, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

[data-theme="night"] .card {
  background: rgba(66, 64, 59, 0.6);
  border-color: rgba(94, 78, 63, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Floating panels */
.floatingPanel {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 16px 64px rgba(38, 38, 38, 0.1);
  border: 1px solid #E5D2BA;
}

[data-theme="night"] .floatingPanel {
  background: #42403B;
  border-color: #5E4E3F;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6);
}
```

### Navigation & Headers

```css
/* Futuristic navbar */
.navbar {
  background: rgba(245, 243, 238, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 210, 186, 0.3);
}

[data-theme="night"] .navbar {
  background: rgba(38, 38, 38, 0.9);
  border-bottom-color: rgba(94, 78, 63, 0.3);
}

/* Holographic borders */
.holoBorder {
  position: relative;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #997A51, #CFA365) border-box;
  mask: linear-gradient(#FFFFFF 0 0) padding-box, linear-gradient(#FFFFFF 0 0);
  mask-composite: xor;
}
```

### Form Elements

```css
/* Futuristic inputs */
.input {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid #E5D2BA;
  border-radius: 12px;
  color: #262626;
  padding: 16px 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.input:focus {
  border-color: #AE5D5A;
  box-shadow: 0 0 20px rgba(174, 93, 90, 0.2);
  outline: none;
}

[data-theme="night"] .input {
  background: rgba(66, 64, 59, 0.3);
  border-color: #5E4E3F;
  color: #F5F3EE;
}

[data-theme="night"] .input:focus {
  border-color: #AE5D5A;
  box-shadow: 0 0 20px rgba(174, 93, 90, 0.4);
}
```

---

## 4  Responsive & Device‑Specific Design

### Breakpoint System (Mobile‑First)

```css
/* Base styles (mobile) */
.container {
  padding: 16px;
  max-width: 100%;
}

/* Tablet portrait: 768px+ */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 728px;
    margin: 0 auto;
  }
}

/* Tablet landscape: 1024px+ */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 984px;
  }
}

/* Desktop: 1280px+ */
@media (min-width: 1280px) {
  .container {
    padding: 40px;
    max-width: 1200px;
  }
}

/* Large desktop: 1536px+ */
@media (min-width: 1536px) {
  .container {
    padding: 48px;
    max-width: 1440px;
  }
}

/* Ultra-wide: 1920px+ */
@media (min-width: 1920px) {
  .container {
    padding: 56px;
    max-width: 1800px;
  }
}
```

### Touch & Hover Optimizations

```css
/* Touch-friendly targets */
@media (hover: none) and (pointer: coarse) {
  .button {
    min-height: 44px;
    padding: 12px 20px;
  }
  
  .card {
    margin-bottom: 16px;
  }
}

/* Hover-enabled devices */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  }
  
  .button:hover {
    transform: translateY(-1px);
  }
}
```

### Grid Systems

```css
/* Futuristic grid layout */
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid {
    gap: 24px;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    gap: 32px;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .grid {
    gap: 40px;
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 5  Interaction & Motion

### Animation Principles

```css
/* Smooth easing curves */
:root {
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-back: cubic-bezier(0.36, 0, 0.66, -0.56);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Micro-Interactions

```css
/* Magnetic hover effect */
.magneticButton {
  transition: transform 0.3s var(--ease-out-expo);
}

.magneticButton:hover {
  transform: scale(1.05);
}

/* Pulsing glow */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(174, 93, 90, 0.3); }
  50% { box-shadow: 0 0 40px rgba(174, 93, 90, 0.6); }
}

.pulseGlow {
  animation: pulse 2s infinite;
}

/* Floating animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.floating {
  animation: float 3s ease-in-out infinite;
}
```

### Page Transitions

```css
/* Fade in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fadeIn {
  animation: fadeIn 0.6s var(--ease-out-expo);
}

/* Slide in from right (for RTL support) */
@keyframes slideInInlineStart {
  from { 
    opacity: 0; 
    transform: translateX(-30px);
  }
  to { 
    opacity: 1; 
    transform: translateX(0);
  }
}

[dir="rtl"] @keyframes slideInInlineStart {
  from { 
    opacity: 0; 
    transform: translateX(30px);
  }
  to { 
    opacity: 1; 
    transform: translateX(0);
  }
}

.slideInInlineStart {
  animation: slideInInlineStart 0.5s var(--ease-out-expo);
}
```

### Loading States

```css
/* Shimmer effect */
@keyframes shimmer {
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
}

.shimmer {
  background: linear-gradient(90deg, #E5D2BA 25%, #CFA365 50%, #E5D2BA 75%);
  background-size: 400% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

[data-theme="night"] .shimmer {
  background: linear-gradient(90deg, #5E4E3F 25%, #997A51 50%, #5E4E3F 75%);
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  border: 3px solid #E5D2BA;
  border-top: 3px solid #AE5D5A;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}
```

### Gesture Interactions

```css
/* Swipe indicators */
.swipeIndicator {
  position: relative;
  overflow: hidden;
}

.swipeIndicator::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, #AE5D5A, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.swipeIndicator:hover::after {
  opacity: 1;
}

/* Pull to refresh */
.pullToRefresh {
  transform: translateY(0);
  transition: transform 0.3s var(--ease-out-expo);
}

.pullToRefresh.pulling {
  transform: translateY(60px);
}
```

---

## 6  Accessibility Targets

* **Contrast:** small text (< 18 px) ≥ 4.5 : 1; large text ≥ 3 : 1.
* **Motion reduce:** respect `prefers-reduced-motion` – drop animations to ≤ 100 ms or disable.
* **Keyboard navigation:** all interactive components must have visible focus (`outline: 2px solid` using hover glow color).
* **Screen reader language:** always set correct `lang` attribute on the `<html>` element (`en` or `ar`) so assistive tech announces text in the proper voice.

---

## 7  Language of programming code 
*Typescript*


---

Follow these enhanced rules to deliver a bilingual, direction‑aware, futuristic interface that remains brand‑consistent and accessible on every critical device size.

```
::contentReference[oaicite:0]{index=0}
````
