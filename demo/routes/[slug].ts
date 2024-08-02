import LetterItem from "../client/Components/Home/LetterItem.tera";
import { view } from "../site/server/response";

export function GET({ params }) {
  return view(LetterItem, params);
}
