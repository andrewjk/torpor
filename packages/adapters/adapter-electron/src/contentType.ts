// Kept local so the adapter doesn't depend on @torpor/build internals.
// From https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types

export default function contentType(extension: string): string {
	return types[extension] || "application/octet-stream";
}

const types: Record<string, string> = {
	".aac": "audio/aac",
	".apng": "image/apng",
	".avif": "image/avif",
	".bin": "application/octet-stream",
	".bmp": "image/bmp",
	".css": "text/css",
	".csv": "text/csv",
	".eot": "application/vnd.ms-fontobject",
	".gif": "image/gif",
	".htm": "text/html",
	".html": "text/html",
	".ico": "image/vnd.microsoft.icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "text/javascript",
	".json": "application/json",
	".jsonld": "application/ld+json",
	".mjs": "text/javascript",
	".mp3": "audio/mpeg",
	".mp4": "video/mp4",
	".ogg": "audio/ogg",
	".ogv": "video/ogg",
	".opus": "audio/ogg",
	".otf": "font/otf",
	".pdf": "application/pdf",
	".png": "image/png",
	".svg": "image/svg+xml",
	".tar": "application/x-tar",
	".txt": "text/plain",
	".ttf": "font/ttf",
	".wasm": "application/wasm",
	".wav": "audio/wav",
	".webm": "video/webm",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".xml": "application/xml",
	".zip": "application/zip",
};
