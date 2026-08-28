import * as fs from "fs";
import * as path from "path";

type OnMissing = boolean | ((path: string) => void);
type UrlMapField = "protocol" | "username" | "password" | "hostname" | "host" | "port" | "origin" | "path" | "hash";
export type UrlMapSelector = UrlMapField | `path(${number})` | `path(${number},${number | "end"})` | `query(\"${string}\")` | `query('${string}')`;
export type UrlMapFallback = readonly [selector: UrlMapSelector, defaultValue: string];
export type UrlMapValue = UrlMapSelector | UrlMapFallback;
export type UrlMap = Record<string, UrlMapValue>;
export type UrlMapResult<T extends UrlMap> = { [K in keyof T]: string };
export interface UrlOptions<T extends UrlMap> {
	defaultValue?: string;
	map: T;
}
export type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] }

function decodeUrlComponent(value: string): string {
	return decodeURIComponent(value);
}

class UrlMapValueMissingError extends Error {}

function urlPathSegments(url: URL): string[] {
	return url.pathname.split("/").filter(Boolean).map(decodeUrlComponent);
}

function resolvePathIndex(index: number, length: number): number {
	return index < 0 ? length + index : index;
}

function selectUrlPath(url: URL, selector: string): string {
	const match = /^path\((-?\d+)(?:,(-?\d+|end))?\)$/.exec(selector);
	if (!match) throw Error(`Invalid URL path selector: ${selector}`);

	const segments = urlPathSegments(url);
	const start = resolvePathIndex(Number(match[1]), segments.length);
	const end = match[2] === undefined ? start : match[2] === "end" ? segments.length - 1 : resolvePathIndex(Number(match[2]), segments.length);

	if (start < 0 || start >= segments.length || end < 0 || end >= segments.length || start > end)
		throw new UrlMapValueMissingError(`URL path selector is out of bounds: ${selector}`);

	const value = segments.slice(start, end + 1).join("/");
	return match[2] !== undefined && end === segments.length - 1 && url.pathname.endsWith("/") ? `${value}/` : value;
}

function selectUrlMapValue(url: URL, selector: UrlMapSelector): string {
	if (/^path\(/.test(selector)) return selectUrlPath(url, selector);
	if (selector === "path") return url.pathname.slice(1).split("/").map(decodeUrlComponent).join("/");

	const queryMatch = /^query\((["'])(.*)\1\)$/.exec(selector);
	if (queryMatch) {
		const value = url.searchParams.get(queryMatch[2]);
		if (value === null) throw new UrlMapValueMissingError(`URL query parameter is missing: ${queryMatch[2]}`);
		return value;
	}

	switch (selector) {
		case "protocol": return url.protocol;
		case "origin": return `${url.protocol}//${url.host}`;
		case "username": return decodeUrlComponent(url.username);
		case "password": return decodeUrlComponent(url.password);
		case "hostname": return url.hostname;
		case "host": return url.host;
		case "port": return url.port;
		case "hash": return url.hash;
		default: throw Error(`Invalid URL map selector: ${selector}`);
	}
}

function isUrlMapFallback(value: UrlMapValue): value is UrlMapFallback {
	return Array.isArray(value);
}

function resolveUrlMapValue(url: URL, value: UrlMapValue): string {
	if (!isUrlMapFallback(value)) return selectUrlMapValue(url, value);
	try { return selectUrlMapValue(url, value[0]); }
	catch (error) {
		if (error instanceof UrlMapValueMissingError) return value[1];
		throw error;
	}
}

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
	 * Get an env var as URL, or map URL components to a typed object.
	 * @param key Env var name.
	 * @param defaultValueOrOptions Fallback URL string, or mapping options.
	 * @returns URL instance, or the mapped URL components.
	 * @throws Error When missing without default or not a valid URL.
	 */
	url(key: string, defaultValue?: string): URL;
	url<T extends UrlMap>(key: string, options: UrlOptions<T>): UrlMapResult<T>;
	url<T extends UrlMap>(key: string, defaultValueOrOptions?: string | UrlOptions<T>): URL | UrlMapResult<T> {
		const options = typeof defaultValueOrOptions === "string" || defaultValueOrOptions === undefined ? undefined : defaultValueOrOptions;
		const defaultValue = typeof defaultValueOrOptions === "string" ? defaultValueOrOptions : options?.defaultValue;
		let envValue = process.env[key];
		let url: URL;
		if (envValue === undefined) {
			if (defaultValue === undefined) throw Error(`Missing Env variable (url): ${key}`);
			try { url = new URL(defaultValue); }
			catch { throw Error(`Env variable default is not a valid url: ${key} - ${defaultValue}`); }
		} else {
			try { url = new URL(envValue.trim()); }
			catch { throw Error(`Env variable type failed: ${key} (url)`); }
		}
		if (!options) return url;

		try {
			return Object.fromEntries(Object.entries(options.map).map(([name, value]) => [name, resolveUrlMapValue(url, value)])) as UrlMapResult<T>;
		} catch (error) {
			if (error instanceof Error) throw Error(`Env variable URL map failed: ${key} - ${error.message}`);
			throw error;
		}
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
