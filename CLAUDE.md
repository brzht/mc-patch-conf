# CLAUDE.md

> Part of the Maincast broadcast stack — system context and inter-repo contracts: `..\CLAUDE.md` / `..\docs\STACK.md`.

Configuration and asset repository for the MultiGame launcher (`mc-ue-patcher`). Holds `games.json` encrypted with AES-256-GCM and signed with Ed25519, plus game banner/icon assets. Published to GitHub Pages (`https://brzht.github.io/mc-patch-conf/`), where the launcher fetches it at boot — config changes deploy independently of launcher releases.

Node.js scripts: keygen, encrypt, sign, verify.
