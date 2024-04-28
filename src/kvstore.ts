import fs from 'fs';
import path from 'path';

/**
 * Mapping value: This fields correspond to the input boxes in the sidebar
 * which translates roughly to CLI options when running aderyn.
 */
export interface ProjectOptions {
    scope?: string,
    exclude?: string
}

/**
 * Mapping Key: Absolute path to project on the machine
 */
export type ProjectPath = string; 

/**
 * Maintain a persitent mapping from `ProjectPath` to `ProjectOptions`
 * so that we can auto fill the values in the sidebar if the user has already 
 * made their preferences clear for a given solidity project
 */
export class KVStore {
    private filePath: string;
    private data: { [key: ProjectPath]: ProjectOptions };

    constructor(filename: string) {
        this.filePath = path.join(this.getUserHome(), filename);
        this.data = {};
        this.loadFromFile();
    }

    private loadFromFile(): void {
        try {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            this.data = JSON.parse(data);
        } catch (err) {
            this.saveToFile();
        }
    }

    private saveToFile(): boolean {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
            return true;
        } catch (err) {
            return false;
        }
    }

    public set(key: string, value: ProjectOptions): void {
        this.data[key] = value;
        this.saveToFile();
    }

    public get(key: string): ProjectOptions {
        return this.data[key];
    }

    public delete(key: string): void {
        delete this.data[key];
        this.saveToFile();
    }

    private getUserHome(): string {
        return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] || '';
    }
}
