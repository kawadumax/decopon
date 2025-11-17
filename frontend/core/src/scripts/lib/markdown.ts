import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]*`/g;
const LINK_PATTERN = /\[[^\]]*?\]\([^)]*?\)/g;
const URL_PATTERN = /https?:\/\/\S+/g;

const TAG_PATTERN = /(^|[\s.,;:!?(){}\[\]"'“”‘’])#([0-9A-Za-z][\w-]{0,63})/g;

const schema = JSON.parse(JSON.stringify(defaultSchema));
schema.attributes ||= {};
schema.attributes.span = [
  ...(schema.attributes.span || []),
  ["className"],
];

const hashtagHighlighter = () => (tree: unknown) => {
  visit(tree, "text", (node: { value: string }, index, parent: any) => {
    const value = node.value;
    if (!value) return;
    const parts: any[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TAG_PATTERN.exec(value)) !== null) {
      const [full, prefix, tag] = match;
      const start = match.index;
      const end = start + full.length;
      if (start > lastIndex) {
        parts.push({ type: "text", value: value.slice(lastIndex, start) });
      }
      if (prefix) {
        parts.push({ type: "text", value: prefix });
      }
      parts.push({
        type: "element",
        tagName: "span",
        properties: { className: ["log-hashtag"] },
        children: [{ type: "text", value: `#${tag}` }],
      });
      lastIndex = end;
    }
    if (parts.length === 0) return;
    if (lastIndex < value.length) {
      parts.push({ type: "text", value: value.slice(lastIndex) });
    }
    parent.children.splice(index, 1, ...parts);
  });
};

const markdownRenderer = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(hashtagHighlighter)
  .use(rehypeSanitize, schema)
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
