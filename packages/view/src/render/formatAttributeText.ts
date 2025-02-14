export default function formatAttributeText(value: any): string {
	return (value ?? "").toString().replaceAll('"', "&quot;");
}
