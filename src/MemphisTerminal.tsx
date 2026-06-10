import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "xterm";
import type { MemphisRepl } from "./memphis";
import "xterm/css/xterm.css";

function normalizeOutput(text: string): string {
  return text.replace(/\n/g, "\r\n");
}

type MemphisTerminalHandle = {
  focus(): void;
  sendKey(key: string): void;
};

type MemphisTerminalProps = {
  bannerLines?: string[];
  repl: MemphisRepl;
};

const MemphisTerminal = forwardRef<MemphisTerminalHandle, MemphisTerminalProps>(
  function MemphisTerminal({ repl, bannerLines = [] }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const termRef = useRef<Terminal | null>(null);
    const handlerRef = useRef<((key: string) => void) | null>(null);

    // Expose a minimal terminal API to the parent without leaking xterm internals.
    useImperativeHandle(
      ref,
      () => ({
        focus() {
          termRef.current?.focus();
        },
        sendKey(key: string) {
          handlerRef.current?.(key);
        },
      }),
      [],
    );

    useEffect(() => {
      const fitAddon = new FitAddon();
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
      });

      let pendingOutput = "";

      const handleResize = () => {
        fitAddon.fit();
      };

      function enter(): void {
        write("\r\n");
      }

      function write(data: string): void {
        pendingOutput += data;
      }

      function writeln(data: string): void {
        write(data);
        enter();
      }

      function writeBanner(): void {
        for (const line of bannerLines) {
          writeln(line);
        }
      }

      function redrawLine(): void {
        const prefix = repl.prompt();
        const currentLine = repl.currentLine();
        const cursorIndex = repl.cursorIndex();

        const fullLine = prefix + currentLine;
        const moveLeft =
          fullLine.length > prefix.length + cursorIndex
            ? `\x1b[${fullLine.length - (prefix.length + cursorIndex)}D`
            : "";

        term.write(pendingOutput + "\r\x1b[2K" + fullLine + moveLeft);
        pendingOutput = "";
      }

      const handleData = (data: string): void => {
        if (data === "\x03") {
          enter();
          repl.interrupt();
        } else if (data === "\x1b[D") {
          repl.moveLeft();
        } else if (data === "\x1b[C") {
          repl.moveRight();
        } else if (data === "\r") {
          enter();
          const step = repl.submit();

          if (step.type === "complete") {
            const { result, stdout } = step.data;

            if (stdout) {
              write(normalizeOutput(stdout));
            }

            if (result.type === "ok" || result.type === "err") {
              write(normalizeOutput(result.value));
              enter();
            }
          }
        } else if (data === "\u007F") {
          repl.backspace();
        } else if (data === "\x1b[A") {
          repl.historyUp();
        } else if (data === "\x1b[B") {
          repl.historyDown();
        } else {
          repl.insertText(data);
        }

        redrawLine();
      };

      const container = containerRef.current;
      if (!container) {
        term.dispose();
        return undefined;
      }

      term.loadAddon(fitAddon);
      container.innerHTML = "";
      term.open(container);
      termRef.current = term;

      fitAddon.fit();
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
      });
      resizeObserver.observe(container);
      window.addEventListener("resize", handleResize);

      writeBanner();
      redrawLine();
      term.focus();

      term.onData(handleData);
      handlerRef.current = handleData;

      return () => {
        handlerRef.current = null;
        termRef.current = null;
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
        term.dispose();
      };
    }, [bannerLines, repl]);

    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", background: "black" }}
      />
    );
  },
);

export default MemphisTerminal;
export type { MemphisTerminalHandle };
