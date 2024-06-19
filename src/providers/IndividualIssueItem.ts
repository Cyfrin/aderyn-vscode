import * as vscode from 'vscode';

export class IndividualIssueItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly issue: any
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = this.issue.title;
    }
}
