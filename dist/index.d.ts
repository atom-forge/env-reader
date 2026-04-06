type OnMissing = boolean | ((path: string) => void);
export type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
export declare function asReadonly<T>(value: T): DeepReadonly<T>;
export declare class EnvReader {
    private readonly projectRoot;
    constructor(projectRoot: string);
    /**
     * Get an env var and validate it against a set of allowed values.
     * @param key Env var name.
     * @param values Allowed values.
     * @param defaultValue Fallback value when missing.
     * @returns The validated value.
     * @throws Error When missing without default or value is not in the allowed set.
     */
    oneOf<T extends string>(key: string, values: T[], defaultValue?: T): T;
    /**
     * Get an env var as float; uses default when provided.
     * @param key Env var name.
     * @param defaultValue Fallback value when missing.
     * @returns Parsed float value.
     * @throws Error When missing without default or not a valid float.
     */
    float(key: string, defaultValue?: number): number;
    /**
     * Get an env var as int; uses default when provided.
     * @param key Env var name.
     * @param defaultValue Fallback value when missing.
     * @param radix Number base for parsing (default 10).
     * @returns Parsed integer value.
     * @throws Error When missing without default or not a valid integer.
     */
    int(key: string, defaultValue?: number, radix?: number): number;
    /**
     * Get an env var as boolean; accepts true/false, yes/no, 1/0 (case-insensitive).
     * @param key Env var name.
     * @param defaultValue Fallback value when missing.
     * @returns Parsed boolean value.
     * @throws Error When missing without default or value is invalid.
     */
    boolean(key: string, defaultValue?: boolean): boolean;
    /**
     * Get an env var as string; trims by default.
     * @param key Env var name.
     * @param defaultValue Fallback value when missing.
     * @param trim Whether to trim whitespace (default true).
     * @returns String value.
     * @throws Error When missing without default.
     */
    string(key: string, defaultValue?: string, trim?: boolean): string;
    /**
     * Get an env var as URL; uses default when provided.
     * @param key Env var name.
     * @param defaultValue Fallback URL string when missing.
     * @returns URL instance.
     * @throws Error When missing without default or not a valid URL.
     */
    url(key: string, defaultValue?: string): URL;
    /**
     * Get an env var as RegExp; uses default when provided.
     * @param key Env var name.
     * @param defaultValue Fallback RegExp when missing.
     * @returns RegExp instance.
     * @throws Error When missing without default or not a valid pattern.
     */
    regex(key: string, defaultValue?: RegExp): RegExp;
    /**
     * Get an env var as a parsed list; splits and parses items.
     * @param key Env var name.
     * @param parser Item parser function.
     * @param defaultValue Fallback list when missing.
     * @param separator Split character (default ",").
     * @returns Parsed list of items.
     * @throws Error When missing without default or an item fails to parse.
     */
    list<T>(key: string, parser: (value: string) => T, defaultValue?: T[], separator?: string): T[];
    /**
     * Resolve an env var to a file path; validates existence and optional project-root bounds.
     * @param key Env var name.
     * @param defaultValue Fallback path when missing.
     * @param onMissing true to throw, or handler for missing file.
     * @param stayInProject Enforce project-root bounds (default true).
     * @returns Resolved file path.
     * @throws Error When missing without default, path escapes root, or not a file.
     */
    file(key: string, defaultValue?: string, onMissing?: OnMissing, stayInProject?: boolean): string;
    /**
     * Resolve an env var to a directory path; validates existence and optional project-root bounds.
     * @param key Env var name.
     * @param defaultValue Fallback path when missing.
     * @param onMissing true to throw, or handler for missing directory.
     * @param stayInProject Enforce project-root bounds (default true).
     * @returns Resolved directory path.
     * @throws Error When missing without default, path escapes root, or not a directory.
     */
    dir(key: string, defaultValue?: string, onMissing?: OnMissing, stayInProject?: boolean): string;
}
export {};
