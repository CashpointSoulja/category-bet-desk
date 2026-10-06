# Brand sheet: mirroring Fleek's live product UI

Category Bet Desk is an independent concept. It borrows Fleek's public visual language so it reads as a tool that could sit inside Fleek's own product. It is not a Fleek product and is not affiliated with Fleek.

Inspected on 6 October 2026: joinfleek.com home (1366 px desktop and 390 px mobile), `/careers`, `/category/denim`, the site's inline CSS custom properties, and the site's own logo assets.

## Logo
- The official mark is the black "FLEEK" wordmark with the starburst, served by the live site as `/_next/static/media/black_logo_transparent_background.webp` (the footer logo, alt "Fleek Logo"). It is used unmodified at `public/brand/fleek-logo.webp`.
- During the inspection the header showed a seasonal "FLEEKY FRIDAY" sale lockup. This concept does not use that lockup.
- The logo sits top-left. The persistent label "Independent concept by Ayo Ahmed. Not affiliated with Fleek." appears in the top strip and next to the logo.

## Colour (taken from the live site's `--cf-*` custom properties)
| Token | Hex | Live use | Use here |
|---|---|---|---|
| `--cf-black` | `#0f0f0f` | Login button, headings | Primary text, primary button |
| `--cf-yellow` | `#f8c642` | Sign Up button, careers hero, accent words, breadcrumb chevrons | Primary accent, eyebrow pill, "Load pilot readings" button |
| `--cf-yellow-dark` | `#e6b52f` | Hover | Hover |
| `--cf-cream` | `#f6f1e7` | "As seen in" band, technology section | Page bands, panels |
| `--cf-orange` | `#f25c2a` | Highlights | Kill / fail state |
| `--cf-blue` | `#0d2bff` | Links | Links |
| `#f86868` | | Sale/discount badges | Discount-style badge, used sparingly |
| `#eaecf0`, `#98a2b3`, `#475467` | | Borders and secondary text | Borders and secondary text |

## Type
- Montserrat throughout, as on the live site. It is open-licensed (SIL OFL) and self-hosted here via `@fontsource/montserrat`, so no fallback font is needed.
- Headings are 700–800 weight in tight, sentence-case blocks ("Vintage Denim", "The world's most broken supply chain"). Small caps-tracked eyebrow labels in dark yellow ("THE PROBLEM", "THE TECHNOLOGY").

## Components mirrored
- **Top strip**: Fleek uses a thin promo bar with a bold lead phrase. Here it is black with the lead phrase in yellow and carries the independence notice.
- **Header**: logo, icon+label nav ("Categories / Brands / Suppliers"), a 2 px black-bordered search box with a "Search for" placeholder, a yellow pill button and a black pill button.
- **Listing cards**: white, thin border, image area, then the title, a bold price, a grey "$/pc" line and a grey "Shipping Inc." chip. Bet cards reuse this pattern: a category tile with a HYPOTHESIS badge, the title, bold bundle price, grey £/pc, the "Shipping Inc." chip, contribution per bundle and a gate chip.
- **Technology section cards**: cream sub-panels and a large metric row. Reused as cream KPI tiles above the bundle P&L.
- **Stat tiles**: small white bordered boxes with a large bold number and a small caption ("15B items collected/year").
- **Mobile**: a hamburger and logo row, then a full-width search box, a single column, and full-width yellow CTAs.

See [visual-guide.md](visual-guide.md) for the screen-by-screen rules and reference captures.
