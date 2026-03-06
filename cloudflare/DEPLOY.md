# Cloudflare Deploy Steps (Money Command Center)

## 1. Install Wrangler

```powershell
npm install
npm install --save-dev wrangler
```

## 2. Login to Cloudflare

```powershell
npx wrangler login
```

## 3. Create D1 database

```powershell
npx wrangler d1 create ram-budget-db
```

Copy the returned `database_id` and replace this value in `wrangler.toml`:

- `database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"`

## 4. Run DB schema

```powershell
npm run cf:d1:remote:migrate
```

## 5. Deploy app

```powershell
npm run cf:deploy
```

After deploy, Cloudflare will output your live URL.

## 6. Optional custom domain

In Cloudflare dashboard:

1. Workers & Pages
2. `ram-budget`
3. Add custom domain (example: `app.ramlogisticssolutions.com`)

## Notes

- Static files are served from the Worker Assets binding.
- `/api/storage/*` and `/api/health` are handled by the Worker and persisted in D1.
- Your browser local storage still works; backend sync now stores in D1.