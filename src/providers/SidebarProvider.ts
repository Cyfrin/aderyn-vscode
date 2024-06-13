import * as vscode from "vscode";
import { getNonce } from "../util/getNonce";
import { registerRunAderynCommand } from "../commands/runAderyn";
import { startAderynWatch } from "../util/startAderynWatch";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _outputChannel: vscode.OutputChannel,
    private readonly _diagnosticCollection: vscode.DiagnosticCollection
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri,
        vscode.Uri.joinPath(this._extensionUri, 'src', 'scripts')
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      this._outputChannel.appendLine(`Received message: ${JSON.stringify(data)}`);
      this._outputChannel.show(true);

      switch (data.type) {
        case "onInfo": {
          if (!data.value) return;
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) return;
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "watch": {
          vscode.window.showInformationMessage("Aderyn is now watching your codebase ...");
          const src = data.value.src;
          const includes = data.value.includes;
          const excludes = data.value.excludes;
          this._outputChannel.appendLine(`SRC: ${src} Includes: ${includes}, Excludes: ${excludes}`);
          this._outputChannel.show(true);
          startAderynWatch(this._context, this._outputChannel, this._diagnosticCollection, src, includes, excludes);
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "scripts", "main.js")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
      -->
      <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
        webview.cspSource
      }; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleResetUri}" rel="stylesheet">
      <link href="${styleVSCodeUri}" rel="stylesheet">
      <link href="${styleMainUri}" rel="stylesheet">
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </head>
    <body>
      <label for="src">SRC Path</label>
      <input name="src" id="src" type="text" />
      <label for="path-includes">Path Includes</label>
      <input name="path-includes" id="path-includes" type="text" />
      <label for="path-excludes">Path Exclude</label>
      <input name="path-excludes" id="path-excludes" type="text" />
      <button id="watchBtn"> Aderyn Watch </button>
    </body>
    </html>`;
  }
}
