# Private Gallery — How This Works (Baby Steps)

This guide assumes you've read `TEACHING-GUIDE.md` for the main site already
and know your way around `style.css` and `main.js`. This is the add-on for
the password-protected gallery. We go slow, on purpose.

---

## 1. The three pieces, in plain English

```
Emily-vale/
├── private-gallery.html   ← what your client sees (locked, then unlocked)
├── admin-upload.html      ← what YOU see, to add new photos/videos
└── worker/
    ├── index.js            ← the "bouncer" — checks passwords, guards the files
    └── wrangler.toml       ← settings for deploying that bouncer
```

Think of it like a private members' club:

- **The club itself** (`private-gallery.html`) — pretty, locked, shows a
  blurred preview of what's inside.
- **Your storage room** (Cloudflare R2) — where the actual photos/videos
  physically live. The public can never walk in here directly.
- **The bouncer** (`worker/index.js`) — stands at the door. Checks the
  password. Only the bouncer is allowed to fetch something from the storage
  room and hand it to a guest — and only after checking ID (a "token").
- **Your staff entrance** (`admin-upload.html`) — a separate door, separate
  password, that lets you carry new photos/videos into the storage room.

This is *why* it's more secure than just blurring images with CSS: a plain
CSS blur still downloads the real file to the visitor's browser — anyone
technical could find it in 10 seconds. Here, the real file never leaves the
storage room until the bouncer has verified a password.

---

## 2. Step 1 — Deploy the bouncer (the Worker)

You do this once. Full command-by-command version is in `SETUP.md` — this
section just explains *what* each step is doing and why.

1. **Install Wrangler.** This is Cloudflare's remote control for Workers —
   it's how you push code from your computer up to Cloudflare's servers.
2. **Create an R2 bucket.** This is the actual "storage room." Empty at
   first.
3. **Turn your passwords into hashes.** A hash is a one-way scramble — you
   can turn `"sunsetrose22"` into a string of random-looking letters and
   numbers, but you can't turn the scrambled version back into the original
   password. The Worker only ever stores the *scrambled* version, never your
   real password. That way, even if someone saw the Worker's settings, they
   couldn't read the password itself.
4. **Give the Worker its secrets.** Three things: the client password's
   hash, your admin password's hash, and a random "signing secret" (explained
   in step 4 below).
5. **Deploy.** Wrangler uploads `index.js` to Cloudflare and gives you back a
   web address, like `https://amara-vale-gallery.you.workers.dev`. That
   address *is* your bouncer's front door.

---

## 3. Step 2 — What actually happens when a client types the password

Walk through it in order:

1. Client opens `private-gallery.html`. At this point, **zero photos or
   videos have been requested or downloaded** — the page only shows a locked
   card with a password box. This matters: nothing sensitive is sitting in
   the page waiting to be blurred; it simply isn't there yet.
2. Client types the password, hits "Unlock the Gallery."
3. The page sends that password to the bouncer's `/api/unlock` address.
4. The bouncer scrambles (hashes) what they typed and compares it to the
   scrambled version it has stored. If it matches → correct password.
5. If correct, the bouncer hands back a **token** — think of it as a
   wristband at a concert. It's not the password itself, it just proves
   "yes, this person already showed the door person their ticket." The
   wristband expires after 4 hours.
6. The page saves that wristband in the browser's memory for this tab
   (`sessionStorage`) and asks the bouncer for the list of files.
7. For every photo/video, the actual `<img>` or `<video>` tag points at the
   bouncer's address *with the wristband attached* — something like
   `.../api/file/sunset.mp4?token=abc123`.
8. Every single time the browser tries to load one of those files, the
   bouncer checks the wristband is still valid *before* handing over the
   bytes. No wristband, no file. Expired wristband, no file.

That's the entire trust chain. The password never touches the storage room
directly — it only ever proves itself to the bouncer.

---

## 4. Step 3 — What "5 wrong tries = 15 minute lockout" means

Open `worker/index.js` and find these two lines near the top:

```js
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes
```

Every time someone gets the password wrong, the bouncer writes down "this
visitor, one more wrong try" in a little notebook (a Cloudflare KV
namespace — just a simple key-value storage). After 5 wrong tries from the
same visitor, the bouncer refuses to even check a 6th password for 15
minutes, no matter what they type — including the *correct* password. This
is what stops someone from just sitting there guessing passwords over and
over.

**To change the numbers:** edit those two lines, then run `wrangler deploy`
again from inside the `worker/` folder. That's it — no other file needs to
change.

---

## 5. Step 4 — Adding new photos and videos

1. Open `admin-upload.html` (bookmark it — it's intentionally not in your
   site's navigation menu, so casual visitors never stumble onto it).
2. Type your **admin** password (different from the client one).
3. Drag in files, or click the dropzone to browse. You'll see a live
   thumbnail and progress bar for every file as it uploads.
4. When everything shows a green checkmark, they're already live — open
   `private-gallery.html` in another tab and they'll be there.

There's no separate "publish" step. The moment a file finishes uploading,
it exists in the storage room, and the client gallery will show it the next
time someone unlocks the gallery (or refreshes if they're already in).

---

## 6. Step 5 — Where the "cinematic" pieces live, if you want to tweak them

- **Falling petals** — `spawnPetals()` function inside `private-gallery.html`'s
  `<script>` block. Change `for (let i = 0; i < 18; i++)` to a different
  number for more or fewer petals.
- **The curtain-close unlock transition** — the CSS class `.unlocking` on
  `#lock-section`, defined right in `private-gallery.html`'s `<style>` block.
  It's the same "fade and get out of the way" trick your homepage already
  uses in `.mask-reveal`, just applied to the whole lock screen instead of
  one image.
- **The blur-until-tapped effect on each tile** — the `.g-tile img` /
  `.g-tile video` CSS rule. `filter: blur(26px)` is the blur amount; change
  the number to make it softer or sharper.
- **The gentle tilt when you hover a revealed photo** — the `mousemove`
  event listener inside `buildTile()`. It's the same math your homepage's
  `.tilt-card` uses, just written directly in JS instead of pure CSS,
  because it needs to track the mouse position over each tile individually.

You don't need to touch any of this for the gallery to work — it's here so
that when you're ready to make it *yours*, you know exactly which few lines
to change.

---

## 7. Common "why isn't this working" moments

- **"Nothing happens when I type the password."** Open the browser console
  (F12 → Console tab). If you see a red error mentioning `WORKER_URL`, you
  haven't replaced the placeholder Worker address in the `<script>` tag yet
  — do that in both `private-gallery.html` and `admin-upload.html`.
- **"It says Unauthorized even with the right password."** The password
  hash you gave the Worker (step 3, section 2) doesn't match what you're
  typing. Regenerate the hash and re-run `wrangler secret put
  GALLERY_PASSWORD_HASH`.
- **"Videos won't seek/scrub."** This should just work — the Worker
  supports `Range` requests specifically for this. If it's not working,
  double check the R2 bucket binding name in `wrangler.toml` is exactly
  `MEDIA_BUCKET` — a mismatch there is the most common cause.
- **"I'm locked out testing my own password."** That's the 15-minute
  lockout working as designed. Either wait it out, or temporarily raise
  `MAX_ATTEMPTS` in `index.js` while you're testing, then lower it back
  before sending the real password to your client.

---

## 8. Why viewing and downloading needed two separate passwords

This is the newest piece, so it gets its own baby-steps walkthrough.

Think back to the bouncer analogy. Originally the bouncer only checked one
thing: "does this password match the list of people allowed in?" Once you
were in, you could see everything and save everything.

Now the bouncer checks a *second* thing before handing over an actual file
to save: "does this person also have the download wristband?" Seeing the
gallery and saving a file are treated as two different favors, each needing
its own password, because a client you trust to *look* isn't automatically
someone you want to be able to *keep a permanent copy*.

Here's the flow, step by step, from a client's point of view:

1. They open `private-gallery.html`, type the regular client password.
   Nothing about this changed. They can see thumbnails, tap to reveal them,
   open the full-screen viewer.
2. They click the download button on something. Instead of the file just
   saving, a second little popup appears asking for a *different*
   password, the download password.
3. If they don't have it, nothing downloads. They can still look at
   everything, they just can't save it.
4. If they type the correct download password once, that unlocks
   downloading for the rest of that visit, they don't have to re-type it
   for every single file.

From your side, in `admin-upload.html` → Settings → Download Access:

- If you never set a download password, this feature is simply off,
  nobody, including a client with the right gallery password, can download
  anything. This is the safe default.
- The moment you type a password there and click "Set Download Password",
  downloading turns on for anyone who has that specific password.
- You (logged in as admin) can always download from the Library tab, with
  or without a download password set, since being admin already proves
  who you are.

One more thing worth knowing: this download password is a single password,
not a list like the client passwords are. If you want different download
permissions for different people later, say so, the same list-based pattern
used for client passwords can be reused for downloads too, it just wasn't
built that way by default since most studios want one simple on/off switch
for "can this person save files."
