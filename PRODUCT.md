# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: prospective couples and families in Serra Gaúcha (RS)** planning a wedding, a 15-anos (debut) party, a birthday or another social event, and deciding who will film it. They arrive mostly on mobile, often from Instagram, WhatsApp or a referral. They watch real films, compare packages and start a conversation on WhatsApp. Design work optimizes for this audience first.

**Secondary: existing clients** who receive a private link to watch their own event's films (`/assistir/[slug]`) or their whole library (`/meus-filmes/[token]`). They have no login or password. They watch, rewatch and share the films with family, often on a TV or laptop as well as on phones.

**Internal: Felipe and Tamires** run the backstage (`/backstage-ft`): clients, events, videos, portfolio curation, the "Recomendamos" partner list, and the Inteligência reports (GA4, UTM links, contacts).

## Product Purpose

Felipe & Tamires Films is a two-person event-filmmaking studio. This site does two things:

1. **Win bookings.** It shows real films, explains how the couple works and what each package includes, and turns interest into a WhatsApp conversation. The site has no form, checkout or public prices.
2. **Deliver the films.** It replaces Google Drive delivery with a private, streaming-style place to watch them.

Success means more qualified WhatsApp conversations from the public site, and clients who feel their film was delivered with the same care it was made with.

## Positioning

The couple are both behind the camera: "ficamos dos dois lados da câmera". They film discreetly, give light direction and edit the footage into a story ("filmes para reviver, não apenas assistir"). The delivery is their own streaming-style portal rather than a Drive folder. Each portfolio film comes from a real client who authorized publication.

## Operating Context

- Contact happens only on WhatsApp (`54 99700-6436`, centralized in `src/config/site.ts`). Each CTA sends a pre-filled message that matches where it was clicked. The site has no lead form and no email capture.
- Packages (`/pacotes`) come in three tiers that build on each other, Essência → Experiência, for casamento, 15 anos and aniversário. They are shown without fixed prices: "cada orçamento é conversado".
- Films are hosted outside the site (YouTube unlisted / `youtube-nocookie` now, Bunny/Cloudflare Stream maybe later). The app stores only references, plus cover images in private Supabase Storage.
- A client event appears in the public portfolio only after an explicit authorization checkbox in the backstage. Public and private identifiers are always kept separate.
- Copy is in Brazilian Portuguese (pt-BR).

## Capabilities and Constraints

- Areas: public site `(public)` (`/`, `/filmes`, `/filmes/[slug]`, `/pacotes`, `/recomendamos`, `/recomendamos/[slug]`, `/privacidade`), private delivery (`/assistir`, `/meus-filmes`), and the admin backstage (`/backstage-ft`). Each area has its own layout and chrome.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), deployed on Netlify.
- Privacy is binding. Optional analytics (GTM/GA4/Clarity, LGPD consent) may run only on public routes, and the code must enforce this. The private and backstage areas stay `noindex` and untracked. Private slugs, tokens, client PII and WhatsApp message text must never reach third-party tools.
- Clients have no login. Private access works through high-entropy links only.
- Still undecided: client self-service link recovery, a non-YouTube player, prev/next inside the player, and public search.

## Brand Commitments

- Name: **Felipe & Tamires Films** (FTF). Assets: `public/icon.svg` and `public/imgs/icone-ftf.png`.
- Voice: warm, personal and plain-spoken. They write in first person plural ("a gente", "vocês"). The tone is cinematic without being grandiose.
- The incumbent site is dark-only and cinematic. That visual system lives in code (`src/app/globals.css`) and is not recorded here.

## Evidence on Hand

- Real published client films, available through the portfolio data in Supabase.
- Photos: `public/imgs/felipe-e-tamires.jpg` (the couple), `felipe-filmando-1600.webp`, `tamires-filmando-1600.webp`, and category images `casamento.webp`, `15-anos.webp`, `aniversario.webp`.
- Hero video: `public/videos/hero.mp4`.
- **There are no testimonials, years-in-business or event counts, press mentions or awards.** Future work must not fabricate any of them, nor invent a biography or client names.

## Product Principles

1. **Real films are the proof.** Let their work persuade. Never add invented claims or social proof.
2. **Every path leads to a conversation.** The goal of a public page is a WhatsApp message that already carries context, not a form.
3. **Private stays private.** Client delivery, tokens and the backstage never leak into public pages, analytics, search engines or shared URLs.
4. **The delivery is part of the product.** Watching a film in the private portal should feel as considered as the film itself.
5. **Plain over performative.** Use the couple's own warm, direct voice, not marketing superlatives.

## Accessibility & Inclusion

- Mobile is the main way prospects arrive, and clients also watch on TVs and other large screens.
- Motion respects `prefers-reduced-motion`. The player modal handles focus, ESC and scroll-lock.
