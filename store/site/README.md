# Support site (privacy policy, support page, app page)

Three small static pages for the store listings. Both stores need a public privacy policy URL, the App Store needs a support URL, and the app opens the policy from Settings → Privacy policy. Publish them on GitHub Pages from a **separate, public repository**; it is free and takes about ten minutes.

| File | What it is |
| --- | --- |
| `index.html` | One-screen app page: icon, tagline, store badge placeholders, links |
| `privacy.html` | The privacy policy. **Generated** from `docs/PRIVACY_POLICY.md`; never edit it by hand |
| `support.html` | Contact email, restoring purchases, and answers about saves, data deletion and ad privacy |
| `icon-512.png` | Copy of `store/play-icon-512.png` |
| `.nojekyll` | Tells GitHub Pages to serve the files exactly as they are |
| `tools/build.mjs` | Rebuilds `privacy.html` and writes a filled-in copy for publishing (not published itself) |

The pages use plain HTML with the CSS inline: no scripts, no cookies, no trackers, no web fonts. They work on phones and desktops and follow the app's dark theme.

## Before you start

You need two things that will be public:

- **Your legal name** (or your company's), shown as the publisher. It should match the developer name on your store accounts.
- **A support email address you read.** Google Play shows it on the listing. A free address on its own (for example `lifeloop.help@…`) keeps your personal inbox out of it.

In these files the two appear as the placeholders **`[YOUR LEGAL NAME]`** and **`[CONTACT EMAIL]`**, highlighted in yellow when you open the pages locally. Leave them in this repository; the build step below fills them in on the published copy only.

## Publish on GitHub Pages

1. **Create the repository.** On GitHub, click **New repository**.
   - **Name:** something neutral such as `lifeloop-site`. Your page address becomes `https://<your-github-username>.github.io/<repo-name>/`, so keep other companies' trademarks out of both the repository name and your username (no "apple", "app-store", "google", "play", "android", "ios", or other games' names). Do not publish from this game's own repository: its GitHub Pages address is taken by the web preview of the game (`.github/workflows/preview.yml`).
   - **Visibility: Public.** GitHub Pages is free only for public repositories.
   - Tick **Add a README file** so the repository has a `main` branch, then click **Create repository**.

2. **Build the files to publish.** From the root of this project (the folder with `package.json`), with your real name and email:

   ```bash
   git clone https://github.com/<your-github-username>/<repo-name>.git ../<repo-name>
   node store/site/tools/build.mjs --out ../<repo-name> --name "Your Legal Name" --email "support@example.com"
   ```

   This rebuilds `privacy.html` from `docs/PRIVACY_POLICY.md`, fills in both placeholders, and copies `index.html`, `privacy.html`, `support.html`, `icon-512.png` and `.nojekyll` into the clone. It stops with an error if any placeholder is left. Open `../<repo-name>/index.html` in a browser to check.

   No command line? Open each HTML file in a text editor, replace every `[YOUR LEGAL NAME]` and `[CONTACT EMAIL]` (and delete the `<mark class="todo">` and `</mark>` tags around them), then in the repository on GitHub use **Add file → Upload files** to upload the five files listed above. Turn on hidden files in your file browser to see `.nojekyll`; if you cannot upload it, the site still works.

3. **Push.**

   ```bash
   cd ../<repo-name>
   git add -A
   git commit -m "Publish support site"
   git push
   ```

4. **Turn on Pages.** In the repository on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save**. After a minute or two the page shows "Your site is live at `https://<your-github-username>.github.io/<repo-name>/`".

5. **Check it.** Open these on your phone, and make sure each loads and shows your name and email:

   - `https://<your-github-username>.github.io/<repo-name>/`
   - `https://<your-github-username>.github.io/<repo-name>/privacy.html`
   - `https://<your-github-username>.github.io/<repo-name>/support.html`

## Where the addresses go

| Where | Field | Value |
| --- | --- | --- |
| App Store Connect → your app → **App Privacy** | Privacy Policy URL | `https://<user>.github.io/<repo>/privacy.html` |
| App Store Connect → your app → the version page | Support URL (required) | `https://<user>.github.io/<repo>/support.html` |
| App Store Connect → your app → the version page | Marketing URL (optional) | `https://<user>.github.io/<repo>/` |
| Play Console → **Policy and programs → App content → Privacy policy** | Privacy policy URL | `https://<user>.github.io/<repo>/privacy.html` |
| Play Console → **Store presence → Store settings → Store listing contact details** | Email; Website | your support email; `https://<user>.github.io/<repo>/` |
| EAS production environment | `EXPO_PUBLIC_PRIVACY_URL` | `https://<user>.github.io/<repo>/privacy.html` |
| EAS production environment | `EXPO_PUBLIC_SUPPORT_EMAIL` | your support email |

Set the two EAS variables (visibility **Plain text**, as `docs/RELEASE_CHECKLIST.md` §1 explains), from the project root:

```bash
npx eas-cli@latest env:create --scope project --environment production --visibility plaintext \
  --name EXPO_PUBLIC_PRIVACY_URL --value "https://<user>.github.io/<repo>/privacy.html"
npx eas-cli@latest env:create --scope project --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPPORT_EMAIL --value "support@example.com"
```

`EXPO_PUBLIC_PRIVACY_URL` is the **policy page**, ending in `/privacy.html`, not the site's home page. Until it is set, the app falls back to the placeholder `https://jaedonh.github.io/lifeloop-privacy/` from `src/config/legal.ts`, which a production build refuses.

Then confirm the app's release check passes with the published address. It fails if the address is still the placeholder, does not answer HTTP 200, is not the policy page (its title must contain "Privacy Policy") or still shows `[YOUR LEGAL NAME]` or `[CONTACT EMAIL]`. Every EAS production build runs this check too:

```bash
EXPO_PUBLIC_PRIVACY_URL="https://<user>.github.io/<repo>/privacy.html" npm run check:privacy
```

The app's **Settings → Privacy → Privacy policy** button opens `EXPO_PUBLIC_PRIVACY_URL`, and **Settings → Support → Contact** and **Settings → Privacy → Report an ad** write to `EXPO_PUBLIC_SUPPORT_EMAIL`, so set both before the production build, and use the same email on the pages (`--email`).

## app-ads.txt for AdMob (recommended)

AdMob checks an `app-ads.txt` file on your developer website to confirm that ads in your app are really yours; apps without it can earn less, and AdMob shows a warning. The crawler looks at the **root of the website's domain**, which for these pages is `https://<user>.github.io/app-ads.txt`, not the `/<repo>/` folder. So it needs a second, tiny repository:

1. In AdMob, open **Apps → View all apps → app-ads.txt** and copy the line it gives you. It looks like `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0` with your own publisher ID.
2. On GitHub, create a **public** repository named exactly `<your-github-username>.github.io`.
3. Add a file named `app-ads.txt` containing that one line, then turn on Pages for it as in step 4 above.
4. Check that `https://<user>.github.io/app-ads.txt` shows the line, and keep the store listings' website (Google Play) and marketing URL (App Store) on the same `<user>.github.io` address, as in the table above.
5. Back in AdMob's app-ads.txt page, it can take a day or more before the file shows as found.

## Keeping it up to date

- **Policy changes:** edit `docs/PRIVACY_POLICY.md` (update the date at the top), run step 2 again, then commit and push in the site repository. GitHub Pages updates within a minute or two. Keep the same URL forever: the stores and every installed copy of the app point at it.
- **When the store listings are live:** in `index.html`, replace each `<span class="badge">` placeholder with a link to the listing around the official badge image (download links are in the comment above the badges in `index.html`), use the badges unchanged, and publish again.
- **New content counts:** `index.html` lists "1,147 hand-written events"; update it with content drops if you like.
- **Renaming the app:** replace `LifeLoop` in `index.html`, `support.html` and `docs/PRIVACY_POLICY.md` (see the top of `docs/STORE_LISTING.md`), rebuild, and consider a matching repository name. Renaming a repository changes the URL, so update the stores and the EAS variable too.
- **Custom domain (optional):** if you buy a domain, add it under **Settings → Pages → Custom domain** and point it at GitHub as the page explains. Update every URL in the table above when you do.
