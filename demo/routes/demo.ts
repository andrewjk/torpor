import Demo from "../client/Components/Home/Demo.tera";
import { view } from "../site/server/response";

export function GET() {
  return view(Demo);
}
