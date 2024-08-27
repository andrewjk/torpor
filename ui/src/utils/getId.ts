let nextId = 0;

/** Returns a unique ID for use by components that need one, e.g. for accessibility */
export default function getId(): string {
	return `tera-id-${nextId++}`;
}
