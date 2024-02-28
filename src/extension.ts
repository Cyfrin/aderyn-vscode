// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "aderyn-vscode" is now active!');
	
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('aderyn-vscode.run', () => {

		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage("Please open a workspace before running this command.");
			return; // Stop the command execution if there's no workspace
		}

		let terminalOptions = {
			name: "Aderyn",
			cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath.toString() ?? "No workspace"
		};
		
		let outputChannel = vscode.window.createTerminal(terminalOptions);

		outputChannel.show();
		outputChannel.sendText("aderyn --output report.json");	
		loadAndHighlightIssues(context);

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}


function loadAndHighlightIssues(context: vscode.ExtensionContext) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const reportPath = path.join(workspaceFolder!, 'report.json');

    fs.readFile(reportPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading report.json:', err);
            return;
        }

        const report = JSON.parse(data);
        highlightIssues(report, context);
    });
}

async function highlightIssues(report: any, context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("aderynIssues");
    context.subscriptions.push(diagnosticCollection);
    diagnosticCollection.clear();

    report.high_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			const issueUri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, instance.contract_path));
			const range = new vscode.Range(new vscode.Position(instance.line_no - 1, 0), new vscode.Position(instance.line_no - 1, Number.MAX_VALUE));
			const hoverOverText = `${issue.title}\n\n${issue.description}`
			const diagnostic = new vscode.Diagnostic(range, hoverOverText, vscode.DiagnosticSeverity.Error);
			diagnostic.source = 'Aderyn';

			const existingDiagnostics = diagnosticCollection.get(issueUri) || [];
			const newDiagnostics = [...existingDiagnostics, diagnostic]; // Create a new array
			diagnosticCollection.set(issueUri, newDiagnostics); // Update the collection
        });
    });
}

