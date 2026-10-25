---
name: Felipe & Tamires Films
description: A private screening room for event films — warm dark, ivory type, a single brass glint.
colors:
  ink: "#0a0908"
  surface: "#12100e"
  raised: "#1a1613"
  hairline: "#26221c"
  bone: "#f3eee4"
  bone-dim: "#a49c8f"
  brass: "#c3a06a"
  brass-soft: "#d8bd93"
typography:
  display:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 300
    lineHeight: 1.05
  headline:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.9rem, 4.5vw, 3rem)"
    fontWeight: 300
    lineHeight: 1.05
  title:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 300
    lineHeight: 1.25
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  eyebrow:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.32em"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.24em"
  button:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    letterSpacing: "0.22em"
rounded:
  sm: "0.25rem"
  lg: "0.5rem"
  xl: "0.75rem"
  2xl: "1rem"
  full: "9999px"
spacing:
  gutter: "1.5rem"
  gutter-sm: "2rem"
  section: "4rem"
  section-lg: "6rem"
  card: "1.25rem"
  container: "72rem"
  container-2xl: "88rem"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: "0.875rem 1.75rem"
  button-primary-hover:
    backgroundColor: "{colors.brass-soft}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: "0.875rem 1.75rem"
  badge:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.bone-dim}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
  card-film:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card}"
  panel-contact:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "3.5rem 1.5rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.bone}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
---

# Design System: Felipe & Tamires Films

## Overview

**Creative North Star: "The Private Screening Room"**

The site is a small, warm, dark theater. The films are the only real light source in it; everything else is the room — warm near-black walls, ivory type that reads like a printed program, and a single brass glint on the things you can act on. Nothing competes with a cover image or a playing film. When there is no image, the room itself carries the mood through film grain, a soft vignette and abstract warm gradients.

Density is low and the pace is slow. Sections breathe with generous vertical space, headlines are set large in a light-weight serif, and small-caps labels with wide tracking do the organizing work that boxes and dividers would do elsewhere. Motion is cinematic and restrained: content rises in on a long ease-out curve, covers drift with an almost imperceptible Ken Burns, and every effect disappears under reduced motion.

The system is dark-only. It refuses the streaming-platform cliché (no red, no logo-heavy carousels), the SaaS dashboard look on public pages, WhatsApp's brand green, and any light theme or theme toggle.

**Key Characteristics:**
- Warm near-black surfaces in three tonal steps, never neutral gray.
- Fraunces Light for display, Inter for everything functional.
- Brass is the only accent and is rationed to actions, labels and the ampersand.
- Depth from tone, hairlines, grain and vignette; shadows are rare.
- Pill-shaped small-caps CTAs; softly rounded frames for media.
- Slow, long-tailed motion that always respects `prefers-reduced-motion`.

## Colors

A warm monochrome of near-black and ivory, lit by one restrained metallic accent.

### Primary
- **Projector Brass** (`brass`): the one accent. Filled primary CTAs, the italic `&` in the wordmark, eyebrow labels above headlines, text selection, focus rings (at 60–70% opacity), and the border of the highlighted package.
- **Soft Brass** (`brass-soft`): hover state of filled brass buttons, the header's "Falar conosco" link, and inline form errors — brass that is a little warmer and closer to the bone text.

### Neutral
- **Ink** (`ink`): the page background, and text on filled brass buttons. The darkest wall of the room.
- **Surface** (`surface`): cards, form fields, framed panels (often at 40% opacity for the contact banner).
- **Raised** (`raised`): badges, floating layers (consent bar, tooltips), the highlighted package card.
- **Hairline** (`hairline`): every border and divider; the header's bottom rule at 60% opacity.
- **Bone Ivory** (`bone`): headlines, primary text, active navigation.
- **Faded Bone** (`bone-dim`): body copy, metadata, inactive navigation, placeholder text (at 50%).

### Named Rules
**The Single Glint Rule.** Brass is the only accent color. It marks what you can act on and what names a section — never a background fill for large areas, never a decorative gradient.

**The Warm Black Rule.** Every dark is a warm near-black from the ink/surface/raised family. Neutral grays and pure `#000` surfaces are off-system; plain black is only used as a transparent overlay (vignette, image gradients).

**The No-Green Rule.** WhatsApp CTAs use the brass system and a `currentColor` glyph. WhatsApp green never appears.

## Typography

**Display Font:** Fraunces (with Georgia, Times New Roman, serif), weights 300/400/500 plus italic
**Body Font:** Inter (with ui-sans-serif, system-ui, -apple-system, sans-serif)

**Character:** A light, soft-serifed display face that feels like a film title card, paired with a neutral grotesque that stays out of the way and carries every functional label in wide-tracked capitals.

### Hierarchy
- **Display** (Fraunces 300, fluid 2.25–4rem, line-height 1.05): page `h1` and hero titles. One per page.
- **Headline** (Fraunces 300, fluid 1.9–3rem, line-height 1.05): section `h2` on the home and inner pages; the contact banner uses a slightly smaller 1.75–2.75rem at 1.1.
- **Title** (Fraunces 300, 1.25rem, line-height 1.25): film card titles, partner names.
- **Body** (Inter 400, 0.875rem on mobile → 1rem from `sm`, line-height 1.625): paragraphs, capped at `max-w-prose` (~65ch), usually in Faded Bone.
- **Eyebrow** (Inter, 0.75rem, uppercase, tracking 0.32em, brass): the label above a headline that names the section ("Pacotes", "Sobre nós").
- **Label** (Inter, 0.75rem, uppercase, tracking 0.24em): navigation; card metadata uses 0.18em; form labels 0.2em at weight 500.
- **Button** (Inter 500, 0.875rem, uppercase, tracking 0.22em): every CTA.

### Named Rules
**The Light Serif Rule.** Display and headline text is always Fraunces at weight 300. Bold serif headlines are off-system; emphasis comes from size and space. Italic is an accent, not a style: the brand ampersand, and at most one italic phrase in Soft Brass per headline (e.g. "Seus filmes.").

**The Small-Caps Grammar Rule.** Anything that labels, categorizes or invites action is set in uppercase Inter with tracking between 0.16em and 0.32em. Sentences are never set this way.

## Layout

A single centered column per section: `max-w-6xl` (72rem) that widens to 88rem on 2xl screens for TVs and large monitors, with a 1.5rem side gutter on mobile and 2rem from `sm`. Sections sit 4rem apart on mobile and 6rem from `sm`; stacked blocks inside a page are separated by 4rem gaps, smaller groups by 1–2.5rem.

Text columns stay narrow (headers `max-w-2xl`, paragraphs `max-w-prose`) even when the container is wide, so imagery and film rows own the width. The home is structured like a screening program: a full-bleed hero (70svh, 76vh on large screens), then horizontal film rows that bleed edge to edge, scroll natively, hide their scrollbar and fade at both edges (`edge-fade-x`). Row cards are fixed-width (78vw on mobile so the next card peeks, growing to 25rem on 2xl). Grids collapse to a single column below `sm`; the header switches to a hamburger menu below `md`.

## Elevation & Depth

Depth is tonal and atmospheric, not cast. Surfaces step from ink to surface to raised, separated by one-pixel hairlines. The whole page sits under a fixed film-grain layer (3.5% opacity, soft-light blend) and a radial vignette that darkens the edges, so the room has texture even where nothing is drawn. Images get bottom-up ink gradients to seat text on them.

### Shadow Vocabulary
- **Brass halo** (`box-shadow: 0 30px 90px -45px rgba(195,160,106,0.5)`): only the highlighted package card on `/pacotes` — a warm glow, not a drop shadow.
- **Floating layer** (`box-shadow: 0 18px 50px -20px rgba(0,0,0,0.85)`): the consent bar fixed to the bottom of the viewport.
- **Tooltip** (`box-shadow: 0 12px 30px -12px rgba(0,0,0,0.8)`): chart tooltips in the backstage.

### Named Rules
**The Lit-Room Rule.** Resting surfaces are flat. A shadow only appears on something that floats above the page or on the single item a page is recommending.

## Shapes

Gently softened, never bubbly. Media and cards use 0.75rem corners; framed panels and floating bars use 1rem; form fields and small popovers 0.5rem; focusable wordmark/links 0.25rem. Every action — buttons, badges, chips, toggles — is a full pill. Borders are always one-pixel hairlines; the hover state of a frame is a hairline that warms toward brass (40–60% opacity), not a thicker stroke. Film covers are always 16:9 and clip inside their card.

## Components

Quiet and tailored: small-caps pills, hairline frames, and motion that amounts to a one-pixel lift.

### Buttons
- **Shape:** full pill (9999px).
- **Primary:** Projector Brass fill, Ink text, button type, 0.875rem × 1.75rem padding on the public site (backstage: min-height 44px, 0.75rem × 1.5rem). Below `sm` the label tightens to 0.8125rem with 0.14em tracking and 1.5rem side padding so long labels fit one line at phone width; when they still wrap, they center and balance. Stacked CTA pairs on phones share one width (max 24rem).
- **Hover / Focus:** fill shifts to Soft Brass over 300ms ease-out with a 1px upward lift (motion-safe only); focus shows a 2px brass ring at 60%.
- **Secondary:** transparent with a brass border at 50% and Bone text; hover brings the border to full brass.
- **Subtle (backstage):** hairline border, Faded Bone text, smaller (0.75rem type, 0.2em tracking); hover warms the border and brightens the text.
- **Link variant:** the header's "Falar conosco" — no frame, Soft Brass text that deepens to brass on hover.

### Chips / Badges
- **Style:** pill, hairline border, Raised at 60%, Faded Bone text at 0.68rem uppercase with 0.18em tracking. Used for event type, categories and states.

### Cards / Containers
- **Film card:** 0.75rem corners, Surface background, hairline border, 16:9 cover with a bottom ink gradient, Fraunces title and small-caps metadata in a 1.25rem body. Hover warms the border to brass 40%, lifts the card 4px and scales the cover to 1.035 over 450ms. Without a cover, a warm abstract gradient stands in — never a gray placeholder.
- **Contact banner:** 1rem corners, Surface at 40%, hairline border, centered text column (eyebrow, headline, body, one primary WhatsApp CTA and an optional secondary link).
- **Shadow strategy:** see Elevation — cards are flat at rest.

### Inputs / Fields
- **Style:** 0.5rem corners, Surface background, hairline border, Bone text at 16px (prevents iOS zoom), placeholder in Faded Bone at 50%.
- **Focus:** border warms to brass 60%; no glow.
- **Error:** inline Soft Brass text under the field; form-level errors sit in a Raised panel with a brass 30% border. Errors never turn red.

### Navigation
- **Public header:** wordmark left, small-caps links right (0.75rem, 0.24em tracking) in Faded Bone that brighten to Bone, with a 1px underline that draws in from the left on hover and appears instantly on focus. Hairline bottom border at 60%. Below `md`, a hamburger opens a panel.
- **Private areas** (`/assistir`, `/meus-filmes`): only the wordmark, no navigation or CTAs.

### Wordmark
"Felipe & Tamires" in Fraunces Light with the ampersand in brass italic, followed by "FILMS" in small Inter capitals with very wide tracking (0.36–0.42em) in Faded Bone. It is the brand's signature and should not be redrawn.

### Player Modal
The private and public film players open in a full-screen modal over a dark backdrop that fades in; the iframe exists only while the modal is open. ESC and backdrop click close it, focus moves to the close button and returns to the card afterwards.

## Do's and Don'ts

### Do:
- **Do** set headlines in Fraunces 300 and let size and whitespace create hierarchy.
- **Do** put a brass small-caps eyebrow (0.75rem, 0.32em tracking) above section headlines.
- **Do** keep every border a one-pixel hairline, warming toward brass on hover.
- **Do** use the ink/surface/raised steps for depth and reserve shadows for floating layers and the one recommended item.
- **Do** use `--ease-cine` (`cubic-bezier(0.22, 1, 0.36, 1)`) for reveals and keep every animation inside `prefers-reduced-motion: no-preference`.
- **Do** give missing covers the warm abstract gradient fallback.

### Don't:
- **Don't** use red or any streaming-platform cliché such as logo-heavy carousels.
- **Don't** bring a SaaS dashboard look (bright cards, stat tiles, generic gradients) to public pages.
- **Don't** use WhatsApp green anywhere; WhatsApp CTAs stay in brass.
- **Don't** add a light theme or a theme toggle.
- **Don't** use neutral grays or bold serif headlines.
- **Don't** fill large areas with brass; it is a glint, not a wall.
