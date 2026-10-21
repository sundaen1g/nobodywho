// Types for the Emscripten JS glue in `./uniffi.js`, generated with
// `-sMODULARIZE=1 -sEXPORT_ES6=1` by `uniffi/build.rs`.
interface EmscriptenModule {
  // Requested with `-sEXPORTED_RUNTIME_METHODS=wasmExports`.
  wasmExports: WebAssembly.Exports;
}

export default function createEmscriptenModule(
  moduleArg?: Record<string, unknown>,
): Promise<EmscriptenModule>;
