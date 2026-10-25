# Technical privacy inventory ? operator review required

This is an implementation inventory, not published legal advice or an approved privacy policy/terms document.

- Account name/email are held by Firebase Authentication and owner profile documents. Password handling stays with Firebase Authentication; the application does not write passwords to Firestore.
- Owner guest records may contain names, phone/email, category/tags, household planning counts, meal/dietary preferences, notes, response status, check-in and reminder opt-out preferences. These records are owner-only under the current single-owner model.
- An explicitly published invitation contains its public event details, artwork, configured questions and enabled website content. Host-selected public photos use tokenized Firebase download URLs. Private gallery entries and hidden section payloads are excluded from new public snapshots.
- Anyone holding a valid public invitation capability may view the published invitation and submit/read the response addressed by that capability. Public invitation/response listing is denied to anonymous visitors. Phone numbers and private notes are not added to share documents.
- Camera access starts only after the organizer chooses Start camera. The scanner decodes in the browser; frames are not uploaded by this implementation. Camera controls stop on cancellation or route unmount.
- Music requires an explicit Play action. Embedded videos are not loaded until a guest chooses to play them; external video providers then receive normal browser requests. Registry/Maps/WhatsApp links open external services only through their corresponding controls.
- Manual reminder preferences and preparation logs are owner-only. No scheduled delivery runs and no sent/delivered/read state is inferred.
- Browser diagnostics contain only timestamps, failure categories and allowlisted/sanitized route names in a bounded in-memory buffer. Original messages, names, email addresses, invitation tokens and full URLs are excluded. No remote telemetry endpoint is configured.
- Guest/analytics exports and offline migration backups contain private workspace information when exported by the owner. The operator must establish storage, access, retention and deletion procedures for exports.

Before launch, the operator must provide its actual identity/contact, service providers/regions, retention periods, lawful-basis/consent decisions, data subject request process, deletion implementation and approved privacy/terms copy. None is fabricated here. Team, billing, automated sending, custom domain and account-erasure activation remain gated as described in SERVER_DEPENDENCIES.md.
