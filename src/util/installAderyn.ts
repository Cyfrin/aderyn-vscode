import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as os from 'os';

export async function installAderyn(aderynOutputChannel: vscode.OutputChannel): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        if (platform === 'win32') {
            // Windows
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
        } else {
            // Unix-based (Linux, macOS)
            exec('curl -L https://raw.githubusercontent.com/Cyfrin/aderyn/feature/cyfrinup/cyfrinup/install | bash', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error downloading installer: ${stderr}`);
                    aderynOutputChannel.appendLine(`Error downloading installer: ${stderr}`);
                    vscode.window.showErrorMessage(`Error downloading installer: ${stderr}`);
                    resolve(false);
                    return;
                }
                console.log(`Installer downloaded: ${stdout}`);
                aderynOutputChannel.appendLine(`Installer downloaded: ${stdout}`);

                const sourcingCommands = `
                    if [ -f ~/.zshrc ]; then source ~/.zshrc; fi
                    if [ -f ~/.bashrc ]; then source ~/.bashrc; fi
                    if [ -f ~/.bash_profile ]; then source ~/.bash_profile; fi
                    if [ -f ~/.profile ]; then source ~/.profile; fi
                    if [ -f ~/.cshrc ]; then source ~/.cshrc; fi
                    if [ -f ~/.tcshrc ]; then source ~/.tcshrc; fi
                    if [ -f ~/.kshrc ]; then source ~/.kshrc; fi
                    cyfrinup
                `;
                exec(sourcingCommands, (error, stdout, stderr) => {
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
        }
    });
}
