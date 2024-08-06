import type Cleanup from "./Cleanup";

export default interface Effect {
  run: () => Cleanup | void;
  cleanup: Cleanup | null;
  //children: Effect[] | null;
}
