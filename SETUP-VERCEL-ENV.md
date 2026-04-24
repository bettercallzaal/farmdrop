# Vercel Environment Setup

After the admin editor is merged to main, you must set three env vars on the Vercel project for the editor to actually save. Until they are set, the admin page will show 500 errors on save.

## Required env vars

Set these at Vercel dashboard → `farmdrop` project → Settings → Environment Variables (Production + Preview + Development).

| Name | Value | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | a strong password | The string Hannah types to unlock `/admin`. Give this to Hannah. |
| `GITHUB_TOKEN` | GitHub fine-grained PAT | See below for how to mint it. |

### Optional (defaults are fine)

| Name | Default | Override only if |
|---|---|---|
| `GH_OWNER` | `bettercallzaal` | Repo moves to a different org |
| `GH_REPO` | `farmdrop` | Repo renames |
| `GH_BRANCH` | `main` | You want edits to go to a staging branch first |
| `GH_FILE_PATH` | `content.json` | You move the file |

## Creating the GitHub PAT

1. Go to https://github.com/settings/personal-access-tokens/new
2. **Token name:** `farmdrop-admin-editor`
3. **Resource owner:** `bettercallzaal`
4. **Expiration:** 1 year (set a calendar reminder for renewal)
5. **Repository access:** Only select repositories → `bettercallzaal/farmdrop`
6. **Repository permissions:** set **Contents** to **Read and write** (everything else stays `No access`)
7. Generate and copy the `github_pat_...` string
8. Paste into `GITHUB_TOKEN` on Vercel

## After setting env vars

Vercel does not automatically redeploy when you edit env vars. Trigger a redeploy:

- Vercel dashboard → Deployments → latest → three-dot menu → **Redeploy**
- Or push any commit to `main`

Then visit `https://farmdrop.vercel.app/admin`, enter the `ADMIN_PASSWORD`, make a tiny edit, click Save. If all three vars are wired, it commits to GitHub and triggers another redeploy.

## Smoke test checklist

- [ ] `POST /api/verify` with correct password → 200
- [ ] `POST /api/verify` with wrong password → 401
- [ ] `POST /api/save` with valid payload → 200 and a new commit appears on `main`
- [ ] A fresh edit shows up on `https://farmdrop.vercel.app/events.html` after ~30s

## Revoking access

If Hannah's password gets shared too widely or the PAT leaks:

1. Rotate `ADMIN_PASSWORD` on Vercel (update + redeploy)
2. Revoke the PAT at https://github.com/settings/tokens and mint a new one
