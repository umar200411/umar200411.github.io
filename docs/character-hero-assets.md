# Interactive character hero assets

The current hero uses `assets/developer-character.webp` as its static, complete visual. It is a single 1122 × 1402 transparent illustration of a developer holding a laptop. It does not depict a seated developer wearing a headset, and it cannot truthfully show headset removal, waving, or pointing. No character source video or animation frames were present in the repository on 2026-11-03.

## Add the real animation

Produce one consistent character video, then export these transparent frame sequences into `assets/hero-character/`:

| Sequence | Required movement |
| --- | --- |
| `idle` | Seated behind laptop, headset on; subtle working loop |
| `lookLeft` | From working pose to a left glance |
| `lookRight` | From working pose to a right glance |
| `noticeVisitor` | Turns from work to look at the visitor |
| `removeHeadset` | Removes the complete headset and rests it around the neck |
| `wave` | Welcoming wave, headset remains around neck |
| `pointDown` | Gestures toward the Featured Projects section |
| `returnToIdle` | Returns to the original working pose and headset position |

Use the same canvas size, camera, character, clothing, laptop, lighting, and placement in every frame. Keep the complete head and laptop in the canvas. A transparent WebP sequence at roughly 900–1122 pixels wide is suitable. Export at 8–15 fps, with sequential filenames such as `assets/hero-character/idle/0001.webp`. Review every adjacent frame and the final-to-first idle transition for jumps. Optimize the frames before adding them to the site. Every frame in a sequence must have identical pixel dimensions; the player rejects mixed-size or incomplete sequences to avoid flashes.

## Recommended folder and metadata layout

```text
assets/hero-character/
  idle/0001.webp ... 0016.webp
  look-left/0001.webp ... 0012.webp
  look-right/0001.webp ... 0012.webp
  notice-visitor/0001.webp ... 0010.webp
  remove-headset/0001.webp ... 0018.webp
  wave/0001.webp ... 0014.webp
  point-down/0001.webp ... 0014.webp
  return-to-idle/0001.webp ... 0016.webp
```

Keep the public URL paths predictable and list them in playback order in `hero-sequences.js`. The configuration accepts `{ frames: [...], fps: 12, loop: true }` for `idle`; reaction sequences use the same shape without `loop`. Use zero-padded names so filesystem sorting and manual review match playback order. Do not crop individual frames differently. Preserve transparent pixels around the head, laptop, hands, and headset so the character never shifts inside the hero.

For a source video, one practical conversion flow is:

```sh
ffmpeg -i character-hero.mov -vf "fps=12,scale=1122:-2:flags=lanczos" -c:v libwebp -lossless 0 -q:v 78 assets/hero-character/idle/%04d.webp
```

For already exported PNG frames, convert without changing dimensions:

```sh
for frame in source/idle/*.png; do cwebp -quiet -q 82 "$frame" -o "assets/hero-character/idle/$(basename "${frame%.png}").webp"; done
```

Run a dimension check before wiring a sequence into the config:

```sh
identify -format '%wx%h\n' assets/hero-character/idle/*.webp | sort -u
```

The command should print exactly one dimension. Keep the original source video and an export note with the date, frame rate, canvas size, and compression quality beside the generated assets.

List each file, in playback order, in the matching `frames` array in `hero-sequences.js`. Adjust `fps` there after viewing the result. Empty arrays are supported and retain the static illustration. The player loads idle frames first, caches each image, and loads reaction frames only when requested. A sequence containing a missing or undecodable image is skipped, leaving the last valid visual in place. The static illustration remains available if there are no usable frames.

The left and right reactions hold for about 2.3 seconds, then return to idle. The center greeting runs through the four distinct visitor states and messages. The desktop pointer uses three broad hero zones with dwell and cooldown; touch visitors can use **Say hello**. Reduced-motion mode stays static.

## Existing behavior to preserve

The site is plain HTML, CSS, and JavaScript. Existing functionality lives in `script.js`: sticky navigation and mobile menu, section tracking, project screenshot galleries and filters, State Lab state switching, process disclosures, resume link, copy-email button, and the mailto project brief. The hero scripts do not alter those controls or page sections.
