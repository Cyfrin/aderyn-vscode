import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { highlightIssues } from '../diagnostics/highlightIssues';
import { AderynTreeDataProvider } from '../providers/AderynTreeDataProvider';

export function startAderynWatch(
    context: vscode.ExtensionContext,
    aderynOutputChannel: vscode.OutputChannel,
    diagnosticCollection: vscode.DiagnosticCollection,
    treeDataProvider: AderynTreeDataProvider,
    src: string,
    includes: string,
    excludes: string
): ChildProcess {
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let stdoutBuffer = '';

    aderynOutputChannel.appendLine("Starting Aderyn with --watch...");

    let args = ['--watch', '--stdout', '--skip-cloc', '--skip-update-check'];
    if (src) {
        args.push('--src', src);
    }
    if (includes) {
        args.push('-i', includes);
    }
    if (excludes) {
        args.push('-x', excludes);
    }
    const aderynProcess = spawn('aderyn', args, {
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
                highlightIssues(report, diagnosticCollection, treeDataProvider);
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
    });

    return aderynProcess;
}
