# Cloudflare Serverless Setup

## Runtime note

This Worker runtime serves the API in **memory mode** (stateless per Worker isolate) for database-backed endpoints.
`MONGODB_URI` is currently not used by the Worker runtime path.

## 1) Install dependencies

```bash
pnpm install
```

## 2) Authenticate Wrangler

```bash
pnpm dlx wrangler login
```

## 3) Configure runtime variables

Set non-sensitive vars in `wrangler.toml` under `[vars]`.

Set sensitive vars as Cloudflare secrets:

```bash
pnpm wrangler secret put MONGODB_URI
pnpm wrangler secret put GEMINI_API_KEY
pnpm wrangler secret put GROQ_API_KEY
pnpm wrangler secret put IMAGE_API_KEY
```

Optional vars you can also set:

- `MONGODB_DB_NAME`
- `MONGODB_SERVER_SELECTION_TIMEOUT_MS`
- `MONGODB_CONNECT_TIMEOUT_MS`
- `CORS_ORIGIN`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW_MS`
- `TRUST_PROXY`

## 4) Run locally on Workers runtime

```bash
pnpm cf:dev
```

## 5) Deploy

```bash
pnpm cf:deploy
```

After deploy, Cloudflare prints the Worker URL.
