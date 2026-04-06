import * as fs from "fs";
import * as path from "path";

type OnMissing = boolean | ((path: string) => void);
export type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] }

export function asReadonly<T>(value: T): DeepReadonly<T> {
	return value as DeepReadonly<T>;
}

export class EnvReader {
	constructor(private readonly projectRoot: string) {}

	/**
	 * Get an env var and validate it against a set of allowed values.
	 * @param key Env var name.
	 * @param values Allowed values.
	 * @param defaultValue Fallback value when missing.
	 * @returns The validated value.
	 * @throws Error When missing without default or value is not in the allowed set.
	 */
	oneOf<T extends string>(key: string, values: T[], defaultValue?: T): T {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) return defaultValue;
			throw Error(`Missing Env variable (oneOf): ${key}`);
		}
		const trimmed = envValue.trim() as T;
		if (!values.includes(trimmed)) throw Error(`Env variable type failed: ${key} (oneOf) - expected one of: ${values.join(", ")}`);
		return trimmed;
	}

	/**
	 * Get an env var as float; uses default when provided.
	 * @param key Env var name.
	 * @param defaultValue Fallback value when missing.
	 * @returns Parsed float value.
	 * @throws Error When missing without default or not a valid float.
	 */
	float(key: string, defaultValue?: number): number {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) return defaultValue;
			throw Error(`Missing Env variable (float): ${key}`);
		}
		let value = parseFloat(envValue.trim());
		if (isNaN(value)) throw Error(`Env variable type failed: ${key} (float)`);
		return value;
	}

	/**
	 * Get an env var as int; uses default when provided.
	 * @param key Env var name.
	 * @param defaultValue Fallback value when missing.
	 * @param radix Number base for parsing (default 10).
	 * @returns Parsed integer value.
	 * @throws Error When missing without default or not a valid integer.
	 */
	int(key: string, defaultValue?: number, radix: number = 10): number {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) return defaultValue;
			throw Error(`Missing Env variable (int): ${key}`);
		}
		let value = parseInt(envValue.trim(), radix);
		if (isNaN(value)) throw Error(`Env variable type failed: ${key} (int)`);
		return value;
	}

	/**
	 * Get an env var as boolean; accepts true/false, yes/no, 1/0 (case-insensitive).
	 * @param key Env var name.
	 * @param defaultValue Fallback value when missing.
	 * @returns Parsed boolean value.
	 * @throws Error When missing without default or value is invalid.
	 */
	boolean(key: string, defaultValue?: boolean): boolean {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) return defaultValue;
			throw Error(`Missing Env variable (boolean): ${key}`);
		}
		if (["1", "yes", "true"].indexOf(envValue.toLowerCase().trim()) != -1) return true;
		if (["0", "no", "false"].indexOf(envValue.toLowerCase().trim()) != -1) return false;
		throw Error(`Env variable type failed: ${key} (boolean) - expected true/false, yes/no, 1/0 value`);
	}

	/**
	 * Get an env var as string; trims by default.
	 * @param key Env var name.
	 * @param defaultValue Fallback value when missing.
	 * @param trim Whether to trim whitespace (default true).
	 * @returns String value.
	 * @throws Error When missing without default.
	 */
	string(key: string, defaultValue?: string, trim: boolean = true): string {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) return defaultValue;
			throw Error(`Missing Env variable (string): ${key}`);
		}
		return trim ? envValue.trim() : envValue;
	}

	/**
	 * Get an env var as URL; uses default when provided.
	 * @param key Env var name.
	 * @param defaultValue Fallback URL string when missing.
	 * @returns URL instance.
	 * @throws Error When missing without default or not a valid URL.
	 */
	url(key: string, defaultValue?: string): URL {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) {
				try { return new URL(defaultValue); }
				catch { throw Error(`Env variable default is not a valid url: ${key} - ${defaultValue}`); }
			}
			throw Error(`Missing Env variable (url): ${key}`);
		}
		try { return new URL(envValue.trim()); }
		catch { throw Error(`Env variable type failed: ${key} (url)`); }
	}

	/**
	 * Get an env var as RegExp; uses default when provided.
	 * @param key Env var name.
	 * @param defaultValue Fallback RegExp when missing.
	 * @returns RegExp instance.
	 * @throws Error When missing without default or not a valid pattern.
	 */
	regex(key: string, defaultValue?: RegExp): RegExp {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) return defaultValue;
			throw Error(`Missing Env variable (regex): ${key}`);
		}
		try { return new RegExp(envValue.trim()); } catch { throw Error(`Env variable type failed: ${key} (regex)`); }
	}

	/**
	 * Get an env var as a parsed list; splits and parses items.
	 * @param key Env var name.
	 * @param parser Item parser function.
	 * @param defaultValue Fallback list when missing.
	 * @param separator Split character (default ",").
	 * @returns Parsed list of items.
	 * @throws Error When missing without default or an item fails to parse.
	 */
	list<T>(key: string, parser: (value: string) => T, defaultValue?: T[], separator: string = ","): T[] {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) return defaultValue;
			throw Error(`Missing Env variable (list): ${key}`);
		}
		return envValue
			.split(separator)
			.map(v => v.trim())
			.filter(v => v.length > 0)
			.map((v, i) => {
				try { return parser(v); } catch { throw Error(`Env variable type failed: ${key}[${i}] - ${v}`); }
			});
	}

	/**
	 * Resolve an env var to a file path; validates existence and optional project-root bounds.
	 * @param key Env var name.
	 * @param defaultValue Fallback path when missing.
	 * @param onMissing true to throw, or handler for missing file.
	 * @param stayInProject Enforce project-root bounds (default true).
	 * @returns Resolved file path.
	 * @throws Error When missing without default, path escapes root, or not a file.
	 */
	file(key: string, defaultValue?: string, onMissing: OnMissing = true, stayInProject: boolean = true): string {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) envValue = defaultValue;
			else throw Error(`Missing Env variable (file): ${key}`);
		}

		const resolved = stayInProject
			? path.resolve(this.projectRoot, envValue.trim())
			: path.resolve(envValue.trim());

		if (stayInProject && !resolved.startsWith(this.projectRoot))
			throw Error(`Env variable path escapes project root: ${key} - ${resolved}`);

		if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
			if (onMissing === true) throw Error(`Env variable path is not a file: ${key} - ${resolved}`);
			if (typeof onMissing === "function") onMissing(resolved);
		}

		return resolved;
	}

	/**
	 * Resolve an env var to a directory path; validates existence and optional project-root bounds.
	 * @param key Env var name.
	 * @param defaultValue Fallback path when missing.
	 * @param onMissing true to throw, or handler for missing directory.
	 * @param stayInProject Enforce project-root bounds (default true).
	 * @returns Resolved directory path.
	 * @throws Error When missing without default, path escapes root, or not a directory.
	 */
	dir(key: string, defaultValue?: string, onMissing: OnMissing = true, stayInProject: boolean = true): string {
		let envValue = process.env[key];
		if (envValue === undefined) {
			if (defaultValue !== undefined) envValue = defaultValue;
			else throw Error(`Missing Env variable (dir): ${key}`);
		}

		const resolved = stayInProject
			? path.resolve(this.projectRoot, envValue.trim())
			: path.resolve(envValue.trim());

		if (stayInProject && !resolved.startsWith(this.projectRoot))
			throw Error(`Env variable path escapes project root: ${key} - ${resolved}`);

		if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
			if (onMissing === true) throw Error(`Env variable path is not a directory: ${key} - ${resolved}`);
			if (typeof onMissing === "function") onMissing(resolved);
		}

		return resolved;
	}
}
