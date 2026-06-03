/* tslint:disable */
/* eslint-disable */

export class WasmRepl {
  free(): void;
  [Symbol.dispose](): void;
  history_up(): void;
  move_right(): void;
  insert_text(text: string): void;
  current_line(): string;
  cursor_index(): number;
  history_down(): void;
  constructor(engine_str: string);
  engine(): string;
  prompt(): string;
  submit(): any;
  version(): string;
  backspace(): void;
  interrupt(): void;
  move_left(): void;
}

export function compile(text: string): any;

export function lex(text: string): any;

export function parse(text: string): any;

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmrepl_free: (a: number, b: number) => void;
  readonly wasmrepl_backspace: (a: number) => void;
  readonly wasmrepl_current_line: (a: number) => [number, number];
  readonly wasmrepl_cursor_index: (a: number) => number;
  readonly wasmrepl_engine: (a: number) => [number, number];
  readonly wasmrepl_history_down: (a: number) => void;
  readonly wasmrepl_history_up: (a: number) => void;
  readonly wasmrepl_insert_text: (a: number, b: number, c: number) => void;
  readonly wasmrepl_interrupt: (a: number) => void;
  readonly wasmrepl_move_left: (a: number) => void;
  readonly wasmrepl_move_right: (a: number) => void;
  readonly wasmrepl_new: (a: number, b: number) => number;
  readonly wasmrepl_prompt: (a: number) => [number, number];
  readonly wasmrepl_submit: (a: number) => any;
  readonly wasmrepl_version: (a: number) => [number, number];
  readonly compile: (a: number, b: number) => [number, number, number];
  readonly lex: (a: number, b: number) => any;
  readonly parse: (a: number, b: number) => [number, number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput,
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<InitOutput>;
