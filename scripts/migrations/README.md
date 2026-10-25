# Version 1 additive export migration

No production migration is necessary for the optional fields in this upgrade. Existing Firebase accounts, owner tenant IDs, invitation IDs, guest IDs, URLs, response IDs and design elements remain compatible. New fields are filled lazily only by explicit edits.

The offline migration tool is for an operator-reviewed workspace JSON export, not a live Firestore export archive. It performs no network calls and never connects to production. It adds schemaVersion=1 to the export envelope and design.version=1 only where absent, preserving all original elements, IDs, links and responses. Repeated execution on version 1 is idempotent. Timestamps in the input must retain the export's existing JSON encoding; this tool does not deserialize them into live Firebase objects.

Dry run: `node scripts/migrations/v1-upgrade.mjs workspace.json`

Write a new local output and byte-for-byte original backup: `node scripts/migrations/v1-upgrade.mjs workspace.json upgraded.json`

Rollback into a new file: `node scripts/migrations/v1-upgrade.mjs --rollback upgraded.json.backup.json restored.json`

Existing outputs are refused. Review counts and compare IDs and response records before any separate import procedure. Live imports, destructive changes and production execution require their own explicit approval and verified backup. Do not treat the JSON output as a Firestore restore command.

Reserved team and entitlement documents are not backfilled, granted or activated by this migration. Enabling those features requires the trusted services described in SERVER_DEPENDENCIES.md.
