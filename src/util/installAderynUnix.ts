import * as vscode from 'vscode';
import { exec } from 'child_process';

export async function installAderynUnix(aderynOutputChannel: vscode.OutputChannel): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // Step 1: Download the installer
        exec('curl -L https://raw.githubusercontent.com/Cyfrin/aderyn/master/cyfrinup/install | bash', (error, stdout, stderr) => {
            if (error) {
                aderynOutputChannel.appendLine(`Error downloading installer: ${stderr}`);
                console.error(`Error downloading installer: ${stderr}`);
                resolve(false);
                return;
            }
            aderynOutputChannel.appendLine(`Installer downloaded: ${stdout}`);
            console.log(`Installer downloaded: ${stdout}`);

            // Step 2: Run `cyfrinup` in appropriate shell context
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
                    aderynOutputChannel.appendLine(`Error running cyfrinup: ${stderr}`);
                    console.error(`Error running cyfrinup: ${stderr}`);
                    resolve(false);
                    return;
                }
                aderynOutputChannel.appendLine(`Aderyn installed: ${stdout}`);
                console.log(`Aderyn installed: ${stdout}`);

                // Verify installation
                exec('aderyn --version', (error, stdout, stderr) => {
                    if (error) {
                        aderynOutputChannel.appendLine(`Error verifying aderyn installation: ${stderr}`);
                        console.error(`Error verifying aderyn installation: ${stderr}`);
                        resolve(false);
                        return;
                    }
                    aderynOutputChannel.appendLine(`Aderyn version: ${stdout}`);
                    console.log(`Aderyn version: ${stdout}`);
                    resolve(true);
                });
            });
        });
    });
}
