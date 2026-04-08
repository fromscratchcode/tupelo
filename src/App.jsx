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
    let cursorIndex = 0;
    let indentLevel = 0;
    let isComplete = true;
    let promptPrefix = "";

    function prompt() {
      // Calculate our new indent _and_ set that to be the start of our current line, since those
      // spaces should be considered part of the text input for that line.
      const indent = " ".repeat(indentLevel * INDENT_WIDTH);
      currentLine = indent;
      cursorIndex = indent.length;

      const symbol = isComplete ? ">>> " : "... ";
      promptPrefix = symbol + indent;
      term?.write(`\r\n${symbol}${indent}`);
    }

    function renderLine() {
      // Move to start of line
      term?.write("\r");

      // Clear the line
      term?.write("\x1b[2K");

      // Reprint prompt + full line
      term?.write(promptPrefix + currentLine);

      // Move cursor to correct position
      const targetCol = promptPrefix.length + cursorIndex;
      const currentCol = promptPrefix.length + currentLine.length;

      if (currentCol > targetCol) {
        term?.write(`\x1b[${currentCol - targetCol}D`);
      }
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
        // CTRL-C
        if (data === "\x03") {
          // Move to a new line
          term?.write("^C");

          // Reset state
          currentLine = "";
          indentLevel = 0;
          isComplete = true;

          // Start fresh prompt
          prompt();
        }

        // LEFT ARROW
        else if (data === "\x1b[D") {
          if (cursorIndex > 0) {
            cursorIndex -= 1;
            renderLine();
          }
        }

        // RIGHT ARROW
        else if (data === "\x1b[C") {
          if (cursorIndex < currentLine.length) {
            cursorIndex += 1;
            renderLine();
          }
        }

        // ENTER
        else if (data === "\r") {
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
            currentLine =
              currentLine.slice(0, cursorIndex - 1) +
              currentLine.slice(cursorIndex);

            cursorIndex -= 1;
            renderLine();
          }
        }

        // NORMAL TEXT
        else {
          currentLine =
            currentLine.slice(0, cursorIndex) +
            data +
            currentLine.slice(cursorIndex);

          cursorIndex += data.length;
          renderLine();
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
