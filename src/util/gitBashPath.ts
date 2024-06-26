export function getGitBashPath(): string | null {
    const gitBashPaths = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    ];
  
    for (const gitBashPath of gitBashPaths) {
      if (require('fs').existsSync(gitBashPath)) {
        return gitBashPath;
      }
    }
  
    return null;
  }