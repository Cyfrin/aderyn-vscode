import * as vscode from 'vscode';
import { checkAderynVersion } from '../util/checkAderynVersion';
import { ChildProcess } from 'child_process';
import { startAderynWatch } from '../util/startAderynWatch';
import { AderynTreeDataProvider } from '../providers/AderynTreeDataProvider';
import { IndividualIssueItem } from '../providers/IndividualIssueItem';

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
      vscode.window.showInformationMessage('Setting Aderyn up. Please wait...');
      const versionCheckPassed = await checkAderynVersion(aderynOutputChannel);
      if (versionCheckPassed) {
        vscode.window.showInformationMessage('Aderyn Starting...');
        let isRunningHasBeenDisplayed = false;
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

              // Process the real issues from the report
              const issues = new Map<string, IndividualIssueItem[]>();
              issues.set('High Issues', []);
              issues.set('Low Issues', []);

              for (const issueType of ['high_issues', 'low_issues']) {
                for (const issue of report[issueType].issues) {
                  const individualIssueItem = new IndividualIssueItem(
                    issue.title,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    issue
                  );
                  if (issueType === 'high_issues') {
                    issues.get('High Issues')?.push(individualIssueItem);
                  } else {
                    issues.get('Low Issues')?.push(individualIssueItem);
                  }
                }
              }
              
              aderynTreeDataProvider.refresh(issues);
              if (!isRunningHasBeenDisplayed) {
                vscode.window.showInformationMessage('Aderyn is running!');
                isRunningHasBeenDisplayed = true;
              }
            } catch (error) {
              aderynOutputChannel.appendLine(`Error parsing Aderyn output: ${error}`);
            }
            stdoutBuffer = stdoutBuffer.slice(endMarker + "STDOUT END".length);
          }
        });

        aderynProcess.stderr?.on('data', (data) => {
          console.error(`stderr: ${data}`);
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
      aderynTreeDataProvider.refresh(new Map());
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
