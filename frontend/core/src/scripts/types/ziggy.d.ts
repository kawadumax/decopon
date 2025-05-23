declare module "@lib/ziggy.js" {
  export const Ziggy: {
    url: string;
    port?: number;
    routes: Record<
      string,
      {
        uri: string;
        methods: string[];
        parameters?: string[];
        bindings?: Record<string, string>;
      }
    >;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    defaults?: Record<string, any>;
  };

  /**
   * Laravel Ziggy が提供する route 関数の概略型
   * @example route('api.tasks.index') -> string
   * @example route('api.tasks.show', { task: 5 }) -> string
   */
  export function route(
    name: string,
    params?: Record<string, string | number | (string | number)[]>,
    absolute?: boolean,
    config?: { onlyUri?: boolean },
  ): string;
}
