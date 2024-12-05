export default function formatAttributeText(text: any): string {
	return (text ?? "").toString().replaceAll('"', "&quot;");
}
