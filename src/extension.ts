// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "aderyn-vscode" is now active!');

    // Create an output channel
    const aderynOutputChannel = vscode.window.createOutputChannel("Aderyn Output");
    context.subscriptions.push(aderynOutputChannel);
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("aderynIssues");

    let disposable = vscode.commands.registerCommand('aderyn-vscode.run', () => {
        diagnosticCollection.clear();
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage("Please open a workspace before running this command.");
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

        aderynOutputChannel.show(true); // Brings the output channel into view and reveals it to the user
        aderynOutputChannel.appendLine("Running aderyn... (Compiling contracts first...)");

        // Construct the path to the binary
        const binaryPath = path.join(context.extensionPath, 'bin', 'aderyn');

        // Assuming you're inside the command registration callback
        const command = spawn(binaryPath, ['--output', 'report.json'], {
            cwd: workspaceFolder,
            shell: true,
            env: { ...process.env, ADERYN_CLOC_SKIP: '1' },
        });

        command.stdout.on('data', (data) => {
            aderynOutputChannel.append(data.toString());
        });

        command.stderr.on('data', (data) => {
            aderynOutputChannel.append(data.toString());
        });

        command.on('close', (code) => {
            aderynOutputChannel.appendLine(`Aderyn process exited with code ${code}`);
            if (code === 0) {
                loadAndHighlightIssues(context, diagnosticCollection);
            } else {
                vscode.window.showErrorMessage("Aderyn did not finish successfully.");
            }
        });
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}


function loadAndHighlightIssues(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const reportPath = path.join(workspaceFolder!, 'report.json');

    fs.readFile(reportPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading report.json:', err);
            return;
        }

        const report = JSON.parse(data);
        highlightIssues(report, context, diagnosticCollection);
    });
}

function highlightIssues(report: any, context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
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

