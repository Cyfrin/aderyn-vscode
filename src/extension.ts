// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as util from "util";
import * as child_process from 'child_process';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld" is now active!');
	let outputChannel = vscode.window.createOutputChannel("Aderyn");


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {

		outputChannel.show();
		outputChannel.appendLine("Running aderyn...");

		let path = vscode.workspace.workspaceFolders?.[0].uri.fsPath.toString() ?? "No workspace";
		let commandString = "cd " + path + " && pwd && aderyn --output report.json";
		let cmd = util.promisify(child_process.exec);

		cmd(commandString)
		.catch((e: any) => vscode.window.showErrorMessage(e.message))
		.then((result: any) => {
			outputChannel.append(result.stdout);
		});

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
