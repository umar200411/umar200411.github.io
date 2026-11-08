# Umar Saeed Qureshi — Portfolio Website

This is the static portfolio website for **Umar Saeed Qureshi**, Flutter & Web Developer. Its redesigned hero pairs the original blue shipping-container depot with a two-column introduction and responsive interactive workspace; the detailed project, experience, toolkit, State Lab, services, process, and contact sections remain available below it.

## Files

- `index.html` — all page content and SEO metadata
- `site.css` — shared dark design system (tokens, header, sections, footer) for every page
- `depot.css` — the interactive container-depot hero
- `case-study.css` — Beautify, Magnet Masala, and Pulse case-study pages
- `script.js` — sticky header, mobile menu, reveal animations, galleries, copy-email interaction
- `effects.js` — visual effects layer: hero starfield, contact particle field, hero/card pointer spotlights, floating back-to-top progress ring, and off-screen animation pausing. Effects scale to the device (fewer particles, 30 fps and capped pixel density on touch devices, static on low-power devices that the inline head script flags with `fx-lite`) and render a single still frame for `prefers-reduced-motion`
- Images: pages load the `.webp` versions of the portrait and screenshots (about 83% smaller); the original `.png`/`.jpg` files stay for social-preview tags and as source files
- `assets/favicon.svg` — browser icon
- `assets/social-preview.svg` — social sharing placeholder graphic
- `robots.txt` — search engine crawl configuration
- `sitemap.xml` — update after your final domain is selected

## Visual effects and performance

- **Tuning:** particle counts and frame rates live at the top of each scene in `effects.js` (`starfieldScene`, `constellationScene`); colours come from the `site.css` tokens. The "Effects & motion layer" section at the end of `site.css` and the "Motion" block near the end of `depot.css` hold the CSS animations.
- **Device tiers:** the inline script in each page's `<head>` adds `fx-lite` on devices that report Data Saver, ≤2 GB memory, or ≤2 CPU cores; those devices keep the full design with static effects and no backdrop blur. Touch devices run the canvases at 30 fps with a lower pixel density.
- **Accessibility:** with `prefers-reduced-motion: reduce`, the canvases draw one still frame and CSS animations are skipped; decorative layers are `aria-hidden`.
- **Adding images:** export screenshots as `.webp` (keep a `.png`/`.jpg` alongside only if it is used for social previews).

## Easiest way to preview

Double-click `index.html` and open it in Chrome.

## Recommended launch setup — Hostinger

### 1. Configure the domain and SSL

The production domain is `https://umarsaeedqureshi.com`. In Hostinger, point the domain to the hosting account, enable the SSL certificate, and force HTTPS.

### 2. Upload the website

Upload the **contents** of this repository directly into Hostinger's `public_html` directory. `index.html` must be directly inside `public_html`, with `assets` beside it. Include the root `favicon.ico`, the `assets/favicon-48.png`, `assets/favicon-96.png`, and `assets/social-preview.png` files.

The included `.htaccess` enables HTTPS redirects, compression, browser caching, and baseline security headers on Hostinger's Apache server.

### 3. Professional email
After configuring your domain, use Google Workspace if you want Gmail with a professional address.

Examples:
- `hello@yourdomain.com`
- `umar@yourdomain.com`
- `work@yourdomain.com`

Your existing Gmail can remain your recovery/personal email.

### 3. Before publishing

Verify the home page, mobile menu, email buttons, Google Play link, GitHub and LinkedIn links, HTTPS redirect, and social preview. Submit `https://umarsaeedqureshi.com/sitemap.xml` to Google Search Console after the domain is live.

## Suggested next upgrades

- Real screenshots from Beautify
- 2–4 additional project case studies
- Downloadable CV
- Testimonials/recommendations from clients or managers
- Contact form connected to Formspree, Netlify Forms, or your own backend
- Google Analytics / privacy-friendly analytics
- Custom domain email


## Your final setup
- Domain: https://umarsaeedqureshi.com
- Professional email: umar@umarsaeedqureshi.com

# umar200411.github.io

## Portfolio Depot and cursor character

The hero's 3D shipping-container depot is powered by `depot.js` and `depot.css`. Selected portfolio summaries appear in a separate accessible content dock, while the complete original page sections below retain their galleries, filters, State Lab, and contact interactions. Pulse is the featured Flutter project and has one case study at `projects/pulse/`, linked from both the Work container and project gallery. Pulse screenshots and app source were not present in this repository, so its image areas are explicitly labeled placeholders and feature details are presented as evolving product scope rather than verified shipped functionality. Add authentic media files under `assets/projects/pulse/` and update `pulse-media.js`; the page's image slots will use them while retaining placeholders for unset or failed files. Character video scrubbing is implemented as a dependency-free native module in `cursor-scrub-video.js`. The current stage uses `assets/character-still.png`; the matching cursor video has not been supplied, so no eye/head tracking is simulated. See [the CursorScrubVideo guide](docs/cursor-scrub-video.md) for asset preparation and verification details.
