# Cortex — Complete Homepage

One index.html, one style.css, one main.js — merged from the ten
standalone sections built earlier (hero, about, services, features,
pricing, testimonials, FAQ, blog, contact, footer).

## Structure

```
cortex-complete/
├── index.html
├── css/
│   └── style.css
└── js/
    └── main.js
```

## Run it

No build step. Serve the folder statically:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## What changed during the merge

- **Bootstrap 5 linked once**, Google Fonts linked once, one shared
  `<head>` with proper SEO meta instead of ten separate copies.
- **One canonical design-token set** at `:root` in `style.css`. Each
  section previously carried its own prefixed alias block
  (`--hero-primary`, `--svc-primary`, `--pr-primary`, …) all pointing
  at the same underlying values — those aliases are gone; every rule
  now references the shared token directly (`--color-primary`, etc.).
- **Duplicate boilerplate removed**: the box-sizing reset, base `body`
  rule, `.container-xl-custom`, and the `[data-reveal]` scroll-reveal
  system existed once per section (10 copies) and now exist once.
  Section-specific reduced-motion rules were kept; the generic
  `[data-reveal] { transition-duration: 0.01ms }` line was deduplicated
  out of each of them.
- **Duplicate JavaScript removed** — this was the part with real
  teeth: every section declared its own `const prefersReducedMotion`,
  which throws a `SyntaxError` on redeclaration once files are
  concatenated into a single script. Also found 8 copies of
  `initReveal()` and 2 copies of `initStatCounters()` (hero + about
  use the same `[data-count-to]` convention). All of it now exists
  exactly once at the top of `main.js`; every section's unique
  function (particle field, tilt cards, billing toggle, slider,
  accordion, form validation, back-to-top, etc.) is unchanged and
  called once from a single `DOMContentLoaded` handler at the bottom.
- **Fixed a real class-name collision**: hero's buttons used a
  generic `.btn` / `.btn--primary` naming scheme, which collides with
  Bootstrap's own `.btn`. Renamed to `.hero-btn*` throughout the CSS,
  HTML, and JS.
- **Demo-only scaffolding removed**: each standalone section had a
  small amount of markup that only existed to make the isolated demo
  page work (hero's fake `#explore` scroll target and filler `<main>`,
  footer's tall filler section for scroll room). Hero's scroll cue now
  points at the real About section; hero's primary CTA is a real link
  to Pricing.
- **Structural upgrade**: everything is now wrapped in a proper
  `<main id="main-content">`, with a skip-link at the top of `<body>`
  pointing to it — none of the standalone demos had this since each
  was just one section in isolation.
- **All animations verified intact**: particle canvas, magnetic
  buttons, stat counters, scroll-reveal (including features' left/right
  directional variant), tilt + spotlight cards, animated mock UI
  panels, pricing toggle crossfade, testimonial auto-slider with
  drag/swipe, accordion expand/collapse, back-to-top scroll-progress
  ring — all confirmed working off the single merged `main.js`.

## Validated

- `main.js` passes `node --check` (no syntax errors, no duplicate
  top-level declarations)
- `style.css` has balanced braces, single `:root` block
- `index.html` has balanced tags and **zero duplicate `id` attributes**
  across all 60 IDs in the document (checked explicitly — this is the
  most common breakage when merging independently-built sections)
- Every internal anchor (`#about`, `#pricing`, `#features`, etc.)
  resolves to a real element in the merged page

## Known gaps to be aware of

- No live browser preview was taken in this environment — the checks
  above are static (syntax, balance, duplicate-ID, dead-link), not a
  rendered visual check. Worth a manual look before shipping.
- The contact section's map is a styled placeholder, not a live Google
  Maps embed, on purpose (see the HTML comment above that section).
- Newsletter and contact forms simulate submission (no backend) —
  each has a clear comment marking where to add a real `fetch()` call.
