# Coda Deploy

When the user asks to deploy, use the Coda CLI.

## Commands

```bash
# Deploy everything (auto-detect hosting + functions)
coda deploy

# Deploy only hosting
coda deploy --only hosting

# Deploy only functions
coda deploy --only functions

# Deploy with JSON output
coda deploy --json
```

## Rules

- ALWAYS use `coda deploy` instead of `firebase deploy` directly
- Coda handles site creation, codebase isolation, and deploy history automatically
- If deploy fails, show the error and suggest `coda deploy --json` for detailed output
- Do NOT modify firebase.json hosting.site or functions.codebase — Coda manages these
- ALL Cloud Functions MUST set `region: "asia-east1"` and `invoker: "public"`
