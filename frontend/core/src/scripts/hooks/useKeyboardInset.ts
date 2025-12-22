import { useEffect, useRef, useState } from "react";

declare global {
  interface VirtualKeyboard {
    overlaysContent: boolean;
    boundingRect: DOMRectReadOnly;
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  }

  interface Navigator {
    virtualKeyboard?: VirtualKeyboard;
  }

  interface Window {
    __decoponImeState?: {
      inset?: number;
      isVisible?: boolean;
      rawInset?: number;
      safeAreaTop?: number;
      safeAreaBottom?: number;
      safeAreaLeft?: number;
      safeAreaRight?: number;
    };
    __decoponImeDebug?: boolean;
  }
}

type SafeAreaInsets = {
  top: number;
  bottom: number;
};

let safeAreaProbeElement: HTMLDivElement | null = null;

const parseCssNumber = (value: string): number | null => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getSafeAreaEnvInsets = (): SafeAreaInsets | null => {
  if (typeof document === "undefined") return null;
  if (!document.body) return null;

  if (!safeAreaProbeElement) {
    const element = document.createElement("div");
    element.id = "decopon-safe-area-probe";
    element.style.position = "fixed";
    element.style.top = "0";
    element.style.left = "0";
    element.style.width = "0";
    element.style.height = "0";
    element.style.paddingTop = "env(safe-area-inset-top)";
    element.style.paddingBottom = "env(safe-area-inset-bottom)";
    element.style.visibility = "hidden";
    element.style.pointerEvents = "none";
    element.style.zIndex = "-1";
    document.body.appendChild(element);
    safeAreaProbeElement = element;
  }

  const styles = getComputedStyle(safeAreaProbeElement);
  const top = parseCssNumber(styles.paddingTop) ?? 0;
  const bottom = parseCssNumber(styles.paddingBottom) ?? 0;
  return { top, bottom };
};

const getSafeAreaCssVarInsets = (): SafeAreaInsets | null => {
  if (typeof document === "undefined") return null;
  const styles = getComputedStyle(document.documentElement);
  const top = parseCssNumber(styles.getPropertyValue("--decopon-safe-area-top"));
  const bottom = parseCssNumber(
    styles.getPropertyValue("--decopon-safe-area-bottom"),
  );
  if (top === null && bottom === null) return null;
  return { top: top ?? 0, bottom: bottom ?? 0 };
};

const shouldLogImeDebug = (): boolean => {
  if (typeof window === "undefined") return false;
  if (window.__decoponImeDebug === true) return true;
  try {
    return window.localStorage.getItem("decopon:ime-debug") === "1";
  } catch {
    return false;
  }
};

let logRafId = 0;
const pendingLogs = new Map<string, Record<string, unknown>>();

const logImeDebug = (label: string, payload: Record<string, unknown>) => {
  if (!shouldLogImeDebug()) return;
  pendingLogs.set(label, payload);
  if (logRafId || typeof window === "undefined") return;

  logRafId = window.requestAnimationFrame(() => {
    for (const [pendingLabel, pendingPayload] of pendingLogs.entries()) {
      console.info("[ime-debug]", pendingLabel, pendingPayload);
    }
    pendingLogs.clear();
    logRafId = 0;
  });
};

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
  rawInset: number;
  layoutLoss: number;
  visualLoss: number;
};

export const useKeyboardState = (): KeyboardState => {
  const [state, setState] = useState<KeyboardState>({
    inset: 0,
    isOpen: false,
    rawInset: 0,
    layoutLoss: 0,
    visualLoss: 0,
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
      const nativeRawInset =
        typeof (detail as { rawInset?: unknown }).rawInset === "number"
          ? ((detail as { rawInset: number }).rawInset as number)
          : undefined;
      const nativeSafeAreaTop =
        typeof (detail as { safeAreaTop?: unknown }).safeAreaTop === "number"
          ? ((detail as { safeAreaTop: number }).safeAreaTop as number)
          : undefined;
      const nativeSafeAreaBottom =
        typeof (detail as { safeAreaBottom?: unknown }).safeAreaBottom === "number"
          ? ((detail as { safeAreaBottom: number }).safeAreaBottom as number)
          : undefined;
      if (typeof rawInsetValue !== "number" || Number.isNaN(rawInsetValue))
        return;
      const rawInsetPx = Math.max(0, Math.floor(rawInsetValue));
      const rawInset = Math.max(
        0,
        Math.floor(typeof nativeRawInset === "number" ? nativeRawInset : rawInsetPx),
      );
      const reportedVisible =
        typeof detail.isVisible === "boolean" ? detail.isVisible : undefined;
      hasNativeImeInsetRef.current = true;

      // `adjustResize` 等で layout viewport 自体が縮む場合、固定要素に rawInset をそのまま加算すると二重に押し上がる。
      // そのため「layout がどれだけ縮んだか」を推定し、固定要素用の `inset` は差し引いた値にする。
      // さらに visualViewport の縮み量が十分に小さい場合は、過大な rawInset を補正する。
      const THRESHOLD_PX = 32;
      if (layoutBaselineHeightRef.current === 0 || rawInsetPx < THRESHOLD_PX) {
        layoutBaselineHeightRef.current = window.innerHeight;
      }
      const viewport = window.visualViewport;
      const visualHeight = viewport
        ? viewport.height + viewport.offsetTop
        : window.innerHeight;
      baselineHeightRef.current = Math.max(
        baselineHeightRef.current,
        window.innerHeight,
        visualHeight,
      );
      const layoutLoss = Math.max(
        0,
        layoutBaselineHeightRef.current - window.innerHeight,
      );
      const visualLoss = Math.max(0, baselineHeightRef.current - visualHeight);
      const MAX_INSET = Math.max(0, Math.floor(window.innerHeight * 0.6));
      const adjustedInset = Math.max(0, rawInsetPx - layoutLoss);
      const visualInset =
        visualLoss >= THRESHOLD_PX ? Math.ceil(visualLoss) : 0;
      const insetCandidate =
        visualInset > 0 && visualInset < adjustedInset
          ? visualInset
          : adjustedInset;
      const inset = Math.min(insetCandidate, MAX_INSET);
      const isOpen =
        reportedVisible !== undefined
          ? reportedVisible
          : Math.max(rawInsetPx, layoutLoss, visualLoss) >= THRESHOLD_PX;

      setState((previous) => {
        if (
          previous.inset === inset &&
          previous.isOpen === isOpen &&
          previous.rawInset === rawInset &&
          previous.layoutLoss === layoutLoss &&
          previous.visualLoss === visualLoss
        ) {
          return previous;
        }
        logImeDebug("native-update", {
          rawInsetPx,
          rawInset,
          nativeRawInset,
          nativeSafeAreaTop,
          nativeSafeAreaBottom,
          adjustedInset,
          visualInset,
          layoutLoss,
          visualLoss,
          inset,
          isOpen,
          reportedVisible,
          innerHeight: window.innerHeight,
          visualHeight,
          layoutBaselineHeight: layoutBaselineHeightRef.current,
          baselineHeight: baselineHeightRef.current,
          nativeDetail: detail,
          safeAreaEnv: getSafeAreaEnvInsets(),
          safeAreaCssVars: getSafeAreaCssVarInsets(),
        });
        return { inset, isOpen, rawInset, layoutLoss, visualLoss };
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
    if (typeof navigator === "undefined") return;
    const vk = navigator.virtualKeyboard;
    if (!vk) return;
    try {
      vk.overlaysContent = true;
    } catch {
      // ignore
    }
    const updateVirtualKeyboard = () => {
      const height = Math.max(0, Math.round(vk.boundingRect?.height ?? 0));
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
          "--decopon-virtual-keyboard-height",
          `${height}px`,
        );
      }
      logImeDebug("virtual-keyboard", {
        overlaysContent: vk.overlaysContent,
        height,
      });
    };
    updateVirtualKeyboard();
    vk.addEventListener("geometrychange", updateVirtualKeyboard);
    return () => {
      vk.removeEventListener("geometrychange", updateVirtualKeyboard);
    };
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
        if (
          previous.inset === inset &&
          previous.isOpen === isOpen &&
          previous.rawInset === 0 &&
          previous.layoutLoss === layoutLoss &&
          previous.visualLoss === visualLoss
        ) {
          return previous;
        }
        logImeDebug("visual-update", {
          layoutLoss,
          visualLoss,
          inset,
          isOpen,
          innerHeight: window.innerHeight,
          visualHeight,
          baselineHeight,
          safeAreaEnv: getSafeAreaEnvInsets(),
          safeAreaCssVars: getSafeAreaCssVarInsets(),
        });
        return { inset, isOpen, rawInset: 0, layoutLoss, visualLoss };
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
