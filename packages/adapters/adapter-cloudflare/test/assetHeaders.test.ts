import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vite-plus/test";
import { assetHeadersRules, writeAssetHeaders } from "../src/assetHeaders";

test("hashed assets are cached for a year", () => {
	const rules = assetHeadersRules(["clientEntry-BUKMQ_H9.js", "site-CccM7dRz.css"]);
	expect(rules).toBe("/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n");
});

test("unhashed files in assets keep Cloudflare's default", () => {
	const rules = assetHeadersRules(["clientEntry-BUKMQ_H9.js", "logo.png", "img/photo.jpg"]);
	expect(rules).toContain("/assets/logo.png\n  ! Cache-Control\n");
	expect(rules).toContain("/assets/img/photo.jpg\n  ! Cache-Control\n");
	expect(rules).not.toContain("clientEntry");
});

test("a site's own _headers file is kept after the generated rules", async () => {
	const folder = await fs.mkdtemp(path.join(os.tmpdir(), "torp-cf-headers-"));
	try {
		await fs.mkdir(path.join(folder, "assets"));
		await fs.writeFile(path.join(folder, "assets", "clientEntry-BUKMQ_H9.js"), "");
		await fs.writeFile(path.join(folder, "_headers"), "/*\n  X-Frame-Options: DENY\n");

		await writeAssetHeaders(folder);

		const headers = await fs.readFile(path.join(folder, "_headers"), "utf-8");
		expect(headers.indexOf("/assets/*")).toBe(0);
		expect(headers).toContain("/*\n  X-Frame-Options: DENY\n");
	} finally {
		await fs.rm(folder, { recursive: true });
	}
});

test("no _headers file is written without assets", async () => {
	const folder = await fs.mkdtemp(path.join(os.tmpdir(), "torp-cf-headers-"));
	try {
		await writeAssetHeaders(folder);
		expect(existsSync(path.join(folder, "_headers"))).toBe(false);
	} finally {
		await fs.rm(folder, { recursive: true });
	}
});
