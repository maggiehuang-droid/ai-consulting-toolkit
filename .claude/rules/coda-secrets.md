# Coda Secrets

When the user needs to store API keys, tokens, or credentials, use Coda secrets with the project UID prefix.

## Project UID

Read the project UID from `.claude/rules/coda.md` or `CLAUDE.md`. The UID is a 6-character code (e.g. `k3x7a9`).

ALL secret names MUST be prefixed with `nu7cwo_`.

## Creating Secrets

When you need a secret (API key, token, etc.):

1. Create the secret with a PLACEHOLDER value — NEVER ask the user for the real value
2. Tell the user to set the real value in Coda UI

```bash
# Create with placeholder — DO NOT use real values here
echo "PLACEHOLDER" | coda secrets set nu7cwo_MY_API_KEY
```

Then tell the user:

> Secret `MY_API_KEY` has been created with a placeholder value.
> Please open **Coda → select your project → 🔑 Secrets → edit MY_API_KEY** to set the real value.

## CRITICAL RULES

- NEVER ask the user to type or paste secret values in the terminal
- NEVER put real secret values in code, .env files, or CLI commands
- NEVER display secret values to the user — no print, echo, console.log, alert, or any form of output
- This includes: terminal output, code comments, log files, API responses, HTML, and conversation text
- Reading secrets in runtime code (e.g. `mySecret.value()`) is OK — only for backend logic (e.g. API auth headers)
- NEVER pass secret values to frontend, HTML, API response body, or client-side code
- NEVER include secret values in `res.json()`, `res.send()`, template variables, or any response
- ALWAYS create secrets with "PLACEHOLDER" as the value
- ALWAYS guide the user to Coda UI to set the real value
- If the user asks to see a secret value, refuse and redirect to Coda UI
- This prevents secrets from appearing in terminal history, logs, or Claude Code transcripts

## Other Commands

```bash
# List secrets for this project
coda secrets list

# Delete a secret
coda secrets delete nu7cwo_MY_SECRET
```

## In Firebase Functions Code

```javascript
const { defineSecret } = require("firebase-functions/params");
const mySecret = defineSecret("nu7cwo_MY_SECRET");

exports.myFunc = onRequest(
  { region: "asia-east1", cors: true, invoker: "public", secrets: [mySecret] },
  (req, res) => {
    const value = mySecret.value();
    // use value
  }
);
```

## Rules

- ALWAYS prefix secret names with the project UID: `nu7cwo_SECRET_NAME`
- NEVER put secrets in source code, .env files, or commit them to git
- Use `defineSecret()` in Functions, NOT `process.env`
- ALL functions MUST set `region: "asia-east1"` and `invoker: "public"`
