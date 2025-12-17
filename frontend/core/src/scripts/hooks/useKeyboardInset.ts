import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __decoponImeState?: {
      inset?: number;
      isVisible?: boolean;
    };
  }
}

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
  const hasNativeImeInsetRef = useRef(false);
  const layoutBaselineHeightRef = useRef<number>(0);

  useEffect(() => {
    // Android で adjustResize を有効にしている場合、IME の高さ分だけ layout viewport が縮み、その分の inset を JS 側で二重に足す必要はない。
    // ここでは縮み量(layoutLoss)を計測するためのベースラインだけキャプチャしておく。
    layoutBaselineHeightRef.current = Math.max(
      layoutBaselineHeightRef.current,
      window.innerHeight,
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyNativeInset = (payload: unknown) => {
      const detail =
        typeof payload === "object" && payload !== null
          ? (payload as { inset?: unknown; isVisible?: unknown })
          : { inset: payload as unknown };
      const rawInsetValue = detail.inset;
      if (typeof rawInsetValue !== "number" || Number.isNaN(rawInsetValue))
        return;
      const rawInsetPx = Math.max(0, Math.floor(rawInsetValue));
      const reportedVisible =
        typeof detail.isVisible === "boolean" ? detail.isVisible : undefined;
      hasNativeImeInsetRef.current = true;

      // `adjustResize` 等で layout viewport 自体が縮む場合、固定要素に rawInset をそのまま加算すると二重に押し上がる。
      // そのため「layout がどれだけ縮んだか」を推定し、固定要素用の `inset` は差し引いた値にする。
      const THRESHOLD_PX = 32;
      if (layoutBaselineHeightRef.current === 0 || rawInsetPx < THRESHOLD_PX) {
        layoutBaselineHeightRef.current = window.innerHeight;
      }
      const layoutLoss = Math.max(
        0,
        layoutBaselineHeightRef.current - window.innerHeight,
      );
      const MAX_INSET = Math.max(0, Math.floor(window.innerHeight * 0.6));
      const inset =
        layoutLoss >= THRESHOLD_PX ? 0 : Math.min(rawInsetPx, MAX_INSET);
      const isOpen =
        reportedVisible !== undefined
          ? reportedVisible
          : Math.max(rawInsetPx, layoutLoss) >= THRESHOLD_PX;

      setState((previous) => {
        if (previous.inset === inset && previous.isOpen === isOpen) {
          return previous;
        }
        return { inset, isOpen };
      });
    };

    applyNativeInset(window.__decoponImeState);

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ inset?: unknown }>;
      applyNativeInset(custom.detail);
    };

    window.addEventListener("decopon:ime-inset", handler);
    return () => window.removeEventListener("decopon:ime-inset", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;

    const THRESHOLD_PX = 32;
    baselineHeightRef.current = Math.max(
      baselineHeightRef.current,
      window.innerHeight,
      viewport ? viewport.height + viewport.offsetTop : 0,
    );

    const updateState = () => {
      if (hasNativeImeInsetRef.current) return;
      const visualHeight = viewport
        ? viewport.height + viewport.offsetTop
        : window.innerHeight;
      const baselineHeight = Math.max(
        baselineHeightRef.current,
        window.innerHeight,
        visualHeight,
      );

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
    window.addEventListener("resize", updateState);
    viewport?.addEventListener("resize", updateState);
    viewport?.addEventListener("scroll", updateState);

    return () => {
      window.removeEventListener("resize", updateState);
      viewport?.removeEventListener("resize", updateState);
      viewport?.removeEventListener("scroll", updateState);
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
