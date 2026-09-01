/**
 * A standalone HTML page loading Swagger UI from a CDN, pointed at the
 * OpenAPI document endpoint.
 */
export default function openApiDocsHtml(docPath: string): string {
	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>API Docs</title>
	<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
	<div id="swagger-ui"></div>
	<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
	<script>
		window.addEventListener("DOMContentLoaded", () => {
			SwaggerUIBundle({ url: ${JSON.stringify(docPath)}, dom_id: "#swagger-ui" });
		});
	</script>
</body>
</html>
`;
}
