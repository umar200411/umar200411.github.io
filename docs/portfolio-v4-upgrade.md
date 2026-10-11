# Portfolio V4 upgrade report

Date: 2026-10-11

## A. Repository audit

- The checkout is a static HTML/CSS/vanilla JavaScript site. It is on `main` at `cbc2cd9`, with `origin/main` pointing to `git@github.com:umar200411/umar200411.github.io.git`.
- The working tree already contained uncommitted V3 changes before V4 work began: the genuine Beautify and Magnet Masala galleries, company product imagery, updated homepage copy, and the V3 asset provenance report. Those changes were preserved.
- V3.1 AI messaging was present in About, the Toolkit card, and Build &amp; Refine. V4 keeps it and adds a compact workflow with five stages and three practical use cases.
- Existing mobile navigation, section tracking, reveal effects, custom cursor, project galleries, process controls, contact links, clipboard interaction, and footer year logic were retained. The menu now stays open at tablet widths up to 1100px, matching the new tablet menu CSS.
- The active local `CNAME` and `git show HEAD:CNAME` both contain `umarsaeedqureshi.com`. The repository has no `.github/workflows` publishing workflow. GitHub Pages settings were not available, so the configured Pages source and live deployment status could not be verified. `README.md` still includes legacy Hostinger instructions and was left untouched.
- No Beautify or Magnet Masala source repository, existing resume, or confirmed detailed education and employment records were present in this checkout.

## B. Case studies

Created two GitHub Pages-compatible static pages:

- `projects/beautify/index.html` — Flutter product overview, goals, role, high-level technology flow, genuine Play screenshots, release context, and explicit limits on undocumented architecture and test claims.
- `projects/magnet-masala/index.html` — current storefront description, verified browse-to-WhatsApp journey, desktop/mobile presentation, real captures, and limits on undocumented stack, payments, backend, and test claims.
- `case-studies.css` provides shared scoped styling; both pages and the homepage load it. Homepage project cards retain their primary Google Play/live website CTAs and add an “Explore Case Study” link.
- Case pages have unique titles, descriptions, canonical URLs, Open Graph/Twitter metadata, one H1, valid JSON-LD, links back to homepage sections, and responsive layouts. `sitemap.xml` includes both new URLs.

Beautify product identity and Play listing details were checked against the [exact Google Play listing for package `com.umar.beautify`](https://play.google.com/store/apps/details?id=com.umar.beautify), which names Umar Saeed Qureshi as developer. The Magnet Masala flow was inspected on the [live storefront](https://magnetmasala.com/); it supports basket review and WhatsApp continuation. No integrated card-payment checkout is claimed.

The case pages reuse V3 local screenshot files; no screenshots were generated or replaced for V4. Their sources, dates, optimization, placement, and unresolved reuse permissions remain documented in `docs/asset-provenance.md`. The Beautify appointment screenshot with visible customer details remains excluded.

## C. Resume

- Added `assets/Umar-Saeed-Qureshi-Resume.pdf` (6,514 bytes) and editable generator source `docs/resume-source.py`.
- The one-page PDF contains a summary, verified skills, Beautify and Magnet Masala project descriptions, general Zamindar Technologies and Token Talent experience wording, public contact links, and a brief AI-assisted workflow statement.
- The PDF has selectable/extractable text, 13 working URI annotations, one page, and no blank placeholder sections. It was opened and rendered for visual inspection. No education credential, employment title, or date was invented; an Education section is omitted until confirmed.
- The homepage About section links to the local PDF with a download attribute. A local HTTP HEAD check returned `200` and `application/pdf`.
- The generator uses ReportLab at authoring time only; the deployed site needs no PDF runtime or build dependency.

## D. Experience

- Zamindar Technologies and Token Talent remain in their existing order with their existing company links and imagery.
- Added a short attribution note explaining that company product screenshots are contextual references and do not identify who implemented individual screens.
- The original general descriptor, “Mobile app development experience,” remains because verified titles, dates, and personal contribution detail were unavailable. No company product screen is attributed to Umar personally.
- `docs/portfolio-v4-verification-needed.md` lists the information needed to make these entries more specific. Image reuse permissions remain unresolved for Zamindar Partner, Token Talent ESS, Magnet Masala captures if client-owned, and any third-party photography embedded in Beautify screenshots.

## E. Services

Added a `#services` section with four cards: Flutter Mobile App Development, Firebase &amp; Backend Integration, Responsive Web Development, and App Maintenance &amp; Improvement. Added Services to the main navigation, included its active-section target, added a tablet menu breakpoint, and linked the section CTA to Contact.

## F. AI engineering

The existing V3.1 copy in About, Toolkit, and Build &amp; Refine remains. Added a concise five-stage Define / Explore / Build / Verify / Ship workflow and practical examples for debugging, implementation, and UI/quality refinement. The copy keeps review, testing, and engineering decisions with the developer; it does not claim autonomous AI delivery or productivity metrics.

## G. Performance

Local Chrome measurements were taken at 1440 × 900 with no network throttling. These are single-run lab samples from a local static server, not Lighthouse scores or real-user field data.

| Metric | Pre-V4 baseline | V4 sample | Notes |
|---|---:|---:|---|
| Resource requests | 10 | 9 | The initial Beautify screen still loads; adjacent gallery screenshots are deferred until interaction. |
| Transferred resource bytes | 1,138,944 | 721,753 | About 36.6% lower in the captured run; capture conditions and cache state can affect samples. |
| First Contentful Paint | 524 ms | 548 ms | One run each; not a controlled benchmark. |
| Largest Contentful Paint | 524 ms | 548 ms | One run each; below 2.5 s in these local samples. |
| Cumulative Layout Shift | 0.129 | 0.125 | Slightly lower, but still above the 0.1 target. |
| Total Blocking Time | Not measured | Not measured | Lighthouse was not available. |
| Interaction to Next Paint | No field data | No field data | No real-user field source was available. |

The existing gallery code preloads only adjacent screenshots after pointer or keyboard focus and swaps only after the target image loads. The hero canvas stops when the hero leaves the viewport or the page is hidden. Reduced-motion mode turns motion durations down and keeps reveal content visible. CSS additions are scoped to case studies and V4 homepage sections. A Lighthouse run is still recommended in a browser environment with Lighthouse available; the CLS result merits follow-up.

## H. Accessibility and SEO

- Keyboard-tested navigation toggle with Space and Escape. Verified the process control’s `aria-expanded` open/restore behavior and gallery selected state, alternative text, and live status during gallery changes.
- Browser checks found no document-level horizontal overflow at the tested widths and no failed local image requests. Case pages use a skip link, semantic sections, a single H1, descriptive links, and image alternatives.
- Emulated `prefers-reduced-motion: reduce`: the media query matched, all reveal content was visible, and service card/headline animation durations computed to `0.00001s`.
- Parsed all three page JSON-LD blocks as valid JSON, verified local references and homepage section links, parsed the sitemap, and checked that it lists the home page and both case studies.
- No axe-core/Lighthouse accessibility runner was available. Manual checks do not establish full WCAG conformance.

## I. Files changed

Modified: `index.html`, `script.js`, `styles.css`, and `sitemap.xml`.

Added for V4: `case-studies.css`, `projects/beautify/index.html`, `projects/magnet-masala/index.html`, `assets/Umar-Saeed-Qureshi-Resume.pdf`, `docs/resume-source.py`, this report, and `docs/portfolio-v4-verification-needed.md`.

The untracked `assets/projects/`, `assets/experience/`, `docs/asset-provenance.md`, and `docs/portfolio-v3-upgrade.md` were already part of the working V3 implementation before V4 and were preserved. No files were deleted; `CNAME`, `robots.txt`, and `README.md` were not modified.

## J. QA results

- Browser: headless Google Chrome, static site served over `http://127.0.0.1:8765/`.
- Homepage, Beautify case study, and Magnet Masala case study were checked at: 320 × 720, 360 × 800, 375 × 812, 390 × 844, 430 × 932, 600 × 900, 768 × 1024, 844 × 390, 900 × 900, 1024 × 768, 1250 × 900, 1440 × 900, and 1920 × 1080.
- At all 39 page/viewport combinations, `document.documentElement.scrollWidth` equaled viewport width. Visible project/service content fit the responsive grids.
- Beautify gallery switched among all three real screenshots and updated `aria-pressed`, alternative text, and live status. Magnet gallery switched desktop, mobile, catalog, and basket images; its mobile mode hid the duplicate inset.
- Mobile navigation opened with Space and closed with Escape. Build &amp; Refine process control opened and restored its `aria-expanded` value.
- Both case pages had one H1, no missing local images at tested widths, no failed internal page requests, and no browser console errors. Local assets, JSON-LD, sitemap entries, resume response, and `CNAME` were verified.
- Resume was parsed and rendered locally: one page, searchable text, working link annotations, no clipping observed.
- Representative screenshots are in the temporary QA directory, not committed: `/private/tmp/v4-after-home-1440.png`, `/private/tmp/v4-beautify-390.png`, `/private/tmp/v4-beautify-1440.png`, `/private/tmp/v4-magnet-masala-390.png`, `/private/tmp/v4-magnet-masala-1440.png`, and `/private/tmp/v4-services-390.png`.
- `node --check script.js`, `git diff --check`, local reference checks, JSON-LD parsing, and sitemap XML parsing passed.

## K. Deployment instructions

No push or deployment was performed. The checked-out branch is `main` and the `origin` URL is the portfolio GitHub repository. Verify GitHub **Settings → Pages** before publishing because the configured publishing source could not be inspected here. If it is still configured to publish the root of `main`, review and then run:

```sh
git status --short
git add index.html styles.css case-studies.css script.js sitemap.xml projects/beautify/index.html projects/magnet-masala/index.html assets/Umar-Saeed-Qureshi-Resume.pdf docs/resume-source.py docs/portfolio-v4-upgrade.md docs/portfolio-v4-verification-needed.md
git add assets/projects assets/experience docs/asset-provenance.md docs/portfolio-v3-upgrade.md
git diff --cached --check
git commit -m "Add portfolio V4 case studies and hiring resources"
git push origin main
```

The second `git add` stages the already-present, uncommitted V3 galleries and provenance assets needed by the pages; review that staged content before committing. A push may publish immediately if GitHub Pages is configured for `main`, so perform it only after reviewing the staged diff and confirming the Pages source. The existing custom-domain `CNAME` is preserved.
