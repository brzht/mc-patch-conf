# CLAUDE.md

> Part of the Maincast broadcast stack — system context and inter-repo contracts: `..\CLAUDE.md` / `..\docs\STACK.md`.

Configuration and asset repository for the MultiGame launcher (`mc-ue-patcher`). Holds `games.json` encrypted with AES-256-GCM and signed with Ed25519, plus game banner/icon assets. Published to GitHub Pages (`https://brzht.github.io/mc-patch-conf/`), where the launcher fetches it at boot — config changes deploy independently of launcher releases.

Node.js scripts: keygen, encrypt, sign, verify.

## Optional per-game fields

Read by the launcher (`mc-ue-patcher` `Models/GameConfig.cs`); older launchers ignore fields they do not know, so a field can be published before the release that reads it.

| Field | Read since | Effect | Set on |
|---|---|---|---|
| `ndiLaunchArguments` | v0.0.13 | shows the `BM / NDI` output toggle; NDI mode launches with this string instead of `launchArguments` | both DOTA2 entries |
| `callNdiToggle` | v0.0.18 | shows the CALL NDI checkbox (on by default); unticked adds `-mcndiclean=0`, which stops the game's NDI call feed | both CS_V3 entries |

## Publish

`games.json` is gitignored and is the source of truth. After editing it: `npm run publish` (encrypt assets, encrypt, sign, verify), then commit `games.json.enc` + `games.json.enc.sig` (+ changed `assets/`) and push `main`. GitHub Pages serves the new files about a minute later; launchers pick them up on their next start.
