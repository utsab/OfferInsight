# Parallax tutorial

Small, in-repo walkthrough of the homepage intro scroll (`components/home/OsrIntroScroll.tsx`). Work through steps in order.

| Route | Topic |
|-------|--------|
| `/parallax_tutorial` | Index |
| `/parallax_tutorial/step1` | Scroll track + scrub (one `fromTo`, one ScrollTrigger) |
| `/parallax_tutorial/step2` | One GSAP timeline + crossfade (Scene A ↔ Scene B) |
| `/parallax_tutorial/step3` | **Not built yet** — inner content scroll (see below) |

## Step 3 (planned)

**Inner content scroll** — same pattern as personal bar on the homepage:

- Section shell stays **fixed** in the viewport.
- Inner content moves **`y`** upward as the user scrolls (e.g. start at `140vh`, end at a negative `vh`).
- Reference: `attachContentScroll()` in `components/home/OsrIntroScroll.tsx`.
- Related timing/travel helpers: `components/home/osrScrollUtils.ts`, `components/home/osrIntroTimeline.ts`.

When implementing Step 3, add `step3/page.tsx` and register it in `ParallaxTutorialNav.tsx` and the index page.

## Homepage reference map

| Tutorial idea | Homepage code |
|---------------|----------------|
| Scroll track height | `scrollTrackRef`, `buildIntroScrollPhases()` |
| Section crossfade | `attachSectionCrossfade()` |
| Inner content scroll | `attachContentScroll()` |
| Phase timings | `osrIntroTimeline.ts` → `buildIntroScrollPhases()` |
