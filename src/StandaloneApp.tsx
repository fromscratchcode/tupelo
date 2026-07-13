import Tupelo from "./Tupelo";
import type { MemphisEngine } from "@fromscratchcode/memphis-js";

function getSelectedEngine(): MemphisEngine | undefined {
  const engine = new URLSearchParams(window.location.search).get("engine");
  if (engine === "treewalk" || engine === "bytecode_vm") {
    return engine;
  }

  return undefined;
}

export default function StandaloneApp() {
  return (
    <Tupelo
      engine={getSelectedEngine()}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
