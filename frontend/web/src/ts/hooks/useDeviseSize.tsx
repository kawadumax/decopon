import { useEffect, useState } from "react";

type DeviseSize = "mobile" | "tablet" | "pc";

export const useDeviseSize = (): DeviseSize => {
  const [deviseSize, setDeviseSize] = useState<DeviseSize>("pc");

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviseSize("mobile");
      else if (width < 1024) setDeviseSize("tablet");
      else setDeviseSize("pc");
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return deviseSize;
};
