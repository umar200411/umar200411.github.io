# Umar's Portfolio Depot browser QA

The depot browser suite uses Playwright Test with its bundled Chromium. `package-lock.json` pins the dependency graph and GitHub Actions uses `npm ci`. The workflow at `.github/workflows/depot-visual-tests.yml` runs on pushes to `feature/interactive-character-hero`, pull requests, and manual dispatch. In this environment, Playwright 1.63 and its Chromium bundle are now present, but the earlier npm registry request failed with `ENOTFOUND`. The local suite starts its HTTP server, then Chromium exits before creating a page with a macOS Mach-port rendezvous `SIGTRAP`; the 12 resulting failures are launch failures and do not exercise page assertions. No visual screenshots were produced. The configured GitHub CLI token is invalid, so no CI run is available yet.

## Run locally

Install Node.js 22 or later and Python 3, then run:

```sh
npm ci
npx playwright install chromium
npm run test:depot
```

The test runner starts the static site on port 4173. It writes desktop, tablet, and mobile screenshots to test-results/, an HTML report to playwright-report/, and traces/screenshots/video for failed tests.

## Run in GitHub Actions

Push the feature branch to GitHub, or open Actions → Depot browser verification → Run workflow. Download depot-playwright-results from the completed run to inspect the screenshots and report. A configured workflow is not a passing result; review the actual run and artifacts.

## Manual smoke checklist

At 1920×1080, 1771×831, 1440×900, 1366×768, 1024×768, 768×1024, 390×844, 375×812, and 320×700:

1. Confirm the viewport shows the navigation, readable left introduction, and bounded right-hand depot. Scroll below the hero and confirm the complete original project, About, Experience, Toolkit, State Lab, Services, Process, Contact, and footer content remains available.
2. Check container labels, 3D side faces, doors, crane alignment, and horizontal overflow at all nine viewports.
3. Open Work, then About; observe doors close, the claw lower the held container to its pile position, release it, and pick up About.
4. Rapidly request Work → Toolkit → Contact and confirm Contact opens last without a stuck state.
5. Use Tab, Enter, Space, and Escape to operate containers; verify the dock is inert while closed and panel links remain independent buttons/links.
6. Enable reduced motion and confirm the left introduction remains immediately readable, then select another container.
7. Verify project filters and both screenshot galleries, resume download, Zamindar Technologies and Token Talent links, the full State Lab, and email/LinkedIn/GitHub/WhatsApp/project inquiry actions.
