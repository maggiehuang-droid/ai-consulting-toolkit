# Project Rules

## GCP Project
cl-maggie-huang-vibe

## Secrets Management
- Project UID: du0c9a
- ALL secret names MUST be prefixed with `du0c9a_` (e.g. `du0c9a_API_KEY`)
- Use: `firebase functions:secrets:set du0c9a_SECRET_NAME --project cl-maggie-huang-vibe`
- In Functions code, use `defineSecret("du0c9a_SECRET_NAME")` to access secrets
- NEVER put secrets in source code, .env files, or commit them to git
- To list existing secrets: `firebase functions:secrets:get --project cl-maggie-huang-vibe`

## Deploy
- Deploy command: `coda deploy`
- Deploy hosting only: `coda deploy --only hosting`
- Deploy functions only: `coda deploy --only functions`

## Firebase
- Hosting public dir: `public/`
- Functions source: `functions/`

## Cloud Functions Rules
- ALL functions MUST set region to asia-east1 and invoker to public
- Example: `exports.myFunc = onRequest({ region: "asia-east1", cors: true, invoker: "public" }, (req, res) => { ... })`
- NEVER use default region (us-central1)
- ALWAYS set `invoker: "public"` for HTTP endpoints
