# Private Gallery — Setup

Three pieces: a Cloudflare Worker (the gatekeeper), an R2 bucket (where the
files actually live), and two HTML pages you drop into your existing site.
Nothing about the rest of the site changes.

## 1. Install Wrangler (Cloudflare's CLI)

```bash
npm install -g wrangler
wrangler login
```

## 2. Create the R2 bucket

```bash
wrangler r2 bucket create amara-vale-media
```

## 3. Generate your two password hashes

The Worker never stores your actual passwords — only SHA-256 hashes of them.
Run this for each password (client-facing one, and your own admin one):

```bash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR-PASSWORD-HERE').digest('hex'))"
```

Do this twice — once for the client gallery password, once for your admin
password. Keep the actual passwords somewhere safe; you'll need to give the
client one to your client.

## 4. Create the KV namespace (for brute-force lockout)

```bash
wrangler kv namespace create RATE_LIMIT
```

This prints an `id`. Open `worker/wrangler.toml` and paste it in place of
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.

## 5. Set secrets on the Worker

From inside `worker/`:

```bash
cd worker
wrangler secret put GALLERY_PASSWORD_HASH
# paste the hash from step 3 (client password)

wrangler secret put ADMIN_PASSWORD_HASH
# paste the hash from step 3 (admin password)

wrangler secret put SIGNING_SECRET
# paste any long random string, e.g. output of: openssl rand -hex 32
```

## 6. Deploy the Worker

```bash
wrangler deploy
```

Wrangler will print a URL like:
`https://amara-vale-gallery.your-subdomain.workers.dev`

Copy that URL.

## 7. Wire the URL into the two HTML pages

In both `private-gallery.html` and `admin-upload.html`, find this line near
the top of the `<script>` block:

```js
const WORKER_URL = "https://amara-vale-gallery.YOUR-SUBDOMAIN.workers.dev";
```

Replace it with the real URL from step 5, in both files.

## 8. Drop the pages into your site and deploy as usual

Copy `private-gallery.html` and `admin-upload.html` into your site's root
(same folder as `gallery.html`), commit, push to GitHub Pages like normal.

- `private-gallery.html` — this is what you send your client the password for.
- `admin-upload.html` — this is your own private upload tool. Don't link to
  it from the nav; just bookmark the URL yourself. It's still password-gated,
  but "not linked anywhere" is a good extra layer for something only you use.

## 9. Try it end to end

1. Go to `admin-upload.html`, log in with the admin password, upload a couple
   of test photos/videos.
2. Go to `private-gallery.html`, log in with the client password — you should
   see them, blurred, and they should sharpen on tap.
3. Click through to the lightbox and confirm video scrubbing/seeking works.

## Notes on scale (100+ files)

- R2's free tier is 10GB storage and **zero egress fees** — you can serve
  video to clients repeatedly without a bandwidth bill, which is the opposite
  of most storage providers.
- Compress video before uploading (H.264 mp4, reasonable bitrate) so 100
  clips don't balloon past the free storage tier. Happy to write you an
  ffmpeg batch-compress script if your source files are large — you've used
  ffmpeg on the Jennifer Amaka project already, so the same tool applies here.
- If you ever want per-client galleries instead of one shared password, the
  Worker's token system extends cleanly: swap the single `GALLERY_PASSWORD_HASH`
  for a small lookup table of client → password hash → tag, and filter
  `/api/media` results by tag. Not needed now, but the architecture doesn't
  have to change to get there later.

## Security notes

- Files are never public — the R2 bucket has no public access, and the only
  way to get bytes out of it is through the Worker, which checks a signed
  token first.
- Tokens expire (4 hours for viewers, 2 hours for admin) and are scoped
  (a viewer token can't upload; an admin token isn't needed to browse).
- This is meaningfully more secure than a client-side-only password check,
  but it's not bank-grade — a client who gets the URL of a specific file
  while their token is still valid could re-share that link until it expires.
  For a client-facing portfolio/proofing gallery, this is the right amount of
  friction. If this ever needs to protect something more sensitive, say so
  and we can add per-file expiry or IP binding.

## Download Password (separate from viewing)

Viewing the gallery and downloading from it are now two different
permissions, controlled by two different passwords:

- The **client password(s)** (Settings → Client Passwords) let someone see
  the gallery and reveal blurred thumbnails, but that's it.
- The **download password** (Settings → Download Access) is a second,
  separate password. Without it, the download button on every photo and
  video simply won't work, even for someone who already unlocked the
  gallery itself.

By default, no download password is set, which means downloads are
completely disabled for clients until you set one. You (as admin) can
always download from the Library tab regardless, since you're already
authenticated as admin.

To turn downloads on: go to Settings → Download Access, set a password,
and share that password only with whoever you actually want to be able to
save files, separately from the regular gallery password.
