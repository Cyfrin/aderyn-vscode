import * as vscode from 'vscode';
import { checkAderynVersion } from '../util/checkAderynVersion';
import { ChildProcess } from 'child_process';
import { startAderynWatch } from '../util/startAderynWatch';

export function registerRunAderynCommand(
    context: vscode.ExtensionContext,
    aderynOutputChannel: vscode.OutputChannel,
    diagnosticCollection: vscode.DiagnosticCollection,
    statusBarItem: vscode.StatusBarItem
) {
    let aderynProcess: ChildProcess | null = null;

    const runCommand = vscode.commands.registerCommand('aderyn-vscode.run', async () => {
        if (!aderynProcess) {
            const versionCheckPassed = await checkAderynVersion();
            if (versionCheckPassed) {
                aderynProcess = startAderynWatch(context, aderynOutputChannel, diagnosticCollection, '', '', '');
                statusBarItem.text = `$(primitive-square) Stop Aderyn`;
                statusBarItem.command = 'aderyn-vscode.stop';
            }
        } else {
            vscode.window.showInformationMessage('Aderyn is already running.');
        }
    });

    const stopCommand = vscode.commands.registerCommand('aderyn-vscode.stop', () => {
        if (aderynProcess) {
            aderynProcess.kill('SIGINT'); // Send SIGINT to simulate ctrl+c
            aderynOutputChannel.appendLine('Aderyn process stopped.');
            aderynProcess = null;
            diagnosticCollection.clear();
            statusBarItem.text = `$(play) Run Aderyn`;
            statusBarItem.command = 'aderyn-vscode.run';
        } else {
            vscode.window.showInformationMessage('Aderyn is not running.');
        }
    });

    context.subscriptions.push(runCommand);
    context.subscriptions.push(stopCommand);

    context.subscriptions.push({
        dispose: () => {
            if (aderynProcess) {
                aderynProcess.kill();
                aderynProcess = null;
            }
        }
    });
}
