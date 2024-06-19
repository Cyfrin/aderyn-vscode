import * as vscode from 'vscode';
import { checkAderynVersion } from '../util/checkAderynVersion';
import { ChildProcess } from 'child_process';
import { startAderynWatch } from '../util/startAderynWatch';
import { AderynTreeDataProvider } from '../providers/AderynTreeDataProvider';
import { IssueItem } from '../providers/IssueItem';

export function registerRunAderynCommand(
  context: vscode.ExtensionContext,
  aderynOutputChannel: vscode.OutputChannel,
  diagnosticCollection: vscode.DiagnosticCollection,
  statusBarItem: vscode.StatusBarItem,
  aderynTreeDataProvider: AderynTreeDataProvider
) {
  let aderynProcess: ChildProcess | null = null;

  const runCommand = vscode.commands.registerCommand('aderyn-vscode.run', async () => {
    if (!aderynProcess) {
      const versionCheckPassed = await checkAderynVersion();
      if (versionCheckPassed) {
        aderynProcess = startAderynWatch(context, aderynOutputChannel, diagnosticCollection, '', '', '');
        statusBarItem.text = `$(primitive-square) Stop Aderyn`;
        statusBarItem.command = 'aderyn-vscode.stop';

        let stdoutBuffer = '';
        aderynProcess.stdout?.on('data', (data) => {
          stdoutBuffer += data.toString();
          const startMarker = stdoutBuffer.indexOf("STDOUT START");
          const endMarker = stdoutBuffer.indexOf("STDOUT END");

          if (startMarker !== -1 && endMarker !== -1 && endMarker > startMarker) {
            const reportJsonString = stdoutBuffer.substring(startMarker + "STDOUT START".length, endMarker).trim();
            try {
              const report = JSON.parse(reportJsonString);
              const testIssueItem = new IssueItem(
                'Test Issue',
                vscode.TreeItemCollapsibleState.None,
                "nope"
              );
              aderynTreeDataProvider.refresh([testIssueItem]);
            } catch (error) {
              aderynOutputChannel.appendLine(`Error parsing Aderyn output: ${error}`);
            }
            stdoutBuffer = stdoutBuffer.slice(endMarker + "STDOUT END".length);
          }
        });

        aderynProcess.stderr?.on('data', (data) => {
          aderynOutputChannel.appendLine(`stderr: ${data}`);
        });

        aderynProcess.on('close', (code) => {
          aderynOutputChannel.appendLine(`Aderyn process exited with code ${code}`);
          aderynProcess = null;
          statusBarItem.text = `$(play) Run Aderyn`;
          statusBarItem.command = 'aderyn-vscode.run';
        });
      }
    } else {
      vscode.window.showInformationMessage('Aderyn is already running.');
    }
  });

  const stopCommand = vscode.commands.registerCommand('aderyn-vscode.stop', () => {
    if (aderynProcess) {
      aderynProcess.kill('SIGINT'); // Send SIGINT to simulate ctrl+c
      aderynOutputChannel.appendLine('Aderyn process stopped.');
      aderynProcess = null;
      diagnosticCollection.clear();
      aderynTreeDataProvider.refresh([]);
      statusBarItem.text = `$(play) Run Aderyn`;
      statusBarItem.command = 'aderyn-vscode.run';
    } else {
      vscode.window.showInformationMessage('Aderyn is not running.');
    }
  });

  context.subscriptions.push(runCommand);
  context.subscriptions.push(stopCommand);

  context.subscriptions.push({
      dispose: () => {
          if (aderynProcess) {
              aderynProcess.kill();
              aderynProcess = null;
          }
      }
  });
}
