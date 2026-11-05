# Umar Saeed Qureshi — Portfolio Website

This is the static portfolio website for **Umar Saeed Qureshi**, Flutter & Web Developer. Its redesigned hero pairs the original blue shipping-container depot with a two-column introduction and responsive interactive workspace; the detailed project, experience, toolkit, State Lab, services, process, and contact sections remain available below it.

## Files

- `index.html` — all page content and SEO metadata
- `styles.css` — full responsive design
- `script.js` — mobile menu, reveal animations, copy-email interaction
- `assets/favicon.svg` — browser icon
- `assets/social-preview.svg` — social sharing placeholder graphic
- `robots.txt` — search engine crawl configuration
- `sitemap.xml` — update after your final domain is selected

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
