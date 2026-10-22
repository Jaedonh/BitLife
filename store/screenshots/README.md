# Store screenshots

Framed screenshots of the real game, at the exact pixel sizes App Store Connect and Google Play Console accept. Every screen is a live capture of the web export, loaded with a save the game engine played itself (no mock-ups, no edited text). Each image has a short caption on top, in the app's colors (background `#0F0E1A`, lime `#A3E635`, indigo `#4338CA`).

All 54 files are 24-bit RGB PNGs with no alpha channel, 380 KB to 1.2 MB each.

## Which folder goes where

| Folder | Size (px) | Where to upload | Needed? |
| --- | --- | --- | --- |
| `ios-6.3/` | 1206 × 2622 | App Store Connect › iPhone › 6.3" display | **Required.** As of October 2026, Apple's "Required device sizes" names this size (the medium iPhone with Dynamic Island) for iPhone. |
| `ios-6.9/` | 1320 × 2868 | App Store Connect › iPhone › 6.9" display | Accepted and recommended: these are the ones shown on the largest iPhones. Upload both iPhone sets. |
| `ipad-13/` | 2064 × 2752 | App Store Connect › iPad › 13" display | **Required** while the app runs on iPad (`supportsTablet: true`). Not needed if you set `supportsTablet: false`. |
| `android-phone/` | 1080 × 1920 | Play Console › Main store listing › Phone screenshots | **Required** (at least 2; 4 or more for promotion). |
| `android-tablet-7/` | 1440 × 2560 | Play Console › 7-inch tablet screenshots | Optional, but needed to be featured on tablets. |
| `android-tablet-10/` | 1800 × 3200 | Play Console › 10-inch tablet screenshots | Optional, same as above. |

Apple scales the 6.9" and 6.3" sets down for older and smaller iPhones, so no other iPhone size is needed.

## Upload order

Upload in file order. The App Store shows the first three in search results, so they carry the pitch: the journal, a choice, and the ending.

| # | File | Caption | What it shows |
| --- | --- | --- | --- |
| 1 | `01-life.png` | One tap. / One year. | Maya, 17, in 2004: a full year in the journal (a new friend, the senior prank she sat out, New Year's Eve on the phone), all four stats above 90%. |
| 2 | `02-event.png` | Every year asks / a question. | The "Cafeteria politics" card with three choices, at 13. |
| 3 | `03-death.png` | Die well. / Start a dynasty. | The tombstone (Rich ribbon, epitaph), her daughter ready to continue the family line, and the obituary. |
| 4 | `04-people.png` | Be kind. / They remember. | People at 45: both parents (a retired bus driver and a retired lawyer), a daughter, a husband and friends, with relationship bars. |
| 5 | `05-work.png` | 70+ careers. / Real ladders. | Work & School: Head of Data after 23 years, $287,500 a year, and job listings. |
| 6 | `06-assets.png` | Build wealth. / Or debt. | Assets: an index fund up 56%, crypto, a family car and the house she lives in ("where I live"), with $181,673 still owed on the mortgage. |
| 7 | `07-start.png` | Eight ways / to be born. | The eight starting scenarios; Wealthy shows its Premium lock. |
| 8 | `08-achievements.png` | 40 achievements. / Every life counts. | Achievements, 11 of 40 unlocked. |
| 9 | `09-court.png` | Get caught? / Your day in court. | The court card: plead guilty, public defender, a lawyer or represent yourself. |

- **App Store:** upload all nine (the limit is 10 per size).
- **Google Play:** the limit is **8 per device type**. Upload `01` to `08`, or swap `08-achievements` for `09-court` if you would rather show crime and court.

Files per folder (sizes in KB, in the order above):

| Folder | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ios-6.9/` | 782 | 696 | 681 | 675 | 670 | 666 | 656 | 718 | 690 |
| `ios-6.3/` | 698 | 615 | 592 | 591 | 583 | 580 | 577 | 629 | 608 |
| `ipad-13/` | 1188 | 1166 | 1074 | 1067 | 1064 | 1054 | 1067 | 1102 | 1175 |
| `android-phone/` | 479 | 415 | 407 | 401 | 389 | 384 | 388 | 426 | 416 |
| `android-tablet-7/` | 787 | 727 | 680 | 673 | 672 | 661 | 680 | 714 | 728 |
| `android-tablet-10/` | 1118 | 1063 | 929 | 957 | 973 | 945 | 953 | 1011 | 1085 |

## The rules these follow (checked October 21, 2026)

**Apple** ([Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)):

- "To submit your app, you must provide screenshots for the following required display sizes: iPhone: At least one screenshot for iPhone with Dynamic Island (medium display). iPad (if your app supports iPadOS): At least one screenshot for iPad 13-inch display."
- Medium display (iPhone 18 Pro, 17 Pro, 17, 16 Pro, 16...): 1179 × 2556 or **1206 × 2622** portrait.
- Large display, 6.9" (iPhone Air, 18 Pro Max, 17 Pro Max, 16 Pro Max...): 1260 × 2736, 1290 × 2796 or **1320 × 2868** portrait.
- iPad 13" (iPad Pro M5/M4, iPad Air M4/M3/M2): **2064 × 2752** or 2048 × 2732 portrait.
- 1 to 10 screenshots per size; `.jpeg`, `.jpg` or `.png`. "Images can't include alpha channels or transparencies."
- Apple's older guidance named 6.9" as the required iPhone size. The live page (re-read on October 21, 2026) names the medium display, 6.3". This folder has both, so either reading is covered.

**Google Play** ([Add preview assets to showcase your app](https://support.google.com/googleplay/android-developer/answer/9866151); that page could not be loaded from this environment, so these figures come from its search summary and from 2026 guides such as [AppLaunchFlow](https://www.applaunchflow.com/blog/google-play-screenshot-requirements-2026). Check the hints in Play Console when you upload):

- JPEG or 24-bit PNG, no alpha. Each side 320 to 3,840 px, and the long side can be **at most twice** the short side.
- 2 to 8 screenshots per device type; at least 2 in all to publish.
- To be eligible for promotion: at least 4 screenshots, 1080 px or more. Games need 3 or more at 9:16 portrait (1080 × 1920 or more) or 16:9 landscape (1920 × 1080 or more). All sets here are exactly 9:16.
- 7-inch and 10-inch tablets: 9:16 or 16:9, each side 1,080 to 7,680 px.
- **1080 × 2400 is not allowed:** 2400 is 2.22 times 1080, over the 2:1 limit. That is why the phone set is 1080 × 1920.

## How the images are made

1. `scripts/store-saves.ts` plays a showcase life ("Maya Brooks", United States) with the real engine, the way an engaged player would: she studies, works hard, dates, marries, keeps up the house and invests. It saves the browser storage the web app reads at the right moments: a teenage year, an event card, a court card, mid-life and the tombstone. The journal and event card come from one seed (1156), and mid-life and the tombstone from another (363). The court card is a branch of the first life at 22. Saves are in `saves/`.

   **The saves in this folder are from the content of October 21, 2026, before the release review.** That review changed two lines of text, and the saves were updated to read exactly as the current game writes them: the New Year's Eve card in the journal ("Mom has poured sparkling grape juice into the good glasses. There is a board game …", in `teen.json` and `court.json`) and the obituary ("She retired as head of data after 42 years", in `death.json` and `fresh.json`, recomputed with the current `buildObituary`). It also moved the "First week of high school" card to age 14 only, which changes the random path of both seeds from age 14 on, so `--fresh-saves` now plays different lives. Before the next `--fresh-saves`, pick new seeds (below) and check every image again.
2. All saves are the **free** game (no Premium). The web build has no ads SDK, so no banner, no "📺" ad buttons and no "test ads" label can appear, and the Wealthy start shows its Premium lock. That keeps the paid feature clearly marked, as App Review guideline 2.3.2 asks.
3. `scripts/store-screenshots.mjs` serves the web export (the pattern in `e2e/smoke.mjs`) and opens each screen in Playwright's system Chromium, at the width of a real device: 390 pt for iPhone, 412 dp for Android phones, 600 dp for a 7" tablet, 800 dp for a 10" tablet and 768 pt for iPad. The device scale factor is set so the capture is exactly the pixel size of its slot in the frame, so the screen is never resized. The frame is an HTML page rendered at scale 1 and at the exact output size. The script then removes the alpha channel (plain Node, no image library).
4. Two screens need help to fit one frame. **Assets** is scrolled to the index fund, so the investments, the car and the house all show. On phones, the **obituary** sits below the fold of the tombstone screen. It is captured from the same screen and drawn on top, outlined in lime, over the achievements button (never over the tombstone or the heir). On tablets the obituary is already on screen, so nothing is moved.
5. A run fails and writes nothing more if:
   - any screen shows `placeholder`, `lorem`, `debug`, `test ads`, `(development)`, `undefined`, `NaN`, `[object` or `TODO`;
   - the page logs an error;
   - a caption runs past two lines or out of its box;
   - an image is not exactly the size its set needs;
   - an image has a transparent pixel.

Every image in this folder was also checked by eye. No text is clipped, nothing overlaps by mistake, and no ad space is drawn.

## Regenerate

```bash
npm run build:web                                   # the web export, into dist/
node scripts/store-screenshots.mjs                  # all six sets (about 3 minutes)
node scripts/store-screenshots.mjs --only ios-6.9,android-phone
node scripts/store-screenshots.mjs --dist /path/to/dist --port 8502
node scripts/store-screenshots.mjs --raw            # also keep the unframed captures in raw/ (for review; do not upload)
node scripts/store-screenshots.mjs --fresh-saves    # rebuild saves/ first
npx tsx scripts/store-saves.ts                      # rebuild saves/ only
```

Chromium is found the same way as in `e2e/smoke.mjs` (`PLAYWRIGHT_BROWSERS_PATH` or `CHROME_PATH`). Captions use Inter Display ExtraBold when it is installed and fall back to Inter or the system sans-serif.

**When to run it again:**

- **After the name changes.** The game's own header shows the app name (`YEARBORN` on shots 1, 2 and 9). The frames contain no app name, so rebuild the web export with the new name and run the script again.
- **After any change to the screens or the theme.** Rebuild the web export first.
- **After content or balance changes.** The saves still load, but the showcase lives may play out differently. Rebuild them with `--fresh-saves` and look at every image again. If a shot got worse, pick new seeds:

  ```bash
  npx tsx scripts/store-saves.ts --scan 1500 --by young   # best journal + event card
  npx tsx scripts/store-saves.ts --scan 1500 --by old     # best mid-life + tombstone
  npx tsx scripts/store-saves.ts --seed 1156 --show       # read what a seed's shots contain
  ```

  Then set `youngSeed` and `oldSeed` in `SHOWCASE` at the top of `scripts/store-saves.ts`.

## Good to know before you upload

- **Emoji look like Google's.** The captures come from Chromium on Linux, so emoji are Noto Color Emoji. On an iPhone the game shows Apple's emoji. That is fine for review. If you want Apple's emoji in the iOS sets, run the script on a Mac (Chromium there uses Apple Color Emoji).
- **No status bar.** These are captures of the game's screen, not of a whole phone.
- **The two showcase lives share a name.** The teenager grows up in Austin; the mid-life and tombstone life is from Los Angeles. Few people will notice.
- **Tablets show more of the journal.** The 10" journal shot shows two years below the current one, including "My dog Poppy died of old age at 15." That line is gentle, but it is the one sad line in the set.
- **Unlock dates.** Achievements show unlock dates of Oct 18, 2026: the saves use a fixed clock so they do not change between runs.

## In the listing

`docs/STORE_LISTING.md` §12 and `docs/RELEASE_CHECKLIST.md` §3 use this order, these captions and these sizes. Change all three together.
