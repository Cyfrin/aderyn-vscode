import * as vscode from 'vscode';
import { installAderynUnix } from './installAderynUnix';
import { installAderynWindows } from './installAderynWindows';
import * as os from 'os';

export async function installAderyn(aderynOutputChannel: vscode.OutputChannel): Promise<boolean> {
    const platform = os.platform();

    if (platform === 'win32') {
        return installAderynWindows(aderynOutputChannel);
    } else {
        return installAderynUnix(aderynOutputChannel);
    }
}
