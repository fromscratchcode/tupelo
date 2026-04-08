import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from '@xterm/addon-fit';
import "xterm/css/xterm.css";
import "./App.css";

import init, { WasmRepl } from "../pkg/memphis";

const INDENT_WIDTH = 4;

export default function MemphisRepl() {
  const containerRef = useRef(null);

  useEffect(() => {
    let term = null;
    let repl = null;
    const fitAddon = new FitAddon();

    let currentLine = "";
    let indentLevel = 0;
    let isComplete = true;

    function prompt() {
      // Calculate our new indent _and_ set that to be the start of our current line, since those
      // spaces should be considered part of the text input for that line.
      const indent = " ".repeat(indentLevel * INDENT_WIDTH);
      currentLine = indent;

      const symbol = isComplete ? ">>> " : "... ";
      term?.write(`\r\n${symbol}${indent}`);
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

      term.write("Memphis REPL");
      prompt();

      term.onData((data) => {
        // ENTER
        if (data === "\r") {
          const res = repl.input_line(currentLine + "\n");

          if (res.result.type === "Ok" || res.result.type === "Err") {
            term?.write(`\r\n${res.result.value}`);
          }

          indentLevel = res.indent_level;
          isComplete = res.is_complete;
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
