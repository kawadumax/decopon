import type { Tag } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import type { Tag as EmblorTag } from "emblor";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * ローカルでのみ表示されるconsole.log
 * @param args ログに表示したいもの
 */
export const logger = (...args: unknown[]) => {
	const viteAppEnv = import.meta.env.VITE_APP_ENV;
	if (viteAppEnv === "local") {
		console.log(...args);
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
 * @returns T 配列の最後の要素
 */
export const getLast = <T>(arr: T[]): T => {
	return arr[arr.length - 1];
};
