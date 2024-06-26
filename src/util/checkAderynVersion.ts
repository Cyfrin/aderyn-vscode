import * as vscode from 'vscode';
import { exec, execSync } from 'child_process';

export function checkAderynVersion(aderynOutputChannel: vscode.OutputChannel): Promise<boolean> {
  const minVersion = '0.1.3';
  return new Promise((resolve) => {
    exec('aderyn --version', (error, stdout, stderr) => {
      if (error) {
        aderynOutputChannel.appendLine(`Error checking Aderyn version: ${stderr}`);
        vscode.window.showErrorMessage(
          "Aderyn not found. Please install aderyn.",
          "Install Aderyn", // New button for installing Aderyn
          "Open Installation Instructions"
        ).then(selection => {
          if (selection === "Install Aderyn") {
            installAderyn(aderynOutputChannel).then(installed => {
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
          aderynOutputChannel.appendLine(`Aderyn version is too old. Found: ${installedVersion}, Required: ${minVersion}`);
          vscode.window.showErrorMessage(
            `Aderyn version is too old. Found: ${installedVersion}, Required: ${minVersion}. Please update aderyn.`,
            "Install Aderyn",
            "Open Installation Instructions"
          ).then(selection => {
            if (selection === "Install Aderyn") {
              installAderyn(aderynOutputChannel).then(installed => {
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
        aderynOutputChannel.appendLine(`Unable to determine the installed version of aderyn: ${stdout}`);
        vscode.window.showErrorMessage(
          "Unable to determine the installed version of aderyn.",
          "Install Aderyn",
          "Open Installation Instructions"
        ).then(selection => {
          if (selection === "Install Aderyn") {
            installAderyn(aderynOutputChannel).then(installed => {
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

async function installAderyn(aderynOutputChannel: vscode.OutputChannel): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Step 1: Download the installer
    exec('curl -L https://raw.githubusercontent.com/Cyfrin/aderyn/master/cyfrinup/install | bash', (error, stdout, stderr) => {
      if (error) {
        aderynOutputChannel.appendLine(`Error downloading installer: ${stderr}`);
        console.error(`Error downloading installer: ${stderr}`);
        resolve(false);
        return;
      }
      aderynOutputChannel.appendLine(`Installer downloaded: ${stdout}`);
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
          aderynOutputChannel.appendLine(`Error running cyfrinup: ${stderr}`);
          console.error(`Error running cyfrinup: ${stderr}`);
          resolve(false);
          return;
        }
        aderynOutputChannel.appendLine(`Aderyn installed: ${stdout}`);
        console.log(`Aderyn installed: ${stdout}`);

        // Verify installation
        exec('aderyn --version', (error, stdout, stderr) => {
          if (error) {
            aderynOutputChannel.appendLine(`Error verifying aderyn installation: ${stderr}`);
            console.error(`Error verifying aderyn installation: ${stderr}`);
            resolve(false);
            return;
          }
          aderynOutputChannel.appendLine(`Aderyn version: ${stdout}`);
          console.log(`Aderyn version: ${stdout}`);
          resolve(true);
        });
      });
    });
  });
}
