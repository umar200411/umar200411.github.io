# CursorScrubVideo

This portfolio is plain HTML, CSS, and JavaScript, so the character uses the native `CursorScrubVideo` class in `cursor-scrub-video.js`. The module does not add a React or Framer dependency. It can be mounted on any element with `data-cursor-scrub`; `window.CursorScrubVideo` is also available to configure an instance directly.

## Current character assets

- Static transparent still: `assets/character-still.png` (reference-based 16:9 PNG, generated at 1672×941 in this environment; it is not a 4K render).
- Existing portfolio illustration retained: `assets/developer-character.webp` and `assets/developer-character-1.png`.
- Cursor video: **not supplied yet**. Add the approved, identity-consistent video at `assets/character-cursor-scrub.mp4`, then set `data-video-file="assets/character-cursor-scrub.mp4"` on the stage's `[data-cursor-scrub]` element.

The current stage shows the still image. It does not fake eye or head movement. The mounted component's state is available at `data-scrub-state`; it stays at `poster-only` until a video is provided. Reduced-motion and touch-first environments remain on the still.

## Component properties

| Option / `data-*` attribute | Type | Default |
| --- | --- | --- |
| `videoFile` / `data-video-file` | URL or `File` | empty |
| `axis` / `data-axis` | `horizontal` or `vertical` | `horizontal` |
| `reverse` / `data-reverse` | boolean | `false` |
| `trackingArea` / `data-tracking-area` | `component` or `window` | `component` |
| `smoothing` / `data-smoothing` | number from 0.02 to 1 | `0.22` |
| `objectFit` / `data-object-fit` | `cover`, `contain`, or `fill` | `cover` |
| `showPoster` / `data-show-poster` | boolean | `true` |
| `borderRadius` / `data-border-radius` | pixels | `0` |
| `poster` / `data-poster` | matching still URL | empty |

Example:

```html
<div class="cursor-scrub-video"
  data-cursor-scrub
  data-video-file="assets/character-cursor-scrub.mp4"
  data-poster="assets/character-still.png"
  data-axis="horizontal"
  data-tracking-area="window"
  data-smoothing="0.22"
  data-object-fit="contain"></div>
```

The module never enables controls, audio, looping, or autoplay. It primes playback muted and pauses as soon as the browser resolves the play promise; scrubbing stays disabled until `canplaythrough`. A missing or failed video falls back to the supplied still. A source-less component without a poster displays **Add a video file**.

## Authoring the video

Create one stable, neutral, forward-facing starting frame, followed by a slow left-to-right look and a return to neutral. Only the eyes and head should move; keep identity, facial features, hairstyle, clothing, framing, background, lighting, and colors consistent. The integrated component uses `trackingArea="window"` and `axis="horizontal"`. A single timeline only maps one cursor dimension; it cannot independently follow X and Y.

For a future two-axis treatment, provide separately authored horizontal and vertical timelines with identical camera, dimensions, transparent/matching background, and a shared neutral pose. Blending layers is only appropriate when both clips align exactly and their poses are subtle; otherwise blending creates a visible double image. A real-time rig or a deliberate dominant-axis crossfade is preferable to claiming independent 2D control from one MP4. Neither directional video is present now, so only the supplied still is shown.

### Encoding for seeking

For smooth random-access scrubbing, encode every frame as a keyframe:

```bash
ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 -x264-params "scenecut=0" -profile:v high -pix_fmt yuv420p -movflags +faststart -an out.mp4
```

All-intra video improves random-access decoding, but substantially increases file size. Start with a short clip at 24 fps and 1280×720; compare actual scrubbing on target phones before increasing resolution or frame rate. If quality permits, raise CRF gradually (for example, 20–22) to reduce size. Browser and device decoders do not guarantee that every requested frame appears instantly, even when all frames are keyframes.

## Verification

Run the existing browser suite with `npm install`, `npx playwright install chromium`, and `npm run test:depot`. It includes the poster-only fallback and stage regressions. With the video supplied, verify horizontal and vertical axes, reverse, both tracking areas, smoothing extremes, blocked playback, seeked sequencing, media errors, reduced motion, touch mode, hidden-tab pause, and `destroy()` cleanup. Browser automation is configured in `.github/workflows/depot-visual-tests.yml`; its first run is still needed for visual confirmation.
