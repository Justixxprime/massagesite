# Amara Vale — How This Site Works (Baby Steps)

Welcome. This guide assumes you know HTML, Tailwind, and JS but haven't built
a site quite this animated before. We go slow, on purpose.

---

## 1. The folder, explained

```
amara-vale/
├── index.html          ← Home
├── about.html
├── services.html
├── gallery.html
├── testimonials.html
├── certifications.html
├── giftcards.html
├── faq.html
├── policies.html
├── blog.html
├── blog-post.html       ← one sample article — duplicate this file for each new post
├── booking.html
├── css/
│   └── style.css        ← every color, font, and animation lives here
└── js/
    └── main.js           ← every interaction (menu, animations, form) lives here
```

**Rule of thumb:** if you're changing how something *looks*, go to `style.css`.
If you're changing how something *behaves* (click, scroll, submit), go to
`main.js`. If you're changing *words or images*, go to the `.html` file.

Open `index.html` by double-clicking it — it opens straight in your browser,
no server needed. Every internal link (`about.html`, `services.html`, etc.)
works locally exactly like it will once uploaded.

---

## 2. Step 1: Changing the business name

Right now everything says "Amara Vale." To rename:

1. Open every `.html` file.
2. Press `Ctrl+F` (or `Cmd+F` on Mac) in your code editor, search `Amara Vale`,
   replace all with the real name.
3. Also search just `Amara` alone — it appears in body copy (e.g. "I'm Amara").
4. Update `<title>` tags too — each page has its own, near the top.

**Tip:** VS Code has "Find and Replace in Files" (`Ctrl+Shift+H`) — one
search across all 12 files at once instead of doing it 12 times.

---

## 3. Step 2: Swapping in her real photos

Every image right now is a placeholder from Unsplash (a free stock photo
site), so nothing on the live site is a real photo of her, her studio, or
real clients. **This must be replaced before launch** — using someone else's
stock photos indefinitely isn't a good look for a real business.

To swap an image:

1. Find the `<img src="...">` tag you want to change.
2. Replace everything between the quotes with the path to her real photo,
   e.g. `src="images/studio-room.jpg"`.
3. Create an `images/` folder next to `index.html`, drop her real photos in
   there with clear names (`studio-room.jpg`, `amara-portrait.jpg`, etc).
4. Always update the `alt="..."` text too — describe what's actually in the
   new photo. This matters for accessibility and Google search.

**Baby step example** — in `about.html`, find:
```html
<img src="https://images.unsplash.com/photo-1519824145371...
     alt="Amara preparing the treatment room" class="w-full h-full object-cover">
```
Change to:
```html
<img src="images/amara-portrait.jpg"
     alt="Amara, licensed massage therapist" class="w-full h-full object-cover">
```
That's it — same class, same styling, just a new source and description.

---

## 4. Step 3: How the design system works (`style.css`)

At the very top of `style.css` you'll see:

```css
:root {
  --forest: #1F3329;
  --alabaster: #F7F3EA;
  --rose: #B76E79;
  --gold: #A6873A;
  --ink: #211D19;
}
```

These are **CSS variables** — one place that controls color everywhere.
Anywhere you see `style="color:var(--forest)"` in the HTML, it's pulling
from that single definition. Change `--forest` once here, and every green
element on all 12 pages updates automatically.

**Baby step:** want a slightly different green? Change the hex value on the
`--forest:` line. Save. Refresh the browser. Done — no hunting through 12 files.

---

## 5. Step 4: Understanding the animations

### Scroll reveal (fade-up as you scroll)
Any element with `class="reveal"` starts invisible and fades/slides up when
it enters the screen. Add `reveal-delay-1`, `reveal-delay-2`, or
`reveal-delay-3` to stagger a group of elements so they don't all animate
at once (see the 3 testimonial cards for an example).

**To make something new animate in:** just add `class="reveal"` to it.
No JavaScript editing required — `main.js` already watches for that class
site-wide.

### The vine divider (signature element)
That small hand-drawn squiggly line between sections is an SVG that "draws
itself" using a CSS trick called `stroke-dashoffset`. It's intentionally
used sparingly — once or twice per page — because a signature element loses
its impact if it's everywhere. Resist the urge to add it to every section.

### Count-up numbers
The "9+ Years," "2,400+ Sessions" numbers in the hero animate upward once
visible. To add a new one anywhere:
```html
<span data-count-to="500">0</span>
```
The `data-count-to` number is the target; `main.js` handles the animation
automatically for any element with that attribute.

---

## 6. Step 5: The booking form (important — read this one)

Right now, `booking.html`'s form does **not** actually send anywhere. When
submitted, JavaScript in `main.js` just hides the form and shows a "Request
received" message — it's a working front-end, but there's no backend yet.

**You have three real options to make it functional, easiest first:**

**Option A — Calendly or Square Appointments embed (easiest, no code)**
Sign up for Calendly (free tier works), set her real availability, then
replace the entire `<form id="booking-form">...</form>` block in
`booking.html` with Calendly's embed `<iframe>` code (they give you a
copy-paste snippet). Handles real scheduling, reminders, and calendar sync
automatically — best option for a one-person practice.

**Option B — Formspree or EmailJS (keep this exact form, make it email her)**
Services like Formspree let you keep this exact HTML form and just add
their endpoint to the `<form>` tag's `action` attribute — form submissions
arrive in her inbox. Free tier covers a small business easily. Takes about
10 minutes to set up once you have an account.

**Option C — A real backend (only if you want to learn server-side code)**
Overkill for this use case, but if you want to grow this skill: a small
Node/Express or Python/Flask endpoint that receives the form POST and saves
it to a database or sends an email via a service like SendGrid.

**My recommendation for a solo massage therapist:** Option A (Calendly).
It's free, handles the calendar for her automatically, and you don't have
to maintain any backend code.

---

## 7. Step 6: Adding a new blog post

1. Duplicate `blog-post.html`, rename it e.g. `blog-post-2.html`.
2. Change the `<title>`, the eyebrow/category text, the headline, and the
   body paragraphs.
3. Open `blog.html` and copy one of the three `<a href="blog-post.html">...`
   card blocks, paste it as a fourth card, and point its `href` to your new
   file name.

That's the whole pattern — every new post is "duplicate, edit text, link it
from the index."

---

## 8. Step 7: Editing the navigation menu

The exact same nav/footer HTML is repeated at the top and bottom of every
page (that's intentional — no server-side includes needed for a static
site). If you add a new page:

1. Create the new `.html` file.
2. Open **every other page**, find the `<nav>` block near the top and the
   matching block inside `#mobile-menu`, and add your new link in both
   places.
3. Do the same in the `<footer>` if it should appear there too.

Yes, this means editing 12 files for one new nav link — that's the tradeoff
of a plain HTML/CSS/JS site with no build tooling. If this becomes painful,
that's the signal to eventually move to a static site generator (11ty,
Astro) or a simple templating setup — but not necessary yet.

---

## 9. Step 8: Testing before you hand it off

- Open every page and click every link — confirm nothing 404s.
- Resize your browser window down to phone width (or open dev tools →
  toggle device toolbar) and check nothing overlaps or overflows.
- Fill out and submit the booking form, confirm the "Request received"
  message appears.
- Click through the gallery lightbox, open the FAQ accordion, let the
  testimonial carousel auto-advance once.
- Replace every placeholder phone number, email, and address before this
  goes live — search for `(555) 019-2044`, `hello@amaravale.com`, and
  `#LMT-000000` across all files.

---

## 10. Where to host it

Since this is pure HTML/CSS/JS with no backend, any static host works —
**Netlify** (free, drag-and-drop the whole folder) is the simplest option
for someone at your stage. GitHub Pages and Vercel are equally valid
alternatives if you want practice with git-based deploys.

---

## 11. What to build next (in order of value to her)

1. Wire up real booking (Section 6 above) — this is the one thing that
   actually needs to work before launch.
2. Replace every placeholder image and license number.
3. A real, live map/location embed once she decides how much address detail
   to expose publicly.
4. Google Business Profile + a few real client reviews once she's live.

You now have a full, animated, multi-page template you understand end to
end — reuse this exact structure (`style.css` token system + `main.js`
interaction patterns) for the next client site. That reusability is the
real skill you're building here, beyond just this one project.

---

## 12. New in this update: mobile polish, WhatsApp, real form backend, PWA icons, SEO

### 12a. Mobile responsiveness
- Added `viewport-fit=cover` and `env(safe-area-inset-*)` padding so content
  doesn't sit under the iPhone notch or get covered by the home-indicator bar.
- Added `overflow-x: hidden` site-wide to stop any decorative blurred shape
  from causing horizontal scroll on small screens.
- Hover-tilt effects are disabled under 640px (tilt makes no sense on touch).
- Test on a real phone if you can, or Chrome DevTools → toggle device
  toolbar → try iPhone SE (smallest common screen) and a mid-size Android.

### 12b. WhatsApp — now everywhere
There's a floating WhatsApp button on every page (bottom-right, green
circle) plus a link in the footer and a full card on the Booking/Contact
page. All of them point to:
```
https://wa.me/15550192044
```
**To make this real:** replace `15550192044` with her actual WhatsApp
number in **full international format, no dashes or plus sign** — e.g. a
US number (555) 123-4567 becomes `15551234567`. Search-and-replace
`15550192044` across all files.

### 12c. Web3Forms — the booking form now actually sends
The booking form on `booking.html` now POSTs to Web3Forms, a free
form-to-email service — no backend code required.

**To activate it (2 minutes):**
1. Go to https://web3forms.com and enter her email to get a free access key.
2. Open `booking.html`, find this line near the top of the form:
   ```html
   <input type="hidden" name="access_key" value="YOUR-WEB3FORMS-ACCESS-KEY-HERE">
   ```
3. Replace `YOUR-WEB3FORMS-ACCESS-KEY-HERE` with the key they email you.
4. Submit a test booking yourself to confirm the email arrives.

Until that key is added, the form will show a friendly error message
instead of silently failing — that's intentional, so nobody thinks a
booking went through when it didn't.

### 12d. "Add to Home Screen" icons (PWA basics)
`manifest.json` and `icons/icon.svg` are now linked from every page. On
Android Chrome, visitors will get an "Install app" / "Add to Home Screen"
prompt; on iPhone Safari, they can do it manually via Share → Add to Home
Screen, and it'll use the same icon.

**Replace the placeholder icon before launch:** `icons/icon.svg` is a
simple circle-and-dot mark, not her real logo. Swap it for a real square
logo (SVG or 512×512 PNG both work) and update the `src` reference in
`manifest.json` and the `<link rel="apple-touch-icon">` / `<link rel="icon">`
tags at the top of each HTML file.

### 12f. Dark / Light / System / Auto theme toggle
There's now a theme button in the nav (sun/moon/monitor/clock icon,
top-right on desktop, next to the menu icon on mobile). Clicking it cycles:

1. **Light** — always light
2. **Dark** — always dark
3. **System** — matches the visitor's OS/browser dark mode setting
4. **Auto** — switches to dark automatically between 7pm–7am based on the
   **visitor's own device clock**

**About "location mode":** a true location-based day/night theme would
need the visitor's GPS coordinates plus a sunrise/sunset API (like
sunrise-sunset.org's free API) to calculate real local sunset — that
requires a permission prompt and a live API call, which is more than a
static site normally needs. What's implemented here (Auto mode) achieves
the same practical result — dark in the evening, light in the day — using
only the visitor's device clock, no permissions or external API required.
If you specifically want true GPS-based sunset calculation later, that's a
small, well-documented addition — ask and I'll wire it in.

The choice is remembered per-visitor (stored in their browser), so it
persists across pages and repeat visits.

### 12g. Other new motion/behavior
- **Scroll progress bar** — thin rose-to-gold line across the very top of
  the page that fills as you scroll.
- **Cursor glow** — a soft light that follows the mouse on desktop (auto
  disabled on touch devices).
- **Magnetic buttons** — primary/outline/rose buttons subtly follow the
  cursor when you hover near them, on desktop only.
- **Gallery filters** — category tabs (Studio / Treatment / Details /
  Ambiance) with instant filtering, plus a full lightbox with prev/next
  arrows and keyboard navigation.

### 12h. New pages
- **Packages & Extended dates** (`packages.html`) — single session, monthly
  dates, and 5-session prepay tiers.
- **Second Journal article** (`blog-post-2.html`) — duplicate this pattern
  for future posts, same as `blog-post.html`.

### 12e. SEO — what's in place, and an honest note on rankings
Added to every page: canonical URLs, Open Graph/Twitter meta tags,
`robots.txt`, `sitemap.xml`, and on the homepage, `LocalBusiness` structured
data (the JSON-LD block) that helps Google understand this is a real local
business with hours, phone, and pricing.

**Important honesty check:** none of this code can *guarantee* being "the
first thing that shows up" in the US. Good on-page SEO is necessary but not
sufficient — ranking well against other local massage therapists also
depends on things outside the code: a claimed and filled-out Google
Business Profile, real client reviews on Google, a real street address
once she's comfortable sharing one, consistent NAP (name/address/phone)
info across the web, and backlinks over time. Code gets the foundation
right; the rest is an ongoing local-SEO process, usually over weeks to
months, not something that ships in a single build.

**Concrete next steps for ranking well in the US:**
1. Claim/create a Google Business Profile with the exact same name, phone,
   and hours as the site.
2. Update `sitemap.xml` and every `canonical`/`og:url` tag with the real
   domain once she buys one (currently placeholder `amaravale.com`).
3. Ask happy clients to leave a Google review after their session.
4. Submit the sitemap in Google Search Console once the site is live.

### 12i. Tawk.to — real live chat (replaces the earlier chat-styled form)
The chat widget is now the real thing: Tawk.to, a genuinely free-forever live
chat service (no caps on chats, agents, or history, unlike most "free" chat
tools that cap conversations somewhere). It replaces the chat-styled contact
form from before, that form is gone now to avoid two floating chat bubbles
competing for the same corner of the screen.

**To activate it (about 2 minutes):**
1. Go to https://www.tawk.to and create a free account.
2. In the dashboard, go to **Administration → Channels → Chat Widget**.
3. You'll see a widget code snippet containing a URL that looks like
   `https://embed.tawk.to/507f1f77bcf86cd799439011/1a2b3c4d5e`. The first
   long ID is your **Property ID**, the second shorter one is your
   **Widget ID**.
4. Open every `.html` file, find this line near the bottom (right before
   `</body>`):
   ```html
   s1.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID';
   ```
5. Replace `YOUR_PROPERTY_ID/YOUR_WIDGET_ID` with your real values from
   step 3. Same replacement, same line, on all 18 pages, this is the one
   spot where a sitewide find-and-replace across every file genuinely
   saves time.
6. Refresh the site. Tawk.to's own chat bubble appears bottom-right and is
   fully functional immediately, no further setup needed to receive and
   reply to messages from their dashboard or free mobile app.

**Why the WhatsApp/Signal buttons moved to the bottom-left:** Tawk.to's
default bubble position is bottom-right, the same spot the old buttons
lived. Moving ours to bottom-left avoids the two stacking on top of each
other. If you'd rather reposition Tawk.to's bubble instead (their
dashboard has a widget position setting under Widget Content →
Appearance), that works too, just move the WhatsApp/Signal `<div>` back
to `bottom-6 right-6` in `partials/footer.html` in that case.

**One limitation worth knowing:** Tawk.to's free plan shows a small
"Powered by tawk.to" badge on the widget. Removing it costs $19/mo, that's
a call for Amara to make once the site is live, not something to fix in
code.

## 13. Video slots — where to drop your own videos

8 video players are built into the site, each with a poster image showing
until you add a real file, so nothing looks broken in the meantime. They
live in a `videos/` folder, and there's a `videos/README.md` inside that
folder listing exactly which filename goes where.

**Where they are:**
- Homepage, "See It In Motion" section → `videos/session-preview.mp4`
- Gallery page, main tour + 6 labeled clips → `videos/studio-tour.mp4`, and `videos/session-clip-1.mp4` through `session-clip-6.mp4` (Hot Stone Technique, Deep Tissue Work, Studio Walk-In, Setting Up the Room, Riding The Wave Positioning, Post-Session Aftercare)
- About page, right after the story → `videos/meet-amara.mp4`
- Testimonials page, 2 video testimonial slots → `videos/testimonial-1.mp4`, `videos/testimonial-2.mp4`
- Corporate page → `videos/corporate-session.mp4`

**To add a video:** just drop a file with the exact matching name into the
`videos/` folder next to the HTML files. No code editing needed, the
`<video>` tags already point to those exact paths.

**Video specs that'll actually work well on a website:**
- **Format:** `.mp4` with H.264 encoding, this plays natively in every
  browser without a plugin.
- **Resolution:** 1920×1080 (1080p) is plenty, going higher just bloats
  file size with no visible benefit on a website.
- **File size:** aim under 15–20MB per clip. A phone video straight out of
  the camera can easily be 200MB+, that needs compressing first or it'll
  make the page painfully slow to load.
- **Length:** 30–90 seconds per clip is the sweet spot for this kind of
  site, long enough to give a real feel, short enough that people actually
  watch the whole thing.
- **Compressing a video for free:** HandBrake (handbrake.fr) is a solid
  free tool, open the file, pick the "Web" or "Fast 1080p30" preset, export.
  That alone usually cuts file size by 80-90% with barely any visible
  quality loss.

**How it behaves technically:** each video shows its poster image with a
play button overlay. Clicking it calls `.play()` on the video, if a real
file exists at that path, it plays; if not, nothing happens and the poster
just stays there, no error, no broken-video icon. That's intentional, so
you can ship the site today and drop real videos in later without anyone
noticing a gap.
