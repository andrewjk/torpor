import Server from "../server/Server";
import Site from "../site/Site";

export default interface Adapter {
	prebuild?: (site: Site) => Promise<void> | void;
	postbuild?: (site: Site) => Promise<void> | void;
	serve: (server: Server, site: Site) => void;
}
