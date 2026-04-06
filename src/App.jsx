import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from '@xterm/addon-fit';
import "xterm/css/xterm.css";
import "./App.css";

import init, { WasmRepl } from "../pkg/memphis";

export default function MemphisRepl() {
  const containerRef = useRef(null);

  useEffect(() => {
    let term = null;
    let repl = null;
    const fitAddon = new FitAddon();

    let currentLine = "";
    let indentLevel = 0;

    function prompt() {
      const indent = "  ".repeat(indentLevel);
      const symbol = indentLevel > 0 ? "... " : ">>> ";
      term?.write(`\r\n${indent}${symbol}`);
    }

    async function setup() {
      await init();

      repl = new WasmRepl();

      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
      });

      term.loadAddon(fitAddon);

      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = "";
      term.open(container);

      fitAddon.fit();

      window.addEventListener("resize", () => {
        fitAddon.fit();
      });

      term.writeln("Memphis WASM REPL");
      prompt();

      term.onData((data) => {
        // ENTER
        if (data === "\r") {
          const res = repl.input_line(currentLine + "\n");

          term?.write("\r\n");

          if (res.result.type === "Ok" || res.result.type === "Err") {
            term?.writeln(res.result.value);
          }

          indentLevel = res.indent_level;
          currentLine = "";

          prompt();
        }

        // BACKSPACE
        else if (data === "\u007F") {
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term?.write("\b \b");
          }
        }

        // NORMAL TEXT
        else {
          currentLine += data;
          term?.write(data);
        }
      });
    }

    setup();

    return () => {
      term?.dispose();
      window.removeEventListener("resize", fitAddon.fit);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "black" }}
    />
  );
}
