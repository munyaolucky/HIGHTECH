# Cross-platform Architecture: Smartwatch, Canvas and AR/VR

## Watch companion API

`GET /api/companion/watch/summary` requires an authenticated `STUDENT` or `LECTURER` session. The server returns a compact upcoming timetable for the signed-in user, current/next session, a short list of that user's notification previews, and an unread count. It does not return a class roster, student marks or balances. The route is rate limited and timetable recurrence is calculated in `Africa/Nairobi`, with academic period and per-slot effective date bounds applied.

The React Native app exposes this as a `Watch` tab for student and lecturer roles. The web Learning Studio includes a watch-sized preview. **The current source does not contain a separately installable Wear OS or watchOS application**; the endpoint and compact companion UI are a base for a future native watch client.

## Interactive Learning Canvas

The web Learning Studio contains a simple network-topology canvas. Users can drag nodes, select and connect nodes, edit labels/descriptions, remove selected nodes, export JSON, and import JSON with validation and a 1 MB size limit. Autosave is per user in the current browser's local storage. It is not shared, collaborative, backed up or synchronized to the college server. Users should not place confidential student records, passwords, live network secrets or other sensitive data in canvas notes.

## AR/VR networking lab

The prototype renders a wireframe computer-network scene with WebGL and can attempt immersive AR/VR using WebXR if the browser/device supports the requested mode. WebXR support varies by browser and device and requires a secure context such as HTTPS (localhost is generally allowed for development). If immersive capabilities are unavailable, the normal 3D preview remains available. This is a learning demonstration, not a certified networking simulator or safety-critical training system.

## Remaining work before production

- Run dependency-backed TypeScript typechecking and tests after a successful install.
- Run `prisma validate`, generate the client, apply migration(s) against a disposable PostgreSQL database, and test the companion API with authenticated student/lecturer accounts.
- Test the web Learning Studio in supported desktop/mobile browsers and test immersive mode on actual compatible headsets over HTTPS.
- For a real smartwatch app, create a dedicated Wear OS/watchOS client, establish platform authentication, design small-screen navigation, and test native notifications and battery constraints.
- For multiuser canvas collaboration, move saved diagrams to a server-side model, enforce sharing permissions, and add concurrency/version handling.
- For AR/VR expansion, add asset management, accessibility and motion-comfort options, device QA, and an educator-reviewed learning curriculum.
