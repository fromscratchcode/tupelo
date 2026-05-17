import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from '@xterm/addon-fit';
import "xterm/css/xterm.css";

import { Memphis } from "./memphis";
import "./App.css";

const INDENT_WIDTH = 4;
const INITIAL_STEP = {
  type: "complete",
  data: {
    stdout: "",
    result: {
      type: "none"
    }
  }
};

function normalizeOutput(text) {
  return text.replace(/\n/g, "\r\n");
}

export default function MemphisRepl() {
  const containerRef = useRef(null);
  const handlerRef = useRef(null);
  const termRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showMobileControls, setShowMobileControls] = useState(false);

  useEffect(() => {
    let term = null;
    let repl = null;
    // Prevent async setup work from attaching resources after unmount.
    let isDisposed = false;
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

    function writeln(data) {
      write(data);
      enter();
    }

    function disposeResources() {
      termRef.current = null;
      term?.dispose();
      term = null;
      // `dispose()` only handles xterm; the interpreter needs its own teardown.
      repl?.free();
      repl = null;
    }

    function writeBanner() {
      const cols = term?.cols ?? 40;
      const rule = "=".repeat(Math.max(24, Math.min(cols, 74)));

      writeln(rule);
      writeln("");
      writeln("Memphis REPL [experimental]");
      writeln("");
      writeln("version=0.1.0 engine=treewalk");
      writeln("");
      writeln("Many core Python features supported.");
      writeln("Standard library support is limited.");
      writeln("");
      writeln("Supported features:");
      writeln("github.com/fromscratchcode/memphis");

      writeln("");
      writeln(rule);
      writeln("");
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

    const handleData = (data) => {
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
    };

    async function setup() {
      const nextRepl = await Memphis.createRepl();
      if (isDisposed) {
        // `WasmRepl` owns wasm-side memory and must be released explicitly.
        nextRepl.free();
        return;
      }

      repl = nextRepl;

      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
      });

      term.loadAddon(fitAddon);

      const container = containerRef.current;
      if (!container || isDisposed) {
        // Clean up both JS and wasm resources if the mount target disappeared.
        disposeResources();
        return;
      }
      container.innerHTML = "";
      term.open(container);
      termRef.current = term;

      fitAddon.fit();

      window.addEventListener("resize", handleResize);

      writeBanner();
      redrawLine();
      // Focus directly during setup because we have the live terminal instance
      // before external callers rely on the ref-backed focus helper.
      term.focus();

      term.onData(handleData);
    }

    // Give access to our handler to the React components so we can press arrow keys
    handlerRef.current = handleData;
    setup();

    return () => {
      isDisposed = true;
      disposeResources();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const updateIsMobile = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);

      if (!nextIsMobile) {
        setShowMobileControls(false);
      }
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  function sendKey(key) {
    handlerRef.current?.(key);
  }

  function focusTerminal() {
    termRef.current?.focus();
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", background: "black" }}
      />

      {isMobile && (
        <>
          {showMobileControls && (
            <button
              aria-label="Close mobile controls"
              onClick={() => {
                setShowMobileControls(false);
                focusTerminal();
              }}
              style={{
                position: "fixed",
                inset: 0,
                border: "none",
                background: "transparent",
                padding: 0,
                zIndex: 19,
              }}
            />
          )}

          <div
            onClick={(event) => {
              event.stopPropagation();
            }}
            style={{
              position: "fixed",
              right: 12,
              bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
              zIndex: 20,
            }}
          >
            {showMobileControls && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 48px)",
                  gridTemplateRows: "repeat(2, 48px)",
                  gap: 6,
                }}
              >
                <div />
                <button
                  aria-label="Up arrow"
                  onClick={() => sendKey("\x1b[A")}
                  style={{ fontSize: 20 }}
                >
                  ↑
                </button>
                <div />
                <button
                  aria-label="Left arrow"
                  onClick={() => sendKey("\x1b[D")}
                  style={{ fontSize: 20 }}
                >
                  ←
                </button>
                <button
                  aria-label="Down arrow"
                  onClick={() => sendKey("\x1b[B")}
                  style={{ fontSize: 20 }}
                >
                  ↓
                </button>
                <button
                  aria-label="Right arrow"
                  onClick={() => sendKey("\x1b[C")}
                  style={{ fontSize: 20 }}
                >
                  →
                </button>
              </div>
            )}

            <button
              aria-expanded={showMobileControls}
              aria-label="Toggle mobile controls"
              onClick={() => setShowMobileControls((current) => !current)}
              style={{
                fontSize: 16,
                fontWeight: 600,
                padding: "10px 14px",
              }}
            >
              ctrl
            </button>
          </div>
        </>
      )}
    </div>
  );
}
