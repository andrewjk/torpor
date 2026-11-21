import buildOpenApiDocument from "./openapi/document";
import openApiDocsHtml from "./openapi/docsHtml";
import { OPEN_API_STATE_KEY, openApi } from "./openapi/plugin";
import { createOpenApiHandler } from "./openapi/serve";

export { buildOpenApiDocument, createOpenApiHandler, openApi, openApiDocsHtml, OPEN_API_STATE_KEY };

export type {
	JsonSchema,
	OpenApiEndPoint,
	OpenApiExtend,
	OpenApiLoader,
	OpenApiPluginOptions,
	OpenApiRouteEntry,
	ResolvedOpenApiOptions,
	ToJsonSchema,
} from "./openapi/types";
