import PropDocumentation from "./PropDocumentation";
import SlotDocumentation from "./SlotDocumentation";

export default interface Documentation {
	description: string;
	props: PropDocumentation[];
	slots: SlotDocumentation[];
}
