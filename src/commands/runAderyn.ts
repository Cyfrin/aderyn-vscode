import * as vscode from 'vscode';
import { checkAderynVersion } from '../util/checkAderynVersion';
import { ChildProcess } from 'child_process';

export function registerRunAderynCommand(context: vscode.ExtensionContext, aderynOutputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection) {
    let aderynProcess: ChildProcess | null = null;

    const runCommand = vscode.commands.registerCommand('aderyn-vscode.run', () => {
        if (!aderynProcess) {
            checkAderynVersion(context, aderynOutputChannel, diagnosticCollection, (process: ChildProcess | null) => {
                aderynProcess = process;
            });
        } else {
            vscode.window.showInformationMessage('Aderyn is already running.');
        }
    });

    context.subscriptions.push(runCommand);

    context.subscriptions.push({
        dispose: () => {
            if (aderynProcess) {
                aderynProcess.kill();
                aderynProcess = null;
            }
        }
    });
}
