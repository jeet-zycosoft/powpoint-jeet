# AI Agent Context Loader

**Instructions for the AI Agent:**
When starting a new session or task on the PawPoint project, please execute the following steps to ensure you have the correct architectural context.

1. **Check Memory:** Determine if you already have the PawPoint project context loaded in your memory.
2. **Read Documentation:** If you do not have the context stored, you must read the following files from the root directory:
    - `PROJECT_CONTEXT.md`
    - `FRONTEND_INTEGRATION_GUIDE.md`
3. **Save to Memory:** Save the patterns and guidelines described in those files into your memory for the duration of the conversation.

### Quick Reference Core Rules:

- **Framework:** Next.js 16 (App Router) with decoupled UI. Keep `src/app/` thin and put actual UI logic in `src/views/` and `src/components/`.
- **Styling:** Use SCSS (`style.scss` next to `index.jsx`). Do NOT use Tailwind CSS.
- **API Strategy:** Always use the custom Axios instance (`src/services/apiClient.js`) and the centralized endpoints dictionary (`src/services/endpoints.js`). Requests are proxied via `/api/v1/`.

By loading this context, you ensure that any code generated aligns with the existing project structure and conventions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
