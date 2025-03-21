//import { type CookieSerializeOptions } from "vinxi/http";

type CookieHelper = {
	get: (name: string) => string | undefined;
	set: (name: string, value: string /*, options?: CookieSerializeOptions*/) => void;
	delete: (name: string /*, options?: CookieSerializeOptions*/) => void;
};

export default CookieHelper;
