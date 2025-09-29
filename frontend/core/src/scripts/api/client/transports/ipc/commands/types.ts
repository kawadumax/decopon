import { getPathname } from "../shared";
import type { ApiMethod, ApiRequest } from "../../../types";
import type { IpcCommand } from "../shared";

export type RegexPathCondition<TMatch> = {
  pattern: RegExp;
  map?: (match: RegExpMatchArray) => TMatch | null;
};

export type CustomPathCondition<TMatch> = {
  match: (pathname: string) => TMatch | null;
};

export type PathCondition<TMatch> =
  | string
  | RegExp
  | RegexPathCondition<TMatch>
  | CustomPathCondition<TMatch>;

export type IpcCommandDefinition<TMatch = undefined> = {
  method: ApiMethod;
  path: PathCondition<TMatch>;
  command: string;
  buildPayload: (request: ApiRequest, match: TMatch) => Record<string, unknown>;
  transform: (raw: unknown) => unknown;
  status?: number;
};

export type IpcCommandMatcher = (request: ApiRequest) => IpcCommand | null;

export function createCommandMatchers<
  TDefinitions extends readonly IpcCommandDefinition<any>[],
>(definitions: TDefinitions): IpcCommandMatcher[] {
  return definitions.map((definition) => createCommandMatcher(definition));
}

function createCommandMatcher<TMatch>(
  definition: IpcCommandDefinition<TMatch>,
): IpcCommandMatcher {
  return (request) => {
    if (request.method !== definition.method) {
      return null;
    }

    const pathname = getPathname(request.url);
    const match = matchPath(pathname, definition.path);
    if (match === null) {
      return null;
    }

    const payload = definition.buildPayload(request, match);
    const command: IpcCommand = {
      command: definition.command,
      payload,
      transform: definition.transform,
    };

    if (definition.status !== undefined) {
      command.status = definition.status;
    }

    return command;
  };
}

function matchPath<TMatch>(
  pathname: string,
  condition: PathCondition<TMatch>,
): TMatch | null {
  if (typeof condition === "string") {
    return pathname === condition ? (undefined as unknown as TMatch) : null;
  }

  if (condition instanceof RegExp) {
    const result = pathname.match(condition);
    return (result as unknown as TMatch | null) ?? null;
  }

  if (isRegexPathCondition(condition)) {
    const result = pathname.match(condition.pattern);
    if (!result) {
      return null;
    }

    if (condition.map) {
      return condition.map(result) ?? null;
    }

    return result as unknown as TMatch;
  }

  if (isCustomPathCondition(condition)) {
    return condition.match(pathname);
  }

  return null;
}

function isRegexPathCondition<TMatch>(
  condition: PathCondition<TMatch>,
): condition is RegexPathCondition<TMatch> {
  return (
    typeof condition === "object" &&
    condition !== null &&
    "pattern" in condition &&
    condition.pattern instanceof RegExp
  );
}

function isCustomPathCondition<TMatch>(
  condition: PathCondition<TMatch>,
): condition is CustomPathCondition<TMatch> {
  return (
    typeof condition === "object" &&
    condition !== null &&
    "match" in condition &&
    typeof condition.match === "function"
  );
}
