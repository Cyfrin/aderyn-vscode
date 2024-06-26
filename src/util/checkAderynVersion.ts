import * as vscode from 'vscode';
import { exec } from 'child_process';
import { installAderynUnix } from './installAderynUnix';
import * as os from 'os';
import * as path from 'path';

function getGitBashPath(): string | null {
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

export function checkAderynVersion(aderynOutputChannel: vscode.OutputChannel): Promise<boolean> {
  const minVersion = '0.1.3';
  const isWindows = os.platform() === 'win32';
  const options = isWindows ? ["Open Installation Instructions"] : ["Install Aderyn", "Open Installation Instructions"];

  return new Promise((resolve) => {
    const gitBashPath = isWindows ? getGitBashPath() : null;
    const execOptions = isWindows && gitBashPath ? { shell: gitBashPath } : {};

    exec('aderyn --version', execOptions, (error, stdout, stderr) => {
      if (error) {
        aderynOutputChannel.appendLine(`Error checking Aderyn version: ${stderr}`);
        vscode.window.showErrorMessage(
          "Aderyn not found. Please install aderyn.",
          ...options
        ).then(selection => {
          if (selection === "Install Aderyn") {
            installAderynUnix(aderynOutputChannel).then(installed => {
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
            ...options
          ).then(selection => {
            if (selection === "Install Aderyn") {
              installAderynUnix(aderynOutputChannel).then(installed => {
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
          ...options
        ).then(selection => {
          if (selection === "Install Aderyn") {
            installAderynUnix(aderynOutputChannel).then(installed => {
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
