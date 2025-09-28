import { ApiError, type ApiRequest, type ApiTransport, type TransportResponse } from "../types";
import type { IpcCommandMatcher } from "./ipc/commands/types";
import { ipcCommandMatchers } from "./ipc/commands";
import { getTauriInvoke, type IpcCommand, type InvokeFn, toApiError } from "./ipc/shared";

const forcedTransport = (
  import.meta.env as unknown as Record<string, string | undefined>
).VITE_APP_TRANSPORT as "http" | "ipc" | undefined;

export function createIpcTransport(): ApiTransport | null {
  if (forcedTransport === "http") {
    return null;
  }

  const invoke = getTauriInvoke();
  if (!invoke) {
    return null;
  }

  return new IpcTransport(invoke, ipcCommandMatchers);
}

class IpcTransport implements ApiTransport {
  readonly kind = "ipc" as const;

  private readonly commandCache = new WeakMap<ApiRequest, IpcCommand | null>();

  constructor(
    private readonly invoke: InvokeFn,
    private readonly matchers: readonly IpcCommandMatcher[],
  ) {}

  canHandle(request: ApiRequest): boolean {
    return this.findCommand(request) !== null;
  }

  async send<T>(request: ApiRequest): Promise<TransportResponse<T>> {
    const match = this.findCommand(request);
    this.commandCache.delete(request);
    if (!match) {
      throw new ApiError("IPC transport does not support this request.", {
        code: "transport.unsupported",
        data: {
          message: "IPC transport does not support this request.",
        },
      });
    }

    try {
      const raw = await this.invoke(match.command, match.payload);
      const data = match.transform(raw) as T;
      return { data, status: match.status ?? 200 };
    } catch (error) {
      throw toApiError(error);
    }
  }

  private findCommand(request: ApiRequest): IpcCommand | null {
    const cached = this.commandCache.get(request);
    if (cached !== undefined) {
      return cached;
    }

    for (const match of this.matchers) {
      const command = match(request);
      if (command) {
        this.commandCache.set(request, command);
        return command;
      }
    }

    this.commandCache.set(request, null);
    return null;
  }
}
