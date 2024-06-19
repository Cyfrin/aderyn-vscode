import * as vscode from 'vscode';
import { exec, execSync } from 'child_process';

export function checkAderynVersion(): Promise<boolean> {
  const minVersion = '0.1.2';
  return new Promise((resolve) => {
    exec('aderyn --version', (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(
          "Aderyn not found. Please install aderyn.",
          "Install Aderyn", // New button for installing Aderyn
          "Open Installation Instructions"
        ).then(selection => {
          if (selection === "Install Aderyn") {
            installAderyn().then(installed => {
              if (installed) {
                vscode.window.showInformationMessage("Aderyn installed successfully.");
                resolve(true);
              } else {
                vscode.window.showErrorMessage("Failed to install Aderyn. Please try installing manually.");
                resolve(false);
              }
            });
          } else if (selection === "Open Installation Instructions") {
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/Cyfrin/aderyn?tab=readme-ov-file#usage"));
          } else {
            resolve(false);
          }
        });
        return;
      }
      const versionPattern = /(\d+\.\d+\.\d+)/; // Regex to extract version number
      const match = stdout.match(versionPattern);
      if (match) {
        const installedVersion = match[1];
        if (installedVersion >= minVersion) {
          resolve(true);
        } else {
          vscode.window.showErrorMessage(
            `Aderyn version is too old. Found: ${installedVersion}, Required: ${minVersion}. Please update aderyn.`,
            "Install Aderyn",
            "Open Installation Instructions"
          ).then(selection => {
            if (selection === "Install Aderyn") {
              installAderyn().then(installed => {
                if (installed) {
                  vscode.window.showInformationMessage("Aderyn installed successfully. Please restart VSCode to complete the setup.");
                  resolve(true);
                } else {
                  vscode.window.showErrorMessage("Failed to install Aderyn. Please try installing manually.");
                  resolve(false);
                }
              });
            } else if (selection === "Open Installation Instructions") {
              vscode.env.openExternal(vscode.Uri.parse("https://github.com/Cyfrin/aderyn?tab=readme-ov-file#usage"));
            } else {
              resolve(false);
            }
          });
        }
      } else {
        vscode.window.showErrorMessage(
          "Unable to determine the installed version of aderyn.",
          "Install Aderyn",
          "Open Installation Instructions"
        ).then(selection => {
          if (selection === "Install Aderyn") {
            installAderyn().then(installed => {
              if (installed) {
                vscode.window.showInformationMessage("Aderyn installed successfully. Please restart VSCode to complete the setup.");
                resolve(true);
              } else {
                vscode.window.showErrorMessage("Failed to install Aderyn. Please try installing manually.");
                resolve(false);
              }
            });
          } else if (selection === "Open Installation Instructions") {
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/Cyfrin/aderyn?tab=readme-ov-file#usage"));
          } else {
            resolve(false);
          }
        });
      }
    });
  });
}

async function installAderyn(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Step 1: Download the installer
    exec('curl -L https://raw.githubusercontent.com/Cyfrin/aderyn/feature/cyfrinup/cyfrinup/install | bash', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error downloading installer: ${stderr}`);
        resolve(false);
        return;
      }
      console.log(`Installer downloaded: ${stdout}`);

      // Step 2: Run `cyfrinup` in appropriate shell context
      const sourcingCommands = `
        if [ -f ~/.zshrc ]; then source ~/.zshrc; fi
        if [ -f ~/.bashrc ]; then source ~/.bashrc; fi
        if [ -f ~/.bash_profile ]; then source ~/.bash_profile; fi
        if [ -f ~/.profile ]; then source ~/.profile; fi
        if [ -f ~/.cshrc ]; then source ~/.cshrc; fi
        if [ -f ~/.tcshrc ]; then source ~/.tcshrc; fi
        if [ -f ~/.kshrc ]; then source ~/.kshrc; fi
        cyfrinup
      `;
      exec(sourcingCommands, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running cyfrinup: ${stderr}`);
          resolve(false);
          return;
        }
        console.log(`Aderyn installed: ${stdout}`);

        // Verify installation
        exec('aderyn --version', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error verifying aderyn installation: ${stderr}`);
            resolve(false);
            return;
          }
          console.log(`Aderyn version: ${stdout}`);
          resolve(true);
        });
      });
    });
  });
}
