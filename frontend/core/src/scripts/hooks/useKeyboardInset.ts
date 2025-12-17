import { useEffect, useRef, useState } from "react";

/**
 * `visualViewport` の高さ変化から、ソフトウェアキーボードに関連する状態を推定する。
 *
 * - `inset`: `position: fixed` 要素を可視領域に寄せるために bottom に加算する量（layout viewport がリサイズされない環境向け）
 * - `isOpen`: キーボードが表示されていると推定されるかどうか（layout viewport がリサイズされる環境でも true になり得る）
 *
 * `visualViewport` 未対応環境では `{ inset: 0, isOpen: false }` を返す。
 */
export type KeyboardState = {
  inset: number;
  isOpen: boolean;
};

export const useKeyboardState = (): KeyboardState => {
  const [state, setState] = useState<KeyboardState>({
    inset: 0,
    isOpen: false,
  });
  const baselineHeightRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const THRESHOLD_PX = 32;
    baselineHeightRef.current = Math.max(
      baselineHeightRef.current,
      window.innerHeight,
      viewport.height + viewport.offsetTop,
    );

    const updateState = () => {
      const baselineHeight = Math.max(
        baselineHeightRef.current,
        window.innerHeight,
        viewport.height + viewport.offsetTop,
      );
      const visualHeight = viewport.height + viewport.offsetTop;

      const layoutLoss = baselineHeight - window.innerHeight;
      const visualLoss = baselineHeight - visualHeight;

      const isOpen = Math.max(layoutLoss, visualLoss) >= THRESHOLD_PX;
      if (!isOpen) {
        baselineHeightRef.current = baselineHeight;
      }

      const inset =
        layoutLoss >= THRESHOLD_PX
          ? 0
          : visualLoss >= THRESHOLD_PX
            ? Math.ceil(visualLoss)
            : 0;

      setState((previous) => {
        if (previous.inset === inset && previous.isOpen === isOpen) {
          return previous;
        }
        return { inset, isOpen };
      });
    };

    updateState();
    viewport.addEventListener("resize", updateState);
    viewport.addEventListener("scroll", updateState);
    window.addEventListener("resize", updateState);

    return () => {
      viewport.removeEventListener("resize", updateState);
      viewport.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
    };
  }, []);

  return state;
};

/**
 * `position: fixed` 要素の bottom に加算するための値（互換 API）。
 * キーボード表示状態の判定は `useKeyboardState()` を利用する。
 */
export const useKeyboardInset = (): number => {
  return useKeyboardState().inset;
};
