# Go live — Vocabulary Builder (lead-gen app)

Three one-time steps take this from demo to a live lead-gen funnel:
**(1) email capture → (2) payment → (3) hosting.** Until 1 & 2 are set the app
runs in demo mode (lead logged to the console, instant unlock), so it's
clickable the moment hosting is on.

All config lives in one file: **`englishpath-vocab-app/config.js`**. Edit it,
commit, and re-run the deploy.

---

## 1. Email capture (the lead)

### Default: Web3Forms (no signup)

1. Go to **https://web3forms.com**, enter your email — they email you an
   **Access Key** (no account to create).
2. In `config.js`:

   ```js
   export const CONFIG = {
     PRICE: 'S$9/mo',
     LEAD_ENDPOINT: 'https://api.web3forms.com/submit',
     WEB3FORMS_ACCESS_KEY: 'paste-your-access-key-here',
     STRIPE_PAYMENT_LINK: '',   // set in step 2
   };
   ```

Every submission `{ email, level, source, app, at }` is emailed to you. The app
adds the access key and a subject line automatically. Web3Forms can later
forward to Google Sheets / Zapier / Make.

### Alternative: Formspree

Create a free form at **https://formspree.io**, copy its endpoint, and set:

```js
  LEAD_ENDPOINT: 'https://formspree.io/f/XXXXXXX',
  WEB3FORMS_ACCESS_KEY: '',
```

Any endpoint that accepts a JSON `POST` works (a webhook, Google Apps Script,
your own server, etc.).

---

## 2. Payment (Stripe Payment Link)

1. **Stripe Dashboard → Product catalog → Add product**: name it
   "Vocabulary Builder Premium" and add a **price** (recurring S$9/month, or a
   one-time amount).
2. **Payment Links → Create payment link** → select that product/price.
3. **After payment → "Redirect customers to your website"** → enter your live
   URL with `?unlocked=1` appended:

   ```
   https://tianjuneg.github.io/tian-os-app/?unlocked=1
   ```

   This is what flips the app to Premium when the customer returns. The app
   strips `?unlocked=1` afterward and tolerates any extra params Stripe adds.
4. **Create**, copy the link (`https://buy.stripe.com/XXXX`), and set:

   ```js
   STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/XXXX',
   ```

The app auto-appends `?prefilled_email=<their email>` so checkout is pre-filled.

---

## 3. Hosting (GitHub Pages)

1. Repo **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
2. **Actions tab → "Deploy Vocab Builder" → Run workflow.**

It bundles the app (the engine inlined + minified into one self-contained file)
and publishes at **`https://tianjuneg.github.io/tian-os-app/`**.

The workflow is **manual-trigger only** so merging never leaves a failing run
before Pages is enabled. To auto-deploy on every change afterward, add the
`push:` trigger (commented snippet is in
`.github/workflows/deploy-vocab-app.yml`).

> Deploying elsewhere (Netlify / Vercel / S3)? Bundle locally and upload the
> folder — see the README. On Netlify you can use Netlify Forms instead of a
> `LEAD_ENDPOINT`.

---

## Test before announcing

- **Email:** submit a test address in the live app → confirm it arrives in your
  inbox / form dashboard.
- **Payment:** switch Stripe to **Test mode**, use card **4242 4242 4242 4242**
  (any future expiry, any CVC) → confirm you're redirected back and the app
  shows Premium.

## Known limitation

The unlock is stored in the browser and **never expires** — fine for a one-time
unlock, but for a **monthly subscription** the static app can't tell if someone
later cancels (or clears the unlock). Real recurring enforcement needs the small
backend that's currently deferred (a `/verify` endpoint that checks Stripe
subscription status). Flag it when you want it.
