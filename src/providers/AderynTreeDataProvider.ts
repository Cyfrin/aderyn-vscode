import * as vscode from 'vscode';
import { IssueItem } from './IssueItem';
import { IssueTypeItem } from './IssueTypeItem';

export class AderynTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueTypeItem | undefined | void> = new vscode.EventEmitter<IssueTypeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<IssueTypeItem | undefined | void> = this._onDidChangeTreeData.event;

    private issues: Map<string, IssueItem[]> = new Map();

    constructor(private context: vscode.ExtensionContext) {}

    refresh(issues: Map<string, IssueItem[]>): void {
        this.issues = issues;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            const issueTypes = Array.from(this.issues.keys()).map(type => {
                return new IssueTypeItem(
                    type,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    type
                );
            });
            return Promise.resolve(issueTypes);
        } else if (element instanceof IssueTypeItem) {
            return Promise.resolve(this.issues.get(element.issueType) || []);
        } else {
            return Promise.resolve([]);
        }
    }
}
