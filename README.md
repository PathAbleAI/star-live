# STAR 2026: Built Live

At the ACCSES NJ STAR Conference (October 7, 2026), Burt Brooks of PathAble AI walked on stage with no slides. Three audience volunteers held a 10-minute planning meeting, Claude turned the conversation into a plan, the room argued with it until they approved it, and Claude built the deck you can see at **https://pathableai.github.io/star-live**.

Everything Claude was told is in [CLAUDE.md](CLAUDE.md). The only thing prepared in advance was the design template in `docs/`. Meeting transcripts were never uploaded.

## Presenting laptop setup

1. Open PowerShell and type, one line at a time:
   ```
   winget install --id GitHub.cli -e
   gh auth login
   gh repo clone PathAbleAI/star-live "$HOME\Documents\STAR-Live"
   cd "$HOME\Documents\STAR-Live"
   powershell -ExecutionPolicy Bypass -File .\setup.ps1
   ```
2. Double-click **STAR Live** on the desktop and log in to Claude once.
