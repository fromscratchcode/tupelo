import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    // Keep the first client render accurate without crashing in SSR.
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const updateIsMobile = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  return isMobile
}
