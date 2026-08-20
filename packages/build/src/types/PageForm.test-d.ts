import badRequest from "../response/badRequest";
import ok from "../response/ok";
import type TypedResponse from "../response/TypedResponse";
import type { PageData } from "./PageData";
import type { PageForm } from "./PageForm";
import type PageProps from "./PageProps";
import type PageServerEndPoint from "./PageServerEndPoint";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
	? true
	: false;
type Expect<T extends true> = T;

// The docs-site form pattern: ok for success, badRequest for validation errors
interface FormServer {
	actions: {
		default: () => Promise<TypedResponse<{ ok: true } | { ok: false; message: string }>>;
	};
}

export const formServer: FormServer = {
	actions: {
		default: async () =>
			Math.random() > 0.5
				? ok({ ok: true as const })
				: badRequest({ ok: false as const, message: "bad text" }),
	},
};

// The shape above is a valid +page.server endpoint
export const formServerCompat: PageServerEndPoint<"/form"> = formServer;

// PageForm extracts the union of action result bodies
export type F01 = Expect<
	Equals<PageForm<FormServer>, { ok: true } | { ok: false; message: string }>
>;

// PageProps carries data and form together
const props: PageProps<PageData<FormServer>, PageForm<FormServer>> = null as never;
const form = props.form;
export const okValue: boolean | undefined = form?.ok;
export const message: string = form && form.ok === false ? form.message : "";

// badRequest bodies are typed and Jsonify'd
export const bad: TypedResponse<{ ok: false; message: string }> = badRequest({
	ok: false,
	message: "bad text",
});
export const untypedBad: Response = badRequest("plain");

// Endpoints without actions fall back to a loose record
interface LoadOnly {
	load: () => Promise<TypedResponse<{ posts: { title: string }[] }>>;
}
export type F02 = Expect<Equals<PageForm<LoadOnly>, Record<string, any>>>;

// Annotated (widened) endpoints fall back to a loose record
export const widened: PageServerEndPoint<"/form"> = {
	actions: { default: async () => ok({ ok: true }) },
};
export type F03 = Expect<Equals<PageForm<typeof widened>, Record<string, any>>>;

// Multiple actions union their bodies
interface MultiServer {
	actions: {
		save: () => Promise<TypedResponse<{ saved: true }>>;
		remove: () => Promise<TypedResponse<{ removed: true }>>;
	};
}
export type F04 = Expect<Equals<PageForm<MultiServer>, { saved: true } | { removed: true }>>;

// Mixed typed and untyped action returns fall back to a loose record
interface MixedServer {
	actions: {
		save: () => Promise<TypedResponse<{ saved: true }>>;
		other: () => Promise<Response>;
	};
}
export type F05 = Expect<Equals<PageForm<MixedServer>, Record<string, any>>>;
