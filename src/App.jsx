import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from '@xterm/addon-fit';
import "xterm/css/xterm.css";

import { Memphis } from "./memphis";
import "./App.css";

const INDENT_WIDTH = 4;
const INITIAL_STEP = { type: "complete", data: { type: "none" } };

function normalizeOutput(text) {
  return text.replace(/\n/g, "\r\n");
}

export default function MemphisRepl() {
  const containerRef = useRef(null);

  useEffect(() => {
    let term = null;
    let repl = null;
    const fitAddon = new FitAddon();
    const handleResize = () => {
      fitAddon.fit();
    };

    let currentLine = "";
    let cursorIndex = 0;
    let lastStep = INITIAL_STEP;
    let pendingOutput = "";
    let history = [];
    let historyIndex = null;

    function promptInfo() {
      const isComplete = lastStep.type === "complete";
      const indentLevel =
        lastStep.type === "incomplete" ? lastStep.data : 0;

      const indent = " ".repeat(indentLevel * INDENT_WIDTH);
      const prefix = isComplete ? ">>> " : "... ";

      return {
        indent,
        prefix,
      };
    }

    function enter() {
      write("\r\n");
    }

    function write(data) {
      pendingOutput += data;
    }

    function resetInput() {
      const { indent } = promptInfo();
      currentLine = indent;
      cursorIndex = indent.length;
    }

    function redrawLine() {
      const { prefix } = promptInfo();

      const fullLine = prefix + currentLine;

      const moveLeft =
        fullLine.length > prefix.length + cursorIndex
          ? `\x1b[${fullLine.length - (prefix.length + cursorIndex)}D`
          : "";

      term.write(pendingOutput + "\r\x1b[2K" + fullLine + moveLeft);

      pendingOutput = "";
    }

    async function setup() {
      repl = await Memphis.createRepl();

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

      window.addEventListener("resize", handleResize);

      write("Memphis REPL");
      enter();
      redrawLine();

      term.onData((data) => {
        // CTRL-C
        if (data === "\x03") {
          enter();
          repl.reset();
          lastStep = INITIAL_STEP;
          resetInput();
        }

        // LEFT ARROW
        else if (data === "\x1b[D") {
          if (cursorIndex > 0) {
            cursorIndex -= 1;
          }
        }

        // RIGHT ARROW
        else if (data === "\x1b[C") {
          if (cursorIndex < currentLine.length) {
            cursorIndex += 1;
          }
        }

        // ENTER
        else if (data === "\r") {
          // Save history (only if non-empty)
          if (currentLine.trim() !== "") {
            history.push(currentLine);
          }
          historyIndex = null;

          enter();
          const step = repl.input_line(currentLine + "\n");
          lastStep = step;

          if (step.type === "complete") {
            const output = step.data;

            const { result, stdout } = output;
            if (stdout) write(normalizeOutput(stdout));
            if (result.type === "ok" || result.type === "err") {
              write(normalizeOutput(result.value));
              enter();
            }
          }

          resetInput();
        }

        // BACKSPACE
        else if (data === "\u007F") {
          if (cursorIndex > 0) {
            currentLine =
              currentLine.slice(0, cursorIndex - 1) +
              currentLine.slice(cursorIndex);

            cursorIndex -= 1;
          }
        }

        // UP ARROW
        else if (data === "\x1b[A") {
          if (historyIndex !== null) {
            if (historyIndex > 0) {
              historyIndex -= 1;
            }
          } else if (history.length > 0) {
            historyIndex = history.length - 1;
          }

          if (historyIndex !== null) {
            currentLine = history[historyIndex];
            cursorIndex = currentLine.length;
          }
        }

        // DOWN ARROW
        else if (data === "\x1b[B") {
          if (historyIndex !== null) {
            if (historyIndex < history.length - 1) {
              historyIndex += 1;
            } else {
              historyIndex = null;
              currentLine = "";
            }

            if (historyIndex !== null) {
              currentLine = history[historyIndex];
            } else {
              currentLine = "";
            }

            cursorIndex = currentLine.length;
          }
        }

        // NORMAL TEXT
        else {
          currentLine =
            currentLine.slice(0, cursorIndex) +
            data +
            currentLine.slice(cursorIndex);

          cursorIndex += data.length;
        }

        redrawLine();
      });
    }

    setup();

    return () => {
      term?.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "black" }}
    />
  );
}
