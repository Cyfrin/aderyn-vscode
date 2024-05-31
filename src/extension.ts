import * as vscode from 'vscode';
import * as path from 'path';
import { spawn, exec, ChildProcess } from 'child_process';

let aderynProcess: ChildProcess | null = null;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "aderyn-vscode" is now active!');

    const aderynStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    aderynStatusBarItem.command = 'aderyn-vscode.run';
    aderynStatusBarItem.text = `$(play) Run Aderyn`;
    aderynStatusBarItem.tooltip = "Run Aderyn Analysis";
    aderynStatusBarItem.show();
    context.subscriptions.push(aderynStatusBarItem);

    const aderynOutputChannel = vscode.window.createOutputChannel("Aderyn Output");
    context.subscriptions.push(aderynOutputChannel);
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("aderynIssues");
    context.subscriptions.push(diagnosticCollection);

    let runCommand = vscode.commands.registerCommand('aderyn-vscode.run', () => {
        if (!aderynProcess) {
            checkAderynVersion(context, aderynOutputChannel, diagnosticCollection);
        } else {
            vscode.window.showInformationMessage('Aderyn is already running.');
        }
    });

    context.subscriptions.push(runCommand);

    // Add a file save watcher to clear diagnostics
    let solidityWatcher = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (document.languageId === 'solidity' && document.fileName.endsWith('.sol')) {
            diagnosticCollection.clear();
        }
    });

    context.subscriptions.push(solidityWatcher);
}

export function deactivate() {
    if (aderynProcess) {
        aderynProcess.kill();
        aderynProcess = null;
    }
}

function checkAderynVersion(context: vscode.ExtensionContext, aderynOutputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection) {
    const minVersion = '0.1.0';
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
                startAderynWatch(context, aderynOutputChannel, diagnosticCollection);
            } else {
                vscode.window.showErrorMessage(
                    `Aderyn version is too old. Found: ${installedVersion}, Required: ${minVersion}. Please update aderyn.`,
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
}

function startAderynWatch(context: vscode.ExtensionContext, aderynOutputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("Please open a workspace before running this command.");
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    let stdoutBuffer = '';

    aderynOutputChannel.appendLine("Starting Aderyn with --watch...");

    aderynProcess = spawn('aderyn', ['--watch', '--stdout', '--skip-cloc', '--skip-update-check'], {
        cwd: workspaceFolder,
        shell: true,
    });

    aderynProcess.stdout?.on('data', (data) => {
        stdoutBuffer += data.toString();
        aderynOutputChannel.append(data.toString());

        const startMarker = stdoutBuffer.indexOf("STDOUT START");
        const endMarker = stdoutBuffer.indexOf("STDOUT END");

        if (startMarker !== -1 && endMarker !== -1 && endMarker > startMarker) {
            const reportJsonString = stdoutBuffer.substring(startMarker + "STDOUT START".length, endMarker).trim();
            try {
                const report = JSON.parse(reportJsonString);
                diagnosticCollection.clear(); // Clear diagnostics before updating with new data
                highlightIssues(report, context, diagnosticCollection);
            } catch (error) {
                vscode.window.showErrorMessage('Error parsing Aderyn output.');
                if (error instanceof Error) {
                    aderynOutputChannel.appendLine(`Error: ${error.message}`);
                } else {
                    aderynOutputChannel.appendLine(`Unknown error: ${JSON.stringify(error)}`);
                }
            }
            stdoutBuffer = stdoutBuffer.slice(endMarker + "STDOUT END".length);
        }
    });

    aderynProcess.stderr?.on('data', (data) => {
        aderynOutputChannel.append(data.toString());
    });

    aderynProcess.on('close', (code) => {
        aderynOutputChannel.appendLine(`Aderyn process exited with code ${code}`);
        if (code !== 0) {
            vscode.window.showErrorMessage(`Aderyn did not finish successfully. Exit code: ${code}`);
        }
        aderynProcess = null;
    });

    context.subscriptions.push({
        dispose: () => {
            if (aderynProcess) {
                aderynProcess.kill();
                aderynProcess = null;
            }
        }
    });
}

function highlightIssues(report: any, context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
    const issueTypes = ['high_issues', 'low_issues'];
    issueTypes.forEach(type => {
        report[type].issues.forEach((issue: any) => {
            issue.instances.forEach((instance: any) => {
                highlightIssueInstance(issue, instance, type.toUpperCase(), type === 'high_issues' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information, diagnosticCollection);
            });
        });
    });
}

function highlightIssueInstance(issue: any, instance: any, severityString: string, diagnosticSeverity: vscode.DiagnosticSeverity, diagnosticCollection: vscode.DiagnosticCollection) {
    const issueUri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, instance.contract_path));
    const srcParts = instance.src.split(':');
    const startOffset = parseInt(srcParts[0], 10);
    const length = parseInt(srcParts[1], 10);

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
