import { useEffect, useRef, useState } from "react";

import "./App.css";
import MemphisTerminal, { type MemphisTerminalHandle } from "./MemphisTerminal";
import MobileControls from "./MobileControls";
import { useIsMobile } from "./hooks/useIsMobile";
import { createMemphis, type MemphisEngine, type MemphisRepl } from "./memphis";

function getSelectedEngine(): MemphisEngine | undefined {
  const engine = new URLSearchParams(window.location.search).get("engine");
  if (engine === "treewalk" || engine === "bytecode_vm") {
    return engine;
  }

  return undefined;
}

export default function MemphisRepl() {
  const [selectedEngine] = useState<MemphisEngine | undefined>(
    getSelectedEngine,
  );
  const [repl, setRepl] = useState<MemphisRepl | null>(null);
  // Keep a stable reference to the REPL so we can free its wasm resources on unmount.
  const replRef = useRef<MemphisRepl | null>(null);
  const terminalRef = useRef<MemphisTerminalHandle | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    let isDisposed = false;

    async function setupRepl(): Promise<void> {
      const nextMemphis = await createMemphis();
      if (isDisposed) {
        return;
      }

      const nextRepl = nextMemphis.createRepl({ engine: selectedEngine });
      if (isDisposed) {
        nextRepl.free();
        return;
      }

      replRef.current = nextRepl;
      setRepl(nextRepl);
    }

    void setupRepl();

    return () => {
      isDisposed = true;
      replRef.current?.free();
      replRef.current = null;
    };
  }, []);

  function sendKey(key: string): void {
    terminalRef.current?.sendKey(key);
  }

  function focusTerminal(): void {
    terminalRef.current?.focus();
  }

  if (!repl) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          background: "black",
          color: "#f5f5f5",
          fontFamily: "ui-monospace, Consolas, monospace",
          fontSize: 14,
        }}
      >
        Loading Memphis...
      </div>
    );
  }

  const bannerLines = [
    "Memphis REPL [experimental]",
    "",
    `version=${repl.version()} engine=${repl.engine()}`,
    "",
    "Many core Python features supported.",
    "Standard library support is limited.",
    "",
    "Supported features:",
    "github.com/fromscratchcode/memphis",
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MemphisTerminal
        ref={terminalRef}
        bannerLines={bannerLines}
        repl={repl}
      />

      {isMobile && <MobileControls onFocus={focusTerminal} onKey={sendKey} />}
    </div>
  );
}
