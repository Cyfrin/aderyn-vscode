import * as vscode from 'vscode';
import { exec } from 'child_process';

export function checkAderynVersion(): Promise<boolean> {
  const minVersion = '0.1.2';
  return new Promise((resolve) => {
    exec('aderyn --version', (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(
          "Aderyn not found. Please install aderyn.",
          "Open Installation Instructions"
        ).then(selection => {
          if (selection === "Open Installation Instructions") {
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/Cyfrin/aderyn?tab=readme-ov-file#usage"));
          }
        });
        resolve(false);
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
            "Open Installation Instructions"
          ).then(selection => {
            if (selection === "Open Installation Instructions") {
              vscode.env.openExternal(vscode.Uri.parse("https://github.com/Cyfrin/aderyn?tab=readme-ov-file#usage"));
            }
          });
          resolve(false);
        }
      } else {
        vscode.window.showErrorMessage(
          "Unable to determine the installed version of aderyn.",
          "Open Installation Instructions"
        ).then(selection => {
          if (selection === "Open Installation Instructions") {
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/Cyfrin/aderyn?tab=readme-ov-file#usage"));
          }
        });
        resolve(false);
      }
    });
  });
}
