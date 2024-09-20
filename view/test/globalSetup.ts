import "../scripts/buildTestOutput";

export async function setup() {
	// Build the output files in the above import
}

//export async function teardown() {
//	// Delete all of the *.server.tera files that we created while hydrating
//	const files = await fg("**/*.server.tera", {
//		absolute: true,
//	});
//	await Promise.all(files.map((f) => fs.unlink(f)));
//}
