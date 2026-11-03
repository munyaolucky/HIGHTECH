# HI-TECH College Public Website

## Design direction

The public homepage uses the supplied HI-TECH College reference as its visual direction: a navy-and-gold identity, institutional navigation, a full-width photography hero, a six-item highlights strip, qualification-led programme cards and a live catalogue summary with an admissions call to action.

This is an original HI-TECH implementation. It preserves the integrated React application, existing public APIs, admissions/application callbacks, enquiry workflow, CMS content, catalogue tabs and role-authenticated portal.

## What changed

- `apps/web/src/PublicWebsite.tsx`: updates the homepage composition and uses live programme qualifications, departments, campuses and published updates for categories and summary counts. Search and qualification/study-mode filters remain available.
- `apps/web/src/public-website-campaign.css`: adds the responsive navy-and-gold campaign visual layer while retaining the existing styles for other public pages.
- Existing gallery, institutional information, CMS pages, news, events and admissions sections remain available below the reference-inspired first-screen content.

## Data integrity

- Homepage programme categories and summary counts come from public API responses; no student, staff or employability statistics are invented.
- News, announcements and event cards still come from published CMS content.
- Public CMS pages are still linked from the homepage when records exist.
- Existing public form submission, consent, reference-number, sign-in, enquiry and admissions callbacks are preserved.
- Empty states remain available when no content has been published.

## Image and launch notes

The remote Unsplash images currently present in `PublicWebsite.tsx` are illustrative design-preview photography, not verified HI-TECH campus photographs. Replace them with approved, appropriately licensed college images before launch. The images are hotlinked rather than bundled; production should preferably use college-owned media uploaded through the Media Library. Image elements hide themselves if an external image fails to load.

## Verification

- Run `npm run typecheck --workspace @hitech/web`, `npm test --workspace @hitech/web`, and `npm run build --workspace @hitech/web`.
- Also test public navigation, application handoff/return, enquiry submission, empty catalogue states, mobile navigation, reduced-motion preferences, image loading/failure, keyboard focus and screen-reader labels.
