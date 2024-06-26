import * as vscode from 'vscode';
import { exec } from 'child_process';

export async function installAderynWindows(aderynOutputChannel: vscode.OutputChannel): Promise<boolean> {
    return new Promise((resolve, reject) => {
        exec('powershell -Command "Invoke-WebRequest -Uri https://raw.githubusercontent.com/Cyfrin/aderyn/feature/cyfrinup/cyfrinup/install -OutFile install.ps1; ./install.ps1"', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error downloading installer: ${stderr}`);
                aderynOutputChannel.appendLine(`Error downloading installer: ${stderr}`);
                vscode.window.showErrorMessage(`Error downloading installer: ${stderr}`);
                resolve(false);
                return;
            }
            console.log(`Installer downloaded: ${stdout}`);
            aderynOutputChannel.appendLine(`Installer downloaded: ${stdout}`);

            exec('powershell -Command "cyfrinup"', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error running cyfrinup: ${stderr}`);
                    aderynOutputChannel.appendLine(`Error running cyfrinup: ${stderr}`);
                    vscode.window.showErrorMessage(`Error running cyfrinup: ${stderr}`);
                    resolve(false);
                    return;
                }
                console.log(`Aderyn installed: ${stdout}`);
                aderynOutputChannel.appendLine(`Aderyn installed: ${stdout}`);

                exec('aderyn --version', (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error verifying aderyn installation: ${stderr}`);
                        aderynOutputChannel.appendLine(`Error verifying aderyn installation: ${stderr}`);
                        vscode.window.showErrorMessage(`Error verifying aderyn installation: ${stderr}`);
                        resolve(false);
                        return;
                    }
                    console.log(`Aderyn version: ${stdout}`);
                    aderynOutputChannel.appendLine(`Aderyn version: ${stdout}`);
                    resolve(true);
                });
            });
        });
    });
}
