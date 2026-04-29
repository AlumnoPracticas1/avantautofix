export interface ErrorPayload {
  source: string;
  message: string;
  file: string | null;
  line: number;
  stack: string | null;
  extra?: Record<string, unknown>;
}

export interface InitOptions {
  /** URL del endpoint /report del orquestador HAM. Por defecto http://127.0.0.1:8000/report */
  endpoint?: string;
  /** URL del endpoint /hello (registro). Si se omite, se deriva de `endpoint` reemplazando /report por /hello. */
  helloEndpoint?: string | null;
  /** Enviar un /hello al iniciar para registrar la página como "escuchando". Por defecto true. */
  sendHello?: boolean;
  /** Etiqueta del origen. Por defecto "js". */
  source?: string;
  /** Capturar respuestas 4xx/5xx de fetch. Por defecto true. */
  captureFetch?: boolean;
  /** Capturar errores de carga de recursos (img/script/link). Por defecto true. */
  captureResources?: boolean;
  /** Capturar promesas rechazadas. Por defecto true. */
  captureUnhandledRejections?: boolean;
  /** Deduplicar errores idénticos en la misma sesión. Por defecto true. */
  dedupe?: boolean;
  /** Etiqueta de aplicación que se añade a `extra.app`. */
  appName?: string | null;
  /** Versión/release que se añade a `extra.release`. */
  release?: string | null;
  /** Hook para mutar o descartar (return false) el payload antes de enviar. */
  beforeSend?: ((payload: ErrorPayload) => ErrorPayload | false | null | void) | null;
}

export function init(options?: InitOptions): void;
export function captureError(err: Error | string, extra?: Record<string, unknown>): void;
export function shutdown(): void;

declare const _default: { init: typeof init; captureError: typeof captureError; shutdown: typeof shutdown };
export default _default;
