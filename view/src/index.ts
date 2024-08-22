import build from "./compile/build";
import parse from "./compile/parse";
import hydrate from "./render/hydrate";
import mount from "./render/mount";
import $run from "./watch/$run";
import $unwrap from "./watch/$unwrap";
import $watch from "./watch/$watch";

// This is used as an input to tsconfig

export { parse, build, mount, hydrate, $watch, $unwrap, $run };
