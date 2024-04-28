// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { spawn, exec } from 'child_process';



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "aderyn-vscode" is now active!');

    const item = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right
    );

    // Create an output channel
    const aderynOutputChannel = vscode.window.createOutputChannel("Aderyn Output");
    context.subscriptions.push(aderynOutputChannel);
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("aderynIssues");
    context.subscriptions.push(diagnosticCollection);

    let runCommand = vscode.commands.registerCommand('aderyn-vscode.run', () => {
        const minVersion = '0.0.18';
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
                    runAderyn(context, aderynOutputChannel, diagnosticCollection);
                } else {
                    vscode.window.showErrorMessage(
                        `Aderyn version is too old. \
                        Found: ${installedVersion}, \
                        Required: ${minVersion}. \ 
                        Please update aderyn.`,
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
    });

    let solidityWatcher = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (document.languageId === 'solidity' && document.fileName.endsWith('.sol')) {
            diagnosticCollection.delete(document.uri);
            runAderyn(context, aderynOutputChannel, diagnosticCollection, document.uri);
        }
    })

    context.subscriptions.push(runCommand);
    context.subscriptions.push(solidityWatcher);

    item.text = "$(beaker) Aderyn Start";
    item.command = "aderyn-vscode.run";
    item.show();
}

// This method is called when your extension is deactivated
export function deactivate() {}

function runAderyn( context: vscode.ExtensionContext, aderynOutputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection, documentUri?: vscode.Uri) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("Please open a workspace before running this command.");
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    let stdoutBuffer = '';

    aderynOutputChannel.show(true); // Brings the output channel into view and reveals it to the user
    aderynOutputChannel.appendLine("Running aderyn...");

    // Assuming you're inside the command registration callback
    const command = spawn('aderyn', ['--stdout', '-o report.json'], {
        cwd: workspaceFolder,
        shell: true,
        env: { ...process.env, ADERYN_CLOC_SKIP: '1' },
    });

    command.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        aderynOutputChannel.append(data.toString());
    });

    command.stderr.on('data', (data) => {
        aderynOutputChannel.append(data.toString());
    });

    command.on('close', (code) => {
        aderynOutputChannel.appendLine(`Aderyn process exited with code ${code}`);
        if (code === 0) {
            const report = parseStdoutBuffer(stdoutBuffer);
            highlightIssues(report, context, diagnosticCollection, documentUri);
        } else {
            vscode.window.showErrorMessage("Aderyn did not finish successfully.");
        }
    });
}

function parseStdoutBuffer(stdoutBuffer: string): any {
    try {
        const reportJsonString = stdoutBuffer.split("STDOUT START")[1].split("STDOUT END")[0];
        return JSON.parse(reportJsonString.trim());
    } catch (err) {
        console.error('Error parsing JSON from stdout:', err);
        return {};
    }
}

function highlightIssues(report: any, context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection, documentUri?: vscode.Uri) {

	report.critical_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "CRITICAL", vscode.DiagnosticSeverity.Error, diagnosticCollection, documentUri);
        });
    });

    report.high_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "HIGH", vscode.DiagnosticSeverity.Error, diagnosticCollection, documentUri);
        });
    });

	report.medium_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "MEDIUM", vscode.DiagnosticSeverity.Warning, diagnosticCollection, documentUri);
        });
    });

	report.low_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "LOW", vscode.DiagnosticSeverity.Information, diagnosticCollection, documentUri);
        });
    });

	report.nc_issues.issues.forEach((issue: any) => {
        issue.instances.forEach((instance: any) => {
			highlightIssueInstance(issue, instance, "NC", vscode.DiagnosticSeverity.Information, diagnosticCollection, documentUri);
        });
    });
}

function highlightIssueInstance(issue: any, instance: any, severityString: string, diagnosticSeverity: vscode.DiagnosticSeverity, diagnosticCollection: vscode.DiagnosticCollection, documentUri?: vscode.Uri) {
    const issueUri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, instance.contract_path));
    if (documentUri && documentUri.fsPath !== issueUri.fsPath) {
        return;
    }
    const srcParts = instance.src.split(':');
    const startOffset = parseInt(srcParts[0], 10);
    const length = parseInt(srcParts[1], 10);

    // Use a document to convert the offset into a position
    vscode.workspace.openTextDocument(issueUri).then(document => {
        const startPosition = document.positionAt(startOffset);
        const endPosition = document.positionAt(startOffset + length);
        const range = new vscode.Range(startPosition, endPosition);
        const hoverOverText = `${severityString}: ${issue.title}\n${issue.description}`
        const diagnostic = new vscode.Diagnostic(range, hoverOverText, diagnosticSeverity);
        diagnostic.source = 'Aderyn';

        const existingDiagnostics = diagnosticCollection.get(issueUri) || [];
        const newDiagnostics = [...existingDiagnostics, diagnostic];
        diagnosticCollection.set(issueUri, newDiagnostics);
    });
}