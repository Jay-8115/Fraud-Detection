---
name: Orval codegen barrel fix
description: Removing the schemas option from orval zod config stops duplicate type generation but the barrel still references ./generated/types; must patch after each run.
---

## Rule
After `pnpm --filter @workspace/api-spec run codegen` succeeds (orval part), `lib/api-zod/src/index.ts` is always regenerated to include `export * from "./generated/types"`. When `schemas` is removed from orval config, this folder no longer exists, causing typecheck to fail.

**Fix:** After orval runs, overwrite `lib/api-zod/src/index.ts` with only `export * from "./generated/api";`.

**Why:** Orval's zod client always emits the barrel referencing types even when the schemas output path is removed. The types are already inferred from Zod schemas via `z.infer<>`, so the separate TS types folder is redundant.

**How to apply:** Any time codegen is re-run, the barrel patch must be reapplied. Consider adding a post-codegen script to `lib/api-spec/package.json` for automation.
