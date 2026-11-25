import { expect, test } from "vite-plus/test";
import { assetHeaders, isHashedAsset } from "../src/run/assetHeaders";

test("hashed build assets are cached for a year", () => {
	const headers = assetHeaders("/site/dist/client/assets/clientEntry-BUKMQ_H9.js");
	expect(headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
	expect(headers["Content-Type"]).toContain("javascript");
});

test("unhashed files in assets get no long cache lifetime", () => {
	expect(isHashedAsset("/assets/logo.png")).toBe(false);
	expect(isHashedAsset("/assets/my-logo.png")).toBe(false);
	expect(assetHeaders("/assets/logo.png")["Cache-Control"]).toBeUndefined();
});
