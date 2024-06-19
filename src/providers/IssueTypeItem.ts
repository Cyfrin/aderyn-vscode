import * as vscode from 'vscode';

export class IssueTypeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly issueType: string,
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = this.issueType;
    }
}
