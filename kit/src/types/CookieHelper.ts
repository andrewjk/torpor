import { CookieSerializeOptions } from "vinxi/http";

export default interface CookieHelper {
	get: (name: string) => string | undefined;
	set: (name: string, value: string, options?: CookieSerializeOptions) => void;
	delete: (name: string, options?: CookieSerializeOptions) => void;
}
