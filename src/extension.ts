// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';


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

		// TODO: require a version of aderyn
		// TODO: Wayyyyyy more visible output of what's happening

		const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const command = 'aderyn --output report.json';

		console.log('Running aderyn...');
        exec(command, { cwd: workspaceFolder }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);

            // Check for specific output indicating command completion
            if (stdout.includes("Report printed to report.json")) {
                loadAndHighlightIssues(context);
            } else {
                vscode.window.showErrorMessage("Aderyn did not finish successfully.");
            }
        });

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

function highlightIssues(report: any, context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("aderynIssues");
    context.subscriptions.push(diagnosticCollection);
    diagnosticCollection.clear();

	report.critical_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "CRITICAL", vscode.DiagnosticSeverity.Error, diagnosticCollection);
        });
    });

    report.high_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "HIGH", vscode.DiagnosticSeverity.Error, diagnosticCollection);
        });
    });

	report.medium_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "MEDIUM", vscode.DiagnosticSeverity.Warning, diagnosticCollection);
        });
    });

	report.low_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "LOW", vscode.DiagnosticSeverity.Information, diagnosticCollection);
        });
    });

	report.nc_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "NC", vscode.DiagnosticSeverity.Hint, diagnosticCollection);
        });
    });
}

function highlightIssueInstance(issue: any, instance: any, severityString: string, diagnosticSeverity: vscode.DiagnosticSeverity, diagnosticCollection: vscode.DiagnosticCollection) {
	const issueUri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, instance.contract_path));
	const range = new vscode.Range(new vscode.Position(instance.line_no - 1, 0), new vscode.Position(instance.line_no - 1, Number.MAX_VALUE));
	const hoverOverText = `${severityString}: ${issue.title}\n${issue.description}`
	const diagnostic = new vscode.Diagnostic(range, hoverOverText, diagnosticSeverity);
	diagnostic.source = 'Aderyn';

	const existingDiagnostics = diagnosticCollection.get(issueUri) || [];
	const newDiagnostics = [...existingDiagnostics, diagnostic]; // Create a new array
	diagnosticCollection.set(issueUri, newDiagnostics); // Update the collection
}

