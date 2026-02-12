declare module 'node:fs' {
    export function existsSync(path: string): boolean;
    export function readFileSync(path: string, options: string): string;
}

declare module 'node:path' {
    export function resolve(...args: string[]): string;
    export function dirname(path: string): string;
}

declare module 'node:url' {
    export function fileURLToPath(url: string | URL): string;
}

declare module 'node:process' {
    const process: {
        exit(code?: number): never;
        argv: string[];
    };
    export default process;
}
