import Effect from "./Effect";

export default interface EffectPath {
  target: object;
  prop: string | symbol;
  effect: Effect;
}
