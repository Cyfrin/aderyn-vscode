export interface Issue {
    title: string;
    description: string;
    instances: Instance[];
}

export interface Instance {
    contract_path: string;
    src_char: string;
}

export interface Report {
    high_issues: { issues: Issue[] };
    low_issues: { issues: Issue[] };
}
