import { useEffect, useState } from "react";

/**
 * `visualViewport` の高さ変化から、ソフトウェアキーボードで覆われる下部インセットを算出する。
 * 未対応環境では 0 を返す。
 */
export const useKeyboardInset = (): number => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateInset = () => {
      const heightLoss = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(heightLoss > 0 ? Math.ceil(heightLoss) : 0);
    };

    updateInset();
    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);

    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
    };
  }, []);

  return inset;
};
