import type { ApiRequest } from "../../../types";
import type { IpcCommand } from "../shared";

export type IpcCommandMatcher = (request: ApiRequest) => IpcCommand | null;
