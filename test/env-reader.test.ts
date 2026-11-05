import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { EnvReader, asReadonly } from "../src/index.js";

const touched = new Set<string>();
function setEnv(values: Record<string, string>) {
	for (const [key, value] of Object.entries(values)) {
		touched.add(key);
		process.env[key] = value;
	}
}
afterEach(() => {
	for (const key of touched) delete process.env[key];
	touched.clear();
});

let tmp: string;
let root: string;
beforeAll(() => {
	tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "env-reader-")));
	root = path.join(tmp, "project");
	fs.mkdirSync(path.join(root, "certs"), { recursive: true });
	fs.writeFileSync(path.join(root, "certs", "server.pem"), "");
	fs.mkdirSync(path.join(tmp, "project-evil"));
	fs.mkdirSync(path.join(tmp, "outside"));
	fs.symlinkSync(path.join(tmp, "outside"), path.join(root, "link-out"));
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

const env = () => new EnvReader(root);

describe("scalar values", () => {
	test("string trims by default and honours trim=false", () => {
		setEnv({ S: "  hi  " });
		expect(env().string("S")).toBe("hi");
		expect(env().string("S", undefined, false)).toBe("  hi  ");
	});

	test("missing without default throws, default is returned", () => {
		expect(() => env().string("NOPE")).toThrow("Missing Env variable (string): NOPE");
		expect(env().string("NOPE", "d")).toBe("d");
	});

	test("int and float", () => {
		setEnv({ I: " 42 ", H: "ff", F: "0.5", BAD: "abc" });
		expect(env().int("I")).toBe(42);
		expect(env().int("H", undefined, 16)).toBe(255);
		expect(env().float("F")).toBe(0.5);
		expect(() => env().int("BAD")).toThrow("Env variable type failed: BAD (int)");
		expect(() => env().float("BAD")).toThrow("Env variable type failed: BAD (float)");
	});

	test("int is strict", () => {
		const cases: Record<string, number> = { " -7 ": -7, "+3": 3, "0": 0 };
		for (const [raw, expected] of Object.entries(cases)) {
			setEnv({ V: raw });
			expect(env().int("V")).toBe(expected);
		}
		for (const raw of ["12px", "1.5", "1e3", "", " ", "-", "0x10", "99999999999999999999"]) {
			setEnv({ V: raw });
			expect(() => env().int("V"), raw).toThrow("Env variable type failed: V (int)");
		}
		setEnv({ H: "0xFF", B: "102" });
		expect(env().int("H", undefined, 16)).toBe(255);
		expect(() => env().int("B", undefined, 2)).toThrow("(int)");
		expect(() => env().int("B", undefined, 1)).toThrow("Invalid radix");
	});

	test("float is strict and finite", () => {
		const cases: Record<string, number> = { "1.5": 1.5, "-.5": -0.5, "1e3": 1000, "3.": 3, " 2 ": 2 };
		for (const [raw, expected] of Object.entries(cases)) {
			setEnv({ V: raw });
			expect(env().float("V")).toBe(expected);
		}
		for (const raw of ["12px", "Infinity", "1e999", "NaN", "0x10", "", ".", "1,5"]) {
			setEnv({ V: raw });
			expect(() => env().float("V"), raw).toThrow("Env variable type failed: V (float)");
		}
	});

	test("boolean", () => {
		setEnv({ T: " YES ", N: "0", X: "maybe" });
		expect(env().boolean("T")).toBe(true);
		expect(env().boolean("N")).toBe(false);
		expect(() => env().boolean("X")).toThrow("(boolean)");
	});

	test("oneOf accepts readonly arrays", () => {
		setEnv({ M: " prod ", W: "Prod" });
		const modes = ["dev", "prod"] as const;
		expect(env().oneOf("M", modes)).toBe("prod");
		expect(() => env().oneOf("W", modes)).toThrow("expected one of: dev, prod");
	});

	test("regex rejects empty pattern", () => {
		setEnv({ R: "^a+$", E: "  ", BAD: "(" });
		expect(env().regex("R").test("aaa")).toBe(true);
		expect(() => env().regex("E")).toThrow("empty pattern");
		expect(() => env().regex("BAD")).toThrow("(regex)");
	});

	test("list splits, trims, drops empties and reports zero-based index", () => {
		setEnv({ L: " a, b, ,", N: "1,x" });
		expect(env().list("L", v => v)).toEqual(["a", "b"]);
		expect(() => env().list("N", v => { if (isNaN(Number(v))) throw Error(); return Number(v); }))
			.toThrow("Env variable type failed: N[1] - x");
	});
});

describe("url", () => {
	test("returns URL and validates default without leaking it", () => {
		expect(env().url("NOPE", "https://a.example/x").hostname).toBe("a.example");
		expect(() => env().url("NOPE", "not a url")).toThrow("Env variable default is not a valid url: NOPE");
		expect(() => env().url("NOPE", "secret://")).not.toThrow();
	});

	test("maps components", () => {
		setEnv({ S3: "s3://ak:s%40k@storage.example.com:9000/assets/files/?region=eu#frag" });
		const m = env().url("S3", {
			map: {
				user: "username", pass: "password", host: "host", hostname: "hostname", port: "port",
				origin: "origin", path: "path", hash: "hash", bucket: "path(0)", prefix: ["path(1,end)", ""],
				last: "path(-1)", region: 'query("region")', missing: ["query('x')", "def"],
			},
		});
		expect(m).toEqual({
			user: "ak", pass: "s@k", host: "storage.example.com:9000", hostname: "storage.example.com", port: "9000",
			origin: "s3://storage.example.com:9000", path: "assets/files/", hash: "#frag", bucket: "assets",
			prefix: "files/", last: "files", region: "eu", missing: "def",
		});
	});

	test("required out-of-range selector throws, fallback applies", () => {
		setEnv({ U: "https://h/a" });
		expect(() => env().url("U", { map: { b: "path(1)" } })).toThrow("Env variable URL map failed: U - URL path selector is out of bounds");
		expect(env().url("U", { map: { b: ["path(1)", "x"] } })).toEqual({ b: "x" });
	});

	test("malformed percent-encoding is reported clearly and not swallowed by fallback", () => {
		setEnv({ U: "https://h/%E0%A4%A" });
		expect(() => env().url("U", { map: { a: ["path(0)", "x"] } }))
			.toThrow("Env variable URL map failed: U - Malformed percent-encoding in URL component: path(0)");
	});
});

describe("file / dir", () => {
	test("resolves relative to project root", () => {
		setEnv({ F: "certs/server.pem", D: "certs" });
		expect(env().file("F")).toBe(path.join(root, "certs", "server.pem"));
		expect(env().dir("D")).toBe(path.join(root, "certs"));
	});

	test("trailing slash and relative project roots are normalized", () => {
		setEnv({ D: "." });
		expect(new EnvReader(`${root}/`).dir("D")).toBe(root);
		const cwd = process.cwd();
		try {
			process.chdir(root);
			expect(new EnvReader("./").dir("D")).toBe(root);
		} finally { process.chdir(cwd); }
	});

	test("rejects sibling directories with the same prefix", () => {
		setEnv({ D: "../project-evil" });
		expect(() => env().dir("D")).toThrow("escapes project root");
	});

	test("rejects symlinks pointing outside the project, including missing children", () => {
		setEnv({ D: "link-out", F: "link-out/new.txt" });
		expect(() => env().dir("D")).toThrow("escapes project root");
		expect(() => env().file("F", undefined, false)).toThrow("escapes project root");
	});

	test("stayInProject=false allows outside paths but still resolves against project root", () => {
		setEnv({ D: "../outside" });
		expect(env().dir("D", undefined, true, false)).toBe(path.join(tmp, "outside"));
	});

	test("empty value throws", () => {
		setEnv({ D: "", F: " " });
		expect(() => env().dir("D")).toThrow("empty path");
		expect(() => env().file("F")).toThrow("empty path");
	});

	test("onMissing handling", () => {
		setEnv({ F: "certs" });
		expect(() => env().file("F")).toThrow("is not a file");
		expect(env().file("F", undefined, false)).toBe(path.join(root, "certs"));
		const seen: string[] = [];
		env().dir("NOPE", "var/cache", p => { seen.push(p); });
		expect(seen).toEqual([path.join(root, "var", "cache")]);
		expect(() => env().file("NOPE")).toThrow("Missing Env variable (file): NOPE");
	});
});

test("asReadonly returns the same object", () => {
	const value = { a: { b: 1 } };
	expect(asReadonly(value)).toBe(value);
});
