import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]*`/g;
const LINK_PATTERN = /\[[^\]]*?\]\([^)]*?\)/g;
const URL_PATTERN = /https?:\/\/\S+/g;

const TAG_PATTERN = /(^|[\s.,;:!?(){}\[\]"'“”‘’])#([0-9A-Za-z][\w-]{0,63})/g;

const markdownRenderer = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

export const renderMarkdown = (text: string): string => {
  if (!text) return "";
  try {
    return markdownRenderer.processSync(text).toString();
  } catch (error) {
    console.warn("Failed to render markdown", error);
    return text;
  }
};

export const maskMarkdownSegments = (text: string): string =>
  text
    .replace(CODE_BLOCK_PATTERN, " ")
    .replace(INLINE_CODE_PATTERN, " ")
    .replace(LINK_PATTERN, " ")
    .replace(URL_PATTERN, " ");

export const extractTagsFromMarkdown = (text: string): string[] => {
  if (!text) {
    return [];
  }
  const masked = maskMarkdownSegments(text);
  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = TAG_PATTERN.exec(masked)) !== null) {
    const [, , tag] = match;
    if (tag) {
      tags.add(tag);
    }
  }
  return Array.from(tags);
};
