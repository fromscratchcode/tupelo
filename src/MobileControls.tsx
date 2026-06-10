import { useState } from "react";

type MobileControlsProps = {
  onFocus(): void;
  onKey(key: string): void;
};

const MobileControls = ({ onKey, onFocus }: MobileControlsProps) => {
  const [showMobileControls, setShowMobileControls] = useState(false);

  return (
    <>
      {showMobileControls && (
        <button
          aria-label="Close mobile controls"
          onClick={() => {
            setShowMobileControls(false);
            onFocus();
          }}
          style={{
            position: "absolute",
            inset: 0,
            border: "none",
            background: "transparent",
            padding: 0,
            zIndex: 19,
          }}
        />
      )}

      <div
        onClick={(event: React.MouseEvent<HTMLDivElement>) => {
          event.stopPropagation();
        }}
        style={{
          position: "absolute",
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
              onClick={() => onKey("\x1b[A")}
              style={{ fontSize: 20 }}
            >
              ↑
            </button>
            <div />
            <button
              aria-label="Left arrow"
              onClick={() => onKey("\x1b[D")}
              style={{ fontSize: 20 }}
            >
              ←
            </button>
            <button
              aria-label="Down arrow"
              onClick={() => onKey("\x1b[B")}
              style={{ fontSize: 20 }}
            >
              ↓
            </button>
            <button
              aria-label="Right arrow"
              onClick={() => onKey("\x1b[C")}
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
  );
};

export default MobileControls;
