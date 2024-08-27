import Demo from "../client/Components/Home/Scratch.tera";
import { view } from "../site/server/response";

export function GET() {
  return view(Demo);
}
