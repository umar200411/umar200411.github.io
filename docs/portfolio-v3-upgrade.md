# Portfolio V3 upgrade

## Summary

Updated the existing single-page HTML, CSS, and JavaScript portfolio with two real project showcases and image-led company experience cards. The original dark purple hero, illustrated portrait, lime and coral accents, typography, responsive navigation, and interaction system remain in place.

The hero now describes mobile and web work. The Featured Projects section contains Beautify as Project 001 and Magnet Masala as Project 002. Beautify uses three genuine Google Play screens and an accessible screenshot selector. Magnet Masala uses desktop, mobile, catalog, and basket captures from the live site; its Mobile control expands the portrait screenshot into the main preview.

The Experience section retains Zamindar Technologies first and Token Talent second. Zamindar Partner imagery comes from the archived listing for the verified `com.zamindartech.zamindarpartner` package. Token Talent imagery comes from its official ESS page. Company contribution wording remains general because specific responsibilities and dates were not verified.

## Source files and assets

- `index.html` — project and experience content, responsive hero wording, expanded metadata, and truthful image descriptions.
- `styles.css` — scoped project media and experience layouts, small-screen type refinements, and gallery styles.
- `script.js` — replaces fictional Beautify screen state with image galleries that preload before swapping and update `aria-pressed`, alt text, and live status.
- `assets/projects/beautify/` — three Google Play screenshots.
- `assets/projects/magnet-masala/` — four live website captures, optimized to JPEG quality 90.
- `assets/experience/zamindar-tech/` — one archived Zamindar Partner product screenshot.
- `assets/experience/token-talent/` — official ESS attendance, leave, and payroll source screenshots; attendance and leave are displayed.
- `docs/asset-provenance.md` — source URLs, image subjects, acquisition date, optimization, placement, and rights status.

Existing process controls, active section navigation, mobile navigation, scroll effects, count-up stats, cursor and magnetic effects, contact links, clipboard fallback, footer year, and CNAME were preserved. No framework or runtime dependency was added.

## Verification

Chrome ran the static site over a loopback HTTP server to match GitHub Pages root-relative paths.

- Widths: 320, 360, 375, 390, 430, 600, 768, 900, 1024, 1250, 1440, and 1920 pixels.
- Mobile landscape: 844 × 390 pixels.
- At every tested width, `document.documentElement.scrollWidth` equaled the viewport width.
- HTTP resource check: zero failed requests and zero HTTP error responses.
- Browser console: zero errors.
- Loaded screenshots: every image presented in the document loaded successfully; gallery transitions were also exercised for Beautify and Magnet Masala.
- Beautify gallery: Discover, Get started, and Service setup update the image, alt text, live status, and selected button.
- Magnet gallery: Home, Mobile, Catalog, and Basket update the authentic screenshot; Mobile switches to the portrait frame and hides the duplicate inset.
- Mobile navigation: opened with `aria-expanded="true"` and closed with Escape.
- Process controls: expanded and restored their original `aria-expanded` state.
- Reduced motion: Chrome emulation matched `prefers-reduced-motion: reduce`; hero, phone, marquee, and card transition durations computed to `0.00001s`.
- Checked links: Beautify Google Play, Magnet Masala, email, and both existing WhatsApp links.

The live project URLs were opened during asset research. No product was added to a basket, no order was placed, and no purchase or message was sent. A before screenshot was not captured before edits. Temporary after-captures are under `/private/tmp/portfolio-v3-qa/` in the working environment.

## Deployment and known limitations

The local Git repository is on `main`, its `origin` is `git@github.com:umar200411/umar200411.github.io.git`, the public repository identifies `main` as its branch, and `CNAME` still contains `umarsaeedqureshi.com`. No `.github/workflows` files are present. The repository also contains `.nojekyll` and a legacy `.htaccess`; the latter is not part of GitHub Pages hosting.

The authenticated GitHub Pages settings page was not available in this workspace, so the configured Pages source branch and custom-domain status could not be independently verified. The README still contains Hostinger instructions and was left untouched until those settings can be confirmed. No GitHub push, deployment, DNS change, or production edit was made.

The experience screenshots are authentic, but public availability does not establish reuse permission. Zamindar Tech and Token Talent image permissions need owner review before publication. Magnet Masala capture reuse should also be confirmed if the site or brand is client-owned. These items are tracked in the provenance file.

