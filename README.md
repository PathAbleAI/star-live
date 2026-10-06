# STAR 2026: Built Live

At the ACCSES NJ STAR Conference (October 7, 2026), Burt Brooks of PathAble AI walked on stage with no slides. Three audience volunteers held a 10-minute planning meeting, Claude turned the conversation into a plan, the room argued with it until they approved it, and Claude built the deck you can see at **https://pathableai.github.io/star-live**.

Everything Claude was told is in [CLAUDE.md](CLAUDE.md). The only thing prepared in advance was the design template in `docs/`. Meeting transcripts were never uploaded.

## Presenting laptop setup

1. Open PowerShell and install Git and the GitHub tool, one line at a time. Wait for "Successfully installed" after each:
   ```
   winget install --id Git.Git -e
   winget install --id GitHub.cli -e
   ```
2. **Close PowerShell and open a new one.** A window opened before the installs can't find the new tools.
3. Sign in to GitHub as the **PathAbleAI** account (choose GitHub.com, HTTPS, Yes, Login with a web browser):
   ```
   gh auth login
   ```
4. Download the kit and run setup, one line at a time:
   ```
   gh repo clone PathAbleAI/star-live "$HOME\Documents\STAR-Live"
   cd "$HOME\Documents\STAR-Live"
   powershell -ExecutionPolicy Bypass -File .\setup.ps1
   ```
5. Double-click **STAR Live** on the desktop, log in to Claude once, and say **yes** to "trust this folder."

### If PowerShell says "gh" (or "git") is not recognized

1. Close every PowerShell window, open a new one, and type `gh --version`.
2. Still not recognized? Type `winget list --id GitHub.cli`.
   - If it lists GitHub CLI, paste this line, then try again:
     ```
     $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
     ```
   - If it says "No installed package found," run `winget install --id GitHub.cli -e` again and wait for "Successfully installed."
3. Last resort: restart the laptop.

For `git`, do the same with `Git.Git` in place of `GitHub.cli`.
