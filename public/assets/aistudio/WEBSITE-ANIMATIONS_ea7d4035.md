# HI-TECH College Website Motion System

The public website now has a small, accessible motion layer loaded by `PublicWebsite.tsx` through `public-website-motion.css`.

## Included motion

- Hero entrance and gentle hero-image reveal.
- IntersectionObserver-based section and card reveal, with staggered delays.
- A slim scroll-progress indicator.
- Hover/focus lift and image zoom for programme, gallery and department cards.
- Button hover feedback and subtle highlight sweep.
- Animated mobile navigation open/close state.
- Focus treatment for programme search and public forms.
- Smooth modal/backdrop entry and form-success feedback.
- Loading indicator breathing animation.

## Accessibility and resilience

- The reveal attributes are applied only when `IntersectionObserver` is available and the user has not requested reduced motion. Without the API, content stays visible.
- `prefers-reduced-motion: reduce` disables animated transforms, keyframe effects, and smooth scrolling and ensures reveal targets remain visible.
- Touch devices do not rely on hover to expose content.
- Motion is decorative; it does not block form submission, navigation, or access to any information.
- The mutation observer catches cards inserted after live catalogue filtering or tab changes.
- CSS animations primarily use opacity and transform to keep motion lightweight.

## Files changed

- `apps/web/src/PublicWebsite.tsx` — registers reveal targets and the scroll progress indicator.
- `apps/web/src/public-website-motion.css` — transitions, keyframes, responsive navigation motion and reduced-motion behavior.
- `apps/web/src/public-website-inspired.css` — removes a legacy forced `transform: none !important` declaration so programme-card motion can work.

## Verify locally

From the repository root:

```powershell
npm install
npm run typecheck --workspace @hitech/web
npm run build --workspace @hitech/web
npm run check:website-motion
```

Then inspect the homepage, programme catalogue, fees, news, public forms and college profile at desktop and mobile viewport widths. Test with the operating-system reduced-motion preference enabled and with keyboard-only navigation.

The source has been syntax-transpiled and the CSS has been parsed in the preparation environment, but a full dependency-based typecheck/browser run must still be performed after dependencies are installed.
