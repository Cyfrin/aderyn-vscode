import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { highlightIssues } from '../diagnostics/highlightIssues';

export function startAderynWatch(context: vscode.ExtensionContext, aderynOutputChannel: vscode.OutputChannel, diagnosticCollection: vscode.DiagnosticCollection): ChildProcess {
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let stdoutBuffer = '';

    aderynOutputChannel.appendLine("Starting Aderyn with --watch...");

    const aderynProcess = spawn('aderyn', ['--watch', '--stdout', '--skip-cloc', '--skip-update-check'], {
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
                highlightIssues(report, diagnosticCollection);
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
    });

    return aderynProcess;
}
