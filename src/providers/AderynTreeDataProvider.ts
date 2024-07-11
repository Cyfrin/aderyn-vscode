import * as vscode from 'vscode';
import * as path from 'path';
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
            return Promise.resolve(element.issue.instances.map(async(instance: any) => {
                const filePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, instance.contract_path);
                console.log(`Navigating to file: ${filePath} at line ${instance.line_no}`);
                console.log(`${path.basename(instance.contract_path)}:${instance.line_no}`);
                const srcParts = instance.src_char.split(':');
                const startOffset = parseInt(srcParts[0], 10);
                const length = parseInt(srcParts[1], 10);
                const document = await vscode.workspace.openTextDocument(filePath);
                const startPosition = document.positionAt(startOffset);
                const endPosition = document.positionAt(startOffset + length);
                return new IssueInstanceItem(
                    `${path.basename(instance.contract_path)}:${instance.line_no}`,
                    vscode.TreeItemCollapsibleState.None,
                    instance,
                    {
                        command: 'vscode.open',
                        title: '',
                        arguments: [
                            vscode.Uri.file(filePath), 
                            {
                                selection: new vscode.Range(startPosition, endPosition)
                            }
                        ]
                    }
                );
            }));
        } else {
            return Promise.resolve([]);
        }
    }
}
