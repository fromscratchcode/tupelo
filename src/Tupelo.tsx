import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import "./App.css";
import MemphisTerminal, { type MemphisTerminalHandle } from "./MemphisTerminal";
import MobileControls from "./MobileControls";
import { useIsMobile } from "./hooks/useIsMobile";
import {
  getMemphis,
  type MemphisEngine,
  type MemphisRepl,
} from "@fromscratchcode/memphis-js";

const defaultBannerLines = [
  "Memphis REPL [experimental]",
  "",
  "Many core Python features supported.",
  "Standard library support is limited.",
  "",
  "Supported features:",
  "github.com/fromscratchcode/memphis",
];

export interface TupeloProps {
  bannerLines?: string[];
  className?: string;
  engine?: MemphisEngine;
  style?: CSSProperties;
}

export default function Tupelo({
  bannerLines = defaultBannerLines,
  className,
  engine,
  style,
}: TupeloProps) {
  const [repl, setRepl] = useState<MemphisRepl | null>(null);
  // Keep a stable reference to the REPL so we can free its wasm resources on unmount.
  const replRef = useRef<MemphisRepl | null>(null);
  const terminalRef = useRef<MemphisTerminalHandle | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    let isDisposed = false;

    async function setupRepl(): Promise<void> {
      const nextMemphis = await getMemphis();
      if (isDisposed) {
        return;
      }

      const nextRepl = nextMemphis.createRepl({
        engine,
        onStdout: (chunk) => {
          terminalRef.current?.write(chunk);
        },
        onInput: (prompt) => {
          return window.prompt(prompt);
        }
      });
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
  }, [engine]);

  function sendKey(key: string): void {
    terminalRef.current?.sendKey(key);
  }

  function focusTerminal(): void {
    terminalRef.current?.focus();
  }

  const resolvedBannerLines = useMemo(
    () =>
      repl
        ? [
            ...bannerLines.slice(0, 2),
            `version=${repl.version()} engine=${repl.engine()}`,
            ...bannerLines.slice(2),
          ]
        : bannerLines,
    [bannerLines, repl],
  );

  if (!repl) {
    return (
      <div
        className={className}
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
          ...style,
        }}
      >
        Loading Memphis...
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    >
      <MemphisTerminal
        ref={terminalRef}
        bannerLines={resolvedBannerLines}
        repl={repl}
      />

      {isMobile && <MobileControls onFocus={focusTerminal} onKey={sendKey} />}
    </div>
  );
}
