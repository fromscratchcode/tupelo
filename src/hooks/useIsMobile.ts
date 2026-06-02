import { useEffect, useState } from "react";

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    // Keep the first client render accurate without crashing in SSR.
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const updateIsMobile = (): void => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  return isMobile;
};
