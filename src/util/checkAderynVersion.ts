import * as vscode from 'vscode';
import { ChildProcess, exec } from 'child_process';
import { startAderynWatch } from './startAderynWatch';

export function checkAderynVersion(context: vscode.ExtensionContext, aderynOutputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection, onSuccess: (process: ChildProcess) => void) {
    const minVersion = '0.1.0';
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
            return;
        }
        const versionPattern = /(\d+\.\d+\.\d+)/; // Regex to extract version number
        const match = stdout.match(versionPattern);
        if (match) {
            const installedVersion = match[1];
            if (installedVersion >= minVersion) {
                diagnosticCollection.clear();
                const aderynProcess = startAderynWatch(context, aderynOutputChannel, diagnosticCollection);
                onSuccess(aderynProcess);
            } else {
                vscode.window.showErrorMessage(
                    `Aderyn version is too old. Found: ${installedVersion}, Required: ${minVersion}. Please update aderyn.`,
                    "Open Installation Instructions"
                ).then(selection => {
                    if (selection === "Open Installation Instructions") {
                        vscode.env.openExternal(vscode.Uri.parse("https://github.com/Cyfrin/aderyn?tab=readme-ov-file#usage"));
                    }
                });
                return;
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
            return;
        }
    });
}
