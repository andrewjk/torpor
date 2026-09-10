import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import CookieHelper from "../src/server/CookieHelper";
import SessionHelper from "../src/server/SessionHelper";

const globalRef = globalThis as { adapter?: { env?: unknown } };
const SECRET = "test-secret-0123456789abcdef";

beforeEach(() => {
	globalRef.adapter = { env: { TORPOR_SESSION_SECRET: SECRET } };
});

afterEach(() => {
	delete globalRef.adapter;
});

function makeSession(cookie: string | undefined): {
	session: SessionHelper;
	cookies: CookieHelper;
} {
	const headers = new Headers();
	if (cookie) headers.set("Cookie", cookie);
	const cookies = new CookieHelper(new Request("http://localhost/", { headers }));
	return { session: new SessionHelper(cookies), cookies };
}

/** The value of the torpor-session cookie from the serialized set-cookie header */
function writtenCookie(cookies: CookieHelper): string {
	const header = [...cookies.cookies.values()].find((c) => c.startsWith("torpor-session="));
	expect(header).toBeTruthy();
	return header!.split(";")[0].slice("torpor-session=".length);
}

describe("SessionHelper", () => {
	test("get returns undefined when there is no cookie", async () => {
		const { session } = makeSession(undefined);
		expect(await session.get()).toBeUndefined();
		expect(session.id).toBeUndefined();
	});

	test("set writes a signed cookie and get reads it back", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 5, name: "Andrew" });

		// A fresh helper, as on the next request
		const next = makeSession(`torpor-session=${writtenCookie(cookies)}`).session;
		expect(await next.get()).toEqual({ userId: 5, name: "Andrew" });
		expect(next.id).toBe(session.id);
		expect(session.id).toMatch(/^[0-9a-f-]{36}$/);
	});

	test("set-cookie attributes are secure by default", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 1 });
		const header = [...cookies.cookies.values()].find((c) => c.startsWith("torpor-session="))!;
		expect(header).toContain("Max-Age=2592000");
		expect(header).toContain("Path=/");
		expect(header).toContain("HttpOnly");
		expect(header).toContain("Secure");
		expect(header).toContain("SameSite=Lax");
	});

	test("get returns undefined for a tampered payload", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 5 });
		const value = writtenCookie(cookies);
		const [encoded, sig] = value.split(".");
		// Change a character inside the encoded payload
		const flipped = (encoded[0] === "A" ? "B" : "A") + encoded.slice(1);
		const next = makeSession(`torpor-session=${flipped}.${sig}`).session;
		expect(await next.get()).toBeUndefined();
	});

	test("get returns undefined for a tampered signature", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 5 });
		const value = writtenCookie(cookies);
		const [encoded, sig] = value.split(".");
		const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
		const next = makeSession(`torpor-session=${encoded}.${flipped}`).session;
		expect(await next.get()).toBeUndefined();
	});

	test("get returns undefined for an expired session", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 5 }, { maxAge: -1 });
		const next = makeSession(`torpor-session=${writtenCookie(cookies)}`).session;
		expect(await next.get()).toBeUndefined();
		expect(next.id).toBeUndefined();
	});

	test("get returns undefined when the secret has changed", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 5 });

		globalRef.adapter = { env: { TORPOR_SESSION_SECRET: "a-different-secret" } };
		const next = makeSession(`torpor-session=${writtenCookie(cookies)}`).session;
		expect(await next.get()).toBeUndefined();
	});

	test("set keeps the session id stable", async () => {
		const { session } = makeSession(undefined);
		await session.set({ userId: 1 });
		const first = session.id;
		await session.set({ userId: 2 });
		expect(session.id).toBe(first);
	});

	test("regenerate mints a new id and replaces the data", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 1 });
		const first = session.id;
		await session.regenerate({ userId: 2 });
		expect(session.id).not.toBe(first);

		const next = makeSession(`torpor-session=${writtenCookie(cookies)}`).session;
		expect(await next.get()).toEqual({ userId: 2 });
		expect(next.id).toBe(session.id);
	});

	test("destroy deletes the cookie", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ userId: 5 });
		await session.destroy();
		expect(session.id).toBeUndefined();

		const deletion = [...cookies.cookies.values()].find((c) => c.startsWith("torpor-session=;"));
		expect(deletion).toContain("Expires=");
	});

	test("throws a helpful error when the secret is not set", async () => {
		globalRef.adapter = { env: {} };
		const { session } = makeSession(undefined);
		await expect(session.set({ userId: 5 })).rejects.toThrow(/TORPOR_SESSION_SECRET/);
	});

	test("handles unicode data", async () => {
		const { session, cookies } = makeSession(undefined);
		await session.set({ name: "André", emoji: "🦔" });
		const next = makeSession(`torpor-session=${writtenCookie(cookies)}`).session;
		expect(await next.get()).toEqual({ name: "André", emoji: "🦔" });
	});
});
