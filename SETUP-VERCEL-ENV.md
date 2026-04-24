# Vercel Setup - One-Time

Two things to do in the Vercel dashboard. Both are point-and-click. No PATs, no GitHub tokens, no command line.

## 1. Create the editor password

Vercel dashboard → `farmdrop` project → **Settings** → **Environment Variables** → **Add New**

- **Name:** `ADMIN_PASSWORD`
- **Value:** a strong password (this is what Hannah types to unlock `/admin`)
- **Environments:** Production, Preview, Development (tick all three)
- Click **Save**

## 2. Link a Blob store for storing content

Vercel dashboard → `farmdrop` project → **Storage** tab → **Create Database** → pick **Blob** → **Create**. Vercel will auto-link it to the project and auto-inject `BLOB_READ_WRITE_TOKEN` as an environment variable. You do not need to set that yourself.

(If Vercel asks for a region, pick the same one as the project - default is usually fine.)

## 3. Redeploy

Vercel does not redeploy automatically when you add env vars or link a store. Trigger a redeploy:

- Deployments tab → latest → three-dot menu → **Redeploy**

That's it.

## Smoke test

After the redeploy finishes (~30 seconds):

1. Visit https://farmdrop.vercel.app/admin
2. Enter the `ADMIN_PASSWORD` you set
3. Change any field (e.g. tweak a sentence in an event description)
4. Click **Save and Publish** - you should see "Saved. Changes are live now"
5. Open https://farmdrop.vercel.app/events in another tab and hard-refresh. The edit should already be visible.

## How it works under the hood

- `content.json` in the repo = the initial seed
- Saves from `/admin` write a fresh JSON blob to Vercel Blob storage
- `/api/content` always serves the latest blob (falls back to the seed if no blob exists yet)
- Pages call `/api/content` on load, so Hannah's edits show up instantly - no redeploy cycle
- The farmdrop.us embed reads the same blob, so edits propagate to the farmdrop.us iframe automatically

## Rotating the password

Edit `ADMIN_PASSWORD` in Vercel → Redeploy. Old sessions still work until browser tab is closed; after that, they need the new password.

## Free tier notes

- Vercel Blob free tier: 1 GB storage, 10 GB bandwidth/month - overkill for a single JSON file
- Serverless function invocations: first 100k/month free - also fine
