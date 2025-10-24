import type { Tag } from "@/scripts/types";
import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import type { Tag as EmblorTag } from "emblor";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ログレベルに応じてログを出力する logger
 * VITE_LOG_LEVEL が `debug` のとき、または VITE_APP_ENV が `local` のときにのみ出力する。
 * @param args ログに表示したいもの
 */
export const logger = (...args: unknown[]) => {
  const logLevel =
    import.meta.env.VITE_LOG_LEVEL ??
    (import.meta.env.VITE_APP_ENV === "local" ? "debug" : "info");

  if (logLevel === "debug") {
    console.debug(...args);
  }
};

/**
 * @param isoString iso形式のcreated_atなどの何か
 * @returns date
 */
export const formatISODate = (isoString: string): string => {
  const date = new Date(isoString);
  return date
    .toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
};

/**
 * unixtime(秒)を hh:ss 形式に変換する
 * @param unixTime date.nowなどのunixtime
 * @returns
 */

export const formatTime = (unixTime: number): string => {
  const minutes = Math.floor(unixTime / 60000);
  const seconds = Math.floor((unixTime % 60000) / 1000);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

/**
 * 今日の日付を取得する
 * @returns yyyy-mm-dd
 */
export const getToday = (): string => {
  const date = new Date();
  return format(date, "yyyy-MM-dd");
};

/**
 * Tag to EmblorTagの変換関数
 * @param tags
 * @returns
 */
export const toEmblorTags = (tags: Tag[]): EmblorTag[] => {
  if (tags?.length) {
    return tags.map((tag) => {
      return { id: `${tag.id}`, text: tag.name };
    });
  }
  return [];
};

/**
 * 配列の最後の要素を取得する
 * @param arr: T[] 配列
 * @returns T | undefined 配列の最後の要素。空配列の場合は undefined
 */
export const getLast = <T>(arr: readonly T[]): T | undefined => {
  if (!arr.length) {
    return undefined;
  }
  return arr[arr.length - 1];
};
