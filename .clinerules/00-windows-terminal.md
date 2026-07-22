# Windows Terminal Rules

- Use Windows PowerShell syntax for every terminal command executed in this repository.
- Run exactly one command per terminal tool call.
- Do not combine commands with `&&`, `;`, pipelines, or command chaining unless the user explicitly requests a single PowerShell expression that requires it.
- Write command operators literally. Do not use HTML entities such as `&&`, `>`, or `<`.
- Run Bash commands and Bash script checks through WSL.
- Use Windows paths for PowerShell commands and `/mnt/<drive-letter>/...` paths for commands executed through WSL.
- For example, validate the Backend deployment script with:

```powershell
wsl bash -n /mnt/z/Work/Projects/MOVEment2026/be/deploy/deploy.sh
```

- When an exit code is required, run the target command first and run `$LASTEXITCODE` in the immediately following PowerShell tool call.
- Do not substitute `cmd.exe`, Git Bash, or a Linux shell for Windows PowerShell unless the user explicitly requests it.