---
name: Kinetic Gold System
colors:
  surface: '#fff8f1'
  surface-dim: '#e2d9c8'
  surface-bright: '#fff8f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf3e1'
  surface-container: '#f6eddc'
  surface-container-high: '#f1e7d6'
  surface-container-highest: '#ebe1d1'
  on-surface: '#1f1b11'
  on-surface-variant: '#4e4633'
  inverse-surface: '#353025'
  inverse-on-surface: '#f9f0de'
  outline: '#807660'
  outline-variant: '#d1c5ac'
  surface-tint: '#745b00'
  primary: '#745b00'
  on-primary: '#ffffff'
  primary-container: '#f5c518'
  on-primary-container: '#695200'
  inverse-primary: '#f0c110'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#00687c'
  on-tertiary: '#ffffff'
  tertiary-container: '#49dbff'
  on-tertiary-container: '#005e70'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe08b'
  primary-fixed-dim: '#f0c110'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#b0ecff'
  tertiary-fixed-dim: '#42d7fb'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#004e5e'
  background: '#fff8f1'
  on-background: '#1f1b11'
  surface-variant: '#ebe1d1'
typography:
  display-stat:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '800'
    lineHeight: '1'
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.3'
  title-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  label-nav:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
  label-button:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1'
  label-auth-cta:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '800'
    lineHeight: '1'
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar_expanded: 240px
  sidebar_collapsed: 72px
  topbar_height: 72px
---

## Brand & Style
The design system is built on a **Corporate Modern** foundation infused with high-energy **Marketing/Startup** vibrance. It balances professional reliability with a sense of momentum and premium quality. The target audience is efficiency-driven, expecting a tool that feels both authoritative and approachable.

The aesthetic utilizes clean, systematic layouts punctuated by expressive gradients and subtle motion. While the core dashboard experience remains grounded and utilitarian to ensure focus, the authentication and onboarding touchpoints employ more dynamic visuals—specifically **Glassmorphism** and soft organic animations—to create an inviting first impression. The overall emotional response should be one of "structured energy."

## Colors
The palette is centered around a signature Gold/Yellow primary color, signifying premium value and clarity. This is contrasted against a deep navy text hierarchy and clean, cool-toned backgrounds.

- **Primary Tone:** Gold (#F5C518) is used for main actions, active states, and brand recognition.
- **Surface Strategy:** We use a "Light-on-Light" approach where surfaces are pure white (#FFFFFF) set against a slightly tinted page background (#F7F8FC) to create natural separation without heavy shadows.
- **Auth Visuals:** Authentication flows diverge from the core dashboard by introducing a vibrant spectrum of Purples, Indigos, and Emeralds, used primarily in gradients to signal a high-energy entry point to the product.

## Typography
The typography system uses **Inter** exclusively to maintain a systematic, neutral, and highly legible interface. 

- **Hierarchy:** We utilize a wide range of weights from 400 to 900 to create clear information density. 
- **Statistical Data:** For numerical data and stats, we use a 30px font size with a weight of 800 and a tight line-height of 1 to emphasize growth and impact.
- **Navigation:** Navigation labels and secondary UI hints use the 13px size with a Medium (500) weight for optimal clarity in high-density areas like sidebars and topbars.

## Layout & Spacing
The system follows a strict **8px base grid** with 4px half-steps for fine-tuning small components. 

- **Grid Model:** A fluid grid is preferred within the main content area, allowing dashboard widgets to expand or stack based on screen width. 
- **Structural Bars:** The sidebar is a fixed persistent element (240px) that can collapse to a 72px icon-only view. The topbar remains locked at 72px height for a consistent horizon line across the application.
- **Adaptation:** On mobile devices, horizontal padding is reduced to 16px to maximize screen real estate, while vertical padding remains generous (20px) to ensure touch targets feel uncrowded.

## Elevation & Depth
This design system uses a combination of **Tonal Layers** and **Ambient Shadows** to define hierarchy.

- **Resting State:** Standard cards use a low-contrast 1.5px border (#EAEDF3) with a very soft, subtle shadow to feel integrated into the page.
- **Interaction Depth:** Interactive elements like Stat Cards or Meal Cards should "lift" on hover—achieved by increasing shadow spread/opacity and applying a `translateY(-4px)` transform.
- **Overlays:** Modals and drawers utilize large, diffused shadows with 10-15% opacity to sit high above the page content.
- **Special Elevation:** Auth CTA buttons use a tinted shadow (matching the primary purple gradient) to create a glowing effect that draws immediate attention.

## Shapes
The shape language is primarily **Rounded**, conveying a modern and friendly personality. 

- **Cards & Containers:** Use a 16px radius for the most prominent containers (cards, dashboard widgets).
- **Inputs & Smaller Elements:** Standard UI controls like buttons and input fields use an 8px radius.
- **Auth Elements:** Authentication-specific inputs use a softer 12px radius to match the more expressive brand style of the entry flow.
- **Status Markers:** Use pill-shaped (999px) or circular (50%) radii for chips, badges, and user avatars.

## Components

### Buttons
- **Primary:** Gold background, Navy text, 8px radius. On hover, darken to #D4A800 and shift -1px vertically.
- **Auth CTA:** Vibrant purple-to-blue gradient, 14px radius, weight 800. Must include a colored drop-shadow for a "glow" effect.

### Input Fields
- **Standard:** Background #F7F8FC, 1.5px border (#EAEDF3). On focus, the border changes to Primary Gold.
- **Auth:** Background #F8F9FF, 1.8px border (#E2E8F0). On focus, the border turns Purple (#7C3AED) with a soft outer glow.

### Sidebar Navigation
- **Default:** Text color #8A92A6 with transparent background.
- **Active State:** Background #FFF3B0 (light gold tint), text color #D4A800 (dark gold). Use an 8px radius for the selection indicator.

### Cards
- **Structure:** 16px radius, #EAEDF3 border, 24px internal padding.
- **Behavior:** Stat cards must scale slightly or lift on hover to indicate interactivity.

### Animations
- **Transitions:** All hover states and UI changes should use a `0.2s ease` timing.
- **Entrance:** Authentication screens should use a `0.55s ease` fade-in combined with a 20px slide-up motion.
- **Atmosphere:** Use slow-moving SVG blobs in the background of the auth hero section (9s-12s loops) to provide a premium, living feel.