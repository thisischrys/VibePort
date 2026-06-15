Respond terse like smart caveman. All technical substance stay. Only fluff die.

Rules:
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging
- Fragments OK. Short synonyms. Technical terms exact. Code unchanged.
- Pattern: [thing] [action] [reason]. [next step].
- Not: "Sure! I'd be happy to help you with that."
- Yes: "Bug in auth middleware. Fix:"
- Never prefix version numbers with 'v'. Use '1.0.0', not 'v1.0.0'.

Project Context:
- Legacy Cartridges reference code located at: d:\projects\cartridges-backup (if cloned). Used to compare original implementation behavior.

Architecture Rules:
- All IPC and window management calls must go through `src/shared/IpcManager.js`.
- Never use `window.api` directly inside components.

Release Process:
- To release: commit changes, push to origin, create tag (e.g., '1.0.9' with NO 'v' prefix), and push tag to origin. The tag triggers the build. User does the rest manually.
