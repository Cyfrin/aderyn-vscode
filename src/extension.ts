import * as vscode from 'vscode';
import { registerRunAderynCommand } from './commands/runAderyn';
import { AderynTreeDataProvider } from './providers/AderynTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "aderyn-vscode" is now active!');

    const aderynOutputChannel = vscode.window.createOutputChannel("Aderyn Output");
    aderynOutputChannel.show(true); // Ensure the output channel is shown
    aderynOutputChannel.appendLine("Aderyn Output Channel Initialized");
    context.subscriptions.push(aderynOutputChannel);
    console.log("Output channel created");

    const diagnosticCollection = vscode.languages.createDiagnosticCollection("aderynIssues");
    context.subscriptions.push(diagnosticCollection);
    console.log("Diagnostic collection created");

    const aderynStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    aderynStatusBarItem.command = 'aderyn-vscode.run';
    aderynStatusBarItem.text = `$(play) Run Aderyn`;
    aderynStatusBarItem.tooltip = "Run Aderyn Analysis";
    aderynStatusBarItem.show();
    context.subscriptions.push(aderynStatusBarItem);
    console.log("Status bar item created");

    console.log("Creating AderynTreeDataProvider");
    const aderynTreeDataProvider = new AderynTreeDataProvider(context, aderynOutputChannel);
    vscode.window.registerTreeDataProvider('aderynSidebarView', aderynTreeDataProvider);

    registerRunAderynCommand(context, aderynOutputChannel, diagnosticCollection, aderynStatusBarItem, aderynTreeDataProvider);

    const solidityWatcher = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (document.languageId === 'solidity' && document.fileName.endsWith('.sol')) {
            diagnosticCollection.clear();
        }
    });

    context.subscriptions.push(solidityWatcher);
}

export function deactivate() {
    // Any cleanup code can go here
}
