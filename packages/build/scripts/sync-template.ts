import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../../..");
const templatePath = path.join(root, "packages/create-build/template/package.json");

function workspaceVersions() {
	const versions = new Map<string, string>();
	const dirs = [path.join(root, "packages"), path.join(root, "packages/adapters")];
	for (const dir of dirs) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const pkgPath = path.join(dir, entry.name, "package.json");
			if (!existsSync(pkgPath)) continue;
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			if (pkg.name && pkg.version) versions.set(pkg.name, pkg.version);
		}
	}
	return versions;
}

const versions = workspaceVersions();
const template = JSON.parse(readFileSync(templatePath, "utf8"));
let changed = false;

for (const section of ["dependencies", "devDependencies"]) {
	const deps = template[section];
	if (!deps) continue;
	for (const name of Object.keys(deps)) {
		const version = versions.get(name);
		if (!version) continue;
		const range = name.startsWith("@torpor/") ? `^${version}` : version;
		if (deps[name] !== range) {
			deps[name] = range;
			changed = true;
		}
	}
}

if (changed) {
	writeFileSync(templatePath, JSON.stringify(template, null, "\t") + "\n");
	console.log("Updated packages/create-build/template/package.json");
} else {
	console.log("Template package.json is up to date");
}
