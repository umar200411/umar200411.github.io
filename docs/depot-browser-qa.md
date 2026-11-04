# Portfolio Depot browser QA

The depot browser suite uses Playwright and Chromium. Local installation stalled in the restricted development environment, so the repository includes a GitHub Actions runner at .github/workflows/depot-visual-tests.yml. The workflow is configured for pushes to feature/interactive-character-hero and manual dispatch. It has not yet run; browser verification remains pending until its first real run.

## Run locally

Install Node.js 22 or later and Python 3, then run:

```sh
npm install
npx playwright install chromium
npm run test:depot
```

The test runner starts the static site on port 4173. It writes desktop, tablet, and mobile screenshots to test-results/, an HTML report to playwright-report/, and traces/screenshots/video for failed tests.

## Run in GitHub Actions

Push the feature branch to GitHub, or open Actions → Depot browser verification → Run workflow. Download depot-playwright-results from the completed run to inspect the screenshots and report. A configured workflow is not a passing result; review the actual run and artifacts.

## Manual smoke checklist

At 1440×900, 1024×768, 768×1024, 390×844, and 320×700:

1. Confirm the depot headline, umar✳ brand, shortcuts, Explore menu, crane, and seven containers appear without horizontal overflow.
2. Open each container and confirm its matching panel and links are readable.
3. Open Work, then About; observe doors close, claw return to the pile position, release, and pickup of About.
4. Rapidly request Work → Toolkit → Contact and confirm Contact opens last without a stuck state.
5. Use Tab, Enter, Space, and Escape to operate the containers; verify inactive panels do not receive focus.
6. Enable reduced motion and confirm the introduction opens immediately, then select another container.
7. Confirm Featured Projects filtering and both screenshot galleries, State Lab controls, mobile nav, resume link, and contact actions still work.
