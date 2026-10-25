# Translation review handoff

English remains the only active interface language. Sinhala (si), Tamil (ta), Spanish (es), and French (fr) are disabled drafts, as requested. Browser language and stored preferences cannot activate them.

All five dictionaries contain 853 matching keys. Each non-English dictionary contains 38 draft core translations and 815 English placeholders awaiting translation and native-speaker review. These are not complete native translations. `review/pending.json` lists pending keys; `review/status.json` records counts and approval; `review/source-catalog.json` provides English text and source context.

Authentication, navigation, sharing, public RSVP, and supported static page/error copy use the dictionaries. Date, time, and number formatting follows the reviewed locale; calendar-only dates retain their day across viewer timezones. Existing English formatting is preserved. Literal guest-template placeholders and interpolated user values remain literal.

Run `npm run i18n:extract` to extract supported JSX text, accessibility attributes, rendered messages, and validation errors. It validates all source edits before writing, backs up existing changed sources and resources under `.tools/localization-backup-*`, and skips identical outputs. Run `npm run i18n:check` to detect remaining supported static copy without writing files. Do not run extraction while browser verification is active.

The extractor is not a complete linguistic audit. Computed status/category labels, display arrays, rich JSX grammar, and pluralization still require manual review. Never translate persisted identifiers or user-authored invitation content. Preserve interpolation tokens, review accessibility and wrapping, and check local date/number conventions. Local Noto Sinhala/Tamil fonts are bundled under SIL OFL 1.1.

Before activation, translate pending entries, obtain native-speaker review, reconcile pending metadata, and explicitly approve the locale catalog. The initializer must also register the reviewed resources and supported language, followed by selector, parity, and browser checks. Changing approval flags alone cannot activate a locale with pending entries. Current authorization keeps English active; this work does not enable draft languages.
