import init, { WasmRepl } from "../pkg/memphis";

let initPromise = null;

function ensureInit() {
  if (!initPromise) {
    initPromise = init();
  }
  return initPromise;
}

export const Memphis = {
  async createRepl() {
    await ensureInit();
    return new WasmRepl();
  },
};
