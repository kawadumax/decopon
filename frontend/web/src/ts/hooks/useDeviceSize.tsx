import { useEffect, useState } from "react";

export type DeviceSize = "mobile" | "tablet" | "pc";

export const useDeviceSize = (): DeviceSize => {
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("pc");

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceSize("mobile");
      else if (width < 1024) setDeviceSize("tablet");
      else setDeviceSize("pc");
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return deviceSize;
};
