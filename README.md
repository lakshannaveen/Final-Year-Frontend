
## Environment & Running Locally

Create a local environment file at `.env.local` (gitignored) and set the values you need. Minimum recommended variables for local development:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
PORT=3000
NODE_ENV=development
```

Install dependencies and run the dev server:

```bash
npm install
npm run dev
# or
pnpm install
pnpm dev
```

Build and start for production:

```bash
npm run build
npm start
```

Open http://localhost:3000 in your browser after starting the dev server.

## Admin Access (dev/testing)

For local testing there is a quick admin access URL pattern (development-only). Example:

```
http://localhost:3000/?admin=johN%40123456&user=naveenlakshan
```

- `admin` should be a URL-encoded identifier (e.g. `john%40example.com` for `john@example.com`).
- `user` is the username to impersonate or view as.

Only use this in a trusted local environment. Do not expose these query parameters in production.

