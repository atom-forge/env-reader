// Compile-time checks for DeepReadonly; verified by `tsc -p tsconfig.test.json`.
import { asReadonly } from "../src/index.js";

const config = asReadonly({
	parse: (value: string) => Number(value),
	url: new URL("https://example.com"),
	pattern: /a/,
	list: [1, 2],
	tuple: [1, "a"] as [number, string],
	nested: { host: "localhost" },
});

const parsed: number = config.parse("1");
const host: string = config.url.hostname;
const matches: boolean = config.pattern.test("a");
const first: number = config.tuple[0];
void [parsed, host, matches, first];

// @ts-expect-error nested properties are readonly
config.nested.host = "other";
// @ts-expect-error arrays are readonly
config.list.push(3);
