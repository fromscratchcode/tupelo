/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const __wbg_wasmrepl_free: (a: number, b: number) => void;
export const wasmrepl_backspace: (a: number) => void;
export const wasmrepl_current_line: (a: number) => [number, number];
export const wasmrepl_cursor_index: (a: number) => number;
export const wasmrepl_history_down: (a: number) => void;
export const wasmrepl_history_up: (a: number) => void;
export const wasmrepl_insert_text: (a: number, b: number, c: number) => void;
export const wasmrepl_interrupt: (a: number) => void;
export const wasmrepl_move_left: (a: number) => void;
export const wasmrepl_move_right: (a: number) => void;
export const wasmrepl_new: () => number;
export const wasmrepl_prompt: (a: number) => [number, number];
export const wasmrepl_submit: (a: number) => any;
export const compile: (a: number, b: number) => [number, number, number];
export const lex: (a: number, b: number) => any;
export const parse: (a: number, b: number) => [number, number, number];
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (
  a: number,
  b: number,
  c: number,
  d: number,
) => number;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
