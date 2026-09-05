# Session Handoff Log

> Newest at top. ✅ done · 🔄 in progress · 🎯 focus · 📝 notes

---

## 2026-09-05 — CoreConsole V1 final UX/product correction pass

🎯 **Focus:** A presentation-only correction pass over the whole console. The cryptography was already
right; the *framing* was wrong. Goal: someone who has never heard of Technocore understands the screen
in ten seconds, and nobody is shown raw key material they did not ask for.

### ✅ Done — framing and wording

* **Nothing calls this a wallet.** "Wallet", "seed phrase", "funds", "balance" appear nowhere in the UI
  (scanned to zero hits). The vocabulary is agent identity, signing key, identity secret, identity backup.
* **"Identity & Key Management" → "Your agent".** Plain-language explanation, DID card, and everything
  cryptographic moved into **Advanced identity**, collapsed by default.
* **The identity secret is hidden by default.** No raw secret anywhere in the normal flow; no "Export
  Seed" primary button. Export lives under Advanced identity behind a gate that says, verbatim: "This
  export contains the secret material that controls this agent's signing identity. Anyone who obtains it
  can act as this agent." Even inside that dialog the value stays masked until you press **Reveal**.
* **Public key, fingerprint, sharded note path, nonce** all left the normal UI. Truncated (`8f31…92ac`)
  with copy buttons under Advanced identity / Protocol details, or in the Protocol Inspector.
* **Signatures recontextualised** — a message now reads **✓ Verified agent**, with the DID, nonce,
  canonical payload, and signature behind **View verification**.
* **Protocol correction (the important one).** The UI never claims the mailbox name proves DID
  ownership. `mb-<fingerprint>` is described as a *default mailbox convention* — a room name is
  first-come and unauthenticated upstream; only the signed `did:key` establishes authorship. Contacts,
  Identity, and Rooms all state this where the mailbox is shown.
* **Navigation split into two labelled groups** — Workspace (Overview, Inbox, Contacts, Rooms) and
  Tools (Verifier, Identity). No routing rewrite.
* **Overview is a dashboard, not a protocol dump** — agent hero, four tiles (Inbox / Rooms / Contacts /
  Agent mailbox), a plain-English Verification card, and Recent activity phrased as events.
* **Status language** is Initializing / Connected / Connection issue / Identity required — no state
  makes the app look broken before an identity exists.

### ✅ Done — accessibility and responsiveness

* **Dark-mode contrast bug found and fixed.** The dark ink ramp had never been measured against the
  surfaces it lands on: `--color-ink-4` was 3.04–3.2:1 (nav group labels, every relative timestamp, room
  topics, the footer target line) and `--color-ink-3` 4.22:1 (unread badge) — real WCAG AA failures in
  the *default* theme. The ramp is now pinned to the lightest surface (`--color-surface-3`): ink 13.1:1,
  ink-2 8.9:1, ink-3 6.4:1, ink-4 4.8:1. Re-measured: nav labels and footer 5.77:1, timestamps 5.47:1.
* **Zero contrast failures** in both themes across Overview, Inbox, Contacts, Rooms, Verifier, Identity,
  Compose, all four Protocol Inspector tabs, the Export gate, and the Create-new-identity confirmation —
  at 360, 375, 768, 1024, and 1440px. Largest single sweep: 318 text elements.
* **Touch targets** meet WCAG 2.2 AA (24×24) at every viewport after fixing sub-24px controls in
  `DataField`, `OverviewTab`, `RoomsTab` (×2), `InboxTab` (×2), and `ExportSeedModal` (×3).
* `docOverflow: 0` everywhere. The only element extending past the viewport is the tab strip, which is
  an intentional `overflow-x-auto` scroller.

### 📝 Notes / caveats for the next session

* **Production is stale.** `https://technocore-agent-console.vercel.app/` still serves the pre-redesign
  build: the Vercel project is not connected to this GitHub repo, and `npx vercel --prod` has never been
  run. Several points in the correction brief describe UI that no longer exists in `master`.
* **Upstream `technocore.chat` is flaky** — intermittent 503s, and 504s on long-poll mailbox reads. The
  504s are expected (a long poll that returns nothing) and do not flip the UI to an error state; the
  status stayed **Connected** throughout.
* **`lobby` runs at ~46 messages/second**, so a posted message leaves the 200-message window within a
  minute. Round-trip proof uses the quiet room `vector-room-427`.
* **Creating a brand-new room fails upstream** with `400 room limit reached (81920 is the cap…)`, so a
  first send to your own `mb-…` mailbox fails until that room exists.
* **Measuring in the hidden Browser pane:** `clientWidth` reads 0 unless `preview_resize` is re-applied,
  `innerText` drops text (use `textContent`), and CSS transitions freeze — so `transition-colors`
  elements report pre-flip colours after an emulated theme change. Inject
  `* { transition: none !important; animation: none !important; }` before reading any colour, or you
  will chase contrast failures that do not exist.
* **Deliberate deviations from the brief** (all presentation-preserving, listed so nobody "fixes" them):
  identity is still auto-generated on first load, so the creation empty state is a fallback rather than
  first-run; there is no global Protocol Inspector nav item because the Inspector is per-message;
  Overview card 2 counts Rooms, not "Conversations"; Recent activity only derives real events; the
  `ExportSeedModal` filename kept its old symbol name while the copy changed; room `last_seq` is
  labelled "Sequence" because it is a height, not a message count; Compose shows both recipient
  affordances at once; contact "Status" is honest capability, not presence; a contact's DID cannot be
  edited because `useContacts.updateContact` does not validate.

### 🎯 Next

1. Connect the GitHub repo in Vercel (or run `npx vercel --prod`) so production reflects `master`.
2. Re-walk the eight-step user flow against the deployed build, not just the dev server.

---

## 2026-09-03 — Spec-compliance fixes + full UI/UX redesign

🎯 **Focus:** Audit against the "Technocore Agent Console — V1 Build Specification", fix every
compliance gap, remove all fake/gimmick ("AI slop") behaviour, and redesign the whole surface on a
real design-token system with light + dark themes.

### ✅ Done — functional / spec compliance

* **Connection check no longer false-fails.** Liveness now probes `/healthz` (~50–120 ms) instead of
  `/rooms` (upstream tail is 25–30 s), and the proxy timeout went 15 s → 30 s. The rooms directory is
  a best-effort side fetch — a slow room listing can no longer flip the app to "Offline".
  `src/lib/client.ts`, `src/hooks/useTechnocore.ts`, `src/app/api/proxy/route.ts`
* **Real error reasons are surfaced everywhere** (spec's exact pattern). New
  `src/components/ConnectionErrorBanner.tsx` renders `Unable to connect to Technocore. Reason: <error>`
  with Retry + dismiss. Inbox shows the real mailbox error + "Retrying automatically…"; Rooms shows
  `Failed to read #<room>` + reason + Retry instead of a silent empty state.
* **Fake seed contacts deleted.** `DEFAULT_SEED_CONTACTS` ("Alpha Mesh Sentinel", "Nexus Courier")
  removed from `src/hooks/useContacts.ts`; contacts start empty and invalid-DID entries are dropped
  on load, which cleans up anyone who already had the fakes in `localStorage`.
* **Fake 150 ms signing delay removed** from `ComposeModal.tsx` — the button now reflects real
  `@noble/ed25519` timing only.
* **Honest clipboard** — `src/lib/clipboard.ts`; "Copied!" only appears after the write resolves,
  failures report the reason.
* **Room refresh bug fixed (real bug).** Submitting the room you were already viewing was a no-op:
  `setSelectedRoom(sameValue)` bails out in React, so the effect never refetched and the stream froze
  on a stale snapshot. Now it calls `fetchRoomMessages` directly.

### ✅ Done — killed the slop

* Deleted the Web Audio gimmick entirely: `src/lib/audio.ts`, `src/hooks/useAudio.ts`, the header
  sound toggle, and every `playClick/playSend/playVerify*` call.
* Removed gradient + glow Compose button, BrandLogo glow, purple glow on the Verifier, the
  "by @ShaikhZeeyan05" header pill, and the marketing subtitle.
* Replaced the static marketing KPI cards ("AGENT DIRECTORY: Active", "VERIFIER ENGINE: Offline
  100%") with four **live** KPIs: unread, rooms reachable from `/rooms`, saved contacts, Ed25519-valid
  messages this session.
* Removed colored icon boxes, tinted nav badges, and every hardcoded hex / `text-slate-*` /
  `white` / `black` utility in `src/`.

### ✅ Done — design system

* `src/app/globals.css` is now the single source of truth: OLED dark tokens **plus** a full
  `prefers-color-scheme: light` theme (both declared unlayered so they beat Tailwind 4's
  `@layer theme`). New `--color-on-accent` token because ink on saturated fills has to invert with the
  theme — 14 `text-bg` usages across 9 components were swapped to it.
* Body font 13 → 14 px, `:focus-visible` 2 px accent ring, `prefers-reduced-motion` block,
  tabular numerals on all mono text, skeleton loaders (no bare spinners), polished empty states in
  Inbox / Rooms / Overview / Contacts.
* Modal a11y extracted to `src/hooks/useModalA11y.ts` (focus trap + Escape + restore focus).
* `window.confirm` for key replacement replaced with an in-app `role="alertdialog"`.

### ✅ Verified (what each check actually proved)

* `npx tsc --noEmit` clean · `npx vitest run` 18/18 in 5 files · `npm run build` compiled, 4 static pages.
* **Walked the real journey in the browser**, not just the build: imported a seed → DID and
  fingerprint round-tripped (`022516204a429fe1` recomputed via WebCrypto matched the rendered value)
  → composed and signed a message → POSTed to `vector-room-427` → read it back at seq 80 → Protocol
  Inspector reported "Cryptographically Verified", 86-char sig, canonical payload + hex dump
  `766563746f722d726f6f6d2d343237…`, protocol v0.11.4 live.
* **Tamper rejection proven live** — Standalone Verifier passed the real message, then failed with
  "Ed25519 signature verification failed (cryptographic mismatch)" after one character was changed.
* **Error banner proven** — with `fetch` stubbed to fail only for `healthz`, the banner read exactly
  `Unable to connect to Technocore. Reason: Failed to fetch`; Retry restored "Live | 111 ms".
* **Contacts add → delete** round trip, **360 px** across all five tabs (zero horizontal overflow),
  **light-mode contrast measured in-browser** (ink 18.6 / 8.6 / 6.0 / 4.8, fills 5.9, all AA).

### 📝 Notes / honest limits

* **Upstream room cap.** Creating a *new* room fails upstream with
  `400 room limit reached (81920 is the cap…)`, so a send to your own `mb-<fingerprint>` mailbox fails
  until that room exists. Not an app bug — the error is surfaced verbatim. Verification was done
  against existing rooms instead.
* **`lobby` is a firehose** (~20 msg/sec) — a message posted there rolls out of the readable window
  in seconds. Use a quiet room for read-back tests.
* Could **not** photograph the focus ring or observe the clipboard *success* path in automation:
  `document.hasFocus()` is false in the driven tab. Both were verified by code inspection only.
* README has no screenshots — this harness can't write binary PNGs into the repo. An honest
  "Interface Tour" section describes each view instead.
* Vercel is linked via the **CLI** (`.vercel/project.json`, gitignored), not a Git integration. A
  push to GitHub will **not** auto-deploy until the repo is connected in the Vercel dashboard.

### ✅ Done — published

* GitHub CLI 2.99.0 installed via winget; signed in as `Zeeyan05` (device flow).
* Repo created and pushed: **https://github.com/Zeeyan05/technocore-agent-console** (public,
  default branch `master`, all 7 commits). Verified `HEAD == origin/master`, 61 tracked files, and
  no `.env` / `.pem` / `.vercel` / 64-hex seed literals anywhere in the tracked tree.

### 🔄 Next

* **Vercel is not connected to this repo.** The deployment is CLI-linked
  (`.vercel/project.json`, gitignored), so pushing to `master` does **not** deploy. Either run
  `npx vercel --prod`, or connect the repo under Vercel → Project → Settings → Git to get
  push-to-deploy.
* Optional: rename the default branch `master` → `main` for consistency with newer tooling
  defaults (`gh repo edit --default-branch main` after pushing a `main` branch).
