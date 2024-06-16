import * as vscode from 'vscode';
import * as path from 'path';
import { Report } from '../types';
import { AderynTreeDataProvider } from '../providers/AderynTreeDataProvider';

export function highlightIssues(report: Report, diagnosticCollection: vscode.DiagnosticCollection, treeDataProvider: AderynTreeDataProvider) {
    const issues: { file: string; line: number; severity: string; message: string; }[] = [];

    const issueTypes = ['high_issues', 'low_issues'];
    issueTypes.forEach(type => {
        (report as any)[type].issues.forEach((issue: any) => {
            issue.instances.forEach((instance: any) => {
                highlightIssueInstance(issue, instance, type.toUpperCase(), type === 'high_issues' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information, diagnosticCollection);
                issues.push({
                    file: path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, instance.contract_path),
                    line: instance.line_no,
                    severity: type.toUpperCase(),
                    message: `${issue.title}: ${issue.description}`
                });
            });
        });
    });
    treeDataProvider.refresh(issues);
}

function highlightIssueInstance(issue: any, instance: any, severityString: string, diagnosticSeverity: vscode.DiagnosticSeverity, diagnosticCollection: vscode.DiagnosticCollection) {
    const issueUri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, instance.contract_path));
    const srcParts = instance.src.split(':');
    const startOffset = parseInt(srcParts[0], 10);
    const length = parseInt(srcParts[1], 10);

    vscode.workspace.openTextDocument(issueUri).then(document => {
        const startPosition = document.positionAt(startOffset);
        const endPosition = document.positionAt(startOffset + length);
        const range = new vscode.Range(startPosition, endPosition);
        const hoverOverText = `${severityString}: ${issue.title}\n${issue.description}`
        const diagnostic = new vscode.Diagnostic(range, hoverOverText, diagnosticSeverity);
        diagnostic.source = 'Aderyn';

        const existingDiagnostics = diagnosticCollection.get(issueUri) || [];
        const newDiagnostics = [...existingDiagnostics, diagnostic];
        diagnosticCollection.set(issueUri, newDiagnostics);
    });
}
