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

# The project root directory.
root = "."

# The source directory containing the Solidity contracts.
# This is often "contracts/" or "src/"
src = "src/"

# Contract files to include in the analysis.
# This is a list of strings representing the file paths of the contracts to include.
# It can be a partial match like "/interfaces/", which will include all files with "/interfaces/" in the file path.
# Or it can be a full match like "Counter.sol", which will include only the file with the exact file.
# If not specified, all contract files in the source directory will be included.
# Example:
# include = ["Counter.sol"]
include = []

# Contract files to exclude from the analysis.
# This is a list of strings representing the file paths of the contracts to exclude.
# It can be a partial match like "/interfaces/", which will exclude all files with "/interfaces/" in the file path.
# Or it can be a full match like "Counter.sol", which will exclude only the file with the exact file.
# If not specified, no contract files will be excluded.
# Example:
# exclude = ["/interfaces/"]
exclude = []

## Remappings used for compiling the contracts.
# Example:
# remappings = ["@oz/contracts=lib/openzeppelin-contracts/contracts"]
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
