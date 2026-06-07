# Skill Panel Capture Utility

This private utility captures screenshots of visible skill detail panels from an authorised curriculum or proficiency report page. It is intended for internal curriculum mapping reference only.

## Ethical Boundary

Use this only on pages you are authorised to view manually.

Do not use it to:

- bypass login, paywalls, captchas, rate limits, or access controls
- scrape hidden APIs or private endpoints
- bulk-download question banks
- copy source wording, diagrams, IDs, or exact examples into Tian OS runtime content

The utility only automates the same manual workflow: open a visible report page, click visible skill boxes/cards one at a time, and save screenshots.

## 1. Save Manual Login State

Run:

```bash
npm run capture:skills -- --login
```

This opens Chromium in non-headless mode. Log in manually. Once the authorised report page is usable, return to the terminal and press Enter.

The browser storage state is saved to:

```text
.auth/reference-site.json
```

You can also open a specific login/report URL during login:

```bash
npm run capture:skills -- --login --url "https://student.koobits.com/report/proficiency"
```

## 2. Capture One Topic

Run:

```bash
npm run capture:skills -- --url "https://student.koobits.com/report/proficiency" --out captures/p4-numbers-to-100000
```

The script will:

- use `.auth/reference-site.json`
- open the URL in visible Chromium
- find visible skill buttons/cards on the left side
- click each visible skill one at a time
- wait for the right-side detail panel to render
- save screenshots as `skill-001.png`, `skill-002.png`, and so on
- save `manifest.json` in the output folder

## 3. Select Syllabus, Level, or Topic Manually

If the report page requires choosing a syllabus, level, subject, or topic first:

1. Run login mode.
2. In the opened browser, manually select the syllabus/level/topic.
3. Navigate to the report view you want.
4. Press Enter in the terminal to save the state.
5. Run capture mode for that exact topic URL.

Capture one topic at a time. Use a separate output folder per topic, for example:

```bash
npm run capture:skills -- --url "https://student.koobits.com/report/proficiency" --out captures/p4-fractions-ii --max 30
```

## 4. Capture Limits

Default max capture count:

```text
50
```

Custom max:

```bash
npm run capture:skills -- --url "https://student.koobits.com/report/proficiency" --out captures/topic-name --max 30
```

The script refuses more than 80 captures unless you explicitly pass:

```bash
--confirm-large
```

This is a safety boundary to avoid accidental bulk capture.

## 5. Output

Screenshots are saved in the output folder:

```text
captures/p4-numbers-to-100000/skill-001.png
captures/p4-numbers-to-100000/skill-002.png
captures/p4-numbers-to-100000/manifest.json
```

The manifest records:

- source URL
- timestamp
- captured count
- detected skill label/text
- screenshot path
- success or failure
- error message, if any

## 6. Selector Assumptions

Selectors are configurable near the top of:

```text
scripts/captureSkillPanels.js
```

The default assumptions are:

- skill buttons/cards are visible on the left side of the page
- many skill items include text like `Skill 1`, `Skill 2`, or `Skill 3`
- skill items are clickable elements such as buttons, links, role buttons, card-like elements, or tabindex elements
- the detail panel appears on the right side after clicking

If skill buttons are not detected:

1. Open `scripts/captureSkillPanels.js`.
2. Edit `SELECTORS.skillCandidates`.
3. Add a visible selector that matches the skill cards on the report page.
4. If labels do not include `Skill 1`, update `SELECTORS.preferredSkillText`.
5. If panel screenshots miss the right area, update `SELECTORS.detailPanels`.

The fallback capture mode takes a right-side viewport clip when a specific panel element cannot be identified.
