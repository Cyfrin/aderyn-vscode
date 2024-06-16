import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function registerConfigureAderynCommand(context: vscode.ExtensionContext) {
    const configureCommand = vscode.commands.registerCommand('aderyn-vscode.configure', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a workspace first.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const configFilePath = path.join(workspaceRoot, 'aderyn.toml');

        try {
            if (fs.existsSync(configFilePath)) {
                // Open existing aderyn.toml file
                const document = await vscode.workspace.openTextDocument(configFilePath);
                await vscode.window.showTextDocument(document);
            } else {
                // Create aderyn.toml file with template content
                const templateContent = `# Aderyn Configuration File
# This is a sample configuration for Aderyn

# root = ""
# src = ""
# include = []
# exclude = []
# remappings = []
`;

                fs.writeFileSync(configFilePath, templateContent);

                // Open the newly created aderyn.toml file
                const document = await vscode.workspace.openTextDocument(configFilePath);
                await vscode.window.showTextDocument(document);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error configuring Aderyn: ${error.message}`);
        }
    });

    context.subscriptions.push(configureCommand);
}
