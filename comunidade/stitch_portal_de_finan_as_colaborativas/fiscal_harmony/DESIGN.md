---
name: Fiscal Harmony
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006e2a'
  on-secondary: '#ffffff'
  secondary-container: '#5cfd80'
  on-secondary-container: '#00732c'
  tertiary: '#5d00de'
  on-tertiary: '#ffffff'
  tertiary-container: '#7632fd'
  on-tertiary-container: '#ebe0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#69ff87'
  secondary-fixed-dim: '#3ce36a'
  on-secondary-fixed: '#002108'
  on-secondary-fixed-variant: '#00531e'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#cfbcff'
  on-tertiary-fixed: '#22005d'
  on-tertiary-fixed-variant: '#5400cc'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

This design system is engineered for a high-trust financial community platform. The brand personality is **authoritative yet accessible**, functioning as a reliable mentor in a user's financial journey. It targets a demographic of proactive individuals seeking structured financial wisdom and peer-to-peer accountability.

The visual style is **Corporate Modern**, characterized by exceptional clarity, rhythmic spacing, and a high-contrast interface. We prioritize a "fintech-first" aesthetic that balances the rigor of a banking application with the engagement of a social platform. The emotional response should be one of stability, precision, and upward mobility.

## Colors

The palette is anchored in **Trustworthy Blue** (#0052FF), serving as the primary driver for actions and brand identity. **Growth Green** (#00C853) is utilized strategically for success states, financial gains, and positive momentum indicators. 

The neutral scale is critical for maintaining professional hierarchies. We use a deep slate (#1A1C1E) for primary text to ensure maximum legibility, while background surfaces utilize varying degrees of cool-tinted grays to separate content layers without resorting to heavy lines.

## Typography

This design system utilizes **Inter** for all primary communication due to its exceptional legibility and systematic neutral tone. For technical data and UI labels, we introduce **Geist** to provide a subtle "developer-grade" precision feel, which reinforces the fintech nature of the product.

Headlines should always use a medium to bold weight with slight negative letter-spacing to appear compact and authoritative. Body text maintains a generous line height to ensure long-form community discussions remain readable.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop to maintain a structured, editorial feel, transitioning to a fluid model for mobile devices. We use an 8px base unit for all spatial relationships.

- **Desktop (1200px+):** 12-column grid, 24px gutters, 40px margins.
- **Tablet (768px - 1199px):** 8-column grid, 20px gutters, 24px margins.
- **Mobile (Up to 767px):** 4-column grid, 16px gutters, 16px margins.

Interactive widgets and cards should utilize "md" spacing (24px) for internal padding to ensure the UI feels spacious and premium.

## Elevation & Depth

We employ **Tonal Layers** combined with **Low-contrast Outlines** to define hierarchy. In this design system, elevation is not about "floating" objects, but about stacking information clearly.

- **Level 0 (Background):** A very light cool gray (#F8FAFC) surface.
- **Level 1 (Cards/Content):** Pure white surfaces with a 1px border in a soft neutral (#E2E8F0).
- **Level 2 (Modals/Popovers):** Pure white with a 1px border and a highly diffused, low-opacity shadow (0px 10px 30px rgba(0, 0, 0, 0.04)) to indicate focus.

Avoid heavy drop shadows; the "professional" feel is maintained through crisp lines rather than artificial depth.

## Shapes

The shape language is **Soft** and disciplined. We avoid the overly playful "bubbly" feel of consumer apps in favor of a look that suggests institutional reliability. 

Standard components like buttons and input fields use a `0.25rem` (4px) radius. Larger containers, such as discussion cards and financial widgets, scale up to `0.75rem` (12px) to provide a modern, approachable frame for complex data.

## Components

### Buttons
Primary buttons use the Brand Blue with white text. Secondary buttons use a light blue ghost style or a subtle gray border. Action labels must be concise.

### Discussion Cards
Cards feature a "L1" elevation. Headers should use `headline-md` for the topic title, with `label-sm` for categories. Interactive elements (like/reply) are placed at the bottom, separated by a thin horizontal rule.

### Financial Tip Widgets
These use a subtle Growth Green background tint (#F0FFF4) and a bold left-accent border (4px) in the primary Green to draw immediate attention.

### Member Profiles
Circular avatars are required. Use `label-md` for user handles and `label-sm` for community rank badges (e.g., "Verified Expert" or "Power Saver").

### Input Fields
Inputs use a white background with a 1px neutral border. Upon focus, the border transitions to Primary Blue with a subtle 2px outer "glow" in the same color at 10% opacity.