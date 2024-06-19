import * as vscode from 'vscode';
import { IssueTypeItem } from './IssueTypeItem';
import { IndividualIssueItem } from './IndividualIssueItem';
import { IssueInstanceItem } from './IssueInstanceItem';

export class AderynTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<IssueTypeItem | undefined | void> = new vscode.EventEmitter<IssueTypeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<IssueTypeItem | undefined | void> = this._onDidChangeTreeData.event;

    private issues: Map<string, IndividualIssueItem[]> = new Map();

    constructor(private context: vscode.ExtensionContext) {}

    refresh(issues: Map<string, IndividualIssueItem[]>): void {
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
        } else if (element instanceof IndividualIssueItem) {
            return Promise.resolve(element.issue.instances.map((instance: any) => {
                return new IssueInstanceItem(
                    `${instance.contract_path}:${instance.line_no}`,
                    vscode.TreeItemCollapsibleState.None,
                    instance,
                    {
                        command: 'vscode.open',
                        title: '',
                        arguments: [vscode.Uri.file(instance.contract_path), { selection: new vscode.Range(new vscode.Position(instance.line_no - 1, 0), new vscode.Position(instance.line_no - 1, 0)) }]
                    }
                );
            }));
        } else {
            return Promise.resolve([]);
        }
    }
}
