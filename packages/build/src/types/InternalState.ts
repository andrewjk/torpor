import type ClientState from "./ClientState";
import type PageState from "./PageState";

export default interface InternalState {
	$page: PageState;
	client: ClientState;
}
