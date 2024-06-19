import * as vscode from 'vscode';
import { IssueItem } from './IssueItem';

export class AderynTreeDataProvider implements vscode.TreeDataProvider<IssueItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | void> = new vscode.EventEmitter<IssueItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | void> = this._onDidChangeTreeData.event;

    private issues: IssueItem[] = [];

    constructor(private context: vscode.ExtensionContext) {}

    refresh(issues: IssueItem[]): void {
        this.issues = issues;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: IssueItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: IssueItem): Thenable<IssueItem[]> {
        if (!element) {
            return Promise.resolve(this.issues);
        } else {
            return Promise.resolve([]);
        }
    }
}
