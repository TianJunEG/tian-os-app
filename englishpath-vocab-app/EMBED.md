# Embedding ELPath as a free resource (BrightDesk & other partners)

ELPath's practice surfaces are self-contained, **no-login**, run entirely in the
learner's browser, and save nothing to a server unless the learner opts in. That
makes them safe to embed as a free resource in a partner site such as the
**BrightDesk** tutoring marketplace.

## What can be embedded

| Resource | URL | What it is |
|----------|-----|------------|
| Vocabulary practice | `/vocab/` | Adaptive P5/P6 vocabulary MCQ practice |
| Comprehension Cloze | `/vocab/cloze.html` | 24 original open-cloze passages, auto-graded with multi-answer accept-sets |

Replace the host with the deployment origin, e.g.
`https://<elpath-host>/vocab/?partner=brightdesk`.

The two pages cross-link to each other, so embedding either one gives access to
both.

## Iframe snippet

```html
<iframe
  src="https://<elpath-host>/vocab/?partner=brightdesk"
  title="ELPath — free English practice"
  style="width:100%; height:820px; border:0; border-radius:12px;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

- Use `min-height: 720px` on mobile; the layout is responsive.
- For the cloze resource, point `src` at `/vocab/cloze.html?partner=brightdesk`.

## The `?partner=` parameter

Adding `?partner=brightdesk` (any short partner slug works):

- shows a small **co-brand ribbon** ("ELPath — free practice for BrightDesk learners"),
- tags the page so styling can adapt (`<html class="is-embedded partner-brightdesk">`),
- logs one anonymous `partner_land` attribution event (no personal data),
- is carried across the vocab ↔ cloze cross-links so the context persists.

Without the parameter every page still works exactly the same, just without the ribbon.

## Allowing the frame (host-side setting)

By default the ELPath host lets **any** site frame `/vocab/*`
(`frame-ancestors *`), which is appropriate for an open free resource. To lock
embedding to specific partner origins, set the environment variable on the host:

```
EMBED_FRAME_ANCESTORS="https://app.brightdesk.example https://www.brightdesk.example"
```

Only `/vocab/*` and its engine assets (`/shared/englishpath/*`) are framable; the
rest of the app keeps the default same-origin-only frame policy.

## Notes

- No cookies or auth are required; nothing is stored server-side for anonymous use.
- The optional "save my progress" sign-in (magic link) still works inside the
  frame but is never required — tutors/students can use it purely as a drill.
