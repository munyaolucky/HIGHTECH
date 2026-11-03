# HI-TECH College — Reference-inspired Public Site Refresh

## Purpose

This design translates the two supplied visual references into an HI-TECH College public website design: a modern rounded institutional landing page with a large photographic hero and integrated programme search, plus a separate institution profile screen. It uses a soft lavender/white surface, deep indigo/purple accents, round cards, restrained shadows and responsive layouts. It does not copy Google, Nestoria or their branding/content.

## Public landing page

- Rounded institutional navigation with a visible College profile section.
- Full-width photographic hero with admissions actions and a real programme search form.
- Search filters use live public catalogue values for programme keyword, qualification type/level and study mode.
- A search submits into the existing program catalogue and preserves the active filters.
- Highlight strip shows catalogue-related features without claiming fabricated review counts, ratings or verification badges.
- Existing public programme catalogue, department cards, college information, public fees, news/events, CMS pages and dynamic public forms remain connected to the current API.
- A three-step information journey adds direct links to programme discovery, applications and public updates.

## Institution profile

The College profile view is opened from the navigation and is shareable through `?public=1&view=profile`. It displays:

- HI-TECH College identity and Kitengela Campus location (the only address-level location shown in this design).
- Dynamic counts from the public programme, fee and update catalogues.
- Directions to a Google Maps search for “HI-TECH College, Kitengela, Kenya”. This is a search link, not a verified street address or pinned campus coordinate.
- Apply, programme catalogue, contact form and share actions.
- Image cards for college life and learning, labelled as illustrative photography.

Telephone numbers, email addresses, opening hours, student/customer review counts, official verification marks and QR identity badges are intentionally omitted until the college supplies verified values and approves a public-contact policy. The `Official college information portal` label describes this site section, not independent institutional accreditation.

## Images and rights

The design uses remote Unsplash URLs as illustrative placeholders. Replace them with authorized HI-TECH College photography or appropriately licensed imagery before public launch. Image load failures hide the affected image without preventing the rest of the page from rendering.

## Implementation details

- Main component: `apps/web/src/PublicWebsite.tsx`
- Reference-inspired style layer: `apps/web/src/public-website-reference.css`
- Existing styles preserved: `apps/web/src/public-website.css` and `apps/web/src/public-website-inspired.css`
- Public deep-link bootstrap: `apps/web/src/App.tsx`
- No API or database schema changes are required.

## Verification

Run from the repository root:

```powershell
npm install
npm run typecheck
npm test
npm run build
```

Also manually test at 1440 px desktop, 768 px tablet, 390 px mobile and 320 px narrow mobile; verify the header menu, keyboard focus, screen-reader labels, programme search filters, profile share URL, directions link, public form submission and app sign-in/return behavior. This environment has no installed workspace dependencies, so dependency-backed typechecking, Vite production build and browser/device testing are not reported as passing.
