---
name: Analytical
colors:
  primary: "#2563EB"
  secondary: "#1D4ED8"
  success: "#16A34A"
  warning: "#EA580C"
  danger: "#DC2626"
  surface: "#FFFFFF"
  text: "#1E293B"
  neutral: "#F1F5F9"
typography:
  h1:
    fontFamily: "Inter"
    fontSize: 1.75rem
  body-md:
    fontFamily: "Inter"
    fontSize: 1rem
  label-caps:
    fontFamily: "Inter"
    fontSize: 0.6875rem
  sourceScale: "12/14/16/18/24/32"
  weights: "400, 500, 600, 700"
rounded:
  sm: 6px
  md: 10px
  lg: 14px
spacing:
  sm: 4px
  md: 8px
  sourceScale: "4/8/12/16/24/32/48"
---

## Overview

Professional analytical dashboard inspired by CashFlow Pro. Light sidebar, vibrant blue accents, metric header strip, and data-dense calendar grids. Contrasts with 004 Paper (print) and 005 Ink (teal/dark nav).

## Style Foundations

- **Visual style:** clean, professional, data-forward
- **Typography:** Inter throughout (UI + labels)
- **Color palette:** blue primary (#2563EB), light gray surfaces (#F1F5F9), green/orange/red status indicators
- **Spacing scale:** 4/8/12/16/24/32/48
- **Mobile:** bottom nav (≤768px), hamburger drawer for full sidebar, min 44px touch targets, horizontal scroll for wide grids with sticky month column
- **Desktop:** persistent left sidebar (240px), no bottom nav

## Shared CSS

All screens link `css/analytical.css` (replaces 004's `paper.css` / 005's `ink.css`). Screen-specific CSS files keep the same names as 004/005.

## JS

Copy JS from 005 unchanged — only HTML/CSS styling changes.

## Branding

- App name: **CashFlow Pro**
- Mode label: **Analytical Mode** (below logo in sidebar)
- Nav items include inline SVG icons (calendar, list, wallet, etc.)

## Navigation pattern (mobile)

```html
<nav class="bottom-nav" aria-label="Main">
  <!-- 5 primary tabs: Calendar, Transactions, Forecast, Categories, More -->
</nav>
```

Sidebar `.nav` hidden on mobile; drawer opens from hamburger in header.

## Year Calendar (reference screen)

- Header row: sticky **Month** column + day-of-month columns **1–31** (not weekday abbreviations)
- Month rows: month name only — muted grey (historical), blue (current), dark (projected)
- Grid is linear: column N = day N of the month (no weekday padding cells)
- Zebra striping on alternate rows
- Day cells: centered day number, status bars at bottom (green=income, orange=outflow), red dot top-right for below-buffer
- Selected day: light blue background + blue border
- Trailing empty cells for months with fewer than 31 days
