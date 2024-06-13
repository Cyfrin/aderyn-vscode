import * as vscode from 'vscode';
import { registerRunAderynCommand } from './commands/runAderyn';
import { SidebarProvider } from './providers/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "aderyn-vscode" is now active!');

    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("aderyn-sidebar", sidebarProvider)
    );

    const aderynOutputChannel = vscode.window.createOutputChannel("Aderyn Output");
    context.subscriptions.push(aderynOutputChannel);

    const diagnosticCollection = vscode.languages.createDiagnosticCollection("aderynIssues");
    context.subscriptions.push(diagnosticCollection);

    const aderynStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    aderynStatusBarItem.command = 'aderyn-vscode.run';
    aderynStatusBarItem.text = `$(play) Run Aderyn`;
    aderynStatusBarItem.tooltip = "Run Aderyn Analysis";
    aderynStatusBarItem.show();
    context.subscriptions.push(aderynStatusBarItem);

    registerRunAderynCommand(context, aderynOutputChannel, diagnosticCollection);

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
