import * as vscode from 'vscode';

interface Issue {
    file: string;
    line: number;
    severity: string;
    message: string;
}

class IssueItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly issue: Issue | undefined,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}

export class AderynTreeDataProvider implements vscode.TreeDataProvider<IssueItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined> = new vscode.EventEmitter<IssueItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined> = this._onDidChangeTreeData.event;

    private issues: Issue[] = [];

    constructor(private context: vscode.ExtensionContext, private aderynOutputChannel: vscode.OutputChannel) {
        aderynOutputChannel.appendLine("AderynTreeDataProvider initialized.");
    }

    refresh(issues: Issue[]): void {
        this.issues = issues;
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: IssueItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: IssueItem): Thenable<IssueItem[]> {
        if (!element) {
            const issueItems = this.issues.map(issue => {
                return new IssueItem(
                    `${issue.file}:${issue.line} - ${issue.message}`,
                    vscode.TreeItemCollapsibleState.None,
                    issue,
                    {
                        command: 'vscode.open',
                        title: '',
                        arguments: [vscode.Uri.file(issue.file), { selection: new vscode.Range(new vscode.Position(issue.line - 1, 0), new vscode.Position(issue.line - 1, 0)) }]
                    }
                );
            });
            return Promise.resolve(issueItems);
        } else {
            return Promise.resolve([]);
        }
    }
}
