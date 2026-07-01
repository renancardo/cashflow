---
name: Ink
colors:
  primary: "#0F172A"
  secondary: "#0D9488"
  success: "#059669"
  warning: "#D97706"
  danger: "#E11D48"
  surface: "#FFFFFF"
  text: "#1E293B"
  neutral: "#F8FAFC"
typography:
  h1:
    fontFamily: "Inter"
    fontSize: 1.75rem
  body-md:
    fontFamily: "Inter"
    fontSize: 1rem
  label-caps:
    fontFamily: "JetBrains Mono"
    fontSize: 0.75rem
  sourceScale: "12/14/16/18/24/32"
  weights: "400, 500, 600, 700"
rounded:
  sm: 6px
  md: 12px
  lg: 16px
spacing:
  sm: 4px
  md: 8px
  sourceScale: "4/8/12/16/24/32/48"
---

## Overview

Mobile-first, card-based design with soft shadows, teal accents, and a bottom tab bar on small screens. Contrasts with prototype 004's Paper print aesthetic.

## Style Foundations

- **Visual style:** modern, airy, touch-friendly
- **Typography:** Inter (UI), JetBrains Mono (labels/amounts)
- **Color palette:** slate primary, teal secondary, rose danger
- **Spacing scale:** 4/8/12/16/24/32/48
- **Mobile:** bottom nav (≤768px), hamburger drawer for secondary links, min 44px touch targets, horizontal scroll for wide tables/calendars
- **Desktop:** persistent left sidebar (240px), no bottom nav

## Shared CSS

All screens link `css/ink.css` (replaces 004's `paper.css`). Screen-specific CSS files keep the same names as 004.

## JS

Copy JS from 004 unchanged — only HTML/CSS styling changes.

## Navigation pattern (mobile)

```html
<nav class="bottom-nav" aria-label="Main">
  <!-- 5 primary tabs: Calendar, Transactions, Forecast, Categories, More -->
</nav>
```

Sidebar `.nav` hidden on mobile; `.nav--drawer` opens from hamburger in header.
