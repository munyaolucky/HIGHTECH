# Cookies and browser storage

Single source of truth in code: `apps/web/src/lib/consent.ts` (the banner and the public cookie policy page are generated from it). If you add a cookie or a localStorage key, add it there in the same change.

| Name | Kind | Category | Purpose | Lifetime |
| --- | --- | --- | --- | --- |
| `hitech_refresh` | Cookie (HttpOnly, SameSite=Strict, path `/api/auth`, Secure in production) | Strictly necessary | Session renewal after sign-in; removed on sign-out | `REFRESH_TOKEN_DAYS` (default 7, maximum 30) |
| `hitech.consent` | Local storage | Strictly necessary | Remembers the visitor's choice | 12 months, or until `CONSENT_VERSION` changes |
| `hitech-shell-v1` | Cache storage (service worker) | Strictly necessary | Public app-shell files only | Until the app updates |
| `hitech-display-preferences:<user>` | Local storage | Preferences (consent required) | Theme, accent, text size | Until cleared |
| `hitech.learning-canvas.v1.<user>` | Local storage | Preferences (consent required) | Saved network diagrams | Until cleared |

No analytics or advertising cookies are used. The consent record stores only the policy version, the two choices and a timestamp, in the visitor's own browser; the server keeps no consent log.

## Behaviour
- Equal-prominence "Necessary only" and "Accept preferences" buttons; a settings panel; a permanent cookie button so withdrawal is as easy as consent.
- Withdrawing preference consent deletes the stored preference keys immediately.
- Nothing optional is written before a choice is made. `canStore('preferences')` gates every optional write.
- Changing `CONSENT_VERSION` re-asks everyone. Public policy page: `/?cookies=1`.

## Before publishing
The policy text is a draft. Have the college's legal adviser or data protection officer review it against the Data Protection Act, 2019, add the data protection officer's contact details, and publish a matching privacy notice. If analytics or any third-party embed is added later, set that category's `inUse` flag, update the table and re-prompt.
