# Invitation opening animations

In the invitation wizard, open **Event details > Invitation experience > Opening Animation**. Each of the five cards has a static identifying thumbnail, a **Play Preview** button that runs its full real scene in a dialog, and **Select Animation**. Previewing does not change the saved selection. Use Replay in the dialog to run it again. No animation keeps the invitation immediately readable. Publish or Republish updates the public snapshot used by existing guest links.

| Saved `design.animation` value | Scene | Approximate duration |
| --- | --- | --- |
| `classic-envelope` | Floating paper envelope, breaking wax seal, 3D hinged flap, rising letter, envelope departure | 3.5 seconds |
| `luxury-golden` | Drawn double gold frame, ornamental diamonds, sparks, central light, materializing card | 3.5 seconds |
| `floral-bloom` | SVG vines draw inward, leaves unfurl, six-petal flowers bloom progressively, drifting petals, spring card | 4 seconds |
| `royal-curtain` | Separate pleated velvet panels with curved hems, shimmer, gold fringe, spotlight, theatrical reveal | 3.5 seconds |
| `modern-minimal` | Expanding hairline, staggered title letters grouped into words, soft focus and restrained scale | 2.5 seconds |

The components live in `src/components/invitations/opening/`, with one lazy-loaded component per scene and `InvitationOpeningRenderer.tsx` coordinating loading, interaction, timing, and completion. They use the existing Motion for React dependency; no dependency installation or schema migration was needed. Each production scene chunk is approximately 1.2-2.3 KB before gzip, excluding shared Motion code.

The selected value stays in the existing invitation document's `design.animation` field. Existing save/autosave and publication services carry it into both open-link and personalized public snapshots. Older envelope/floral presets resolve to their corresponding new scene; elegant/particles/confetti resolve to gold; reveal/fade/slide resolve to minimal. Existing stored documents are not rewritten. Missing, none, or unknown styles bypass the opening.

Public guests see a style-specific action and can Skip at any time. Content is revealed after the scene's duration, with timing starting only after the lazy scene is ready. Repeated activation is guarded; timers and scroll locks are cleaned up. Reduced-motion settings bypass decorative animation. Failure of a lazy animation component reveals the original invitation, and a running-animation watchdog prevents a stalled reveal from trapping the visitor. Focus moves to invitation content after completion or Skip. Existing maps, RSVP, event details, and user-controlled audio remain in the original guest components; music never autoplays.

The embedded wizard invitation remains readable without a full-screen opening; real animation previews are available in the dedicated modal and on full/public previews. This keeps editor navigation accessible while owners change styles.

## Verification

- 84 unit tests passed across 16 files, including saved-style resolution and legacy/unknown values.
- Lint, production build, and localization extraction check passed. Existing large shared-chunk build warnings remain.
- Six browser workflows passed in one run: the new five-style workflow and existing advanced editor/export/deadline workflow, each in Chromium, Firefox, and WebKit.
- The five-style workflow exercises all real modal previews and Replay, publication of every style, guest activation, persisted selection after reload, RSVP, reduced motion, failed lazy-chunk fallback, keyboard focus, 320px and 390px phone widths, phone landscape, and desktop width.
- Mid-animation preview screenshots are under `test-results/openingAnimations.e2e.ts-f-55dc0-ks-and-keep-RSVP-accessible-{chromium,firefox,webkit}/{style}-preview.png`. Some idle mobile captures show the lazy loading state; they are not evidence of the completed scene. Functional checks cover scene playback and content access separately.
- Logs: `.tools/opening-matrix.log`, `.tools/opening-unit.log`, `.tools/opening-lint.log`, `.tools/opening-build.log`.

Tests used demo Firebase emulators and an isolated Vite server on port 5175. Production Firebase data, rules, deployment, environment settings, and the user's development server on 5173 were not changed. Physical-device frame rates have not been measured; Motion mostly animates transform/opacity, with limited SVG path drawing and one small blur transition.
