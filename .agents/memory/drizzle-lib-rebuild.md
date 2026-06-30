---
name: Drizzle lib rebuild after schema changes
description: Adding new schema files to lib/db requires rebuilding declarations before dependent packages can typecheck.
---

## Rule
When new files are added to `lib/db/src/schema/` and exported from `lib/db/src/schema/index.ts`, the dependent api-server package will show `Module '"@workspace/db"' has no exported member 'XTable'` until declarations are rebuilt.

**Fix:** Run `pnpm run typecheck:libs` (which runs `tsc --build`) before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** TypeScript project references use pre-built `.d.ts` files in `dist/`. Stale declarations don't reflect new exports.

**How to apply:** Always rebuild libs before typechecking dependents after schema changes.
