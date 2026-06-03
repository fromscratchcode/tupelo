import init, { WasmRepl, compile, lex, parse } from "../pkg/memphis";

export type MemphisEngine = "treewalk" | "bytecode_vm";

export type ReplResult =
  | { type: "none" }
  | { type: "ok" | "err"; value: string };

export type ReplOutput = {
  stdout: string;
  result: ReplResult;
};

export type ReplStep =
  | { type: "complete"; data: ReplOutput }
  | { type: "incomplete"; data: unknown };

export interface MemphisRepl {
  engine(): MemphisEngine;
  backspace(): void;
  currentLine(): string;
  cursorIndex(): number;
  free(): void;
  historyDown(): void;
  historyUp(): void;
  insertText(text: string): void;
  interrupt(): void;
  moveLeft(): void;
  moveRight(): void;
  prompt(): string;
  submit(): ReplStep;
}

interface CreateReplOptions {
  engine?: MemphisEngine;
}

export interface Memphis {
  createRepl(options?: CreateReplOptions): MemphisRepl;
  compile(code: string): unknown;
  lex(code: string): unknown;
  parse(code: string): unknown;
}

// Share a single in-flight wasm initialization across concurrent callers.
let initPromise: Promise<unknown> | null = null;

export const createMemphis = async (): Promise<Memphis> => {
  try {
    if (!initPromise) {
      initPromise = init();
    }

    await initPromise;
  } catch {
    throw new Error("Failed to initialize Memphis.");
  }

  return {
    createRepl({ engine }: CreateReplOptions = {}) {
      const engineStr = engine ?? "treewalk";
      const repl = new WasmRepl(engineStr);

      return {
        engine() {
          return repl.engine() as MemphisEngine;
        },
        backspace() {
          repl.backspace();
        },
        currentLine() {
          return repl.current_line();
        },
        cursorIndex() {
          return repl.cursor_index();
        },
        free() {
          repl.free();
        },
        historyDown() {
          repl.history_down();
        },
        historyUp() {
          repl.history_up();
        },
        insertText(text: string) {
          repl.insert_text(text);
        },
        interrupt() {
          repl.interrupt();
        },
        moveLeft() {
          repl.move_left();
        },
        moveRight() {
          repl.move_right();
        },
        prompt() {
          return repl.prompt();
        },
        submit() {
          return repl.submit() as ReplStep;
        },
      };
    },
    compile,
    lex,
    parse,
  };
};
