export function migrateV1<T extends Record<string, unknown>>(input:T):T & {schemaVersion:1};
