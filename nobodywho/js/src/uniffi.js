// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// When targeting node and ES6 we use `await import ..` in the generated code
// so the outer function needs to be marked as async.
async function Module(moduleArg = {}) {
  var Module = moduleArg;
// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split('-')[0]; // Remove any trailing part from e.g. "12.53.3-alpha"
    let vers = str.split('.').slice(0, 3);
    while(vers.length < 3) vers.push('00');
    vers = vers.map((n, i, arr) => n.padStart(2, '0'));
    return vers.join('');
  }
  // 300000 -> "30.0.0"
  const packedVersionToHumanReadable = n => [n / 10_000 | 0, (n / 100 | 0) % 100, n % 100].join('.');

  const TARGET_NOT_SUPPORTED = 2147483647;

  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.

  // We skip the node version checking when running on Bun/Deno since the node
  // version they report doesn't seem to be useful.
  if (typeof process !== 'undefined' && !process.versions?.bun && typeof Deno === "undefined") {
    const currentNodeVersion = process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
    if (currentNodeVersion < 180300) {
      throw new Error(`This emscripten-generated code requires node v${ packedVersionToHumanReadable(180300) } (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
    }
  }

  const userAgent = typeof navigator !== 'undefined' && navigator.userAgent;
  if (!userAgent) {
    return;
  }

  const currentSafariVersion = userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < 150200) {
    throw new Error(`This emscripten-generated code requires Safari v${ packedVersionToHumanReadable(150200) } (detected v${currentSafariVersion})`);
  }

  const currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 100) {
    throw new Error(`This emscripten-generated code requires Firefox v100 (detected v${currentFirefoxVersion})`);
  }

  const currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 95) {
    throw new Error(`This emscripten-generated code requires Chrome v95 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // When building an ES module `require` is not normally available.
  // We need to use `createRequire()` to construct the require()` function.
  const { createRequire } = await import('node:module');
  /** @suppress{duplicate} */
  var require = createRequire(import.meta.url);

}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


var programArgs = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

var _scriptName = import.meta.url;

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  const isNode = globalThis.process?.versions?.node && globalThis.process?.type != 'renderer';
  if (!isNode) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('node:fs');

  if (_scriptName.startsWith('file:')) {
    scriptDirectory = require('node:path').dirname(require('node:url').fileURLToPath(_scriptName)) + '/';
  }

// include: node_shell_read.js
readBinary = (filename) => {
  // We need to re-wrap `file://` strings to URLs.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename);
  assert(Buffer.isBuffer(ret));
  return ret;
};

readAsync = async (filename, binary = true) => {
  // See the comment in the `readBinary` function.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename, binary ? undefined : 'utf8');
  assert(binary ? Buffer.isBuffer(ret) : typeof ret === 'string');
  return ret;
};
// end include: node_shell_read.js
  if (process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, '/');
  }

  programArgs = process.argv.slice(2);

  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };

} else
if (ENVIRONMENT_IS_SHELL) {

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL('.', _scriptName).href; // includes trailing slash
  } catch {
    // Must be a `blob:` or `data:` URL (e.g. `blob:http://site.com/etc/etc`), we cannot
    // infer anything from them.
  }

  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
    // See https://github.com/github/fetch/pull/92#issuecomment-140665932
    // Cordova or Electron apps are typically loaded from a file:// url.
    // So use XHR on webview if URL is a file URL.
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = console.log.bind(console);
var err = console.error.bind(console);

var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time (add `shell` to `-sENVIRONMENT` to enable)');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;

if (!globalThis.WebAssembly) {
  err('no native wasm support detected');
}

// Wasm globals

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_common.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true; // Switch to false at runtime to disable logging at the right times

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug !== 'undefined') return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  const h16 = new Int16Array(1);
  const h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) abort('Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)');
})();

function consumedModuleProp(prop) {
  let value = Module[prop];
  const msg = `Attempt to modify \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`;
  if (Array.isArray(value)) {
    value = new Proxy(value, {
      set(target, key, val) {
        abort(msg);
        return false;
      },
      defineProperty(target, key, descriptor) {
        abort(msg);
        return false;
      },
      deleteProperty(target, key) {
        abort(msg);
        return false;
      }
    });
  }
  Object.defineProperty(Module, prop, {
    configurable: true,
    get() { return value; },
    set() {
      abort(msg);
    }
  });
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);

}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_preloadFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingLibrarySymbol(sym) {

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        let msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      },
    });
  }
}

// end include: runtime_debug.js
// include: runtime_stack_check.js
const stackCookie1 = 0x02135467;
const stackCookie2 = 0x89BACDFE;

// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  let max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = stackCookie1;
  HEAPU32[(((max)+(4))>>2)] = stackCookie2;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function u32ToHexString(num) {
  return '0x' + (num >>> 0).toString(16).padStart(8, '0');
}

function checkStackCookie() {
  if (ABORT) return;
  let max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  const val1 = HEAPU32[((max)>>2)];
  const val2 = HEAPU32[(((max)+(4))>>2)];
  if (val1 != stackCookie1 || val2 != stackCookie2) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords ${u32ToHexString(stackCookie2)} and ${u32ToHexString(stackCookie1)}, but received ${u32ToHexString(val2)} ${u32ToHexString(val1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// Memory management

var runtimeInitialized = false;



// When ALLOW_MEMORY_GROWTH is enabled, the conversion from Wasm
// memory to ArrayBuffer requires some additional logic.
function getMemoryBuffer() {
  return wasmMemory.buffer;
}

function updateMemoryViews() {
  // If we already have a heap that is resizeable/growable buffer we don't
  // need to do anything in updateMemoryViews.
  if (HEAP8?.buffer?.resizable) return;
  var b = getMemoryBuffer();
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set,
       'JS engine does not provide full typed array support');

function preRun() {
  var preRun = Module['preRun'];
  if (preRun) {
    if (typeof preRun === 'function') preRun = [preRun];
    onPreRuns.push(...preRun);
  }
  consumedModuleProp('preRun');
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
  // End ATPRERUNS hooks
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  // Begin ATINITS hooks
  SOCKFS.root = FS.mount(SOCKFS, {}, null);
if (!Module['noFSInit'] && !FS.initialized) FS.init();
TTY.init();
  // End ATINITS hooks

  wasmExports['__wasm_call_ctors']();

  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
  // End ATPOSTCTORS hooks

  checkStackCookie();
}

function postRun() {
  checkStackCookie();

  var postRun = Module['postRun'];
  if (postRun) {
    if (typeof postRun === 'function') postRun = [postRun];
    onPostRuns.push(...postRun);
  }
  consumedModuleProp('postRun');

  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
  // End ATPOSTRUNS hooks
}

/**
 * @param {string|number=} what
 */
function abort(what) {
  Module['onAbort']?.(what);

  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // See above, in the meantime, we resort to wasm code for trapping.
  //
  // In case abort() is called before the module is initialized, wasmExports
  // and its exported '__trap' function is not available, in which case we throw
  // a RuntimeError.
  //
  // We trap instead of throwing RuntimeError to prevent infinite-looping in
  // Wasm EH code (because RuntimeError is considered as a foreign exception and
  // caught by 'catch_all'), but in case throwing RuntimeError is fine because
  // the module has not even been instantiated, even less running.
  if (runtimeInitialized) {
    ___trap();
  }
  throw new WebAssembly.RuntimeError(what);
}

function createExportWrapper(name, func, nargs) {
  assert(func);
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return func(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {

  if (Module['locateFile']) {
    return locateFile('uniffi.wasm');
  }

  // Use bundler-friendly `new URL(..., import.meta.url)` pattern; works in browsers too.
  return new URL('uniffi.wasm', import.meta.url).href;

}

function getBinarySync(file) {
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary
      // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
      && !isFileURI(binaryFile)
      // Avoid using instantiateStreaming() on Node.js since the `fetch()` API
      // does not support `file://` URLs.
      // See: https://github.com/emscripten-core/emscripten/pull/16917
      && !ENVIRONMENT_IS_NODE
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  var imports = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance) {
    wasmExports = instance.exports;

    assignWasmExports(wasmExports);

    Module['wasmExports'] = wasmExports;

    updateMemoryViews();

    return wasmExports;
  }

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  var instantiateWasm = Module['instantiateWasm'];
  if (instantiateWasm) {
    return new Promise((resolve) => {
      try {
        instantiateWasm(info, (inst) => resolve(receiveInstance(inst)));
      } catch(e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        throw e;
      }
    });
  }

  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js

// Begin JS library code


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  /** @type {!Int32Array} */
  var HEAP32;

  /** @type {!Int8Array} */
  var HEAP8;

  /** @type {!Uint32Array} */
  var HEAPU32;

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);

  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);


  var noExitRuntime = true;

  function ptrToString(ptr) {
      assert(typeof ptr === 'number', `ptrToString expects a number, got ${typeof ptr}`);
      // Convert to 32-bit unsigned value
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    }

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
      }
    };

  

  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  
  
    /**
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul
   * @return {number}
   */
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead;
      if (ignoreNul) return maxIdx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // As a tiny code save trick, compare idx against maxIdx using a negation,
      // so that maxBytesToRead=undefined/NaN means Infinity.
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
      return idx;
    };
  
  
    /**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  
      // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce(`Invalid UTF-8 leading byte ${ptrToString(u0)} encountered when deserializing a UTF-8 string in wasm memory to a JS string!`);
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
  /** @type {!Uint8Array} */
  var HEAPU8;
  
    /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
      assert(typeof ptr === 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : '';
    };
  var ___assert_fail = (condition, filename, line, func) =>
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);

  var initRandomFill = () => {
      // This block is not needed on v19+ since crypto.getRandomValues is builtin
      if (ENVIRONMENT_IS_NODE) {
        var nodeCrypto = require('node:crypto');
        return (view) => (nodeCrypto.randomFillSync(view), 0);
      }
  
      return (view) => (crypto.getRandomValues(view), 0);
    };
  var randomFill = (view) => (randomFill = initRandomFill())(view);
  
  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.slice(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.slice(0, -1);
        }
        return root + dir;
      },
  basename:(path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
join:(...paths) => PATH.normalize(paths.join('/')),
join2:(l, r) => PATH.normalize(l + '/' + r),
};


var PATH_FS = {
resolve:(...args) => {
      var resolvedPath = '',
        resolvedAbsolute = false;
      for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? args[i] : FS.cwd();
        // Skip empty and invalid entries
        if (typeof path !== 'string') {
          throw new TypeError('Arguments to path.resolve must be strings');
        } else if (!path) {
          return ''; // an invalid portion invalidates the whole thing
        }
        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = PATH.isAbs(path);
      }
      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)
      resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    },
relative:(from, to) => {
      from = PATH_FS.resolve(from).slice(1);
      to = PATH_FS.resolve(to).slice(1);
      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== '') break;
        }
        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== '') break;
        }
        if (start > end) return [];
        return arr.slice(start, end - start + 1);
      }
      var fromParts = trim(from.split('/'));
      var toParts = trim(to.split('/'));
      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
      }
      var outputParts = [];
      for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }
      outputParts = outputParts.concat(toParts.slice(samePartsLength));
      return outputParts.join('/');
    },
};



var FS_stdin_getChar_buffer = [];

var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
      // unit, not a Unicode code point of the character! So decode
      // UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var c = str.charCodeAt(i); // possibly a lead surrogate
      if (c <= 0x7F) {
        len++;
      } else if (c <= 0x7FF) {
        len += 2;
      } else if (c >= 0xD800 && c <= 0xDFFF) {
        len += 4; ++i;
      } else {
        len += 3;
      }
    }
    return len;
  };

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
    // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
    // undefined and false each don't write out any bytes.
    if (!(maxBytesToWrite > 0))
      return 0;

    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
    for (var i = 0; i < str.length; ++i) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
      // and https://www.ietf.org/rfc/rfc2279.txt
      // and https://tools.ietf.org/html/rfc3629
      var u = str.codePointAt(i);
      if (u <= 0x7F) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u;
      } else if (u <= 0x7FF) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 0xC0 | (u >> 6);
        heap[outIdx++] = 0x80 | (u & 63);
      } else if (u <= 0xFFFF) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 0xE0 | (u >> 12);
        heap[outIdx++] = 0x80 | ((u >> 6) & 63);
        heap[outIdx++] = 0x80 | (u & 63);
      } else {
        if (outIdx + 3 >= endIdx) break;
        if (u > 0x10FFFF) warnOnce(`Invalid Unicode code point ${ptrToString(u)} encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).`);
        heap[outIdx++] = 0xF0 | (u >> 18);
        heap[outIdx++] = 0x80 | ((u >> 12) & 63);
        heap[outIdx++] = 0x80 | ((u >> 6) & 63);
        heap[outIdx++] = 0x80 | (u & 63);
        // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
        // We need to manually skip over the second code unit for correct iteration.
        i++;
      }
    }
    // Null-terminate the pointer to the buffer.
    heap[outIdx] = 0;
    return outIdx - startIdx;
  };
/** @type {function(string, boolean=, number=)} */
  var intArrayFromString = (stringy, dontAddNull, length) => {
      var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    };
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          // we will read data by chunks of BUFSIZE
          var BUFSIZE = 256;
          var buf = Buffer.alloc(BUFSIZE);
          var bytesRead = 0;
  
          try {
            bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE);
          } catch(e) {
            // Cross-platform differences: on Windows, reading EOF throws an
            // exception, but on other OSes, reading EOF returns 0. Uniformize
            // behavior by treating the EOF exception to return 0.
            if (e.toString().includes('EOF')) bytesRead = 0;
            else throw e;
          }
  
          if (bytesRead > 0) {
            result = buf.toString('utf-8', 0, bytesRead);
          }
        } else
        if (globalThis.window?.prompt) {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else
        {}
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && !bytesRead) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
            // We currently only support canonical mode (ICANON), where
            // read(2) returns as soon as a line delimiter is read.
            if (result === 10) break;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  },
  };
  
  
  var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
  
  var alignMemory = (size, alignment) => {
      assert(alignment, 'alignment argument is required');
      return Math.ceil(size / alignment) * alignment;
    };
  var mmapAlloc = (size) => {
      size = alignMemory(size, 65536);
      var ptr = _emscripten_builtin_memalign(65536, size);
      if (ptr) zeroMemory(ptr, size);
      return ptr;
    };
  
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
      },
  createNode(parent, name, mode, dev = undefined) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // not supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
          dir: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              lookup: MEMFS.node_ops.lookup,
              mknod: MEMFS.node_ops.mknod,
              rename: MEMFS.node_ops.rename,
              unlink: MEMFS.node_ops.unlink,
              rmdir: MEMFS.node_ops.rmdir,
              readdir: MEMFS.node_ops.readdir,
              symlink: MEMFS.node_ops.symlink
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek
            }
          },
          file: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek,
              read: MEMFS.stream_ops.read,
              write: MEMFS.stream_ops.write,
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync
            }
          },
          link: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              readlink: MEMFS.node_ops.readlink
            },
            stream: {}
          },
          chrdev: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: FS.chrdev_stream_ops
          }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          // The actual number of bytes used in the typed array, as opposed to
          // contents.length which gives the whole capacity.
          node.usedBytes = 0;
          // The byte data of the file is stored in a typed array.
          // Note: typed arrays are not resizable like normal JS arrays are, so
          // there is a small penalty involved for appending file writes that
          // continuously grow a file similar to std::vector capacity vs used.
          node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        assert(FS.isFile(node.mode), 'getFileDataAsTypedArray called on non-file');
        return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents.length;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very
        // small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for
        // large sizes, do a much more conservative size*1.125 increase to avoid
        // overshooting the allocation cap by a very large margin.
        const CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = MEMFS.getFileDataAsTypedArray(node);
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        node.contents.set(oldContents);
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        var oldContents = node.contents;
        node.contents = new Uint8Array(newSize); // Allocate new storage.
        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
        node.usedBytes = newSize;
      },
  node_ops:{
  getattr(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          for (const key of ['mode', 'atime', 'mtime', 'ctime']) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          throw new FS.ErrnoError(44);
        },
  mknod(parent, name, mode, dev = undefined) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {}
          if (new_node && FS.isDir(old_node.mode)) {
            // if we're overwriting a directory at new_name, make sure it's empty.
            for (var i in new_node.contents) {
              throw new FS.ErrnoError(55);
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  readdir(node) {
          return ['.', '..', ...Object.keys(node.contents)];
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          buffer.set(contents.subarray(position, position + size), offset);
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          assert(buffer.subarray, 'FS.write expects a TypedArray');
          // If the buffer is located in main memory (HEAP), and if
          // memory can grow, we can't hold on to references of the
          // memory buffer, as they may get invalidated. That means we
          // need to copy its contents.
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
  
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
  
          if (canOwn) {
            assert(!position, 'canOwn must imply no weird position inside the file');
            node.contents = buffer.subarray(offset, offset + length);
            node.usedBytes = length;
          } else if (!node.usedBytes && !position) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
            node.contents = buffer.slice(offset, offset + length);
            node.usedBytes = length;
          } else {
            MEMFS.expandFileStorage(node, position+length);
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
            node.usedBytes = Math.max(node.usedBytes, position + length);
          }
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  
  var FS_modeStringToFlags = (str) => {
      if (typeof str !== 'string') return str;
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags === 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  
  var FS_fileDataToTypedArray = (data) => {
      if (typeof data === 'string') {
        data = intArrayFromString(data, true);
      }
      if (!data.subarray) {
        data = new Uint8Array(data);
      }
      return data;
    };
  
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  
  
  
  
  var strError = (errno) => UTF8ToString(_strerror(errno));
  
  var ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };
  
  
  var asyncLoad = async (url) => {
      var arrayBuffer = await readAsync(url);
      assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
      return new Uint8Array(arrayBuffer);
    };
  
  
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  
  var getUniqueRunDependency = (id) => {
      var orig = id;
      while (1) {
        if (!runDependencyTracking[id]) return id;
        id = orig + Math.random();
      }
    };
  
  var dependenciesPromise = null;
  var resolveRunDependencies = async () => dependenciesPromise;
  var runDependencies = 0;
  
  
  var dependenciesPromiseResolve = null;
  
  var runDependencyTracking = {
  };
  
  var runDependencyWatcher = null;
  var removeRunDependency = (id) => {
      runDependencies--;
  
      Module['monitorRunDependencies']?.(runDependencies);
  
      assert(id, 'removeRunDependency requires an ID');
      assert(runDependencyTracking[id]);
      delete runDependencyTracking[id];
      if (!runDependencies) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        dependenciesPromiseResolve();
      }
    };
  
  
  
  
  var addRunDependency = (id) => {
      if (!runDependencies) {
        dependenciesPromise = new Promise((resolve) => dependenciesPromiseResolve = resolve);
      }
      runDependencies++;
  
      Module['monitorRunDependencies']?.(runDependencies);
  
      assert(id, 'addRunDependency requires an ID')
      assert(!runDependencyTracking[id]);
      runDependencyTracking[id] = 1;
      if (!runDependencyWatcher && globalThis.setInterval) {
        // Check for missing dependencies every few seconds
        runDependencyWatcher = setInterval(() => {
          if (ABORT) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
            return;
          }
          var shown = false;
          for (var dep in runDependencyTracking) {
            if (!shown) {
              shown = true;
              err('still waiting on run dependencies:');
            }
            err(`dependency: ${dep}`);
          }
          if (shown) {
            err('(end of list)');
          }
        }, 10_000);
        // Prevent this timer from keeping the runtime alive if nothing
        // else is.
        runDependencyWatcher.unref?.()
      }
    };
  
  
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
      // Ensure plugins are ready.
      if (typeof Browser !== 'undefined') Browser.init();
  
      for (var plugin of preloadPlugins) {
        if (plugin['canHandle'](fullname)) {
          assert(plugin['handle'].constructor.name === 'AsyncFunction', 'Filesystem plugin handlers must be async functions (See #24914)')
          return plugin['handle'](byteArray, fullname);
        }
      }
      // If no plugin handled this file then return the original/unmodified
      // byteArray.
      return byteArray;
    };
  var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
      // TODO we should allow people to just pass in a complete filename instead
      // of parent and name being that we just join them anyways
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
      addRunDependency(dep);
  
      try {
        var byteArray = url;
        if (typeof url === 'string') {
          byteArray = await asyncLoad(url);
        }
  
        byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
        preFinish?.();
        if (!dontCreateFile) {
          FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
        }
      } finally {
        removeRunDependency(dep);
      }
    };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
      FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
    };
  
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:[],
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  syncFSRequests:0,
  ErrnoError:class extends Error {
        name = 'ErrnoError';
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          super(runtimeInitialized ? strError(errno) : '');
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
        }
      },
  FSStream:class {
        shared = {};
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.rdev = rdev;
          this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
        // The per-inode readiness wait-queue. The node carries a Set of listener
        // entries {cb}; producers (SOCKFS, PIPEFS) call notifyListeners on a
        // readiness transition, and poll()/epoll consume it. It lives on the node
        // (not the fd) so dup'd fds share one queue. Only nodes that derive real
        // readiness (sockets, pipes, and an epoll's own node) ever use this -
        // always-ready types (regular files, ttys) never register or notify.
        addListener(cb, exclusive = false) {
          var entry = {cb, exclusive};
          var listeners = (this.listeners ??= new Set());
          listeners.add(entry);
          return {listeners, entry};
        }
        notifyListeners(flags) {
          // Iterates the set without copying, which is safe ONLY under a
          // load-bearing contract that every internal listener must honour:
          //   1. A listener must not run user code synchronously (a poll waiter only
          //      resolves a Promise; an epoll registration only re-lists +
          //      re-notifies; the epoll callback only schedules a tick). User code
          //      runs on a later tick, never inside this loop.
          //   2. A listener may delete entries only from ITS OWN waiter, never from
          //      a sibling node's set that may be mid-iteration. (Deleting an entry
          //      of the set being iterated here is fine - a Set tolerates removal of
          //      a not-yet-visited entry mid-iteration; mutating a *different* node's
          //      set is fine because that set is not being iterated.)
          // Violating either gives silently skipped wakeups that are near-impossible
          // to reproduce. Any new producer/listener must preserve it.
          if (!this.listeners) return;
          // Fire every non-exclusive listener. Among EPOLLEXCLUSIVE registrations
          // (one fd watched by several epolls) wake only one, rotating round-robin
          // per node, to avoid a thundering herd. (Only epoll registrations are ever
          // exclusive; poll waiters and a node's own consumers are not.)
          var excl;
          for (var entry of this.listeners) {
            if (entry.exclusive) (excl ||= []).push(entry);
            else entry.cb(flags);
          }
          if (excl) {
            var i = (this.exclTurn || 0) % excl.length;
            this.exclTurn = i + 1;
            excl[i].cb(flags);
          }
        }
      },
  lookupPath(path, opts = {}) {
        if (!path) {
          throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true
  
        if (!PATH.isAbs(path)) {
          path = FS.cwd() + '/' + path;
        }
  
        // limit max consecutive symlinks to SYMLOOP_MAX.
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
          // split the absolute path
          var parts = path.split('/').filter((p) => !!p);
  
          // start at the root
          var current = FS.root;
          var current_path = '/';
  
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
  
            if (parts[i] === '.') {
              continue;
            }
  
            if (parts[i] === '..') {
              current_path = PATH.dirname(current_path);
              if (FS.isRoot(current)) {
                path = current_path + '/' + parts.slice(i + 1).join('/');
                // We're making progress here, don't let many consecutive ..'s
                // lead to ELOOP
                nlinks--;
                continue linkloop;
              } else {
                current = current.parent;
              }
              continue;
            }
  
            current_path = PATH.join2(current_path, parts[i]);
            try {
              current = FS.lookupNode(current, parts[i]);
            } catch (e) {
              // if noent_okay is true, suppress a ENOENT in the last component
              // and return an object with an undefined node. This is needed for
              // resolving symlinks in the path when creating a file.
              if ((e?.errno === 44) && islast && opts.noent_okay) {
                return { path: current_path };
              }
              throw e;
            }
  
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
              current = current.mounted.root;
            }
  
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (FS.isLink(current.mode) && (!islast || opts.follow)) {
              if (!current.node_ops.readlink) {
                throw new FS.ErrnoError(52);
              }
              var link = current.node_ops.readlink(current);
              if (!PATH.isAbs(link)) {
                link = PATH.dirname(current_path) + '/' + link;
              }
              path = link + '/' + parts.slice(i + 1).join('/');
              continue linkloop;
            }
          }
          return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },
  createNode(parent, name, mode, rdev = undefined) {
        assert(typeof parent === 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        }
        if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        }
        if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
          return 54;
        }
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else if (FS.isDir(node.mode)) {
          return 31;
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        }
        var mode = FS.flagsToPermissionString(flags);
        if (FS.isDir(node.mode)) {
          // opening for write
          // TODO: check for O_SEARCH? (== search for dir only)
          if (mode !== 'r' || (flags & (512 | 64))) {
            return 31;
          }
        }
        return FS.nodePermissions(node, mode);
      },
  checkOpExists(op, err) {
        if (!op) {
          throw new FS.ErrnoError(err);
        }
        return op;
      },
  MAX_OPEN_FDS:4096,
  nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
        assert(fd >= -1);
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  doSetAttr(stream, node, attr) {
        var setattr = stream?.stream_ops.setattr;
        var arg = setattr ? stream : node;
        setattr ??= node.node_ops.setattr;
        FS.checkOpExists(setattr, 63)
        try {
          setattr(arg, attr);
        } catch (e) {
          if (e instanceof RangeError) {
            throw new FS.ErrnoError(22);
          }
          throw e;
        }
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        for (var mount of mounts) {
          if (mount.type.syncfs) {
            mount.type.syncfs(mount, populate, done);
          } else {
            done(null);
          }
        }
      },
  mount(type, opts, mountpoint) {
        if (typeof type === 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        for (var [hash, current] of Object.entries(FS.nameTable)) {
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        }
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
          throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
          throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {follow: true}).node);
      },
  statfsStream(stream) {
        // We keep a separate statfsStream function because noderawfs overrides
        // it. In noderawfs, stream.node is sometimes null. Instead, we need to
        // look at stream.path.
        return FS.statfsNode(stream.node);
      },
  statfsNode(node) {
        // NOTE: None of the defaults here are true. We're just returning safe and
        //       sane values. Currently nodefs and rawfs replace these defaults,
        //       other file systems leave them alone.
        var rtn = {
          bsize: 4096,
          frsize: 4096,
          blocks: 1_000_000,
          bfree: 500_000,
          bavail: 500_000,
          files: FS.nextInode,
          ffree: FS.nextInode - 1,
          fsid: 42,
          flags: 2,
          namelen: 255,
        };
  
        if (node.node_ops.statfs) {
          Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
      },
  create(path, mode = 0o666) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode = 0o777) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode = 0o777) {
        var dirs = path.split('/');
        var d = '';
        for (var dir of dirs) {
          if (!dir) continue;
          if (d || PATH.isAbs(path)) d += '/';
          d += dir;
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev = undefined) {
        if (typeof dev === 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  link(oldpath, newpath, flags) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // Hardlinks are only supported by filesystem backends that provide a
        // `link` node op (e.g. NODERAWFS backed by the host). NODEFS omits it:
        // a host hardlink cannot be confined to the mount root.
        if (!parent.node_ops.link) {
          throw new FS.ErrnoError(34);
        }
        return parent.node_ops.link(parent, newname, oldpath, flags);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          // The replaced node is stale now. Evict it only after the rename
          // succeeded: backends like NODEFS report node.id as st_ino.
          if (new_node) {
            FS.hashRemoveNode(new_node);
          }
          // update old node (we do this here to avoid each backend
          // needing to)
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
      },
  stat(path, dontFollow = false) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
      },
  fstat(fd) {
        var stream = FS.getStreamChecked(fd);
        var node = stream.node;
        var getattr = stream.stream_ops.getattr;
        var arg = getattr ? stream : node;
        getattr ??= node.node_ops.getattr;
        FS.checkOpExists(getattr, 63)
        return getattr(arg);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  doChmod(stream, node, mode, dontFollow = false) {
        FS.doSetAttr(stream, node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          ctime: Date.now(),
          dontFollow
        });
      },
  chmod(path, mode, dontFollow = false) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChmod(null, node, mode, dontFollow);
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.doChmod(stream, stream.node, mode, false);
      },
  doChown(stream, node, dontFollow = false) {
        FS.doSetAttr(stream, node, {
          timestamp: Date.now(),
          dontFollow
          // we ignore the uid / gid for now
        });
      },
  chown(path, uid, gid, dontFollow = false) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChown(null, node, dontFollow);
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.doChown(stream, stream.node, false);
      },
  doTruncate(stream, node, len) {
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.doSetAttr(stream, node, {
          size: len,
          timestamp: Date.now()
        });
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doTruncate(null, node, len);
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if (len < 0 || (stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.doTruncate(stream, stream.node, len);
      },
  utime(path, atime, mtime, dontFollow = false) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        FS.doSetAttr(null, lookup.node, {
          atime: atime,
          mtime: mtime,
          dontFollow
        });
      },
  open(path, flags, mode = 0o666) {
        if (path === '') {
          throw new FS.ErrnoError(44);
        }
        flags = FS_modeStringToFlags(flags);
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path === 'object') {
          node = path;
        } else {
          isDirPath = path.endsWith('/');
          // noent_okay makes it so that if the final component of the path
          // doesn't exist, lookupPath returns `node: undefined`. `path` will be
          // updated to point to the target of all symlinks.
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072),
            noent_okay: true
          });
          node = lookup.node;
          path = lookup.path;
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else if (isDirPath) {
            throw new FS.ErrnoError(31);
          } else {
            // node doesn't exist, try to create it
            // Ignore the permission bits here to ensure we can `open` this new
            // file below. We use chmod below to apply the permissions once the
            // file is open.
            node = FS.mknod(path, mode | 0o777, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (created) {
          FS.chmod(node, mode & 0o777);
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        // The fd is going away: wake anything waiting on it (poll/epoll) with
        // POLLNVAL so a blocking wait unblocks and an epoll registration is evicted
        // on its next derive. Only sockets/pipes/epoll ever carry a wait-queue, so
        // for every other stream (incl. nodeless noderawfs stdio) this is a no-op.
        stream.node?.notifyListeners(32);
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position = undefined) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position = undefined, canOwn = undefined) {
        assert(offset >= 0);
        assert(buffer.subarray, 'FS.write expects a TypedArray');
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2)
            && !(flags & 2)
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags ??= 0;
        opts.encoding ??= 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          abort(`Invalid encoding type "${opts.encoding}"`);
        }
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          buf = UTF8ArrayToString(buf);
        }
        FS.close(stream);
        return buf;
      },
  writeFile(path, data, opts = {}) {
        opts.flags ??= 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        data = FS_fileDataToTypedArray(data);
        FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
          llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (!randomLeft) {
            randomFill(randomBuffer);
            randomLeft = randomBuffer.byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16895, 73);
            node.stream_ops = {
              llseek: MEMFS.stream_ops.llseek,
            };
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                  id: fd + 1,
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              },
              readdir() {
                return Array.from(FS.streams.entries())
                  .filter(([k, v]) => v)
                  .map(([k, v]) => k.toString());
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams(input, output, error) {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (input) {
          FS.createDevice('/dev', 'stdin', input);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
          FS.createDevice('/dev', 'stdout', null, output);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
          FS.createDevice('/dev', 'stderr', null, error);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
      },
  staticInit() {
        FS.nameTable.length = 4096;
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
      },
  init(input = undefined, output = undefined, error = undefined) {
        assert(!FS.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input ??= Module['stdin'];
        output ??= Module['stdout'];
        error ??= Module['stderr'];
  
        FS.createStandardStreams(input, output, error);
      },
  quit() {
        FS.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var stream of FS.streams) {
          if (stream) {
            FS.close(stream);
          }
        }
      },
  analyzePath(path, dontResolveLastLink = false) {
        warnOnce('FS.analyzePath is deprecated; use FS.lookupPath or FS.stat instead');
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },
  createPath(parent, path, canRead = undefined, canWrite = undefined) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
          parent = current;
        }
        return current;
      },
  createFile(parent, name, properties, canRead = undefined, canWrite = undefined) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data = undefined, canRead = undefined, canWrite = undefined, canOwn = undefined) {
        var path = name;
        if (parent) {
          parent = typeof parent === 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          data = FS_fileDataToTypedArray(data);
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input = undefined, output = undefined) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && !bytesRead) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (globalThis.XMLHttpRequest) {
          abort('Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.');
        } else { // Command-line.
          try {
            obj.contents = readBinary(obj.url);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
  createLazyFile(parent, name, url, canRead = undefined, canWrite = undefined) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          lengthKnown = false;
          chunks = []; // Loaded chunks. Index is the chunk number
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
            var datalength = Number(xhr.getResponseHeader('Content-length'));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader('Accept-Ranges')) && header === 'bytes';
            var usesGzip = (header = xhr.getResponseHeader('Content-Encoding')) && header === 'gzip';
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) abort(`invalid range (${from}, ${to}) or no bytes requested!`);
              if (to > datalength-1) abort(`only ${datalength} bytes available! programmer error!`);
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader('Range', `bytes=${from}-${to}`);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText ?? '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] === 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] === 'undefined') abort('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out('LazyFiles on gzip forces download of the whole file when length is accessed');
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (globalThis.XMLHttpRequest) {
          if (!ENVIRONMENT_IS_WORKER) abort('Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc');
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        for (const [key, fn] of Object.entries(node.stream_ops)) {
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        }
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  };
  
  
  var SOCKFS = {
  websocketArgs:{
  },
  callbacks:{
  },
  on(event, callback) {
        SOCKFS.callbacks[event] = callback;
      },
  emit(event, param) {
        SOCKFS.callbacks[event]?.(param);
        // Bridge socket readiness into the inode wait-queue (poll/epoll). The
        // 'error' event carries [fd, ...]; the rest carry the fd directly.
        var fd = event === 'error' ? param[0] : param;
        var flags = {
          'message':    64 | 1,
          'open':       4,
          'connection': 64 | 1,
          'close':      1 | 16,
          'error':      8,
        }[event];
        // 'listen' has no readiness mapping; skip it.
        if (flags) FS.getStream(fd)?.node.notifyListeners(flags);
      },
  mount(mount) {
        // The incoming Module['websocket'] can be used for configuring 
        // subprotocol/url, etc
        SOCKFS.websocketArgs = Module['websocket'] || {};
        // Add the Event registration mechanism to the exported websocket configuration
        // object so we can register network callbacks from native JavaScript too.
        // For more documentation see system/include/emscripten/emscripten.h
        (Module['websocket'] ??= {})['on'] = SOCKFS.on;
  
        return FS.createNode(null, '/', 16895, 0);
      },
  createSocket(family, type, protocol) {
        if (family != 2
           ) {
          throw new FS.ErrnoError(5);
        }
        var flags = 2;
        type &= ~526336; // SOCK_CLOEXEC makes no sense for a single process.
        // Emscripten only supports SOCK_STREAM and SOCK_DGRAM
        if (type != 1 && type != 2) {
          throw new FS.ErrnoError(28);
        }
        var streaming = type == 1;
        // The IPPROTO_TCP protocol guard only applies to INET stream sockets; unix
        // stream sockets use protocol 0.
        if (streaming && protocol && protocol != 6
           ) {
          throw new FS.ErrnoError(66); // if SOCK_STREAM, must be tcp or 0.
        }
  
        // create our internal socket structure
        var sock = {
          family,
          type,
          protocol,
          server: null,
          error: null, // Used in getsockopt for SOL_SOCKET/SO_ERROR test
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node,
          flags,
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },
  getSocket(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },
  stream_ops:{
  getattr(stream) {
          var node = stream.node;
          return {
            dev: 1,
            ino: node.id,
            mode: 49152 | 0o777,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            size: 0,
            atime: new Date(0),
            mtime: new Date(0),
            ctime: new Date(0),
            blksize: 4096,
            blocks: 0,
          };
        },
  poll(stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },
  ioctl(stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },
  read(stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },
  write(stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },
  close(stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        },
  },
  nextname() {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return `socket[${SOCKFS.nextname.current++}]`;
      },
  websocket_sock_ops:{
  createPeer(sock, addr, port = undefined) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // The default value is 'ws://' the replace is needed because the compiler replaces '//' comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the '#' for '//' again.
              var url = 'ws://'.replace('#', '//');
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
              // The default WebSocket options
              var opts = undefined;
  
              // Fetch runtime WebSocket URL config.
              if (SOCKFS.websocketArgs['url']) {
                url = SOCKFS.websocketArgs['url'];
              }
              // Fetch runtime WebSocket subprotocol config.
              if (SOCKFS.websocketArgs['subprotocol']) {
                subProtocols = SOCKFS.websocketArgs['subprotocol'];
              } else if (SOCKFS.websocketArgs['subprotocol'] === null) {
                subProtocols = 'null'
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                var parts = addr.split('/');
                url = url + parts[0] + ':' + port + '/' + parts.slice(1).join('/');
              }
  
              if (subProtocols !== 'null') {
                // The regex trims the string (removes spaces at the beginning and end), then splits the string by
                // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
                subProtocols = subProtocols.replace(/^ +| +$/g,'').split(/ *, */);
  
                opts = subProtocols;
              }
  
              // If node we use the ws library.
              var WebSocketConstructor;
              if (ENVIRONMENT_IS_NODE) {
                WebSocketConstructor = /** @type{(typeof WebSocket)} */(require('ws'));
              } else
              {
                WebSocketConstructor = WebSocket;
              }
              ws = new WebSocketConstructor(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(23);
            }
          }
  
          var peer = {
            addr,
            port,
            socket: ws,
            msg_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.msg_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },
  getPeer(sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },
  addPeer(sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },
  removePeer(sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },
  handlePeerEvents(sock, peer) {
          var first = true;
  
          function handleOpen() {
  
            sock.connecting = false;
            SOCKFS.emit('open', sock.stream.fd);
  
            try {
              var queued = peer.msg_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.msg_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          }
  
          function handleMessage(data) {
            if (typeof data === 'string') {
              var encoder = new TextEncoder(); // should be utf-8
              data = encoder.encode(data); // make a typed array from the string
            } else {
              assert(data.byteLength !== undefined); // must receive an ArrayBuffer
              if (data.byteLength == 0) {
                // An empty ArrayBuffer will emit a pseudo disconnect event
                // as recv/recvmsg will return zero which indicates that a socket
                // has performed a shutdown although the connection has not been disconnected yet.
                return;
              }
              data = new Uint8Array(data); // make a typed array view on the array buffer
            }
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and its key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
            SOCKFS.emit('message', sock.stream.fd);
          }
  
          if (ENVIRONMENT_IS_NODE) {
             // EventEmitter-style events use by ws library objects in Node.js).
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', (data, isBinary) => {
              if (!isBinary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer); // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('close', () => SOCKFS.emit('close', sock.stream.fd));
            peer.socket.on('error', (error) =>{
              // Although the ws library may pass errors that may be more descriptive than
              // ECONNREFUSED they are not necessarily the expected error code e.g.
              // ENOTFOUND on getaddrinfo seems to be node.js specific, so using ECONNREFUSED
              // is still probably the most useful thing to do.
              sock.error = 14; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
              SOCKFS.emit('error', [sock.stream.fd, sock.error, 'ECONNREFUSED: Connection refused']);
            });
            return;
          }
          peer.socket.onopen = handleOpen;
          peer.socket.onclose = () => SOCKFS.emit('close', sock.stream.fd);
          peer.socket.onmessage = (event) => handleMessage(event.data);
          peer.socket.onerror = (error) => {
            // The WebSocket spec only allows a 'simple event' to be thrown on error,
            // so we only really know as much as ECONNREFUSED.
            sock.error = 14; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
            SOCKFS.emit('error', [sock.stream.fd, sock.error, 'ECONNREFUSED: Connection refused']);
          };
        },
  poll(sock) {
          if (sock.type === 1 && (sock.server || sock.listening)) {
            if (sock.error) {
              return 8;
            }
            if (!sock.server) {
              return 16;
            }
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          if (sock.error) {
            mask |= 8;
          }
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            // When an non-blocking connect fails mark the socket as writable.
            // Its up to the calling code to then use getsockopt with SO_ERROR to
            // retrieve the error.
            // See https://man7.org/linux/man-pages/man2/connect.2.html
            if (sock.connecting) {
              mask |= 4;
            } else  {
              // A closed peer is both a full hangup and a read-side hangup.
              mask |= 16 | 8192;
            }
          }
  
          return mask;
        },
  ioctl(sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)] = bytes;
              return 0;
            case 21537:
              var on = HEAP32[((arg)>>2)];
              if (on) {
                sock.stream.flags |= 2048;
              } else {
                sock.stream.flags &= ~2048;
              }
              return 0;
            default:
              return 28;
          }
        },
  close(sock) {
          sock.listening = false;
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          for (var peer of Object.values(sock.peers)) {
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },
  bind(sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(28);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port;
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e.name === 'ErrnoError')) throw e;
              if (e.errno !== 138) throw e;
            }
          }
        },
  connect(sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(138);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(7);
              } else {
                throw new FS.ErrnoError(30);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // because we cannot synchronously block to wait for the WebSocket
          // connection to complete, we return here pretending that the connection
          // was a success.
          sock.connecting = true;
        },
  listen(sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(138);
          }
          if (sock.server || sock.listening) {
             throw new FS.ErrnoError(28);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host,
            port: sock.sport
            // TODO support backlog
          });
          sock.listening = true;
          SOCKFS.emit('listen', sock.stream.fd); // Send Event with listen fd.
  
          sock.server.on('connection', (ws) => {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
              SOCKFS.emit('connection', newsock.stream.fd);
              // A queued client makes the listening socket readable (POLLIN).
              sock.stream.node.notifyListeners(64 | 1);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
              SOCKFS.emit('connection', sock.stream.fd);
            }
          });
          sock.server.on('close', () => {
            SOCKFS.emit('close', sock.stream.fd);
            sock.server = null;
          });
          sock.server.on('error', (error) => {
            sock.error = (error.code && ERRNO_CODES[error.code]) || 29;
            SOCKFS.emit('error', [sock.stream.fd, sock.error, error.message || error.code || 'Server error']);
            if (sock.server) {
              try {
                sock.server.close();
              } catch (e) {
              }
              sock.server = null;
            }
            // don't throw
          });
        },
  accept(listensock) {
          if (listensock.error) {
            var err = listensock.error;
            listensock.error = null;
            throw new FS.ErrnoError(err);
          }
          if (!listensock.server || !listensock.pending.length) {
            throw new FS.ErrnoError(28);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },
  getname(sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(53);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr, port };
        },
  sendmsg(sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(17);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(53);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          if (ArrayBuffer.isView(buffer)) {
            offset += buffer.byteOffset;
            buffer = buffer.buffer;
          }
  
          var data = buffer.slice(offset, offset + length);
  
          // if we don't have a cached connectionless UDP datagram connection, or
          // the TCP socket is still connecting, queue the message to be sent upon
          // connect, and lie, saying the data was sent now.
          if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
            // if we're not connected, open a new connection
            if (sock.type === 2) {
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
            }
            dest.msg_send_queue.push(data);
            return length;
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(28);
          }
        },
  recvmsg(sock, length, flags) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(53);
          }
  
          // MSG_PEEK returns the head of the queue without consuming it, so a
          // later recv sees the same bytes and poll still reports it readable.
          var peek = flags & 2;
          var queued = sock.recv_queue[0];
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(53);
              }
              if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              // else, our socket is in a valid state but truly has nothing available
              throw new FS.ErrnoError(6);
            }
            throw new FS.ErrnoError(6);
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
          if (peek) return res;
          sock.recv_queue.shift();
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        },
  },
  };
  
  var getSocketFromFD = (fd) => {
      var socket = SOCKFS.getSocket(fd);
      if (!socket) throw new FS.ErrnoError(8);
      return socket;
    };
  
  var inetNtop4 = (addr) =>
      (addr & 0xff) + '.' + ((addr >> 8) & 0xff) + '.' + ((addr >> 16) & 0xff) + '.' + ((addr >> 24) & 0xff);
  
  
  var inetNtop6 = (ints) => {
      //  ref:  http://www.ietf.org/rfc/rfc2373.txt - section 2.5.4
      //  Format for IPv4 compatible and mapped  128-bit IPv6 Addresses
      //  128-bits are split into eight 16-bit words
      //  stored in network byte order (big-endian)
      //  |                80 bits               | 16 |      32 bits        |
      //  +-----------------------------------------------------------------+
      //  |               10 bytes               |  2 |      4 bytes        |
      //  +--------------------------------------+--------------------------+
      //  +               5 words                |  1 |      2 words        |
      //  +--------------------------------------+--------------------------+
      //  |0000..............................0000|0000|    IPv4 ADDRESS     | (compatible)
      //  +--------------------------------------+----+---------------------+
      //  |0000..............................0000|FFFF|    IPv4 ADDRESS     | (mapped)
      //  +--------------------------------------+----+---------------------+
      var str = '';
      var word = 0;
      var longest = 0;
      var lastzero = 0;
      var zstart = 0;
      var len = 0;
      var i = 0;
      var parts = [
        ints[0] & 0xffff,
        (ints[0] >> 16),
        ints[1] & 0xffff,
        (ints[1] >> 16),
        ints[2] & 0xffff,
        (ints[2] >> 16),
        ints[3] & 0xffff,
        (ints[3] >> 16)
      ];
  
      // Handle IPv4-compatible, IPv4-mapped, loopback and any/unspecified addresses
  
      var hasipv4 = true;
      var v4part = '';
      // check if the 10 high-order bytes are all zeros (first 5 words)
      for (i = 0; i < 5; i++) {
        if (parts[i]) {
          hasipv4 = false;
          break;
        }
      }
  
      if (hasipv4) {
        // low-order 32-bits store an IPv4 address (bytes 13 to 16) (last 2 words)
        v4part = inetNtop4(parts[6] | (parts[7] << 16));
        // IPv4-mapped IPv6 address if 16-bit value (bytes 11 and 12) == 0xFFFF (6th word)
        if (parts[5] === -1) {
          str = '::ffff:';
          str += v4part;
          return str;
        }
        // IPv4-compatible IPv6 address if 16-bit value (bytes 11 and 12) == 0x0000 (6th word)
        if (!parts[5]) {
          str = '::';
          // special case IPv6 addresses
          if (v4part === '0.0.0.0') v4part = ''; // any/unspecified address
          if (v4part === '0.0.0.1') v4part = '1';// loopback address
          str += v4part;
          return str;
        }
      }
  
      // Handle all other IPv6 addresses
  
      // first run to find the longest contiguous zero words
      for (word = 0; word < 8; word++) {
        if (!parts[word]) {
          if (word - lastzero > 1) {
            len = 0;
          }
          lastzero = word;
          len++;
        }
        if (len > longest) {
          longest = len;
          zstart = word - longest + 1;
        }
      }
  
      for (word = 0; word < 8; word++) {
        if (longest > 1) {
          // compress contiguous zeros - to produce '::'
          if (!parts[word] && word >= zstart && word < (zstart + longest) ) {
            if (word === zstart) {
              str += ':';
              if (!zstart) str += ':'; //leading zeros case
            }
            continue;
          }
        }
        // converts 16-bit words from big-endian to little-endian before converting to hex string
        str += Number(_ntohs(parts[word] & 0xffff)).toString(16);
        str += word < 7 ? ':' : '';
      }
      return str;
    };
  
  
  /** @type {!Int16Array} */
  var HEAP16;
  
  /** @type {!Uint16Array} */
  var HEAPU16;
  
  var readSockaddr = (sa, salen) => {
      // family / port offsets are common to both sockaddr_in and sockaddr_in6
      var family = HEAP16[((sa)>>1)];
      var port = _ntohs(HEAPU16[(((sa)+(2))>>1)]);
      var addr;
  
      switch (family) {
        case 2:
          if (salen !== 16) {
            return { errno: 28 };
          }
          addr = HEAP32[(((sa)+(4))>>2)];
          addr = inetNtop4(addr);
          break;
        case 10:
          if (salen !== 28) {
            return { errno: 28 };
          }
          addr = [
            HEAP32[(((sa)+(8))>>2)],
            HEAP32[(((sa)+(12))>>2)],
            HEAP32[(((sa)+(16))>>2)],
            HEAP32[(((sa)+(20))>>2)]
          ];
          addr = inetNtop6(addr);
          break;
        default:
          return { errno: 5 };
      }
  
      return { family: family, addr: addr, port: port };
    };
  
  
  var inetPton4 = (str) => {
      var b = str.split('.');
      for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp;
      }
      return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
    };
  
  var inetPton6 = (str) => {
      var words;
      var w, offset, z, i;
      /* http://home.deds.nl/~aeron/regex/ */
      var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i
      var parts = [];
      if (!valid6regx.test(str)) {
        return null;
      }
      if (str === '::') {
        return [0, 0, 0, 0, 0, 0, 0, 0];
      }
      // Z placeholder to keep track of zeros when splitting the string on ':'
      if (str.startsWith('::')) {
        str = str.replace('::', 'Z:'); // leading zeros case
      } else {
        str = str.replace('::', ':Z:');
      }
  
      if (str.indexOf('.') > 0) {
        // parse IPv4 embedded address
        str = str.replace(new RegExp('[.]', 'g'), ':');
        words = str.split(':');
        words[words.length-4] = Number(words[words.length-4]) + Number(words[words.length-3])*256;
        words[words.length-3] = Number(words[words.length-2]) + Number(words[words.length-1])*256;
        words = words.slice(0, words.length-2);
      } else {
        words = str.split(':');
      }
  
      offset = 0; z = 0;
      for (w=0; w < words.length; w++) {
        if (typeof words[w] === 'string') {
          if (words[w] === 'Z') {
            // compressed zeros - write appropriate number of zero words
            for (z = 0; z < (8 - words.length+1); z++) {
              parts[w+z] = 0;
            }
            offset = z-1;
          } else {
            // parse hex field to 16-bit value and write it in network byte-order
            parts[w+offset] = _htons(parseInt(words[w],16));
          }
        } else {
          // parsed IPv4 words
          parts[w+offset] = words[w];
        }
      }
      return [
        (parts[1] << 16) | parts[0],
        (parts[3] << 16) | parts[2],
        (parts[5] << 16) | parts[4],
        (parts[7] << 16) | parts[6]
      ];
    };
  var DNS = {
  address_map:{
  id:1,
  addrs:{
  },
  names:{
  },
  },
  lookup_name(name) {
        // If the name is already a valid ipv4 / ipv6 address, don't generate a fake one.
        var res = inetPton4(name);
        if (res !== null) {
          return name;
        }
        res = inetPton6(name);
        if (res !== null) {
          return name;
        }
  
        // See if this name is already mapped.
        var addr;
  
        if (DNS.address_map.addrs[name]) {
          addr = DNS.address_map.addrs[name];
        } else {
          var id = DNS.address_map.id++;
          assert(id < 65535, 'exceeded max address mappings of 65535');
  
          addr = '172.29.' + (id & 0xff) + '.' + (id & 0xff00);
  
          DNS.address_map.names[addr] = name;
          DNS.address_map.addrs[name] = addr;
        }
  
        return addr;
      },
  lookup_addr(addr) {
        if (DNS.address_map.names[addr]) {
          return DNS.address_map.names[addr];
        }
  
        return null;
      },
  };
  var getSocketAddress = (addrp, addrlen) => {
      var info = readSockaddr(addrp, addrlen);
      if (info.errno) throw new FS.ErrnoError(info.errno);
      info.addr = DNS.lookup_addr(info.addr) || info.addr;
      return info;
    };
  function ___syscall_connect(fd, addr, len, u1, u2, u3) {
  try {
  
      var sock = getSocketFromFD(fd);
      var info = getSocketAddress(addr, len);
      sock.sock_ops.connect(sock, info.addr, info.port);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  var syscallGetVarargI = () => {
      assert(SYSCALLS.varargs != undefined);
      // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
      var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
      SYSCALLS.varargs += 4;
      return ret;
    };
  var syscallGetVarargP = syscallGetVarargI;
  
  
  
  
  
  
  
  
  /** not-@type {!BigInt64Array} */
  var HEAP64;
  var SYSCALLS = {
  currentUmask:18,
  calculateAt(dirfd, path, allowEmpty = false) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return dir + '/' + path;
      },
  writeStat(buf, stat) {
        HEAPU32[((buf)>>2)] = stat.dev;
        HEAPU32[(((buf)+(4))>>2)] = stat.mode;
        HEAPU32[(((buf)+(8))>>2)] = stat.nlink;
        HEAPU32[(((buf)+(12))>>2)] = stat.uid;
        HEAPU32[(((buf)+(16))>>2)] = stat.gid;
        HEAPU32[(((buf)+(20))>>2)] = stat.rdev;
        HEAP64[(((buf)+(24))>>3)] = BigInt(stat.size);
        HEAP32[(((buf)+(32))>>2)] = 4096;
        HEAP32[(((buf)+(36))>>2)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[(((buf)+(40))>>3)] = BigInt(Math.floor(atime / 1000));
        HEAPU32[(((buf)+(48))>>2)] = (atime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(56))>>3)] = BigInt(Math.floor(mtime / 1000));
        HEAPU32[(((buf)+(64))>>2)] = (mtime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(72))>>3)] = BigInt(Math.floor(ctime / 1000));
        HEAPU32[(((buf)+(80))>>2)] = (ctime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(88))>>3)] = BigInt(stat.ino);
        return 0;
      },
  writeStatFs(buf, stats) {
        HEAPU32[(((buf)+(4))>>2)] = stats.bsize;
        HEAPU32[(((buf)+(60))>>2)] = stats.bsize;
        HEAP64[(((buf)+(8))>>3)] = BigInt(stats.blocks);
        HEAP64[(((buf)+(16))>>3)] = BigInt(stats.bfree);
        HEAP64[(((buf)+(24))>>3)] = BigInt(stats.bavail);
        HEAP64[(((buf)+(32))>>3)] = BigInt(stats.files);
        HEAP64[(((buf)+(40))>>3)] = BigInt(stats.ffree);
        HEAPU32[(((buf)+(48))>>2)] = stats.fsid;
        HEAPU32[(((buf)+(64))>>2)] = stats.flags;  // ST_NOSUID
        HEAPU32[(((buf)+(56))>>2)] = stats.namelen;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.subarray(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  
  function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          var mask = 289792;
          stream.flags = (stream.flags & ~mask) | (arg & mask);
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)] = 2;
          return 0;
        }
        case 13:
        case 14:
          // Pretend that the locking is successful. These are process-level locks,
          // and Emscripten programs are a single process. If we supported linking a
          // filesystem between programs, we'd need to do more here.
          // See https://github.com/emscripten-core/emscripten/issues/23697
          return 0;
      }
      return -28;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_fstat64(fd, buf) {
  try {
  
      return SYSCALLS.writeStat(buf, FS.fstat(fd));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite === 'number', 'stringToUTF8 requires a third parameter that specifies the length of the output buffer');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  function ___syscall_getcwd(buf, size) {
  try {
  
      if (!size) return -28;
      var cwd = FS.cwd();
      var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
      if (size < cwdLengthInBytes) return -68;
      stringToUTF8(cwd, buf, size);
      return cwdLengthInBytes;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  
  
  
  function ___syscall_getdents64(fd, dirp, count) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd)
      stream.getdents ||= FS.readdir(stream.path);
  
      var struct_size = 280;
      var pos = 0;
      var off = FS.llseek(stream, 0, 1);
  
      var startIdx = Math.floor(off / struct_size);
      var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count/struct_size))
      for (var idx = startIdx; idx < endIdx; idx++) {
        var id;
        var type;
        var name = stream.getdents[idx];
        if (name === '.') {
          id = stream.node.id;
          type = 4;
        }
        else if (name === '..') {
          var lookup = FS.lookupPath(stream.path, { parent: true });
          id = lookup.node.id;
          type = 4;
        }
        else {
          var child;
          try {
            child = FS.lookupNode(stream.node, name);
          } catch (e) {
            // If the entry is not a directory, file, or symlink, nodefs
            // lookupNode will raise EINVAL. Skip these and continue.
            if (e?.errno === 28) {
              continue;
            }
            throw e;
          }
          id = child.id;
          type = FS.isChrdev(child.mode) ? 2 : // character device.
                 FS.isDir(child.mode) ? 4 :    // directory
                 FS.isLink(child.mode) ? 10 :   // symbolic link.
                 8;                            // regular file.
        }
        assert(id);
        HEAP64[((dirp + pos)>>3)] = BigInt(id);
        HEAP64[(((dirp + pos)+(8))>>3)] = BigInt((idx + 1) * struct_size);
        HEAP16[(((dirp + pos)+(16))>>1)] = 280;
        HEAP8[(dirp + pos)+(18)] = type;
        stringToUTF8(name, dirp + pos + 19, 256);
        pos += struct_size;
      }
      FS.llseek(stream, idx * struct_size, 0);
      return pos;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  
  
  
  
  
  
  /** @param {number=} addrlen */
  var writeSockaddr = (sa, family, addr, port, addrlen) => {
      switch (family) {
        case 2:
          // The address may still be an unresolved hostname (e.g. a peer name
          // recorded at connect time); map it to its fake IP here so callers can
          // pass names and IPs alike. Real sockets only ever see numeric addresses.
          addr = inetPton4(DNS.lookup_name(addr));
          zeroMemory(sa, 16);
          if (addrlen) {
            HEAP32[((addrlen)>>2)] = 16;
          }
          HEAP16[((sa)>>1)] = family;
          HEAP32[(((sa)+(4))>>2)] = addr;
          HEAP16[(((sa)+(2))>>1)] = _htons(port);
          break;
        case 10:
          addr = inetPton6(DNS.lookup_name(addr));
          zeroMemory(sa, 28);
          if (addrlen) {
            HEAP32[((addrlen)>>2)] = 28;
          }
          HEAP32[((sa)>>2)] = family;
          HEAP32[(((sa)+(8))>>2)] = addr[0];
          HEAP32[(((sa)+(12))>>2)] = addr[1];
          HEAP32[(((sa)+(16))>>2)] = addr[2];
          HEAP32[(((sa)+(20))>>2)] = addr[3];
          HEAP16[(((sa)+(2))>>1)] = _htons(port);
          break;
        default:
          return 5;
      }
      return 0;
    };
  function ___syscall_getpeername(fd, addr, len, u1, u2, u3) {
  try {
  
      var sock = getSocketFromFD(fd);
      if (!sock.daddr) {
        return -53; // The socket is not connected.
      }
      var errno = writeSockaddr(addr, sock.family, sock.daddr, sock.dport, len);
      assert(!errno);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  function ___syscall_getsockopt(fd, level, optname, optval, optlen, unused) {
  try {
  
      var sock = getSocketFromFD(fd);
      // Minimal getsockopt aimed at resolving https://github.com/emscripten-core/emscripten/issues/2211
      // so only supports SOL_SOCKET with SO_ERROR.
      if (level === 1) {
        if (optname === 4) {
          HEAP32[((optval)>>2)] = sock.error;
          HEAP32[((optlen)>>2)] = 4;
          sock.error = null; // Clear the error (The SO_ERROR option obtains and then clears this field).
          return 0;
        }
      }
      return -50; // The option is unknown at the level indicated.
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  
  
  
  function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[((argp)>>2)] = termios.c_iflag || 0;
            HEAP32[(((argp)+(4))>>2)] = termios.c_oflag || 0;
            HEAP32[(((argp)+(8))>>2)] = termios.c_cflag || 0;
            HEAP32[(((argp)+(12))>>2)] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[(argp + i)+(17)] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[((argp)>>2)];
            var c_oflag = HEAP32[(((argp)+(4))>>2)];
            var c_cflag = HEAP32[(((argp)+(8))>>2)];
            var c_lflag = HEAP32[(((argp)+(12))>>2)];
            var c_cc = []
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[(argp + i)+(17)]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[((argp)>>2)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[((argp)>>1)] = winsize[0];
            HEAP16[(((argp)+(2))>>1)] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default: return -28; // not supported
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_linkat(olddirfd, oldpath, newdirfd, newpath, flags) {
  try {
  
      oldpath = SYSCALLS.getStr(oldpath);
      newpath = SYSCALLS.getStr(newpath);
      oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
      newpath = SYSCALLS.calculateAt(newdirfd, newpath);
      FS.link(oldpath, newpath, flags);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_lstat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_mkdirat(dirfd, path, mode) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      mode &= ~SYSCALLS.currentUmask;
      FS.mkdir(path, mode);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_newfstatat(dirfd, path, buf, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & (~6400);
      assert(!flags, `unknown flags in __syscall_newfstatat: ${flags}`);
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      if (flags & 64) {
        mode &= ~SYSCALLS.currentUmask;
      }
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  var pollOne = (fd, events) => {
      var stream = FS.getStream(fd);
      if (!stream) return 32;
      // Streams without a poll handler (regular files, incl. NODERAWFS/NODEFS
      // which leave stream_ops unset) are treated as always readable+writable.
      var flags = stream.stream_ops?.poll?.(stream) ?? 5;
      return flags & (events | 8 | 16 | 32);
    };
  
  
  var doPollSync = (fds, nfds) => {
      var count = 0;
      for (var i = 0, pollfd = fds; i < nfds; i++, pollfd += 8) {
        var revents = pollOne(
          HEAP32[((pollfd)>>2)],
          HEAP16[(((pollfd)+(4))>>1)]);
        if (revents) count++;
        HEAP16[(((pollfd)+(6))>>1)] = revents;
      }
      return count;
    };
  function ___syscall_poll(fds, nfds, timeout) {
  try {
  
      var count = doPollSync(fds, nfds);
      if (!count && timeout != 0) warnOnce('non-zero poll() timeout not supported: ' + timeout)
      return count;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_poll_nonblocking(fds, nfds) {
  try {
  
      return doPollSync(fds, nfds);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  
  
  function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (bufsize <= 0) return -28;
      var ret = FS.readlink(path);
  
      var len = Math.min(bufsize, lengthBytesUTF8(ret));
      var endChar = HEAP8[buf+len];
      stringToUTF8(ret, buf, bufsize+1);
      // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
      // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
      HEAP8[buf+len] = endChar;
      return len;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  
  function ___syscall_recvfrom(fd, buf, len, flags, addr, alen) {
  try {
  
      var sock = getSocketFromFD(fd);
      var msg = sock.sock_ops.recvmsg(sock, len, flags);
      if (!msg) return 0; // socket is closed
      if (addr) {
        var errno = writeSockaddr(addr, sock.family, msg.addr, msg.port, alen);
        assert(!errno);
      }
      HEAPU8.set(msg.buffer, buf);
      return msg.buffer.byteLength;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
  try {
  
      oldpath = SYSCALLS.getStr(oldpath);
      newpath = SYSCALLS.getStr(newpath);
      oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
      newpath = SYSCALLS.calculateAt(newdirfd, newpath);
      FS.rename(oldpath, newpath);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  
  function ___syscall_sendto(fd, buf, len, flags, addr, alen) {
  try {
  
      var sock = getSocketFromFD(fd);
      if (!addr) {
        // send, no address provided
        return FS.write(sock.stream, HEAP8, buf, len);
      }
      var dest = getSocketAddress(addr, alen);
      // sendto an address
      return sock.sock_ops.sendmsg(sock, HEAP8, buf, len, dest.addr, dest.port);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_setsockopt(fd, level, optname, optval, optlen, unused) {
  try {
  
      getSocketFromFD(fd); // validate the fd (and keep this syscall's catch reachable)
      return -50; // The option is unknown at the level indicated.
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_shutdown(fd, how, u1, u2, u3, u4) {
  try {
  
      var sock = getSocketFromFD(fd);
      return -52; // unsupported feature
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_socket(domain, type, protocol, u1, u2, u3) {
  try {
  
      var sock = SOCKFS.createSocket(domain, type, protocol);
      return sock.stream.fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  function ___syscall_stat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  var ___syscall_uname = (buf) => {
      if (!buf) {
        return -21;
      }
      var copyString = (offset, value) => stringToUTF8(value, buf + offset, 65);
      copyString(0, 'Emscripten');
      copyString(65, 'emscripten');
      copyString(130, '6.0.13');
      copyString(195, '#1');
      copyString(260, 'wasm32');
      return 0;
    };

  function ___syscall_unlinkat(dirfd, path, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (!flags) {
        FS.unlink(path);
      } else if (flags === 512) {
        FS.rmdir(path);
      } else {
        return -28;
      }
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  var getCppExceptionTag = () => ___cpp_exception;
  
  
  var getCppExceptionThrownObjectFromWebAssemblyException = (ex) => {
      // In Wasm EH, the value extracted from WebAssembly.Exception is a pointer
      // to the unwind header. Convert it to the actual thrown value.
      var unwind_header = ex.getArg(getCppExceptionTag(), 0);
      return ___thrown_object_from_unwind_exception(unwind_header);
    };
  
  
  
  var stackSave = () => _emscripten_stack_get_current();
  
  var stackRestore = (val) => __emscripten_stack_restore(val);
  
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  
  
  var getExceptionMessageCommon = (ptr) => {
      var sp = stackSave();
      var type_addr_addr = stackAlloc(4);
      var message_addr_addr = stackAlloc(4);
      ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
      var type_addr = HEAPU32[((type_addr_addr)>>2)];
      var message_addr = HEAPU32[((message_addr_addr)>>2)];
      var type = UTF8ToString(type_addr);
      _free(type_addr);
      var message;
      if (message_addr) {
        message = UTF8ToString(message_addr);
        _free(message_addr);
      }
      stackRestore(sp);
      return [type, message];
    };
  var getExceptionMessage = (ex) => {
      var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
      return getExceptionMessageCommon(ptr);
    };
  
  
  var decrementExceptionRefcount = (ex) => {
      var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
      ___cxa_decrement_exception_refcount(ptr);
    };
  
  
  var incrementExceptionRefcount = (ex) => {
      var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
      ___cxa_increment_exception_refcount(ptr);
    };
  var ___throw_exception_with_stack_trace = (ex) => {
      var e = new WebAssembly.Exception(getCppExceptionTag(), [ex], {traceStack: true});
      e.message = getExceptionMessage(e);
      throw e;
    };

  var __abort_js = () =>
      abort('native code called abort()');

  
  
  
  
  
  var INT53_MAX = 9007199254740992;
  
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  
  
  function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
    offset = bigintToI53Checked(offset);
  
  
  try {
  
      // musl's mmap doesn't allow values over a certain limit
      // see OFF_MASK in mmap.c.
      assert(!isNaN(offset));
      var stream = SYSCALLS.getStreamFromFD(fd);
      var res = FS.mmap(stream, len, offset, prot, flags);
      var ptr = res.ptr;
      HEAP32[((allocated)>>2)] = res.allocated;
      HEAPU32[((addr)>>2)] = ptr;
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function __munmap_js(addr, len, prot, flags, fd, offset) {
    offset = bigintToI53Checked(offset);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      if (prot & 2) {
        SYSCALLS.doMsync(addr, stream, len, flags, offset);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  
  
  var __tzset_js = (timezone, daylight, std_name, dst_name) => {
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for
      // daylight savings.  This code uses the fact that getTimezoneOffset returns
      // a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it
      // compares whether the output of the given date the same (Standard) or less
      // (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU32[((timezone)>>2)] = stdTimezoneOffset * 60;
  
      HEAP32[((daylight)>>2)] = Number(winterOffset != summerOffset);
  
      var extractZone = (timezoneOffset) => {
        // Why inverse sign?
        // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        var sign = timezoneOffset >= 0 ? '-' : '+';
  
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
        var minutes = String(absOffset % 60).padStart(2, '0');
  
        return `UTC${sign}${hours}${minutes}`;
      }
  
      var winterName = extractZone(winterOffset);
      var summerName = extractZone(summerOffset);
      assert(winterName);
      assert(summerName);
      assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
      assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
      } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
      }
    };

  var _emscripten_get_now = () => performance.now();
  
  var _emscripten_date_now = () => Date.now();
  
  var nowIsMonotonic = 1;
  
  var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
  
  
  function _clock_time_get(clk_id, ignored_precision, ptime) {
    ignored_precision = bigintToI53Checked(ignored_precision);
  
  
      if (!checkWasiClock(clk_id)) {
        return 28;
      }
      var now;
      // all wasi clocks but realtime are monotonic
      if (clk_id === 0) {
        now = _emscripten_date_now();
      } else if (nowIsMonotonic) {
        now = _emscripten_get_now();
      } else {
        return 52;
      }
      // "now" is in ms, and wasi times are in ns.
      var nsec = Math.round(now * 1_000_000);
      HEAP64[((ptime)>>3)] = BigInt(nsec);
      return 0;
    ;
  }

  var setImmediateWrapped = (func) => {
      var id = setImmediateWrapped.nextId++;
      setImmediateWrapped.pending.set(id, setImmediate(() => {
        setImmediateWrapped.pending.delete(id);
        func();
      }));
      return id;
    };
  
  var clearImmediateWrapped = (id) => {
      var handle = setImmediateWrapped.pending.get(id);
      if (!handle) return false;
      setImmediateWrapped.pending.delete(id);
      clearImmediate(handle);
      return true;
    };
  
  var emSetImmediate;
  var emClearImmediate;
  var _emscripten_clear_immediate = (id) => {
      if (emClearImmediate(id)) {
        
      }
    };

  var handleException = (e) => {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      checkStackCookie();
      if (e instanceof WebAssembly.RuntimeError) {
        if (_emscripten_stack_get_current() <= 0) {
          err('Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 524288)');
        }
      }
      quit_(1, e);
    };
  
  
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        Module['onExit']?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
  
  
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        err(msg);
      }
  
      _proc_exit(status);
    };
  var _exit = exitJS;
  
  
  var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    };
  var callUserCallback = (func, ...args) => {
      if (ABORT) {
        err('user callback triggered after runtime exited or application aborted.  Ignoring.');
        return;
      }
      try {
        return func(...args);
      } catch (e) {
        handleException(e);
      } finally {
        maybeExit();
      }
    };
  /** @param {number=} timeout */
  var safeSetTimeout = (func, timeout) => {
      
      var id = safeSetTimeout.nextId++;
      safeSetTimeout.pending.set(id, setTimeout(() => {
        safeSetTimeout.pending.delete(id);
        
        callUserCallback(func);
      }, timeout));
      return id;
    };
  var safeClearTimeout = (id) => {
      var handle = safeSetTimeout.pending.get(id);
      if (!handle) return;
      safeSetTimeout.pending.delete(id);
      clearTimeout(handle);
      
    };
  var _emscripten_clear_timeout = safeClearTimeout;

  var _emscripten_err = (str) => err(UTF8ToString(str));

  var getHeapMax = () =>
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      2147483648;
  var _emscripten_get_heap_max = () => getHeapMax();


  var _emscripten_has_asyncify = () => 0;

  var _emscripten_promise_await = (returnValuePtr, id) => {
      abort('emscripten_promise_await is only available with ASYNCIFY');
    };

  class HandleAllocator {
      allocated = [undefined];
      freelist = [];
      get(id) {
        assert(this.allocated[id] !== undefined, `invalid handle: ${id}`);
        return this.allocated[id];
      }
      has(id) {
        return this.allocated[id] !== undefined;
      }
      allocate(handle) {
        var id = this.freelist.pop() ?? this.allocated.length;
        this.allocated[id] = handle;
        return id;
      }
      free(id) {
        assert(this.allocated[id] !== undefined);
        // Set the slot to `undefined` rather than using `delete` here since
        // apparently arrays with holes in them can be less efficient.
        this.allocated[id] = undefined;
        this.freelist.push(id);
      }
    }
  var promiseMap = new HandleAllocator();;
  var makePromise = () => {
      var promiseInfo = {};
      promiseInfo.promise = new Promise((resolve, reject) => {
        promiseInfo.reject = reject;
        promiseInfo.resolve = resolve;
      });
      promiseInfo.id = promiseMap.allocate(promiseInfo);
      return promiseInfo;
    };
  var _emscripten_promise_create = () => makePromise().id;

  var _emscripten_promise_destroy = (id) => {
      promiseMap.free(id);
    };

  
  var getPromise = (id) => promiseMap.get(id).promise;
  
  var _emscripten_promise_resolve = (id, result, value) => {
      var info = promiseMap.get(id);
      switch (result) {
        case 0:
          info.resolve(value);
          return;
        case 1:
          info.resolve(getPromise(value));
          return;
        case 2:
          info.resolve(getPromise(value));
          _emscripten_promise_destroy(value);
          return;
        case 3:
          info.reject(value);
          return;
      }
      abort(`unexpected promise callback result ${result}`);
    };

  
  
  var growMemory = (size) => {
      var oldHeapSize = wasmMemory.buffer.byteLength;
      var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(pages); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
      }
      // implicit 0 return to save code size (caller will cast 'undefined' into 0
      // anyhow)
    };
  
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
        return false;
      }
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = growMemory(newSize);
        if (replacement) {
  
          return true;
        }
      }
      err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
      return false;
    };

  
  
  
  
  
  
  
  
  
  
  /** @type {!Float32Array} */
  var HEAPF32;
  
  /** @type {!Float64Array} */
  var HEAPF64;
  
  
  /** not-@type {!BigUint64Array} */
  var HEAPU64;
  var _emscripten_run_script_string = (ptr) => {
      var s = eval(UTF8ToString(ptr));
      if (s == null) {
        return 0;
      }
      s += '';
      var me = _emscripten_run_script_string;
      me.bufferSize = lengthBytesUTF8(s) + 1;
      me.buffer = _realloc(me.buffer ?? 0, me.bufferSize)
      stringToUTF8(s, me.buffer, me.bufferSize);
      return me.buffer;
    };

  
  
  var wasmTableMirror = [];
  
  
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        /** @suppress {checkTypes} */
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      /** @suppress {checkTypes} */
      assert(wasmTable.get(funcPtr) == func, 'table mirror is out of date');
      return func;
    };
  var _emscripten_set_immediate = (cb, userData) => {
      
      return emSetImmediate(() => {
        
        callUserCallback(getWasmTableEntry(cb), userData);
      });
    };

  
  var _emscripten_set_timeout = (cb, msecs, userData) =>
      safeSetTimeout(() => getWasmTableEntry(cb)(userData), msecs);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };
  
  
  
  
  var readI53FromI64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAP32[(((ptr)+(4))>>2)] * 4294967296;
    };
  
  var readI53FromU64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAPU32[(((ptr)+(4))>>2)] * 4294967296;
    };
  
  var writeI53ToI64 = (ptr, num) => {
      HEAPU32[((ptr)>>2)] = num;
      var lower = HEAPU32[((ptr)>>2)];
      HEAPU32[(((ptr)+(4))>>2)] = (num - lower)/4294967296;
      var deserialized = (num >= 0) ? readI53FromU64(ptr) : readI53FromI64(ptr);
      var offset = ((ptr)>>2);
      if (deserialized != num) warnOnce(`writeI53ToI64() out of range: serialized JS Number ${num} to Wasm heap as bytes lo=${ptrToString(HEAPU32[offset])}, hi=${ptrToString(HEAPU32[offset+1])}, which deserializes back to ${deserialized} instead!`);
    };
  
  
  
  var stringToNewUTF8 = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret) stringToUTF8(str, ret, size);
      return ret;
    };
  
  
  
  
  
  
  
  
  
  var WebGPU = {
  Internals:{
  jsObjects:[],
  jsObjectInsert:(ptr, jsObject) => {
          ptr >>>= 0
          WebGPU.Internals.jsObjects[ptr] = jsObject;
        },
  bufferOnUnmaps:[],
  futures:[],
  futureInsert:(futureId, promise) => {
        },
  },
  getJsObject:(ptr) => {
        if (!ptr) return undefined;
        ptr >>>= 0
        assert(ptr in WebGPU.Internals.jsObjects);
        return WebGPU.Internals.jsObjects[ptr];
      },
  importJsAdapter:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateAdapter(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsBindGroup:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateBindGroup(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsBindGroupLayout:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateBindGroupLayout(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsBuffer:(buffer, parentPtr = 0) => {
        // At the moment, we do not allow importing pending buffers.
        assert(buffer.mapState === "unmapped");
        var bufferPtr = _emwgpuImportBuffer(parentPtr);
        WebGPU.Internals.jsObjectInsert(bufferPtr, buffer);
        return bufferPtr;
      },
  importJsCommandBuffer:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateCommandBuffer(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsCommandEncoder:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateCommandEncoder(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsComputePassEncoder:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateComputePassEncoder(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsComputePipeline:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateComputePipeline(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsDevice:(device, parentPtr = 0) => {
        var queuePtr = _emwgpuCreateQueue(parentPtr);
        var devicePtr = _emwgpuCreateDevice(parentPtr, queuePtr);
        WebGPU.Internals.jsObjectInsert(queuePtr, device.queue);
        WebGPU.Internals.jsObjectInsert(devicePtr, device);
        return devicePtr;
      },
  importJsExternalTexture:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateExternalTexture(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsPipelineLayout:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreatePipelineLayout(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsQuerySet:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateQuerySet(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsQueue:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateQueue(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsRenderBundle:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateRenderBundle(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsRenderBundleEncoder:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateRenderBundleEncoder(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsRenderPassEncoder:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateRenderPassEncoder(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsRenderPipeline:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateRenderPipeline(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsSampler:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateSampler(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsShaderModule:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateShaderModule(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsSurface:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateSurface(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsTexture:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateTexture(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  importJsTextureView:(obj, parentPtr = 0) => {
            var ptr = _emwgpuCreateTextureView(parentPtr);
            WebGPU.Internals.jsObjects[ptr] = obj;
            return ptr;
          },
  errorCallback:(callback, type, message, userdata) => {
        var sp = stackSave();
        var messagePtr = stringToUTF8OnStack(message);
        getWasmTableEntry(callback)(type, messagePtr, userdata);
        stackRestore(sp);
      },
  iterateExtensions:(root, handlers) => {
        assert(root);
        for (var ptr = HEAPU32[((root)>>2)]; ptr;
                 ptr = HEAPU32[((ptr)>>2)]) {
          var sType = HEAP32[(((ptr)+(4))>>2)];
          // This will crash if there's no handler indicating either a bogus
          // sType, or one we haven't implemented yet.
          var handler = handlers[sType](ptr);
        }
      },
  setStringView:(ptr, data, length) => {
        HEAPU32[((ptr)>>2)] = data;
        HEAPU32[(((ptr)+(4))>>2)] = length;
      },
  makeStringFromStringView:(stringViewPtr) => {
        var ptr = HEAPU32[((stringViewPtr)>>2)];
        var length = HEAPU32[(((stringViewPtr)+(4))>>2)];
        // UTF8ToString stops at the first null terminator character in the
        // string regardless of the length.
        return UTF8ToString(ptr, length);
      },
  makeStringFromOptionalStringView:(stringViewPtr) => {
        var ptr = HEAPU32[((stringViewPtr)>>2)];
        var length = HEAPU32[(((stringViewPtr)+(4))>>2)];
        // If we don't have a valid string pointer, just return undefined when
        // optional.
        if (!ptr) {
          if (length === 0) {
            return "";
          }
          return undefined;
        }
        // UTF8ToString stops at the first null terminator character in the
        // string regardless of the length.
        return UTF8ToString(ptr, length);
      },
  makeColor:(ptr) => {
        return {
          "r": HEAPF64[((ptr)>>3)],
          "g": HEAPF64[(((ptr)+(8))>>3)],
          "b": HEAPF64[(((ptr)+(16))>>3)],
          "a": HEAPF64[(((ptr)+(24))>>3)],
        };
      },
  makeExtent3D:(ptr) => {
        return {
          "width": HEAPU32[((ptr)>>2)],
          "height": HEAPU32[(((ptr)+(4))>>2)],
          "depthOrArrayLayers": HEAPU32[(((ptr)+(8))>>2)],
        };
      },
  makeOrigin3D:(ptr) => {
        return {
          "x": HEAPU32[((ptr)>>2)],
          "y": HEAPU32[(((ptr)+(4))>>2)],
          "z": HEAPU32[(((ptr)+(8))>>2)],
        };
      },
  makeTexelCopyTextureInfo:(ptr) => {
        assert(ptr);
        return {
          "texture": WebGPU.getJsObject(
            HEAPU32[((ptr)>>2)]),
          "mipLevel": HEAPU32[(((ptr)+(4))>>2)],
          "origin": WebGPU.makeOrigin3D(ptr + 8),
          "aspect": WebGPU.TextureAspect[HEAP32[(((ptr)+(20))>>2)]],
        };
      },
  makeTexelCopyBufferLayout:(ptr) => {
        var bytesPerRow = HEAPU32[(((ptr)+(8))>>2)];
        var rowsPerImage = HEAPU32[(((ptr)+(12))>>2)];
        return {
          "offset": readI53FromI64(ptr),
          "bytesPerRow": bytesPerRow === 4294967295 ? undefined : bytesPerRow,
          "rowsPerImage": rowsPerImage === 4294967295 ? undefined : rowsPerImage,
        };
      },
  makeTexelCopyBufferInfo:(ptr) => {
        assert(ptr);
        var layoutPtr = ptr + 0;
        var bufferCopyView = WebGPU.makeTexelCopyBufferLayout(layoutPtr);
        bufferCopyView["buffer"] = WebGPU.getJsObject(
          HEAPU32[(((ptr)+(16))>>2)]);
        return bufferCopyView;
      },
  makePassTimestampWrites:(ptr) => {
        if (ptr === 0) return undefined;
        return {
          "querySet": WebGPU.getJsObject(
            HEAPU32[(((ptr)+(4))>>2)]),
          "beginningOfPassWriteIndex": HEAPU32[(((ptr)+(8))>>2)],
          "endOfPassWriteIndex": HEAPU32[(((ptr)+(12))>>2)],
        };
      },
  makePipelineConstants:(constantCount, constantsPtr) => {
        if (!constantCount) return;
        var constants = {};
        for (var i = 0; i < constantCount; ++i) {
          var entryPtr = constantsPtr + 24 * i;
          var key = WebGPU.makeStringFromStringView(entryPtr + 4);
          constants[key] = HEAPF64[(((entryPtr)+(16))>>3)];
        }
        return constants;
      },
  makePipelineLayout:(layoutPtr) => {
        if (!layoutPtr) return 'auto';
        return WebGPU.getJsObject(layoutPtr);
      },
  makeComputeState:(ptr) => {
        if (!ptr) return undefined;
        assert(ptr);assert(HEAPU32[((ptr)>>2)] === 0);
        var desc = {
          "module": WebGPU.getJsObject(
            HEAPU32[(((ptr)+(4))>>2)]),
          "constants": WebGPU.makePipelineConstants(
            HEAPU32[(((ptr)+(16))>>2)],
            HEAPU32[(((ptr)+(20))>>2)]),
          "entryPoint": WebGPU.makeStringFromOptionalStringView(
            ptr + 8),
        };
        return desc;
      },
  makeComputePipelineDesc:(descriptor) => {
        assert(descriptor);assert(HEAPU32[((descriptor)>>2)] === 0);
  
        var desc = {
          "label": WebGPU.makeStringFromOptionalStringView(
            descriptor + 4),
          "layout": WebGPU.makePipelineLayout(
            HEAPU32[(((descriptor)+(12))>>2)]),
          "compute": WebGPU.makeComputeState(
            descriptor + 16),
        };
        return desc;
      },
  makeRenderPipelineDesc:(descriptor) => {
        assert(descriptor);assert(HEAPU32[((descriptor)>>2)] === 0);
  
        function makePrimitiveState(psPtr) {
          if (!psPtr) return undefined;
          assert(psPtr);assert(HEAPU32[((psPtr)>>2)] === 0);
          return {
            "topology": WebGPU.PrimitiveTopology[HEAP32[(((psPtr)+(4))>>2)]],
            "stripIndexFormat": WebGPU.IndexFormat[HEAP32[(((psPtr)+(8))>>2)]],
            "frontFace": WebGPU.FrontFace[HEAP32[(((psPtr)+(12))>>2)]],
            "cullMode": WebGPU.CullMode[HEAP32[(((psPtr)+(16))>>2)]],
            "unclippedDepth": !!(HEAPU32[(((psPtr)+(20))>>2)]),
          };
        }
  
        function makeBlendComponent(bdPtr) {
          if (!bdPtr) return undefined;
          return {
            "operation": WebGPU.BlendOperation[HEAP32[((bdPtr)>>2)]],
            "srcFactor": WebGPU.BlendFactor[HEAP32[(((bdPtr)+(4))>>2)]],
            "dstFactor": WebGPU.BlendFactor[HEAP32[(((bdPtr)+(8))>>2)]],
          };
        }
  
        function makeBlendState(bsPtr) {
          if (!bsPtr) return undefined;
          return {
            "alpha": makeBlendComponent(bsPtr + 12),
            "color": makeBlendComponent(bsPtr + 0),
          };
        }
  
        function makeColorState(csPtr) {
          assert(csPtr);assert(HEAPU32[((csPtr)>>2)] === 0);
          var format = WebGPU.TextureFormat[HEAP32[(((csPtr)+(4))>>2)]];
          return format ? {
            "format": format,
            "blend": makeBlendState(HEAPU32[(((csPtr)+(8))>>2)]),
            "writeMask": HEAPU32[(((csPtr)+(16))>>2)],
          } : undefined;
        }
  
        function makeColorStates(count, csArrayPtr) {
          var states = [];
          for (var i = 0; i < count; ++i) {
            states.push(makeColorState(csArrayPtr + 24 * i));
          }
          return states;
        }
  
        function makeStencilStateFace(ssfPtr) {
          assert(ssfPtr);
          return {
            "compare": WebGPU.CompareFunction[HEAP32[((ssfPtr)>>2)]],
            "failOp": WebGPU.StencilOperation[HEAP32[(((ssfPtr)+(4))>>2)]],
            "depthFailOp": WebGPU.StencilOperation[HEAP32[(((ssfPtr)+(8))>>2)]],
            "passOp": WebGPU.StencilOperation[HEAP32[(((ssfPtr)+(12))>>2)]],
          };
        }
  
        function makeDepthStencilState(dssPtr) {
          if (!dssPtr) return undefined;
  
          assert(dssPtr);
          return {
            "format": WebGPU.TextureFormat[HEAP32[(((dssPtr)+(4))>>2)]],
            "depthWriteEnabled": !!(HEAPU32[(((dssPtr)+(8))>>2)]),
            "depthCompare": WebGPU.CompareFunction[HEAP32[(((dssPtr)+(12))>>2)]],
            "stencilFront": makeStencilStateFace(dssPtr + 16),
            "stencilBack": makeStencilStateFace(dssPtr + 32),
            "stencilReadMask": HEAPU32[(((dssPtr)+(48))>>2)],
            "stencilWriteMask": HEAPU32[(((dssPtr)+(52))>>2)],
            "depthBias": HEAP32[(((dssPtr)+(56))>>2)],
            "depthBiasSlopeScale": HEAPF32[(((dssPtr)+(60))>>2)],
            "depthBiasClamp": HEAPF32[(((dssPtr)+(64))>>2)],
          };
        }
  
        function makeVertexAttribute(vaPtr) {
          assert(vaPtr);
          return {
            "format": WebGPU.VertexFormat[HEAP32[(((vaPtr)+(4))>>2)]],
            "offset": readI53FromI64((vaPtr)+(8)),
            "shaderLocation": HEAPU32[(((vaPtr)+(16))>>2)],
          };
        }
  
        function makeVertexAttributes(count, vaArrayPtr) {
          var vas = [];
          for (var i = 0; i < count; ++i) {
            vas.push(makeVertexAttribute(vaArrayPtr + i * 24));
          }
          return vas;
        }
  
        function makeVertexBuffer(vbPtr) {
          if (!vbPtr) return undefined;
          var stepMode = WebGPU.VertexStepMode[HEAP32[(((vbPtr)+(4))>>2)]];
          var attributeCount = HEAPU32[(((vbPtr)+(16))>>2)];
          if (!stepMode && !attributeCount) {
            return null;
          }
          return {
            "arrayStride": readI53FromI64((vbPtr)+(8)),
            "stepMode": stepMode,
            "attributes": makeVertexAttributes(
              attributeCount,
              HEAPU32[(((vbPtr)+(20))>>2)]),
          };
        }
  
        function makeVertexBuffers(count, vbArrayPtr) {
          if (!count) return undefined;
  
          var vbs = [];
          for (var i = 0; i < count; ++i) {
            vbs.push(makeVertexBuffer(vbArrayPtr + i * 24));
          }
          return vbs;
        }
  
        function makeVertexState(viPtr) {
          if (!viPtr) return undefined;
          assert(viPtr);assert(HEAPU32[((viPtr)>>2)] === 0);
          var desc = {
            "module": WebGPU.getJsObject(
              HEAPU32[(((viPtr)+(4))>>2)]),
            "constants": WebGPU.makePipelineConstants(
              HEAPU32[(((viPtr)+(16))>>2)],
              HEAPU32[(((viPtr)+(20))>>2)]),
            "buffers": makeVertexBuffers(
              HEAPU32[(((viPtr)+(24))>>2)],
              HEAPU32[(((viPtr)+(28))>>2)]),
            "entryPoint": WebGPU.makeStringFromOptionalStringView(
              viPtr + 8),
            };
          return desc;
        }
  
        function makeMultisampleState(msPtr) {
          if (!msPtr) return undefined;
          assert(msPtr);assert(HEAPU32[((msPtr)>>2)] === 0);
          return {
            "count": HEAPU32[(((msPtr)+(4))>>2)],
            "mask": HEAPU32[(((msPtr)+(8))>>2)],
            "alphaToCoverageEnabled": !!(HEAPU32[(((msPtr)+(12))>>2)]),
          };
        }
  
        function makeFragmentState(fsPtr) {
          if (!fsPtr) return undefined;
          assert(fsPtr);assert(HEAPU32[((fsPtr)>>2)] === 0);
          var desc = {
            "module": WebGPU.getJsObject(
              HEAPU32[(((fsPtr)+(4))>>2)]),
            "constants": WebGPU.makePipelineConstants(
              HEAPU32[(((fsPtr)+(16))>>2)],
              HEAPU32[(((fsPtr)+(20))>>2)]),
            "targets": makeColorStates(
              HEAPU32[(((fsPtr)+(24))>>2)],
              HEAPU32[(((fsPtr)+(28))>>2)]),
            "entryPoint": WebGPU.makeStringFromOptionalStringView(
              fsPtr + 8),
            };
          return desc;
        }
  
        var desc = {
          "label": WebGPU.makeStringFromOptionalStringView(
            descriptor + 4),
          "layout": WebGPU.makePipelineLayout(
            HEAPU32[(((descriptor)+(12))>>2)]),
          "vertex": makeVertexState(
            descriptor + 16),
          "primitive": makePrimitiveState(
            descriptor + 48),
          "depthStencil": makeDepthStencilState(
            HEAPU32[(((descriptor)+(72))>>2)]),
          "multisample": makeMultisampleState(
            descriptor + 76),
          "fragment": makeFragmentState(
            HEAPU32[(((descriptor)+(92))>>2)]),
        };
        return desc;
      },
  fillLimitStruct:(limits, limitsOutPtr) => {
        assert(limitsOutPtr);
        var nextInChainPtr = HEAPU32[((limitsOutPtr)>>2)];
  
        function setLimitValueU32(name, basePtr, limitOffset, fallbackValue = 0) {
          var limitValue = limits[name] ?? fallbackValue;
          HEAPU32[(((basePtr)+(limitOffset))>>2)] = limitValue;
        }
        function setLimitValueU64(name, basePtr, limitOffset, fallbackValue = 0) {
          var limitValue = limits[name] ?? fallbackValue;
          // Limits are integer-valued JS `Number`s, so they fit in 'i53'.
          writeI53ToI64((basePtr)+(limitOffset), limitValue);
        }
  
        setLimitValueU32('maxTextureDimension1D',                     limitsOutPtr, 4);
        setLimitValueU32('maxTextureDimension2D',                     limitsOutPtr, 8);
        setLimitValueU32('maxTextureDimension3D',                     limitsOutPtr, 12);
        setLimitValueU32('maxTextureArrayLayers',                     limitsOutPtr, 16);
        setLimitValueU32('maxBindGroups',                             limitsOutPtr, 20);
        setLimitValueU32('maxBindGroupsPlusVertexBuffers',            limitsOutPtr, 24);
        setLimitValueU32('maxBindingsPerBindGroup',                   limitsOutPtr, 28);
        setLimitValueU32('maxDynamicUniformBuffersPerPipelineLayout', limitsOutPtr, 32);
        setLimitValueU32('maxDynamicStorageBuffersPerPipelineLayout', limitsOutPtr, 36);
        setLimitValueU32('maxSampledTexturesPerShaderStage',          limitsOutPtr, 40);
        setLimitValueU32('maxSamplersPerShaderStage',                 limitsOutPtr, 44);
        setLimitValueU32('maxStorageBuffersPerShaderStage',           limitsOutPtr, 48);
        setLimitValueU32('maxStorageTexturesPerShaderStage',          limitsOutPtr, 52);
        setLimitValueU32('maxUniformBuffersPerShaderStage',           limitsOutPtr, 56);
        setLimitValueU32('minUniformBufferOffsetAlignment',           limitsOutPtr, 80);
        setLimitValueU32('minStorageBufferOffsetAlignment',           limitsOutPtr, 84);
        setLimitValueU64('maxUniformBufferBindingSize',               limitsOutPtr, 64);
        setLimitValueU64('maxStorageBufferBindingSize',               limitsOutPtr, 72);
        setLimitValueU32('maxVertexBuffers',                          limitsOutPtr, 88);
        setLimitValueU64('maxBufferSize',                             limitsOutPtr, 96);
        setLimitValueU32('maxVertexAttributes',                       limitsOutPtr, 104);
        setLimitValueU32('maxVertexBufferArrayStride',                limitsOutPtr, 108);
        setLimitValueU32('maxInterStageShaderVariables',              limitsOutPtr, 112);
        setLimitValueU32('maxColorAttachments',                       limitsOutPtr, 116);
        setLimitValueU32('maxColorAttachmentBytesPerSample',          limitsOutPtr, 120);
        setLimitValueU32('maxComputeWorkgroupStorageSize',            limitsOutPtr, 124);
        setLimitValueU32('maxComputeInvocationsPerWorkgroup',         limitsOutPtr, 128);
        setLimitValueU32('maxComputeWorkgroupSizeX',                  limitsOutPtr, 132);
        setLimitValueU32('maxComputeWorkgroupSizeY',                  limitsOutPtr, 136);
        setLimitValueU32('maxComputeWorkgroupSizeZ',                  limitsOutPtr, 140);
        setLimitValueU32('maxComputeWorkgroupsPerDimension',          limitsOutPtr, 144);
        // Note this limit is new and won't be present in all browsers for a while. Fall back to 0.
        setLimitValueU32('maxImmediateSize',                          limitsOutPtr, 148);
  
        if (nextInChainPtr !== 0) {
          var sType = HEAP32[(((nextInChainPtr)+(4))>>2)];
          assert(sType === 15);
          assert(0 === HEAPU32[((nextInChainPtr)>>2)]);
          var compatibilityModeLimitsPtr = nextInChainPtr;
          assert(compatibilityModeLimitsPtr);assert(HEAPU32[((compatibilityModeLimitsPtr)>>2)] === 0);
  
          // Note these limits are new and won't be present in all browsers for a while. Fall back to exposing the PerShaderStage limit.
          setLimitValueU32('maxStorageBuffersInVertexStage',    compatibilityModeLimitsPtr, 8,    limits.maxStorageBuffersPerShaderStage);
          setLimitValueU32('maxStorageBuffersInFragmentStage',  compatibilityModeLimitsPtr, 16,  limits.maxStorageBuffersPerShaderStage);
          setLimitValueU32('maxStorageTexturesInVertexStage',   compatibilityModeLimitsPtr, 12,   limits.maxStorageTexturesPerShaderStage);
          setLimitValueU32('maxStorageTexturesInFragmentStage', compatibilityModeLimitsPtr, 20, limits.maxStorageTexturesPerShaderStage);
        }
      },
  fillAdapterInfoStruct:(info, infoStruct) => {
        assert(infoStruct);assert(HEAPU32[((infoStruct)>>2)] === 0);
  
        // Populate subgroup limits.
        HEAPU32[(((infoStruct)+(52))>>2)] = info.subgroupMinSize;
        HEAPU32[(((infoStruct)+(56))>>2)] = info.subgroupMaxSize;
  
        // Append all the strings together to condense into a single malloc.
        var strs = info.vendor + info.architecture + info.device + info.description;
        var strPtr = stringToNewUTF8(strs);
  
        var vendorLen = lengthBytesUTF8(info.vendor);
        WebGPU.setStringView(infoStruct + 4, strPtr, vendorLen);
        strPtr += vendorLen;
  
        var architectureLen = lengthBytesUTF8(info.architecture);
        WebGPU.setStringView(infoStruct + 12, strPtr, architectureLen);
        strPtr += architectureLen;
  
        var deviceLen = lengthBytesUTF8(info.device);
        WebGPU.setStringView(infoStruct + 20, strPtr, deviceLen);
        strPtr += deviceLen;
  
        var descriptionLen = lengthBytesUTF8(info.description);
        WebGPU.setStringView(infoStruct + 28, strPtr, descriptionLen);
        strPtr += descriptionLen;
  
        HEAP32[(((infoStruct)+(36))>>2)] = 2;
        var adapterType = info.isFallbackAdapter ? 3 : 4;
        HEAP32[(((infoStruct)+(40))>>2)] = adapterType;
        HEAPU32[(((infoStruct)+(44))>>2)] = 0;
        HEAPU32[(((infoStruct)+(48))>>2)] = 0;
      },
  AddressMode:[,"clamp-to-edge","repeat","mirror-repeat"],
  BlendFactor:[,"zero","one","src","one-minus-src","src-alpha","one-minus-src-alpha","dst","one-minus-dst","dst-alpha","one-minus-dst-alpha","src-alpha-saturated","constant","one-minus-constant","src1","one-minus-src1","src1-alpha","one-minus-src1-alpha"],
  BlendOperation:[,"add","subtract","reverse-subtract","min","max"],
  BufferBindingType:[,,"uniform","storage","read-only-storage"],
  BufferMapState:[,"unmapped","pending","mapped"],
  CompareFunction:[,"never","less","equal","less-equal","greater","not-equal","greater-equal","always"],
  CompilationInfoRequestStatus:[,"success","callback-cancelled"],
  ComponentSwizzle:[,"0","1","r","g","b","a"],
  CompositeAlphaMode:[,"opaque","premultiplied","unpremultiplied","inherit"],
  CullMode:[,"none","front","back"],
  ErrorFilter:[,"validation","out-of-memory","internal"],
  FeatureLevel:[,"compatibility","core"],
  FeatureName:{
  1:"core-features-and-limits",
  2:"depth-clip-control",
  3:"depth32float-stencil8",
  4:"texture-compression-bc",
  5:"texture-compression-bc-sliced-3d",
  6:"texture-compression-etc2",
  7:"texture-compression-astc",
  8:"texture-compression-astc-sliced-3d",
  9:"timestamp-query",
  10:"indirect-first-instance",
  11:"shader-f16",
  12:"rg11b10ufloat-renderable",
  13:"bgra8unorm-storage",
  14:"float32-filterable",
  15:"float32-blendable",
  16:"clip-distances",
  17:"dual-source-blending",
  18:"subgroups",
  19:"texture-formats-tier1",
  20:"texture-formats-tier2",
  21:"primitive-index",
  22:"texture-component-swizzle",
  327692:"chromium-experimental-unorm16-texture-formats",
  327729:"chromium-experimental-multi-draw-indirect",
  },
  FilterMode:[,"nearest","linear"],
  FrontFace:[,"ccw","cw"],
  IndexFormat:[,"uint16","uint32"],
  InstanceFeatureName:[,"timed-wait-any","shader-source-spirv","multiple-devices-per-adapter"],
  LoadOp:[,"load","clear"],
  MipmapFilterMode:[,"nearest","linear"],
  OptionalBool:["false","true",],
  PowerPreference:[,"low-power","high-performance"],
  PredefinedColorSpace:[,"srgb","display-p3"],
  PrimitiveTopology:[,"point-list","line-list","line-strip","triangle-list","triangle-strip"],
  QueryType:[,"occlusion","timestamp"],
  SamplerBindingType:[,,"filtering","non-filtering","comparison"],
  Status:[,"success","error"],
  StencilOperation:[,"keep","zero","replace","invert","increment-clamp","decrement-clamp","increment-wrap","decrement-wrap"],
  StorageTextureAccess:[,,"write-only","read-only","read-write"],
  StoreOp:[,"store","discard"],
  SurfaceGetCurrentTextureStatus:[,"success-optimal","success-suboptimal","timeout","outdated","lost","error"],
  TextureAspect:[,"all","stencil-only","depth-only"],
  TextureDimension:[,"1d","2d","3d"],
  TextureFormat:[,"r8unorm","r8snorm","r8uint","r8sint","r16unorm","r16snorm","r16uint","r16sint","r16float","rg8unorm","rg8snorm","rg8uint","rg8sint","r32float","r32uint","r32sint","rg16unorm","rg16snorm","rg16uint","rg16sint","rg16float","rgba8unorm","rgba8unorm-srgb","rgba8snorm","rgba8uint","rgba8sint","bgra8unorm","bgra8unorm-srgb","rgb10a2uint","rgb10a2unorm","rg11b10ufloat","rgb9e5ufloat","rg32float","rg32uint","rg32sint","rgba16unorm","rgba16snorm","rgba16uint","rgba16sint","rgba16float","rgba32float","rgba32uint","rgba32sint","stencil8","depth16unorm","depth24plus","depth24plus-stencil8","depth32float","depth32float-stencil8","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb","bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm","bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb","etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm","astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm","astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb"],
  TextureSampleType:[,,"float","unfilterable-float","depth","sint","uint"],
  TextureViewDimension:[,"1d","2d","2d-array","cube","cube-array","3d"],
  ToneMappingMode:[,"standard","extended"],
  VertexFormat:[,"uint8","uint8x2","uint8x4","sint8","sint8x2","sint8x4","unorm8","unorm8x2","unorm8x4","snorm8","snorm8x2","snorm8x4","uint16","uint16x2","uint16x4","sint16","sint16x2","sint16x4","unorm16","unorm16x2","unorm16x4","snorm16","snorm16x2","snorm16x4","float16","float16x2","float16x4","float32","float32x2","float32x3","float32x4","uint32","uint32x2","uint32x3","uint32x4","sint32","sint32x2","sint32x3","sint32x4","unorm10-10-10-2","unorm8x4-bgra"],
  VertexStepMode:[,"vertex","instance"],
  WGSLLanguageFeatureName:[,"readonly_and_readwrite_storage_textures","packed_4x8_integer_dot_product","unrestricted_pointer_parameters","pointer_composite_access","uniform_buffer_standard_layout","subgroup_id","texture_and_sampler_let","subgroup_uniformity","texture_formats_tier1","linear_indexing"],
  };
  
  var emwgpuStringToInt_DeviceLostReason = {
              'undefined': 1,  // For older browsers
              'unknown': 1,
              'destroyed': 2,
          };
  
  
  
  
  
  
  function _emwgpuAdapterRequestDevice(adapterPtr, futureId, deviceLostFutureId, devicePtr, queuePtr, descriptor) {
    futureId = bigintToI53Checked(futureId);
    deviceLostFutureId = bigintToI53Checked(deviceLostFutureId);
  
  
      var adapter = WebGPU.getJsObject(adapterPtr);
  
      var desc = {};
      if (descriptor) {
        assert(descriptor);assert(HEAPU32[((descriptor)>>2)] === 0);
        var requiredFeatureCount = HEAPU32[(((descriptor)+(12))>>2)];
        if (requiredFeatureCount) {
          var requiredFeaturesPtr = HEAPU32[(((descriptor)+(16))>>2)];
          // requiredFeaturesPtr is a pointer to an array of FeatureName which is an enum of size uint32_t
          desc["requiredFeatures"] = Array.from(HEAPU32.subarray((((requiredFeaturesPtr)>>2)), ((requiredFeaturesPtr + requiredFeatureCount * 4)>>2)),
            (feature) => WebGPU.FeatureName[feature]);
        }
        var limitsPtr = HEAPU32[(((descriptor)+(20))>>2)];
        if (limitsPtr) {
          assert(limitsPtr);
          var nextInChainPtr = HEAPU32[((limitsPtr)>>2)];
          var requiredLimits = {};
          function setLimitU32IfDefined(name, basePtr, limitOffset, ignoreIfZero = false) {
            var ptr = basePtr + limitOffset;
            var value = HEAPU32[((ptr)>>2)];
            if (value != 4294967295 && (!ignoreIfZero || value != 0)) {
              requiredLimits[name] = value;
            }
          }
          function setLimitU64IfDefined(name, basePtr, limitOffset) {
            var ptr = basePtr + limitOffset;
            // Handle WGPU_LIMIT_U64_UNDEFINED.
            var limitPart1 = HEAPU32[((ptr)>>2)];
            var limitPart2 = HEAPU32[(((ptr)+(4))>>2)];
            if (limitPart1 != 0xFFFFFFFF || limitPart2 != 0xFFFFFFFF) {
              requiredLimits[name] = readI53FromI64(ptr);
            }
          }
  
          setLimitU32IfDefined("maxTextureDimension1D",                     limitsPtr, 4);
          setLimitU32IfDefined("maxTextureDimension2D",                     limitsPtr, 8);
          setLimitU32IfDefined("maxTextureDimension3D",                     limitsPtr, 12);
          setLimitU32IfDefined("maxTextureArrayLayers",                     limitsPtr, 16);
          setLimitU32IfDefined("maxBindGroups",                             limitsPtr, 20);
          setLimitU32IfDefined('maxBindGroupsPlusVertexBuffers',            limitsPtr, 24);
          setLimitU32IfDefined('maxBindingsPerBindGroup',                   limitsPtr, 28);
          setLimitU32IfDefined("maxDynamicUniformBuffersPerPipelineLayout", limitsPtr, 32);
          setLimitU32IfDefined("maxDynamicStorageBuffersPerPipelineLayout", limitsPtr, 36);
          setLimitU32IfDefined("maxSampledTexturesPerShaderStage",          limitsPtr, 40);
          setLimitU32IfDefined("maxSamplersPerShaderStage",                 limitsPtr, 44);
          setLimitU32IfDefined("maxStorageBuffersPerShaderStage",           limitsPtr, 48);
          setLimitU32IfDefined("maxStorageTexturesPerShaderStage",          limitsPtr, 52);
          setLimitU32IfDefined("maxUniformBuffersPerShaderStage",           limitsPtr, 56);
          setLimitU32IfDefined("minUniformBufferOffsetAlignment",           limitsPtr, 80);
          setLimitU32IfDefined("minStorageBufferOffsetAlignment",           limitsPtr, 84);
          setLimitU64IfDefined("maxUniformBufferBindingSize",               limitsPtr, 64);
          setLimitU64IfDefined("maxStorageBufferBindingSize",               limitsPtr, 72);
          setLimitU32IfDefined("maxVertexBuffers",                          limitsPtr, 88);
          setLimitU64IfDefined("maxBufferSize",                             limitsPtr, 96);
          setLimitU32IfDefined("maxVertexAttributes",                       limitsPtr, 104);
          setLimitU32IfDefined("maxVertexBufferArrayStride",                limitsPtr, 108);
          setLimitU32IfDefined("maxInterStageShaderVariables",              limitsPtr, 112);
          setLimitU32IfDefined("maxColorAttachments",                       limitsPtr, 116);
          setLimitU32IfDefined("maxColorAttachmentBytesPerSample",          limitsPtr, 120);
          setLimitU32IfDefined("maxComputeWorkgroupStorageSize",            limitsPtr, 124);
          setLimitU32IfDefined("maxComputeInvocationsPerWorkgroup",         limitsPtr, 128);
          setLimitU32IfDefined("maxComputeWorkgroupSizeX",                  limitsPtr, 132);
          setLimitU32IfDefined("maxComputeWorkgroupSizeY",                  limitsPtr, 136);
          setLimitU32IfDefined("maxComputeWorkgroupSizeZ",                  limitsPtr, 140);
          setLimitU32IfDefined("maxComputeWorkgroupsPerDimension",          limitsPtr, 144);
          // Not present in all browsers. If the app requested 0, avoid passing it through so it won't cause an error.
          setLimitU32IfDefined("maxImmediateSize",                          limitsPtr, 148, true);
  
          if (nextInChainPtr !== 0) {
            var sType = HEAP32[(((nextInChainPtr)+(4))>>2)];
            assert(sType === 15);
            assert(0 === HEAPU32[((nextInChainPtr)>>2)]);
            var compatibilityModeLimitsPtr = nextInChainPtr;
            assert(compatibilityModeLimitsPtr);assert(HEAPU32[((compatibilityModeLimitsPtr)>>2)] === 0);
            // If not present in the browser, don't request these, otherwise they'll cause an error.
            // (Technically, if any of these is higher than the PerShaderStage equivalent, we should
            // raise the PerShaderStage limit instead, but that's complex and apps should be able to
            // deal with that themselves.)
            if ('maxStorageBuffersInVertexStage' in GPUSupportedLimits.prototype) {
              setLimitU32IfDefined('maxStorageBuffersInVertexStage',    compatibilityModeLimitsPtr, 8);
              setLimitU32IfDefined('maxStorageTexturesInVertexStage',   compatibilityModeLimitsPtr, 12);
              setLimitU32IfDefined('maxStorageBuffersInFragmentStage',  compatibilityModeLimitsPtr, 16);
              setLimitU32IfDefined('maxStorageTexturesInFragmentStage', compatibilityModeLimitsPtr, 20);
            }
          }
  
          desc["requiredLimits"] = requiredLimits;
        }
  
        var defaultQueuePtr = HEAPU32[(((descriptor)+(24))>>2)];
        if (defaultQueuePtr) {
          var defaultQueueDesc = {
            "label": WebGPU.makeStringFromOptionalStringView(
              defaultQueuePtr + 4),
          };
          desc["defaultQueue"] = defaultQueueDesc;
        }
        desc["label"] = WebGPU.makeStringFromOptionalStringView(
          descriptor + 4
        );
      }
  
       // requestDevice
      WebGPU.Internals.futureInsert(futureId, adapter.requestDevice(desc).then((device) => {
         // requestDevice fulfilled
        callUserCallback(() => {
          WebGPU.Internals.jsObjectInsert(queuePtr, device.queue);
          WebGPU.Internals.jsObjectInsert(devicePtr, device);
  
          
  
          // Set up device lost promise resolution.
          assert(deviceLostFutureId);
          // Don't keepalive here, because this isn't guaranteed to ever happen.
          WebGPU.Internals.futureInsert(deviceLostFutureId, device.lost.then((info) => {
            // If the runtime has exited, avoid calling callUserCallback as it
            // will print an error (e.g. if the device got freed during shutdown).
            callUserCallback(() => {
              // Unset the uncaptured error handler.
              device.onuncapturederror = (ev) => {};
              var sp = stackSave();
              var messagePtr = stringToUTF8OnStack(info.message);
              _emwgpuOnDeviceLostCompleted(deviceLostFutureId, emwgpuStringToInt_DeviceLostReason[info.reason],
                messagePtr);
              stackRestore(sp);
            });
          }));
  
          // Set up uncaptured error handlers.
          assert(typeof GPUValidationError != 'undefined');
          assert(typeof GPUOutOfMemoryError != 'undefined');
          assert(typeof GPUInternalError != 'undefined');
          device.onuncapturederror = (ev) => {
              var type = 5;
              if (ev.error instanceof GPUValidationError) type = 2;
              else if (ev.error instanceof GPUOutOfMemoryError) type = 3;
              else if (ev.error instanceof GPUInternalError) type = 4;
              var sp = stackSave();
              var messagePtr = stringToUTF8OnStack(ev.error.message);
              _emwgpuOnUncapturedError(devicePtr, type, messagePtr);
              stackRestore(sp);
          };
  
          _emwgpuOnRequestDeviceCompleted(futureId, 1,
            devicePtr, 0);
        });
      }, (ex) => {
         // requestDevice rejected
        callUserCallback(() => {
          var sp = stackSave();
          var messagePtr = stringToUTF8OnStack(ex.message);
          _emwgpuOnRequestDeviceCompleted(futureId, 3,
            devicePtr, messagePtr);
          if (deviceLostFutureId) {
            _emwgpuOnDeviceLostCompleted(deviceLostFutureId, 4,
              messagePtr);
          }
          stackRestore(sp);
        });
      }));
    ;
  }

  
  var _emwgpuBufferDestroy = (bufferPtr) => {
      var buffer = WebGPU.getJsObject(bufferPtr);
      var onUnmap = WebGPU.Internals.bufferOnUnmaps[bufferPtr];
      if (onUnmap) {
        for (var i = 0; i < onUnmap.length; ++i) {
          onUnmap[i]();
        }
        delete WebGPU.Internals.bufferOnUnmaps[bufferPtr];
      }
  
      buffer.destroy();
    };

  
  
  
  
  
  var _emwgpuBufferGetConstMappedRange = (bufferPtr, offset, size) => {
      var buffer = WebGPU.getJsObject(bufferPtr);
  
      if (size === 0) warnOnce('getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE');
  
      if (size == -1) size = undefined;
  
      var mapped;
      try {
        mapped = buffer.getMappedRange(offset, size);
      } catch (ex) {
        err(`buffer.getMappedRange(${offset}, ${size}) failed: ${ex}`);
        return 0;
      }
      var data = _memalign(16, mapped.byteLength);
      HEAPU8.set(new Uint8Array(mapped), data);
      WebGPU.Internals.bufferOnUnmaps[bufferPtr].push(() => _free(data));
      return data;
    };

  
  
  
  
  var _emwgpuBufferMapAsync = function(bufferPtr, futureId, mode, offset, size) {
    futureId = bigintToI53Checked(futureId);
    mode = bigintToI53Checked(mode);
  
  
      var buffer = WebGPU.getJsObject(bufferPtr);
      WebGPU.Internals.bufferOnUnmaps[bufferPtr] = [];
  
      if (size == -1) size = undefined;
  
       // mapAsync
      WebGPU.Internals.futureInsert(futureId, buffer.mapAsync(mode, offset, size).then(() => {
         // mapAsync fulfilled
        callUserCallback(() => {
          _emwgpuOnMapAsyncCompleted(futureId, 1,
            0);
        });
      }, (ex) => {
         // mapAsync rejected
        callUserCallback(() => {
          var sp = stackSave();
          var messagePtr = stringToUTF8OnStack(ex.message);
          var status =
            ex.name === 'AbortError' ? 4 :
            ex.name === 'OperationError' ? 3 :
            0;
          assert(status);
          _emwgpuOnMapAsyncCompleted(futureId, status, messagePtr);
          delete WebGPU.Internals.bufferOnUnmaps[bufferPtr];
        });
      }));
    ;
  };

  
  var _emwgpuBufferUnmap = (bufferPtr) => {
      var buffer = WebGPU.getJsObject(bufferPtr);
  
      var onUnmap = WebGPU.Internals.bufferOnUnmaps[bufferPtr];
      if (!onUnmap) {
        // Already unmapped
        return;
      }
  
      for (var i = 0; i < onUnmap.length; ++i) {
        onUnmap[i]();
      }
      delete WebGPU.Internals.bufferOnUnmaps[bufferPtr]
  
      buffer.unmap();
    };

  
  var _emwgpuDelete = (ptr) => {
      delete WebGPU.Internals.jsObjects[ptr];
    };

  
  
  var _emwgpuDeviceCreateBuffer = (devicePtr, descriptor, bufferPtr) => {
      assert(descriptor);assert(HEAPU32[((descriptor)>>2)] === 0);
  
      var mappedAtCreation = !!(HEAPU32[(((descriptor)+(32))>>2)]);
  
      var desc = {
        "label": WebGPU.makeStringFromOptionalStringView(
          descriptor + 4),
        "usage": HEAPU32[(((descriptor)+(16))>>2)],
        "size": readI53FromI64((descriptor)+(24)),
        "mappedAtCreation": mappedAtCreation,
      };
  
      var device = WebGPU.getJsObject(devicePtr);
      var buffer;
      try {
        buffer = device.createBuffer(desc);
      } catch (ex) {
        // The only exception should be RangeError if mapping at creation ran out of memory.
        assert(ex instanceof RangeError);
        assert(mappedAtCreation);
        err('createBuffer threw:', ex);
        return false;
      }
      WebGPU.Internals.jsObjectInsert(bufferPtr, buffer);
      if (mappedAtCreation) {
        WebGPU.Internals.bufferOnUnmaps[bufferPtr] = [];
      }
      return true;
    };

  
  
  
  var _emwgpuDeviceCreateShaderModule = (devicePtr, descriptor, shaderModulePtr) => {
      assert(descriptor);
      var nextInChainPtr = HEAPU32[((descriptor)>>2)];
      assert(nextInChainPtr !== 0);
      var sType = HEAP32[(((nextInChainPtr)+(4))>>2)];
  
      var desc = {
        "label": WebGPU.makeStringFromOptionalStringView(
          descriptor + 4),
        "code": "",
      };
  
      switch (sType) {
        case 2: {
          desc["code"] = WebGPU.makeStringFromStringView(
            nextInChainPtr + 8
          );
          break;
        }
        default: abort('unrecognized ShaderModule sType');
      }
  
      var device = WebGPU.getJsObject(devicePtr);
      WebGPU.Internals.jsObjectInsert(shaderModulePtr, device.createShaderModule(desc));
    };

  
  var _emwgpuDeviceDestroy = (devicePtr) => {
      const device = WebGPU.getJsObject(devicePtr);
      // Remove the onuncapturederror handler which holds a pointer to the WGPUDevice.
      device.onuncapturederror = null;
      device.destroy()
    };

  
  
  
  
  
  
  function _emwgpuInstanceRequestAdapter(instancePtr, futureId, options, adapterPtr) {
    futureId = bigintToI53Checked(futureId);
  
  
      var opts;
      if (options) {
        assert(options);
        opts = {
          "featureLevel": WebGPU.FeatureLevel[HEAP32[(((options)+(4))>>2)]],
          "powerPreference": WebGPU.PowerPreference[HEAP32[(((options)+(8))>>2)]],
          "forceFallbackAdapter":
            !!(HEAPU32[(((options)+(12))>>2)]),
        };
  
        var nextInChainPtr = HEAPU32[((options)>>2)];
        if (nextInChainPtr !== 0) {
          var sType = HEAP32[(((nextInChainPtr)+(4))>>2)];
          assert(sType === 11);
          assert(0 === HEAPU32[((nextInChainPtr)>>2)]);
          var webxrOptions = nextInChainPtr;
          assert(webxrOptions);assert(HEAPU32[((webxrOptions)>>2)] === 0);
          opts.xrCompatible = !!(HEAPU32[(((webxrOptions)+(8))>>2)]);
        }
      }
  
      if (!('gpu' in navigator)) {
        var sp = stackSave();
        var messagePtr = stringToUTF8OnStack('WebGPU not available on this browser (navigator.gpu is not available)');
        _emwgpuOnRequestAdapterCompleted(futureId, 3,
          adapterPtr, messagePtr);
        stackRestore(sp);
        return;
      }
  
       // requestAdapter
      WebGPU.Internals.futureInsert(futureId, navigator.gpu.requestAdapter(opts).then((adapter) => {
         // requestAdapter fulfilled
        callUserCallback(() => {
          if (adapter) {
            WebGPU.Internals.jsObjectInsert(adapterPtr, adapter);
            _emwgpuOnRequestAdapterCompleted(futureId, 1,
              adapterPtr, 0);
          } else {
            var sp = stackSave();
            var messagePtr = stringToUTF8OnStack('WebGPU not available on this browser (requestAdapter returned null)');
            _emwgpuOnRequestAdapterCompleted(futureId, 3,
              adapterPtr, messagePtr);
            stackRestore(sp);
          }
        });
      }, (ex) => {
         // requestAdapter rejected
        callUserCallback(() => {
          var sp = stackSave();
          var messagePtr = stringToUTF8OnStack(ex.message);
          _emwgpuOnRequestAdapterCompleted(futureId, 4,
            adapterPtr, messagePtr);
          stackRestore(sp);
        });
      }));
    ;
  }

  
  
  
  
  var _emwgpuQueueOnSubmittedWorkDone = function(queuePtr, futureId) {
    futureId = bigintToI53Checked(futureId);
  
  
      var queue = WebGPU.getJsObject(queuePtr);
  
       // onSubmittedWorkDone
      WebGPU.Internals.futureInsert(futureId, queue.onSubmittedWorkDone().then(() => {
         // onSubmittedWorkDone fulfilled (assumed not to reject)
        callUserCallback(() => {
          _emwgpuOnWorkDoneCompleted(futureId, 1);
        });
      }));
    ;
  };

  
  var _emwgpuWaitAny = (futurePtr, futureCount, timeoutMSPtr) => {
      abort('TODO: Implement asyncify-free WaitAny for timeout=0');
    };

  var ENV = {
  };
  
  var getExecutableName = () => thisProgram;
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        var lang = (globalThis.navigator?.language ?? 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      var envp = 0;
      for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(envp))>>2)] = ptr;
        bufSize += stringToUTF8(string, ptr, Infinity) + 1;
        envp += 4;
      }
      return 0;
    };

  
  
  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1;
      }
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    };

  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  

  
  
  
  function _fd_fdstat_get(fd, pbuf) {
  try {
  
      var rightsBase = 0;
      var rightsInheriting = 0;
      var flags = 0;
      {
        var stream = SYSCALLS.getStreamFromFD(fd);
        // All character devices are terminals (other things a Linux system would
        // assume is a character device, like the mouse, we have special APIs for).
        var type = stream.tty ? 2 :
                   FS.isDir(stream.mode) ? 3 :
                   FS.isLink(stream.mode) ? 7 :
                   4;
      }
      HEAP8[pbuf] = type;
      HEAP16[(((pbuf)+(2))>>1)] = flags;
      HEAP64[(((pbuf)+(8))>>3)] = BigInt(rightsBase);
      HEAP64[(((pbuf)+(16))>>3)] = BigInt(rightsInheriting);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  

  
  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        try {
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
        } catch (e) {
          // On a non-blocking stream a subsequent read may would-block after we
          // already gathered data. POSIX readv is a single gather-read: return
          // what we have rather than failing the whole call.
          if (ret > 0 && e instanceof FS.ErrnoError &&
              (e.errno == 6 || e.errno == 6)) {
            break;
          }
          throw e;
        }
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset !== 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  
  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  

  
  
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
  
  
  try {
  
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[((newOffset)>>3)] = BigInt(stream.position);
      if (stream.getdents && !offset && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  
  
  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      // Gather all iovecs into one contiguous buffer and issue a single
      // FS.write, matching POSIX writev's single gather-write semantics (as
      // __syscall_sendmsg already does). Per-iovec writes fragment a stream
      // socket send into multiple segments, breaking stream byte semantics.
      if (iovcnt == 1) {
        // Single iovec: write directly from HEAP8, no gather buffer needed.
        return FS.write(stream, HEAP8, HEAPU32[((iov)>>2)], HEAPU32[(((iov)+(4))>>2)], offset);
      }
      var total = 0;
      for (var i = 0, p = iov; i < iovcnt; i++, p += 8) {
        total += HEAPU32[(((p)+(4))>>2)];
      }
      var view = new Uint8Array(total);
      var voff = 0;
      for (var i = 0; i < iovcnt; i++, iov += 8) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        view.set(HEAPU8.subarray(ptr, ptr + len), voff);
        voff += len;
      }
      return FS.write(stream, view, 0, total, offset);
    };
  
  
  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  

  
  
  
  
  
  
  
  
  
  
  var _getaddrinfo = (node, service, hint, out) => {
      // Note getaddrinfo currently only returns a single addrinfo with ai_next defaulting to NULL. When NULL
      // hints are specified or ai_family set to AF_UNSPEC or ai_socktype or ai_protocol set to 0 then we
      // really should provide a linked list of suitable addrinfo values.
      var addrs = [];
      var canon = null;
      var addr = 0;
      var port = 0;
      var flags = 0;
      var family = 0;
      var type = 0;
      var proto = 0;
      var ai, last;
  
      function allocaddrinfo(family, type, proto, canon, addr, port) {
        var sa, salen, ai;
        var errno;
  
        salen = family === 10 ?
          28 :
          16;
        addr = family === 10 ?
          inetNtop6(addr) :
          inetNtop4(addr);
        sa = _malloc(salen);
        errno = writeSockaddr(sa, family, addr, port);
        assert(!errno);
  
        ai = _malloc(32);
        HEAP32[(((ai)+(4))>>2)] = family;
        HEAP32[(((ai)+(8))>>2)] = type;
        HEAP32[(((ai)+(12))>>2)] = proto;
        HEAPU32[(((ai)+(24))>>2)] = canon;
        HEAPU32[(((ai)+(20))>>2)] = sa;
        if (family === 10) {
          HEAP32[(((ai)+(16))>>2)] = 28;
        } else {
          HEAP32[(((ai)+(16))>>2)] = 16;
        }
        HEAP32[(((ai)+(28))>>2)] = 0;
  
        return ai;
      }
  
      if (hint) {
        flags = HEAP32[((hint)>>2)];
        family = HEAP32[(((hint)+(4))>>2)];
        type = HEAP32[(((hint)+(8))>>2)];
        proto = HEAP32[(((hint)+(12))>>2)];
      }
      if (type && !proto) {
        proto = type === 2 ? 17 : 6;
      }
      if (!type && proto) {
        type = proto === 17 ? 2 : 1;
      }
  
      // If type or proto are set to zero in hints we should really be returning multiple addrinfo values, but for
      // now default to a TCP STREAM socket so we can at least return a sensible addrinfo given NULL hints.
      if (!proto) {
        proto = 6;
      }
      if (!type) {
        type = 1;
      }
  
      if (!node && !service) {
        return -2;
      }
      if (flags & ~(1|2|4|
          1024|8|16|32)) {
        return -1;
      }
      if (hint && (HEAP32[((hint)>>2)] & 2) && !node) {
        return -1;
      }
      if (flags & 32) {
        // TODO
        return -2;
      }
      if (type && type !== 1 && type !== 2) {
        return -7;
      }
      if (family !== 0 && family !== 2 && family !== 10) {
        return -6;
      }
  
      if (service) {
        service = UTF8ToString(service);
        port = parseInt(service, 10);
  
        if (isNaN(port)) {
          if (flags & 1024) {
            return -2;
          }
          // TODO support resolving well-known service names from:
          // http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.txt
          return -8;
        }
      }
  
      if (!node) {
        if (family === 0) {
          family = 2;
        }
        if (!(flags & 1)) {
          if (family === 2) {
            addr = _htonl(2130706433);
          } else {
            addr = [0, 0, 0, _htonl(1)];
          }
        }
        ai = allocaddrinfo(family, type, proto, null, addr, port);
        HEAPU32[((out)>>2)] = ai;
        return 0;
      }
  
      //
      // try as a numeric address
      //
      node = UTF8ToString(node);
      addr = inetPton4(node);
      if (addr !== null) {
        // incoming node is a valid ipv4 address
        if (family === 0 || family === 2) {
          family = 2;
        }
        else if (family === 10 && (flags & 8)) {
          addr = [0, 0, _htonl(0xffff), addr];
          family = 10;
        } else {
          return -2;
        }
      } else {
        addr = inetPton6(node);
        if (addr !== null) {
          // incoming node is a valid ipv6 address
          if (family === 0 || family === 10) {
            family = 10;
          } else {
            return -2;
          }
        }
      }
      if (addr != null) {
        ai = allocaddrinfo(family, type, proto, node, addr, port);
        HEAPU32[((out)>>2)] = ai;
        return 0;
      }
      if (flags & 4) {
        return -2;
      }
  
      //
      // try as a hostname
      //
      // resolve the hostname to a temporary fake address
      node = DNS.lookup_name(node);
      addr = inetPton4(node);
      if (family === 0) {
        family = 2;
      } else if (family === 10) {
        addr = [0, 0, _htonl(0xffff), addr];
      }
      ai = allocaddrinfo(family, type, proto, null, addr, port);
      HEAPU32[((out)>>2)] = ai;
      return 0;
    };

  
  var _random_get = (buffer, size) => randomFill(HEAPU8.subarray(buffer, buffer + size));

  
  var _wgpuAdapterGetInfo = (adapterPtr, info) => {
      var adapter = WebGPU.getJsObject(adapterPtr);
      WebGPU.fillAdapterInfoStruct(adapter.info, info);
      return 1;
    };

  
  var _wgpuAdapterGetLimits = (adapterPtr, limitsOutPtr) => {
      var adapter = WebGPU.getJsObject(adapterPtr);
      WebGPU.fillLimitStruct(adapter.limits, limitsOutPtr);
      return 1;
    };

  
  var _wgpuAdapterHasFeature = (adapterPtr, featureEnumValue) => {
      var adapter = WebGPU.getJsObject(adapterPtr);
      return adapter.features.has(WebGPU.FeatureName[featureEnumValue]);
    };

  
  
  var _wgpuBufferGetSize = function(bufferPtr) {
  
  var ret = (() => { 
      var buffer = WebGPU.getJsObject(bufferPtr);
      // 64-bit
      return buffer.size;
     })();
  return BigInt(ret);
  };

  
  
  
  var _wgpuCommandEncoderBeginComputePass = (encoderPtr, descriptor) => {
      var desc;
  
      if (descriptor) {
        assert(descriptor);assert(HEAPU32[((descriptor)>>2)] === 0);
        desc = {
          "label": WebGPU.makeStringFromOptionalStringView(
            descriptor + 4),
          "timestampWrites": WebGPU.makePassTimestampWrites(
            HEAPU32[(((descriptor)+(12))>>2)]),
        };
      }
      var commandEncoder = WebGPU.getJsObject(encoderPtr);
      var ptr = _emwgpuCreateComputePassEncoder(0);
      WebGPU.Internals.jsObjectInsert(ptr, commandEncoder.beginComputePass(desc));
      return ptr;
    };

  
  
  function _wgpuCommandEncoderCopyBufferToBuffer(encoderPtr, srcPtr, srcOffset, dstPtr, dstOffset, size) {
    srcOffset = bigintToI53Checked(srcOffset);
    dstOffset = bigintToI53Checked(dstOffset);
    size = bigintToI53Checked(size);
  
  
      var commandEncoder = WebGPU.getJsObject(encoderPtr);
      var src = WebGPU.getJsObject(srcPtr);
      var dst = WebGPU.getJsObject(dstPtr);
      commandEncoder.copyBufferToBuffer(src, srcOffset, dst, dstOffset, size);
    ;
  }

  
  
  var _wgpuCommandEncoderFinish = (encoderPtr, descriptor) => {
      // TODO: Use the descriptor.
      var commandEncoder = WebGPU.getJsObject(encoderPtr);
      var ptr = _emwgpuCreateCommandBuffer(0);
      WebGPU.Internals.jsObjectInsert(ptr, commandEncoder.finish());
      return ptr;
    };

  
  var _wgpuComputePassEncoderDispatchWorkgroups = (passPtr, x, y, z) => {
      assert(x >= 0);
      assert(y >= 0);
      assert(z >= 0);
      var pass = WebGPU.getJsObject(passPtr);
      pass.dispatchWorkgroups(x, y, z);
    };

  
  var _wgpuComputePassEncoderEnd = (passPtr) => {
      var pass = WebGPU.getJsObject(passPtr);
      pass.end();
    };

  
  
  var _wgpuComputePassEncoderSetBindGroup = (passPtr, groupIndex, groupPtr, dynamicOffsetCount, dynamicOffsetsPtr) => {
      assert(groupIndex >= 0);
      var pass = WebGPU.getJsObject(passPtr);
      var group = WebGPU.getJsObject(groupPtr);
      if (dynamicOffsetCount == 0) {
        pass.setBindGroup(groupIndex, group);
      } else {
        pass.setBindGroup(groupIndex, group, HEAPU32, ((dynamicOffsetsPtr)>>2), dynamicOffsetCount);
      }
    };

  
  var _wgpuComputePassEncoderSetPipeline = (passPtr, pipelinePtr) => {
      var pass = WebGPU.getJsObject(passPtr);
      var pipeline = WebGPU.getJsObject(pipelinePtr);
      pass.setPipeline(pipeline);
    };

  
  
  var _wgpuComputePipelineGetBindGroupLayout = (pipelinePtr, groupIndex) => {
      assert(groupIndex >= 0);
      var pipeline = WebGPU.getJsObject(pipelinePtr);
      var ptr = _emwgpuCreateBindGroupLayout(0);
      WebGPU.Internals.jsObjectInsert(ptr, pipeline.getBindGroupLayout(groupIndex));
      return ptr;
    };

  
  
  
  var _wgpuDeviceCreateBindGroup = (devicePtr, descriptor) => {
      assert(descriptor);assert(HEAPU32[((descriptor)>>2)] === 0);
  
      function makeEntry(entryPtr) {
        assert(entryPtr);
  
        var bufferPtr = HEAPU32[(((entryPtr)+(8))>>2)];
        var samplerPtr = HEAPU32[(((entryPtr)+(32))>>2)];
        var textureViewPtr = HEAPU32[(((entryPtr)+(36))>>2)];
        var externalTexturePtr = 0;
        WebGPU.iterateExtensions(entryPtr, {
          14: (ptr) => {
            externalTexturePtr = HEAPU32[(((ptr)+(8))>>2)];
          },
        });
        assert((bufferPtr !== 0) + (samplerPtr !== 0) + (textureViewPtr !== 0) + (externalTexturePtr !== 0) === 1);
  
        var resource;
        if (bufferPtr) {
          // Note the sentinel UINT64_MAX will be read as -1.
          var size = readI53FromI64((entryPtr)+(24));
          if (size == -1) size = undefined;
  
          resource = {
            "buffer": WebGPU.getJsObject(bufferPtr),
            "offset": readI53FromI64((entryPtr)+(16)),
            "size": size,
          };
        } else {
          resource = WebGPU.getJsObject(samplerPtr || textureViewPtr || externalTexturePtr);
        }
        return {
          "binding": HEAPU32[(((entryPtr)+(4))>>2)],
          "resource": resource,
        };
      }
  
      function makeEntries(count, entriesPtrs) {
        var entries = [];
        for (var i = 0; i < count; ++i) {
          entries.push(makeEntry(entriesPtrs +
              40 * i));
        }
        return entries;
      }
  
      var desc = {
        "label": WebGPU.makeStringFromOptionalStringView(
          descriptor + 4),
        "layout": WebGPU.getJsObject(
          HEAPU32[(((descriptor)+(12))>>2)]),
        "entries": makeEntries(
          HEAPU32[(((descriptor)+(16))>>2)],
          HEAPU32[(((descriptor)+(20))>>2)]
        ),
      };
  
      var device = WebGPU.getJsObject(devicePtr);
      var ptr = _emwgpuCreateBindGroup(0);
      WebGPU.Internals.jsObjectInsert(ptr, device.createBindGroup(desc));
      return ptr;
    };

  
  
  
  var _wgpuDeviceCreateCommandEncoder = (devicePtr, descriptor) => {
      var desc;
      if (descriptor) {
        assert(descriptor);assert(HEAPU32[((descriptor)>>2)] === 0);
        desc = {
          "label": WebGPU.makeStringFromOptionalStringView(
            descriptor + 4),
        };
      }
      var device = WebGPU.getJsObject(devicePtr);
      var ptr = _emwgpuCreateCommandEncoder(0);
      WebGPU.Internals.jsObjectInsert(ptr, device.createCommandEncoder(desc));
      return ptr;
    };

  
  
  var _wgpuDeviceCreateComputePipeline = (devicePtr, descriptor) => {
      var desc = WebGPU.makeComputePipelineDesc(descriptor);
      var device = WebGPU.getJsObject(devicePtr);
      var ptr = _emwgpuCreateComputePipeline(0);
      WebGPU.Internals.jsObjectInsert(ptr, device.createComputePipeline(desc));
      return ptr;
    };

  
  var _wgpuInstanceHasWGSLLanguageFeature = (instance, featureEnumValue) => {
      if (!('wgslLanguageFeatures' in navigator.gpu)) {
        return false;
      }
      return navigator.gpu.wgslLanguageFeatures.has(WebGPU.WGSLLanguageFeatureName[featureEnumValue]);
    };

  
  
  var _wgpuQueueSubmit = (queuePtr, commandCount, commands) => {
      assert(commands % 4 === 0);
      var queue = WebGPU.getJsObject(queuePtr);
      var cmds = Array.from(HEAP32.subarray((((commands)>>2)), ((commands + commandCount * 4)>>2)),
        (id) => WebGPU.getJsObject(id));
      queue.submit(cmds);
    };

  
  
  
  function _wgpuQueueWriteBuffer(queuePtr, bufferPtr, bufferOffset, data, size) {
    bufferOffset = bigintToI53Checked(bufferOffset);
  
  
      var queue = WebGPU.getJsObject(queuePtr);
      var buffer = WebGPU.getJsObject(bufferPtr);
      // There is a size limitation for ArrayBufferView. Work around by passing in a subarray
      // instead of the whole heap. crbug.com/1201109
      var subarray = HEAPU8.subarray(data, data + size);
      queue.writeBuffer(buffer, bufferOffset, subarray, 0, size);
    ;
  }

  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();;

      if (globalThis.setImmediate) {
        emSetImmediate = setImmediateWrapped;
        emClearImmediate = clearImmediateWrapped;
      } else if (globalThis.addEventListener) {
        var __setImmediate_id_counter = 0;
        var __setImmediate_queue = [];
        var __setImmediate_message_id = '_si';
        /** @param {Event} e */
        var __setImmediate_cb = (e) => {
          if (e.data === __setImmediate_message_id) {
            e.stopPropagation();
            __setImmediate_queue.shift()?.();
            ++__setImmediate_id_counter;
          }
        }
        addEventListener('message', __setImmediate_cb, true);
        emSetImmediate = (func) => {
          postMessage(__setImmediate_message_id, '*');
          return __setImmediate_id_counter + __setImmediate_queue.push(func) - 1;
        }
        emClearImmediate = /**@type{function(number=)}*/((id) => {
          var index = id - __setImmediate_id_counter;
          if (index < 0 || !__setImmediate_queue[index]) return false;
          // must preserve the order and count of elements in the queue, so replace the pending callback with an empty function
          __setImmediate_queue[index] = null;
          return true;
        })
      };
setImmediateWrapped.pending = new Map(); setImmediateWrapped.nextId = 1;;
safeSetTimeout.pending = new Map(); safeSetTimeout.nextId = 1;;
// End JS library code

// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.

{

  // Begin ATMODULES hooks
  if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];

if (Module['print']) out = Module['print'];
if (Module['printErr']) err = Module['printErr'];
  // End ATMODULES hooks

  checkIncomingModuleAPI();

  if (Module['arguments']) programArgs = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read'] === 'undefined', 'Module.read option was removed');
  assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
  assert(typeof Module['TOTAL_MEMORY'] === 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  assert(typeof Module['ENVIRONMENT'] === 'undefined', 'Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
  assert(typeof Module['STACK_SIZE'] === 'undefined', 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')
  // If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
  assert(typeof Module['wasmMemory'] === 'undefined', 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
  assert(typeof Module['INITIAL_MEMORY'] === 'undefined', 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

  var preInit = Module['preInit'];
  if (preInit) {
    if (typeof preInit === 'function') Module['preInit'] = preInit = [preInit];
    // Written as a loop so that preInit functions that themselves add more
    // preInit functions.  Is this actually needed?
    while (preInit.length > 0) {
      preInit.shift()();
    }
  }
  consumedModuleProp('preInit');
}

// Begin runtime exports
  Module['wasmExports'] = wasmExports;
  var missingLibrarySymbols = [
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'getTempRet0',
  'setTempRet0',
  'createNamedFunction',
  'withStackSave',
  'readEmAsmArgs',
  'jstoi_q',
  'autoResumeAudioContext',
  'getDynCaller',
  'dynCall',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'asmjsMangle',
  'addOnInit',
  'addOnPostCtor',
  'addOnPreMain',
  'addOnExit',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'ccall',
  'cwrap',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'setValue',
  'getValue',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'writeArrayToMemory',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'callCanvasResizedCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'currentFullscreenStrategy',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'getCallstack',
  'convertPCtoSourceLocation',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'safeRequestAnimationFrame',
  'registerPostMainLoop',
  'registerPreMainLoop',
  'addPromise',
  'idsToPromises',
  'makePromiseCallback',
  'Browser_asyncPrepareDataCounter',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetProgramUniformLocation',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'demangle',
  'stackTrace',
  'getNativeTypeSize',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

  var unexportedSymbols = [
  'run',
  'out',
  'err',
  'callMain',
  'abort',
  'writeStackCookie',
  'checkStackCookie',
  'writeI53ToI64',
  'readI53FromI64',
  'readI53FromU64',
  'INT53_MAX',
  'INT53_MIN',
  'bigintToI53Checked',
  'HEAP8',
  'HEAPU8',
  'HEAP16',
  'HEAPU16',
  'HEAP32',
  'HEAPU32',
  'HEAPF32',
  'HEAPF64',
  'HEAP64',
  'HEAPU64',
  'stackSave',
  'stackRestore',
  'stackAlloc',
  'ptrToString',
  'zeroMemory',
  'exitJS',
  'getHeapMax',
  'growMemory',
  'ENV',
  'ERRNO_CODES',
  'strError',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'DNS',
  'Protocols',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'getExecutableName',
  'handleException',
  'keepRuntimeAlive',
  'callUserCallback',
  'maybeExit',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'HandleAllocator',
  'wasmTable',
  'wasmMemory',
  'getUniqueRunDependency',
  'noExitRuntime',
  'addRunDependency',
  'removeRunDependency',
  'addOnPreRun',
  'addOnPostRun',
  'freeTableIndexes',
  'functionsInTableMap',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'UTF16Decoder',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'JSEvents',
  'specialHTMLTargets',
  'findCanvasEventTarget',
  'restoreOldWindowedStyle',
  'UNWIND_CACHE',
  'ExitStatus',
  'getEnvStrings',
  'checkWasiClock',
  'doReadv',
  'doWritev',
  'initRandomFill',
  'randomFill',
  'safeSetTimeout',
  'safeClearTimeout',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'emSetImmediate',
  'emClearImmediate',
  'promiseMap',
  'getPromise',
  'makePromise',
  'getExceptionMessageCommon',
  'getCppExceptionTag',
  'getCppExceptionThrownObjectFromWebAssemblyException',
  'incrementUncaughtExceptionCount',
  'decrementUncaughtExceptionCount',
  'incrementExceptionRefcount',
  'decrementExceptionRefcount',
  'getExceptionMessage',
  'Browser',
  'requestFullscreen',
  'setCanvasSize',
  'createContext',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'SYSCALLS',
  'getSocketFromFD',
  'getSocketAddress',
  'preloadPlugins',
  'FS_createPreloadedFile',
  'FS_preloadFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_fileDataToTypedArray',
  'FS_stdin_getChar_buffer',
  'FS_stdin_getChar',
  'FS_unlink',
  'FS_createPath',
  'FS_createDevice',
  'FS_readFile',
  'FS',
  'FS_root',
  'FS_mounts',
  'FS_devices',
  'FS_streams',
  'FS_nextInode',
  'FS_nameTable',
  'FS_currentPath',
  'FS_initialized',
  'FS_ignorePermissions',
  'FS_syncFSRequests',
  'FS_lookupPath',
  'FS_getPath',
  'FS_hashName',
  'FS_hashAddNode',
  'FS_hashRemoveNode',
  'FS_lookupNode',
  'FS_createNode',
  'FS_destroyNode',
  'FS_isRoot',
  'FS_isMountpoint',
  'FS_isFile',
  'FS_isDir',
  'FS_isLink',
  'FS_isChrdev',
  'FS_isBlkdev',
  'FS_isFIFO',
  'FS_isSocket',
  'FS_flagsToPermissionString',
  'FS_nodePermissions',
  'FS_mayLookup',
  'FS_mayCreate',
  'FS_mayDelete',
  'FS_mayOpen',
  'FS_checkOpExists',
  'FS_nextfd',
  'FS_getStreamChecked',
  'FS_getStream',
  'FS_createStream',
  'FS_closeStream',
  'FS_dupStream',
  'FS_doSetAttr',
  'FS_chrdev_stream_ops',
  'FS_major',
  'FS_minor',
  'FS_makedev',
  'FS_registerDevice',
  'FS_getDevice',
  'FS_getMounts',
  'FS_syncfs',
  'FS_mount',
  'FS_unmount',
  'FS_lookup',
  'FS_mknod',
  'FS_statfs',
  'FS_statfsStream',
  'FS_statfsNode',
  'FS_create',
  'FS_mkdir',
  'FS_mkdev',
  'FS_symlink',
  'FS_link',
  'FS_rename',
  'FS_rmdir',
  'FS_readdir',
  'FS_readlink',
  'FS_stat',
  'FS_fstat',
  'FS_lstat',
  'FS_doChmod',
  'FS_chmod',
  'FS_lchmod',
  'FS_fchmod',
  'FS_doChown',
  'FS_chown',
  'FS_lchown',
  'FS_fchown',
  'FS_doTruncate',
  'FS_truncate',
  'FS_ftruncate',
  'FS_utime',
  'FS_open',
  'FS_close',
  'FS_isClosed',
  'FS_llseek',
  'FS_read',
  'FS_write',
  'FS_mmap',
  'FS_msync',
  'FS_ioctl',
  'FS_writeFile',
  'FS_cwd',
  'FS_chdir',
  'FS_createDefaultDirectories',
  'FS_createDefaultDevices',
  'FS_createSpecialDirectories',
  'FS_createStandardStreams',
  'FS_staticInit',
  'FS_init',
  'FS_quit',
  'FS_analyzePath',
  'FS_createFile',
  'FS_createDataFile',
  'FS_forceLoadFile',
  'FS_createLazyFile',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'print',
  'printErr',
  'jstoi_s',
  'WebGPU',
  'emwgpuStringToInt_BufferMapState',
  'emwgpuStringToInt_CompilationMessageType',
  'emwgpuStringToInt_DeviceLostReason',
  'emwgpuStringToInt_FeatureName',
  'emwgpuStringToInt_PreferredFormat',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);

  // End runtime exports
  // Begin JS library exports
  // End JS library exports

// end include: postlibrary.js

function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
  ignoredModuleProp('logReadFiles');
  ignoredModuleProp('loadSplitModule');
  ignoredModuleProp('onMalloc');
  ignoredModuleProp('onRealloc');
  ignoredModuleProp('onFree');
  ignoredModuleProp('onSbrkGrow');
  ignoredModuleProp('onCOSCacheHit');
  ignoredModuleProp('onCOSCacheMiss');
  ignoredModuleProp('onCOSStore');
  ignoredModuleProp('GL_MAX_TEXTURE_IMAGE_UNITS');
  ignoredModuleProp('SDL_canPlayWithWebAudio');
  ignoredModuleProp('SDL_numSimultaneouslyQueuedBuffers');
  ignoredModuleProp('freePreloadedMediaOnUse');
  ignoredModuleProp('preinitializedWebGLContext');
  ignoredModuleProp('keyboardListeningElement');
  ignoredModuleProp('doNotCaptureKeyboard');
  ignoredModuleProp('extraStackTrace');
  ignoredModuleProp('preloadPlugins');
  ignoredModuleProp('preMainLoop');
  ignoredModuleProp('postMainLoop');
  ignoredModuleProp('forcedAspectRatio');
  ignoredModuleProp('mainScriptUrlOrBlob');
  ignoredModuleProp('onFullScreen');
  ignoredModuleProp('INITIAL_MEMORY');
  ignoredModuleProp('wasmMemory');
  ignoredModuleProp('wasmBinary');
}

// Imports from the Wasm binary.
var _ffi_nobodywho_uniffi_rust_future_cancel_f32 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_f32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_f32');
var _ffi_nobodywho_uniffi_rust_future_cancel_f64 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_f64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_f64');
var _ffi_nobodywho_uniffi_rust_future_cancel_i16 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_i16');
var _ffi_nobodywho_uniffi_rust_future_cancel_i32 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_i32');
var _ffi_nobodywho_uniffi_rust_future_cancel_i64 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_i64');
var _ffi_nobodywho_uniffi_rust_future_cancel_i8 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_i8');
var _ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer');
var _ffi_nobodywho_uniffi_rust_future_cancel_u16 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_u16');
var _ffi_nobodywho_uniffi_rust_future_cancel_u32 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_u32');
var _ffi_nobodywho_uniffi_rust_future_cancel_u64 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_u64');
var _ffi_nobodywho_uniffi_rust_future_cancel_u8 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_u8');
var _ffi_nobodywho_uniffi_rust_future_cancel_void = Module['_ffi_nobodywho_uniffi_rust_future_cancel_void'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_cancel_void');
var _ffi_nobodywho_uniffi_rust_future_complete_f32 = Module['_ffi_nobodywho_uniffi_rust_future_complete_f32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_f32');
var _ffi_nobodywho_uniffi_rust_future_complete_f64 = Module['_ffi_nobodywho_uniffi_rust_future_complete_f64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_f64');
var _ffi_nobodywho_uniffi_rust_future_complete_i16 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_i16');
var _ffi_nobodywho_uniffi_rust_future_complete_i32 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_i32');
var _ffi_nobodywho_uniffi_rust_future_complete_i64 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_i64');
var _ffi_nobodywho_uniffi_rust_future_complete_i8 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_i8');
var _ffi_nobodywho_uniffi_rust_future_complete_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_complete_rust_buffer'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_rust_buffer');
var _ffi_nobodywho_uniffi_rust_future_complete_u16 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_u16');
var _ffi_nobodywho_uniffi_rust_future_complete_u32 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_u32');
var _ffi_nobodywho_uniffi_rust_future_complete_u64 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_u64');
var _ffi_nobodywho_uniffi_rust_future_complete_u8 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_u8');
var _ffi_nobodywho_uniffi_rust_future_complete_void = Module['_ffi_nobodywho_uniffi_rust_future_complete_void'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_complete_void');
var _ffi_nobodywho_uniffi_rust_future_free_f32 = Module['_ffi_nobodywho_uniffi_rust_future_free_f32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_f32');
var _ffi_nobodywho_uniffi_rust_future_free_f64 = Module['_ffi_nobodywho_uniffi_rust_future_free_f64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_f64');
var _ffi_nobodywho_uniffi_rust_future_free_i16 = Module['_ffi_nobodywho_uniffi_rust_future_free_i16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_i16');
var _ffi_nobodywho_uniffi_rust_future_free_i32 = Module['_ffi_nobodywho_uniffi_rust_future_free_i32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_i32');
var _ffi_nobodywho_uniffi_rust_future_free_i64 = Module['_ffi_nobodywho_uniffi_rust_future_free_i64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_i64');
var _ffi_nobodywho_uniffi_rust_future_free_i8 = Module['_ffi_nobodywho_uniffi_rust_future_free_i8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_i8');
var _ffi_nobodywho_uniffi_rust_future_free_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_free_rust_buffer'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_rust_buffer');
var _ffi_nobodywho_uniffi_rust_future_free_u16 = Module['_ffi_nobodywho_uniffi_rust_future_free_u16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_u16');
var _ffi_nobodywho_uniffi_rust_future_free_u32 = Module['_ffi_nobodywho_uniffi_rust_future_free_u32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_u32');
var _ffi_nobodywho_uniffi_rust_future_free_u64 = Module['_ffi_nobodywho_uniffi_rust_future_free_u64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_u64');
var _ffi_nobodywho_uniffi_rust_future_free_u8 = Module['_ffi_nobodywho_uniffi_rust_future_free_u8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_u8');
var _ffi_nobodywho_uniffi_rust_future_free_void = Module['_ffi_nobodywho_uniffi_rust_future_free_void'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_free_void');
var _ffi_nobodywho_uniffi_rust_future_poll_f32 = Module['_ffi_nobodywho_uniffi_rust_future_poll_f32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_f32');
var _ffi_nobodywho_uniffi_rust_future_poll_f64 = Module['_ffi_nobodywho_uniffi_rust_future_poll_f64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_f64');
var _ffi_nobodywho_uniffi_rust_future_poll_i16 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_i16');
var _ffi_nobodywho_uniffi_rust_future_poll_i32 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_i32');
var _ffi_nobodywho_uniffi_rust_future_poll_i64 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_i64');
var _ffi_nobodywho_uniffi_rust_future_poll_i8 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_i8');
var _ffi_nobodywho_uniffi_rust_future_poll_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_poll_rust_buffer'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_rust_buffer');
var _ffi_nobodywho_uniffi_rust_future_poll_u16 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u16'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_u16');
var _ffi_nobodywho_uniffi_rust_future_poll_u32 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u32'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_u32');
var _ffi_nobodywho_uniffi_rust_future_poll_u64 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u64'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_u64');
var _ffi_nobodywho_uniffi_rust_future_poll_u8 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u8'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_u8');
var _ffi_nobodywho_uniffi_rust_future_poll_void = Module['_ffi_nobodywho_uniffi_rust_future_poll_void'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rust_future_poll_void');
var _ffi_nobodywho_uniffi_rustbuffer_alloc = Module['_ffi_nobodywho_uniffi_rustbuffer_alloc'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rustbuffer_alloc');
var _ffi_nobodywho_uniffi_rustbuffer_free = Module['_ffi_nobodywho_uniffi_rustbuffer_free'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rustbuffer_free');
var _ffi_nobodywho_uniffi_rustbuffer_from_bytes = Module['_ffi_nobodywho_uniffi_rustbuffer_from_bytes'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rustbuffer_from_bytes');
var _ffi_nobodywho_uniffi_rustbuffer_reserve = Module['_ffi_nobodywho_uniffi_rustbuffer_reserve'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_rustbuffer_reserve');
var _ffi_nobodywho_uniffi_uniffi_contract_version = Module['_ffi_nobodywho_uniffi_uniffi_contract_version'] = makeInvalidEarlyAccess('_ffi_nobodywho_uniffi_uniffi_contract_version');
var _uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async');
var _uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new');
var _uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json = Module['_uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json');
var _uniffi_nobodywho_uniffi_checksum_func_cosine_similarity = Module['_uniffi_nobodywho_uniffi_checksum_func_cosine_similarity'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_cosine_similarity');
var _uniffi_nobodywho_uniffi_checksum_func_download_model = Module['_uniffi_nobodywho_uniffi_checksum_func_download_model'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_download_model');
var _uniffi_nobodywho_uniffi_checksum_func_get_cached_models = Module['_uniffi_nobodywho_uniffi_checksum_func_get_cached_models'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_get_cached_models');
var _uniffi_nobodywho_uniffi_checksum_func_load_model = Module['_uniffi_nobodywho_uniffi_checksum_func_load_model'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_load_model');
var _uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text = Module['_uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text');
var _uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech = Module['_uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech');
var _uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection = Module['_uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k');
var _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_ask = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_complete = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_complete'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_complete');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize');
var _uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt');
var _uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank = Module['_uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank');
var _uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json = Module['_uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json');
var _uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide = Module['_uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide');
var _uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress = Module['_uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress');
var _uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode = Module['_uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode');
var _uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch = Module['_uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch');
var _uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx = Module['_uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx');
var _uniffi_nobodywho_uniffi_checksum_method_rustmodel_source = Module['_uniffi_nobodywho_uniffi_checksum_method_rustmodel_source'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustmodel_source');
var _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file');
var _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm');
var _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed');
var _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token');
var _uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize');
var _uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async');
var _uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed');
var _uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token');
var _uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json');
var _uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call');
var _uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call');
var _uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call');
var _uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish = Module['_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish');
var _uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push = Module['_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push');
var _uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment = Module['_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1 = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2 = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p');
var _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc');
var _uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json');
var _uniffi_nobodywho_uniffi_fn_clone_rustchat = Module['_uniffi_nobodywho_uniffi_fn_clone_rustchat'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustchat');
var _uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder = Module['_uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder');
var _uniffi_nobodywho_uniffi_fn_clone_rustdecision = Module['_uniffi_nobodywho_uniffi_fn_clone_rustdecision'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustdecision');
var _uniffi_nobodywho_uniffi_fn_clone_rustencoder = Module['_uniffi_nobodywho_uniffi_fn_clone_rustencoder'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustencoder');
var _uniffi_nobodywho_uniffi_fn_clone_rustmodel = Module['_uniffi_nobodywho_uniffi_fn_clone_rustmodel'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustmodel');
var _uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext = Module['_uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext');
var _uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream = Module['_uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream');
var _uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech = Module['_uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech');
var _uniffi_nobodywho_uniffi_fn_clone_rusttokenstream = Module['_uniffi_nobodywho_uniffi_fn_clone_rusttokenstream'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rusttokenstream');
var _uniffi_nobodywho_uniffi_fn_clone_rusttool = Module['_uniffi_nobodywho_uniffi_fn_clone_rusttool'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rusttool');
var _uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection = Module['_uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection');
var _uniffi_nobodywho_uniffi_fn_clone_samplerbuilder = Module['_uniffi_nobodywho_uniffi_fn_clone_samplerbuilder'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_samplerbuilder');
var _uniffi_nobodywho_uniffi_fn_clone_samplerconfig = Module['_uniffi_nobodywho_uniffi_fn_clone_samplerconfig'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_clone_samplerconfig');
var _uniffi_nobodywho_uniffi_fn_constructor_rustchat_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustchat_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rustchat_new');
var _uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new');
var _uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new');
var _uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new');
var _uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new');
var _uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new');
var _uniffi_nobodywho_uniffi_fn_constructor_rusttool_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rusttool_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rusttool_new');
var _uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async = Module['_uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async');
var _uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new');
var _uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new');
var _uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json = Module['_uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json');
var _uniffi_nobodywho_uniffi_fn_free_rustchat = Module['_uniffi_nobodywho_uniffi_fn_free_rustchat'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustchat');
var _uniffi_nobodywho_uniffi_fn_free_rustcrossencoder = Module['_uniffi_nobodywho_uniffi_fn_free_rustcrossencoder'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustcrossencoder');
var _uniffi_nobodywho_uniffi_fn_free_rustdecision = Module['_uniffi_nobodywho_uniffi_fn_free_rustdecision'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustdecision');
var _uniffi_nobodywho_uniffi_fn_free_rustencoder = Module['_uniffi_nobodywho_uniffi_fn_free_rustencoder'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustencoder');
var _uniffi_nobodywho_uniffi_fn_free_rustmodel = Module['_uniffi_nobodywho_uniffi_fn_free_rustmodel'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustmodel');
var _uniffi_nobodywho_uniffi_fn_free_rustspeechtotext = Module['_uniffi_nobodywho_uniffi_fn_free_rustspeechtotext'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustspeechtotext');
var _uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream = Module['_uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream');
var _uniffi_nobodywho_uniffi_fn_free_rusttexttospeech = Module['_uniffi_nobodywho_uniffi_fn_free_rusttexttospeech'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rusttexttospeech');
var _uniffi_nobodywho_uniffi_fn_free_rusttokenstream = Module['_uniffi_nobodywho_uniffi_fn_free_rusttokenstream'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rusttokenstream');
var _uniffi_nobodywho_uniffi_fn_free_rusttool = Module['_uniffi_nobodywho_uniffi_fn_free_rusttool'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rusttool');
var _uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection = Module['_uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection');
var _uniffi_nobodywho_uniffi_fn_free_samplerbuilder = Module['_uniffi_nobodywho_uniffi_fn_free_samplerbuilder'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_samplerbuilder');
var _uniffi_nobodywho_uniffi_fn_free_samplerconfig = Module['_uniffi_nobodywho_uniffi_fn_free_samplerconfig'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_free_samplerconfig');
var _uniffi_nobodywho_uniffi_fn_func_cosine_similarity = Module['_uniffi_nobodywho_uniffi_fn_func_cosine_similarity'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_cosine_similarity');
var _uniffi_nobodywho_uniffi_fn_func_download_model = Module['_uniffi_nobodywho_uniffi_fn_func_download_model'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_download_model');
var _uniffi_nobodywho_uniffi_fn_func_get_cached_models = Module['_uniffi_nobodywho_uniffi_fn_func_get_cached_models'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_get_cached_models');
var _uniffi_nobodywho_uniffi_fn_func_load_model = Module['_uniffi_nobodywho_uniffi_fn_func_load_model'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_load_model');
var _uniffi_nobodywho_uniffi_fn_func_load_speech_to_text = Module['_uniffi_nobodywho_uniffi_fn_func_load_speech_to_text'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_load_speech_to_text');
var _uniffi_nobodywho_uniffi_fn_func_load_text_to_speech = Module['_uniffi_nobodywho_uniffi_fn_func_load_text_to_speech'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_load_text_to_speech');
var _uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection = Module['_uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_default = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_default'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_default');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_json = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_json');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k');
var _uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p');
var _uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback = Module['_uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback');
var _uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback = Module['_uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_ask = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_ask'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_ask');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_complete = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_complete'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_complete');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize');
var _uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt');
var _uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank = Module['_uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank');
var _uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json = Module['_uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json');
var _uniffi_nobodywho_uniffi_fn_method_rustdecision_decide = Module['_uniffi_nobodywho_uniffi_fn_method_rustdecision_decide'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustdecision_decide');
var _uniffi_nobodywho_uniffi_fn_method_rustencoder_encode = Module['_uniffi_nobodywho_uniffi_fn_method_rustencoder_encode'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustencoder_encode');
var _uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch = Module['_uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch');
var _uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx = Module['_uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx');
var _uniffi_nobodywho_uniffi_fn_method_rustmodel_source = Module['_uniffi_nobodywho_uniffi_fn_method_rustmodel_source'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustmodel_source');
var _uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file');
var _uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm');
var _uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed');
var _uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token');
var _uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize = Module['_uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize');
var _uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async = Module['_uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async');
var _uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed = Module['_uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed');
var _uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token = Module['_uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token');
var _uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json = Module['_uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json');
var _uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call = Module['_uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call');
var _uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call = Module['_uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call');
var _uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish = Module['_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish');
var _uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push = Module['_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push');
var _uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment = Module['_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1 = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2 = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p');
var _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc');
var _uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json = Module['_uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json'] = makeInvalidEarlyAccess('_uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json');
var _malloc = makeInvalidEarlyAccess('_malloc');
var _realloc = makeInvalidEarlyAccess('_realloc');
var _free = makeInvalidEarlyAccess('_free');
var _fflush = makeInvalidEarlyAccess('_fflush');
var _llg_cancel = Module['_llg_cancel'] = makeInvalidEarlyAccess('_llg_cancel');
var _llg_clone_cancellation_handle = Module['_llg_clone_cancellation_handle'] = makeInvalidEarlyAccess('_llg_clone_cancellation_handle');
var _llg_clone_constraint = Module['_llg_clone_constraint'] = makeInvalidEarlyAccess('_llg_clone_constraint');
var _llg_clone_matcher = Module['_llg_clone_matcher'] = makeInvalidEarlyAccess('_llg_clone_matcher');
var _llg_clone_stop_controller = Module['_llg_clone_stop_controller'] = makeInvalidEarlyAccess('_llg_clone_stop_controller');
var _llg_clone_tokenizer = Module['_llg_clone_tokenizer'] = makeInvalidEarlyAccess('_llg_clone_tokenizer');
var _llg_commit_token = Module['_llg_commit_token'] = makeInvalidEarlyAccess('_llg_commit_token');
var _llg_compute_mask = Module['_llg_compute_mask'] = makeInvalidEarlyAccess('_llg_compute_mask');
var _llg_constraint_init_set_defaults = Module['_llg_constraint_init_set_defaults'] = makeInvalidEarlyAccess('_llg_constraint_init_set_defaults');
var _llg_decode_tokens = Module['_llg_decode_tokens'] = makeInvalidEarlyAccess('_llg_decode_tokens');
var _llg_flush_logs = Module['_llg_flush_logs'] = makeInvalidEarlyAccess('_llg_flush_logs');
var _llg_free_cancellation_handle = Module['_llg_free_cancellation_handle'] = makeInvalidEarlyAccess('_llg_free_cancellation_handle');
var _llg_free_constraint = Module['_llg_free_constraint'] = makeInvalidEarlyAccess('_llg_free_constraint');
var _llg_free_matcher = Module['_llg_free_matcher'] = makeInvalidEarlyAccess('_llg_free_matcher');
var _llg_free_stop_controller = Module['_llg_free_stop_controller'] = makeInvalidEarlyAccess('_llg_free_stop_controller');
var _llg_free_tokenizer = Module['_llg_free_tokenizer'] = makeInvalidEarlyAccess('_llg_free_tokenizer');
var _llg_get_error = Module['_llg_get_error'] = makeInvalidEarlyAccess('_llg_get_error');
var _llg_get_temperature = Module['_llg_get_temperature'] = makeInvalidEarlyAccess('_llg_get_temperature');
var _llg_get_version = Module['_llg_get_version'] = makeInvalidEarlyAccess('_llg_get_version');
var _llg_is_stopped = Module['_llg_is_stopped'] = makeInvalidEarlyAccess('_llg_is_stopped');
var _llg_matcher_compute_ff_tokens = Module['_llg_matcher_compute_ff_tokens'] = makeInvalidEarlyAccess('_llg_matcher_compute_ff_tokens');
var _llg_matcher_compute_mask = Module['_llg_matcher_compute_mask'] = makeInvalidEarlyAccess('_llg_matcher_compute_mask');
var _llg_matcher_compute_mask_into = Module['_llg_matcher_compute_mask_into'] = makeInvalidEarlyAccess('_llg_matcher_compute_mask_into');
var _llg_matcher_consume_token = Module['_llg_matcher_consume_token'] = makeInvalidEarlyAccess('_llg_matcher_consume_token');
var _llg_matcher_consume_tokens = Module['_llg_matcher_consume_tokens'] = makeInvalidEarlyAccess('_llg_matcher_consume_tokens');
var _llg_matcher_get_cancellation_handle = Module['_llg_matcher_get_cancellation_handle'] = makeInvalidEarlyAccess('_llg_matcher_get_cancellation_handle');
var _llg_matcher_get_error = Module['_llg_matcher_get_error'] = makeInvalidEarlyAccess('_llg_matcher_get_error');
var _llg_matcher_get_mask = Module['_llg_matcher_get_mask'] = makeInvalidEarlyAccess('_llg_matcher_get_mask');
var _llg_matcher_get_mask_byte_size = Module['_llg_matcher_get_mask_byte_size'] = makeInvalidEarlyAccess('_llg_matcher_get_mask_byte_size');
var _llg_matcher_is_accepting = Module['_llg_matcher_is_accepting'] = makeInvalidEarlyAccess('_llg_matcher_is_accepting');
var _llg_matcher_is_cancelled = Module['_llg_matcher_is_cancelled'] = makeInvalidEarlyAccess('_llg_matcher_is_cancelled');
var _llg_matcher_is_error = Module['_llg_matcher_is_error'] = makeInvalidEarlyAccess('_llg_matcher_is_error');
var _llg_matcher_is_stopped = Module['_llg_matcher_is_stopped'] = makeInvalidEarlyAccess('_llg_matcher_is_stopped');
var _llg_matcher_reset = Module['_llg_matcher_reset'] = makeInvalidEarlyAccess('_llg_matcher_reset');
var _llg_matcher_rollback = Module['_llg_matcher_rollback'] = makeInvalidEarlyAccess('_llg_matcher_rollback');
var _llg_matcher_validate_tokens = Module['_llg_matcher_validate_tokens'] = makeInvalidEarlyAccess('_llg_matcher_validate_tokens');
var _llg_new_constraint = Module['_llg_new_constraint'] = makeInvalidEarlyAccess('_llg_new_constraint');
var _llg_new_constraint_any = Module['_llg_new_constraint_any'] = makeInvalidEarlyAccess('_llg_new_constraint_any');
var _llg_new_constraint_json = Module['_llg_new_constraint_json'] = makeInvalidEarlyAccess('_llg_new_constraint_json');
var _llg_new_constraint_lark = Module['_llg_new_constraint_lark'] = makeInvalidEarlyAccess('_llg_new_constraint_lark');
var _llg_new_constraint_regex = Module['_llg_new_constraint_regex'] = makeInvalidEarlyAccess('_llg_new_constraint_regex');
var _llg_new_matcher = Module['_llg_new_matcher'] = makeInvalidEarlyAccess('_llg_new_matcher');
var _llg_new_stop_controller = Module['_llg_new_stop_controller'] = makeInvalidEarlyAccess('_llg_new_stop_controller');
var _llg_new_tokenizer = Module['_llg_new_tokenizer'] = makeInvalidEarlyAccess('_llg_new_tokenizer');
var _llg_new_tokenizer_v2 = Module['_llg_new_tokenizer_v2'] = makeInvalidEarlyAccess('_llg_new_tokenizer_v2');
var _llg_par_compute_mask = Module['_llg_par_compute_mask'] = makeInvalidEarlyAccess('_llg_par_compute_mask');
var _llg_stop_commit_token = Module['_llg_stop_commit_token'] = makeInvalidEarlyAccess('_llg_stop_commit_token');
var _llg_stringify_tokens = Module['_llg_stringify_tokens'] = makeInvalidEarlyAccess('_llg_stringify_tokens');
var _llg_tokenize_bytes = Module['_llg_tokenize_bytes'] = makeInvalidEarlyAccess('_llg_tokenize_bytes');
var _llg_tokenize_bytes_marker = Module['_llg_tokenize_bytes_marker'] = makeInvalidEarlyAccess('_llg_tokenize_bytes_marker');
var _llg_validate_grammar = Module['_llg_validate_grammar'] = makeInvalidEarlyAccess('_llg_validate_grammar');
var _strerror = makeInvalidEarlyAccess('_strerror');
var ___ubrn_alloc = Module['___ubrn_alloc'] = makeInvalidEarlyAccess('___ubrn_alloc');
var ___ubrn_free = Module['___ubrn_free'] = makeInvalidEarlyAccess('___ubrn_free');
var ___ubrn_install_panic_hook = Module['___ubrn_install_panic_hook'] = makeInvalidEarlyAccess('___ubrn_install_panic_hook');
var ___ubrn_set_panic_log = Module['___ubrn_set_panic_log'] = makeInvalidEarlyAccess('___ubrn_set_panic_log');
var _emwgpuCreateBindGroup = makeInvalidEarlyAccess('_emwgpuCreateBindGroup');
var _emwgpuCreateBindGroupLayout = makeInvalidEarlyAccess('_emwgpuCreateBindGroupLayout');
var _emwgpuCreateCommandBuffer = makeInvalidEarlyAccess('_emwgpuCreateCommandBuffer');
var _emwgpuCreateCommandEncoder = makeInvalidEarlyAccess('_emwgpuCreateCommandEncoder');
var _emwgpuCreateComputePassEncoder = makeInvalidEarlyAccess('_emwgpuCreateComputePassEncoder');
var _emwgpuCreateComputePipeline = makeInvalidEarlyAccess('_emwgpuCreateComputePipeline');
var _emwgpuCreateExternalTexture = makeInvalidEarlyAccess('_emwgpuCreateExternalTexture');
var _emwgpuCreatePipelineLayout = makeInvalidEarlyAccess('_emwgpuCreatePipelineLayout');
var _emwgpuCreateQuerySet = makeInvalidEarlyAccess('_emwgpuCreateQuerySet');
var _emwgpuCreateRenderBundle = makeInvalidEarlyAccess('_emwgpuCreateRenderBundle');
var _emwgpuCreateRenderBundleEncoder = makeInvalidEarlyAccess('_emwgpuCreateRenderBundleEncoder');
var _emwgpuCreateRenderPassEncoder = makeInvalidEarlyAccess('_emwgpuCreateRenderPassEncoder');
var _emwgpuCreateRenderPipeline = makeInvalidEarlyAccess('_emwgpuCreateRenderPipeline');
var _emwgpuCreateSampler = makeInvalidEarlyAccess('_emwgpuCreateSampler');
var _emwgpuCreateSurface = makeInvalidEarlyAccess('_emwgpuCreateSurface');
var _emwgpuCreateTexture = makeInvalidEarlyAccess('_emwgpuCreateTexture');
var _emwgpuCreateTextureView = makeInvalidEarlyAccess('_emwgpuCreateTextureView');
var _emwgpuCreateAdapter = makeInvalidEarlyAccess('_emwgpuCreateAdapter');
var _emwgpuImportBuffer = makeInvalidEarlyAccess('_emwgpuImportBuffer');
var _emwgpuCreateDevice = makeInvalidEarlyAccess('_emwgpuCreateDevice');
var _emwgpuCreateQueue = makeInvalidEarlyAccess('_emwgpuCreateQueue');
var _emwgpuCreateShaderModule = makeInvalidEarlyAccess('_emwgpuCreateShaderModule');
var _emwgpuOnCompilationInfoCompleted = makeInvalidEarlyAccess('_emwgpuOnCompilationInfoCompleted');
var _emwgpuOnCreateComputePipelineCompleted = makeInvalidEarlyAccess('_emwgpuOnCreateComputePipelineCompleted');
var _emwgpuOnCreateRenderPipelineCompleted = makeInvalidEarlyAccess('_emwgpuOnCreateRenderPipelineCompleted');
var _emwgpuOnDeviceLostCompleted = makeInvalidEarlyAccess('_emwgpuOnDeviceLostCompleted');
var _emwgpuOnMapAsyncCompleted = makeInvalidEarlyAccess('_emwgpuOnMapAsyncCompleted');
var _emwgpuOnPopErrorScopeCompleted = makeInvalidEarlyAccess('_emwgpuOnPopErrorScopeCompleted');
var _emwgpuOnRequestAdapterCompleted = makeInvalidEarlyAccess('_emwgpuOnRequestAdapterCompleted');
var _emwgpuOnRequestDeviceCompleted = makeInvalidEarlyAccess('_emwgpuOnRequestDeviceCompleted');
var _emwgpuOnWorkDoneCompleted = makeInvalidEarlyAccess('_emwgpuOnWorkDoneCompleted');
var _emwgpuOnUncapturedError = makeInvalidEarlyAccess('_emwgpuOnUncapturedError');
var _emscripten_stack_get_end = makeInvalidEarlyAccess('_emscripten_stack_get_end');
var _emscripten_stack_get_base = makeInvalidEarlyAccess('_emscripten_stack_get_base');
var _htonl = makeInvalidEarlyAccess('_htonl');
var _htons = makeInvalidEarlyAccess('_htons');
var _emscripten_builtin_memalign = makeInvalidEarlyAccess('_emscripten_builtin_memalign');
var _ntohs = makeInvalidEarlyAccess('_ntohs');
var _memalign = makeInvalidEarlyAccess('_memalign');
var ___trap = makeInvalidEarlyAccess('___trap');
var _emscripten_stack_init = makeInvalidEarlyAccess('_emscripten_stack_init');
var _emscripten_stack_get_free = makeInvalidEarlyAccess('_emscripten_stack_get_free');
var __emscripten_stack_restore = makeInvalidEarlyAccess('__emscripten_stack_restore');
var __emscripten_stack_alloc = makeInvalidEarlyAccess('__emscripten_stack_alloc');
var _emscripten_stack_get_current = makeInvalidEarlyAccess('_emscripten_stack_get_current');
var ___cxa_decrement_exception_refcount = makeInvalidEarlyAccess('___cxa_decrement_exception_refcount');
var ___cxa_increment_exception_refcount = makeInvalidEarlyAccess('___cxa_increment_exception_refcount');
var ___thrown_object_from_unwind_exception = makeInvalidEarlyAccess('___thrown_object_from_unwind_exception');
var ___get_exception_message = makeInvalidEarlyAccess('___get_exception_message');
var memory = makeInvalidEarlyAccess('memory');
var __indirect_function_table = makeInvalidEarlyAccess('__indirect_function_table');
var ___cpp_exception = makeInvalidEarlyAccess('___cpp_exception');
var wasmMemory = makeInvalidEarlyAccess('wasmMemory');
var wasmTable = makeInvalidEarlyAccess('wasmTable');

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_f32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_f32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_f64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_f64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_i16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_i32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_i64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_i8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_u16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_u32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_u64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_u8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_void'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_cancel_void');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_f32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_f32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_f64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_f64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_i16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_i32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_i64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_i8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_rust_buffer'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_rust_buffer');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_u16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_u32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_u64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_u8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_complete_void'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_complete_void');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_f32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_f32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_f64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_f64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_i16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_i16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_i32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_i32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_i64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_i64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_i8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_i8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_rust_buffer'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_rust_buffer');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_u16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_u16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_u32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_u32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_u64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_u64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_u8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_u8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_free_void'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_free_void');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_f32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_f32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_f64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_f64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_i16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_i32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_i64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_i8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_rust_buffer'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_rust_buffer');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u16'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_u16');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u32'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_u32');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u64'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_u64');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u8'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_u8');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rust_future_poll_void'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rust_future_poll_void');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rustbuffer_alloc'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rustbuffer_alloc');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rustbuffer_free'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rustbuffer_free');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rustbuffer_from_bytes'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rustbuffer_from_bytes');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_rustbuffer_reserve'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_rustbuffer_reserve');
  assert(typeof wasmExports['ffi_nobodywho_uniffi_uniffi_contract_version'] !== 'undefined', 'missing Wasm export: ffi_nobodywho_uniffi_uniffi_contract_version');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_cosine_similarity'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_cosine_similarity');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_download_model'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_download_model');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_get_cached_models'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_get_cached_models');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_model'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_load_model');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_ask'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_ask');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_complete'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_complete');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustmodel_source'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustmodel_source');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustchat'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustchat');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustdecision'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustdecision');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustencoder'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustencoder');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustmodel'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustmodel');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rusttokenstream'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rusttokenstream');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rusttool'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rusttool');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_samplerbuilder'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_samplerbuilder');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_clone_samplerconfig'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_clone_samplerconfig');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustchat_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rustchat_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rusttool_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rusttool_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustchat'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustchat');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustcrossencoder'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustcrossencoder');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustdecision'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustdecision');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustencoder'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustencoder');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustmodel'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustmodel');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustspeechtotext'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustspeechtotext');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rusttexttospeech'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rusttexttospeech');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rusttokenstream'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rusttokenstream');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rusttool'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rusttool');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_samplerbuilder'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_samplerbuilder');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_free_samplerconfig'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_free_samplerconfig');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_cosine_similarity'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_cosine_similarity');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_download_model'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_download_model');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_get_cached_models'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_get_cached_models');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_load_model'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_load_model');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_load_speech_to_text'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_load_speech_to_text');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_load_text_to_speech'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_load_text_to_speech');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_default'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_default');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_ask'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_ask');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_complete'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_complete');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustdecision_decide'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustdecision_decide');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustencoder_encode'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustencoder_encode');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustmodel_source'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustmodel_source');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc');
  assert(typeof wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json'] !== 'undefined', 'missing Wasm export: uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json');
  assert(typeof wasmExports['malloc'] !== 'undefined', 'missing Wasm export: malloc');
  assert(typeof wasmExports['realloc'] !== 'undefined', 'missing Wasm export: realloc');
  assert(typeof wasmExports['free'] !== 'undefined', 'missing Wasm export: free');
  assert(typeof wasmExports['fflush'] !== 'undefined', 'missing Wasm export: fflush');
  assert(typeof wasmExports['llg_cancel'] !== 'undefined', 'missing Wasm export: llg_cancel');
  assert(typeof wasmExports['llg_clone_cancellation_handle'] !== 'undefined', 'missing Wasm export: llg_clone_cancellation_handle');
  assert(typeof wasmExports['llg_clone_constraint'] !== 'undefined', 'missing Wasm export: llg_clone_constraint');
  assert(typeof wasmExports['llg_clone_matcher'] !== 'undefined', 'missing Wasm export: llg_clone_matcher');
  assert(typeof wasmExports['llg_clone_stop_controller'] !== 'undefined', 'missing Wasm export: llg_clone_stop_controller');
  assert(typeof wasmExports['llg_clone_tokenizer'] !== 'undefined', 'missing Wasm export: llg_clone_tokenizer');
  assert(typeof wasmExports['llg_commit_token'] !== 'undefined', 'missing Wasm export: llg_commit_token');
  assert(typeof wasmExports['llg_compute_mask'] !== 'undefined', 'missing Wasm export: llg_compute_mask');
  assert(typeof wasmExports['llg_constraint_init_set_defaults'] !== 'undefined', 'missing Wasm export: llg_constraint_init_set_defaults');
  assert(typeof wasmExports['llg_decode_tokens'] !== 'undefined', 'missing Wasm export: llg_decode_tokens');
  assert(typeof wasmExports['llg_flush_logs'] !== 'undefined', 'missing Wasm export: llg_flush_logs');
  assert(typeof wasmExports['llg_free_cancellation_handle'] !== 'undefined', 'missing Wasm export: llg_free_cancellation_handle');
  assert(typeof wasmExports['llg_free_constraint'] !== 'undefined', 'missing Wasm export: llg_free_constraint');
  assert(typeof wasmExports['llg_free_matcher'] !== 'undefined', 'missing Wasm export: llg_free_matcher');
  assert(typeof wasmExports['llg_free_stop_controller'] !== 'undefined', 'missing Wasm export: llg_free_stop_controller');
  assert(typeof wasmExports['llg_free_tokenizer'] !== 'undefined', 'missing Wasm export: llg_free_tokenizer');
  assert(typeof wasmExports['llg_get_error'] !== 'undefined', 'missing Wasm export: llg_get_error');
  assert(typeof wasmExports['llg_get_temperature'] !== 'undefined', 'missing Wasm export: llg_get_temperature');
  assert(typeof wasmExports['llg_get_version'] !== 'undefined', 'missing Wasm export: llg_get_version');
  assert(typeof wasmExports['llg_is_stopped'] !== 'undefined', 'missing Wasm export: llg_is_stopped');
  assert(typeof wasmExports['llg_matcher_compute_ff_tokens'] !== 'undefined', 'missing Wasm export: llg_matcher_compute_ff_tokens');
  assert(typeof wasmExports['llg_matcher_compute_mask'] !== 'undefined', 'missing Wasm export: llg_matcher_compute_mask');
  assert(typeof wasmExports['llg_matcher_compute_mask_into'] !== 'undefined', 'missing Wasm export: llg_matcher_compute_mask_into');
  assert(typeof wasmExports['llg_matcher_consume_token'] !== 'undefined', 'missing Wasm export: llg_matcher_consume_token');
  assert(typeof wasmExports['llg_matcher_consume_tokens'] !== 'undefined', 'missing Wasm export: llg_matcher_consume_tokens');
  assert(typeof wasmExports['llg_matcher_get_cancellation_handle'] !== 'undefined', 'missing Wasm export: llg_matcher_get_cancellation_handle');
  assert(typeof wasmExports['llg_matcher_get_error'] !== 'undefined', 'missing Wasm export: llg_matcher_get_error');
  assert(typeof wasmExports['llg_matcher_get_mask'] !== 'undefined', 'missing Wasm export: llg_matcher_get_mask');
  assert(typeof wasmExports['llg_matcher_get_mask_byte_size'] !== 'undefined', 'missing Wasm export: llg_matcher_get_mask_byte_size');
  assert(typeof wasmExports['llg_matcher_is_accepting'] !== 'undefined', 'missing Wasm export: llg_matcher_is_accepting');
  assert(typeof wasmExports['llg_matcher_is_cancelled'] !== 'undefined', 'missing Wasm export: llg_matcher_is_cancelled');
  assert(typeof wasmExports['llg_matcher_is_error'] !== 'undefined', 'missing Wasm export: llg_matcher_is_error');
  assert(typeof wasmExports['llg_matcher_is_stopped'] !== 'undefined', 'missing Wasm export: llg_matcher_is_stopped');
  assert(typeof wasmExports['llg_matcher_reset'] !== 'undefined', 'missing Wasm export: llg_matcher_reset');
  assert(typeof wasmExports['llg_matcher_rollback'] !== 'undefined', 'missing Wasm export: llg_matcher_rollback');
  assert(typeof wasmExports['llg_matcher_validate_tokens'] !== 'undefined', 'missing Wasm export: llg_matcher_validate_tokens');
  assert(typeof wasmExports['llg_new_constraint'] !== 'undefined', 'missing Wasm export: llg_new_constraint');
  assert(typeof wasmExports['llg_new_constraint_any'] !== 'undefined', 'missing Wasm export: llg_new_constraint_any');
  assert(typeof wasmExports['llg_new_constraint_json'] !== 'undefined', 'missing Wasm export: llg_new_constraint_json');
  assert(typeof wasmExports['llg_new_constraint_lark'] !== 'undefined', 'missing Wasm export: llg_new_constraint_lark');
  assert(typeof wasmExports['llg_new_constraint_regex'] !== 'undefined', 'missing Wasm export: llg_new_constraint_regex');
  assert(typeof wasmExports['llg_new_matcher'] !== 'undefined', 'missing Wasm export: llg_new_matcher');
  assert(typeof wasmExports['llg_new_stop_controller'] !== 'undefined', 'missing Wasm export: llg_new_stop_controller');
  assert(typeof wasmExports['llg_new_tokenizer'] !== 'undefined', 'missing Wasm export: llg_new_tokenizer');
  assert(typeof wasmExports['llg_new_tokenizer_v2'] !== 'undefined', 'missing Wasm export: llg_new_tokenizer_v2');
  assert(typeof wasmExports['llg_par_compute_mask'] !== 'undefined', 'missing Wasm export: llg_par_compute_mask');
  assert(typeof wasmExports['llg_stop_commit_token'] !== 'undefined', 'missing Wasm export: llg_stop_commit_token');
  assert(typeof wasmExports['llg_stringify_tokens'] !== 'undefined', 'missing Wasm export: llg_stringify_tokens');
  assert(typeof wasmExports['llg_tokenize_bytes'] !== 'undefined', 'missing Wasm export: llg_tokenize_bytes');
  assert(typeof wasmExports['llg_tokenize_bytes_marker'] !== 'undefined', 'missing Wasm export: llg_tokenize_bytes_marker');
  assert(typeof wasmExports['llg_validate_grammar'] !== 'undefined', 'missing Wasm export: llg_validate_grammar');
  assert(typeof wasmExports['strerror'] !== 'undefined', 'missing Wasm export: strerror');
  assert(typeof wasmExports['__ubrn_alloc'] !== 'undefined', 'missing Wasm export: __ubrn_alloc');
  assert(typeof wasmExports['__ubrn_free'] !== 'undefined', 'missing Wasm export: __ubrn_free');
  assert(typeof wasmExports['__ubrn_install_panic_hook'] !== 'undefined', 'missing Wasm export: __ubrn_install_panic_hook');
  assert(typeof wasmExports['__ubrn_set_panic_log'] !== 'undefined', 'missing Wasm export: __ubrn_set_panic_log');
  assert(typeof wasmExports['emwgpuCreateBindGroup'] !== 'undefined', 'missing Wasm export: emwgpuCreateBindGroup');
  assert(typeof wasmExports['emwgpuCreateBindGroupLayout'] !== 'undefined', 'missing Wasm export: emwgpuCreateBindGroupLayout');
  assert(typeof wasmExports['emwgpuCreateCommandBuffer'] !== 'undefined', 'missing Wasm export: emwgpuCreateCommandBuffer');
  assert(typeof wasmExports['emwgpuCreateCommandEncoder'] !== 'undefined', 'missing Wasm export: emwgpuCreateCommandEncoder');
  assert(typeof wasmExports['emwgpuCreateComputePassEncoder'] !== 'undefined', 'missing Wasm export: emwgpuCreateComputePassEncoder');
  assert(typeof wasmExports['emwgpuCreateComputePipeline'] !== 'undefined', 'missing Wasm export: emwgpuCreateComputePipeline');
  assert(typeof wasmExports['emwgpuCreateExternalTexture'] !== 'undefined', 'missing Wasm export: emwgpuCreateExternalTexture');
  assert(typeof wasmExports['emwgpuCreatePipelineLayout'] !== 'undefined', 'missing Wasm export: emwgpuCreatePipelineLayout');
  assert(typeof wasmExports['emwgpuCreateQuerySet'] !== 'undefined', 'missing Wasm export: emwgpuCreateQuerySet');
  assert(typeof wasmExports['emwgpuCreateRenderBundle'] !== 'undefined', 'missing Wasm export: emwgpuCreateRenderBundle');
  assert(typeof wasmExports['emwgpuCreateRenderBundleEncoder'] !== 'undefined', 'missing Wasm export: emwgpuCreateRenderBundleEncoder');
  assert(typeof wasmExports['emwgpuCreateRenderPassEncoder'] !== 'undefined', 'missing Wasm export: emwgpuCreateRenderPassEncoder');
  assert(typeof wasmExports['emwgpuCreateRenderPipeline'] !== 'undefined', 'missing Wasm export: emwgpuCreateRenderPipeline');
  assert(typeof wasmExports['emwgpuCreateSampler'] !== 'undefined', 'missing Wasm export: emwgpuCreateSampler');
  assert(typeof wasmExports['emwgpuCreateSurface'] !== 'undefined', 'missing Wasm export: emwgpuCreateSurface');
  assert(typeof wasmExports['emwgpuCreateTexture'] !== 'undefined', 'missing Wasm export: emwgpuCreateTexture');
  assert(typeof wasmExports['emwgpuCreateTextureView'] !== 'undefined', 'missing Wasm export: emwgpuCreateTextureView');
  assert(typeof wasmExports['emwgpuCreateAdapter'] !== 'undefined', 'missing Wasm export: emwgpuCreateAdapter');
  assert(typeof wasmExports['emwgpuImportBuffer'] !== 'undefined', 'missing Wasm export: emwgpuImportBuffer');
  assert(typeof wasmExports['emwgpuCreateDevice'] !== 'undefined', 'missing Wasm export: emwgpuCreateDevice');
  assert(typeof wasmExports['emwgpuCreateQueue'] !== 'undefined', 'missing Wasm export: emwgpuCreateQueue');
  assert(typeof wasmExports['emwgpuCreateShaderModule'] !== 'undefined', 'missing Wasm export: emwgpuCreateShaderModule');
  assert(typeof wasmExports['emwgpuOnCompilationInfoCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnCompilationInfoCompleted');
  assert(typeof wasmExports['emwgpuOnCreateComputePipelineCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnCreateComputePipelineCompleted');
  assert(typeof wasmExports['emwgpuOnCreateRenderPipelineCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnCreateRenderPipelineCompleted');
  assert(typeof wasmExports['emwgpuOnDeviceLostCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnDeviceLostCompleted');
  assert(typeof wasmExports['emwgpuOnMapAsyncCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnMapAsyncCompleted');
  assert(typeof wasmExports['emwgpuOnPopErrorScopeCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnPopErrorScopeCompleted');
  assert(typeof wasmExports['emwgpuOnRequestAdapterCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnRequestAdapterCompleted');
  assert(typeof wasmExports['emwgpuOnRequestDeviceCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnRequestDeviceCompleted');
  assert(typeof wasmExports['emwgpuOnWorkDoneCompleted'] !== 'undefined', 'missing Wasm export: emwgpuOnWorkDoneCompleted');
  assert(typeof wasmExports['emwgpuOnUncapturedError'] !== 'undefined', 'missing Wasm export: emwgpuOnUncapturedError');
  assert(typeof wasmExports['emscripten_stack_get_end'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_end');
  assert(typeof wasmExports['emscripten_stack_get_base'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_base');
  assert(typeof wasmExports['htonl'] !== 'undefined', 'missing Wasm export: htonl');
  assert(typeof wasmExports['htons'] !== 'undefined', 'missing Wasm export: htons');
  assert(typeof wasmExports['emscripten_builtin_memalign'] !== 'undefined', 'missing Wasm export: emscripten_builtin_memalign');
  assert(typeof wasmExports['ntohs'] !== 'undefined', 'missing Wasm export: ntohs');
  assert(typeof wasmExports['memalign'] !== 'undefined', 'missing Wasm export: memalign');
  assert(typeof wasmExports['__trap'] !== 'undefined', 'missing Wasm export: __trap');
  assert(typeof wasmExports['emscripten_stack_init'] !== 'undefined', 'missing Wasm export: emscripten_stack_init');
  assert(typeof wasmExports['emscripten_stack_get_free'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_free');
  assert(typeof wasmExports['_emscripten_stack_restore'] !== 'undefined', 'missing Wasm export: _emscripten_stack_restore');
  assert(typeof wasmExports['_emscripten_stack_alloc'] !== 'undefined', 'missing Wasm export: _emscripten_stack_alloc');
  assert(typeof wasmExports['emscripten_stack_get_current'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_current');
  assert(typeof wasmExports['__cxa_decrement_exception_refcount'] !== 'undefined', 'missing Wasm export: __cxa_decrement_exception_refcount');
  assert(typeof wasmExports['__cxa_increment_exception_refcount'] !== 'undefined', 'missing Wasm export: __cxa_increment_exception_refcount');
  assert(typeof wasmExports['__thrown_object_from_unwind_exception'] !== 'undefined', 'missing Wasm export: __thrown_object_from_unwind_exception');
  assert(typeof wasmExports['__get_exception_message'] !== 'undefined', 'missing Wasm export: __get_exception_message');
  assert(typeof wasmExports['memory'] !== 'undefined', 'missing Wasm export: memory');
  assert(typeof wasmExports['__indirect_function_table'] !== 'undefined', 'missing Wasm export: __indirect_function_table');
  assert(typeof wasmExports['__cpp_exception'] !== 'undefined', 'missing Wasm export: __cpp_exception');
  _ffi_nobodywho_uniffi_rust_future_cancel_f32 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_f32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_f32', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_f32'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_f64 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_f64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_f64', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_f64'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_i16 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_i16', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i16'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_i32 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_i32', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i32'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_i64 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_i64', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i64'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_i8 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_i8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_i8', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_i8'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_rust_buffer'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_u16 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_u16', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u16'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_u32 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_u32', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u32'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_u64 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_u64', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u64'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_u8 = Module['_ffi_nobodywho_uniffi_rust_future_cancel_u8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_u8', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_u8'], 1);
  _ffi_nobodywho_uniffi_rust_future_cancel_void = Module['_ffi_nobodywho_uniffi_rust_future_cancel_void'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_cancel_void', wasmExports['ffi_nobodywho_uniffi_rust_future_cancel_void'], 1);
  _ffi_nobodywho_uniffi_rust_future_complete_f32 = Module['_ffi_nobodywho_uniffi_rust_future_complete_f32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_f32', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_f32'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_f64 = Module['_ffi_nobodywho_uniffi_rust_future_complete_f64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_f64', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_f64'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_i16 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_i16', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i16'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_i32 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_i32', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i32'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_i64 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_i64', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i64'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_i8 = Module['_ffi_nobodywho_uniffi_rust_future_complete_i8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_i8', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_i8'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_complete_rust_buffer'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_rust_buffer', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_rust_buffer'], 3);
  _ffi_nobodywho_uniffi_rust_future_complete_u16 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_u16', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u16'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_u32 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_u32', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u32'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_u64 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_u64', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u64'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_u8 = Module['_ffi_nobodywho_uniffi_rust_future_complete_u8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_u8', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_u8'], 2);
  _ffi_nobodywho_uniffi_rust_future_complete_void = Module['_ffi_nobodywho_uniffi_rust_future_complete_void'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_complete_void', wasmExports['ffi_nobodywho_uniffi_rust_future_complete_void'], 2);
  _ffi_nobodywho_uniffi_rust_future_free_f32 = Module['_ffi_nobodywho_uniffi_rust_future_free_f32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_f32', wasmExports['ffi_nobodywho_uniffi_rust_future_free_f32'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_f64 = Module['_ffi_nobodywho_uniffi_rust_future_free_f64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_f64', wasmExports['ffi_nobodywho_uniffi_rust_future_free_f64'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_i16 = Module['_ffi_nobodywho_uniffi_rust_future_free_i16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_i16', wasmExports['ffi_nobodywho_uniffi_rust_future_free_i16'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_i32 = Module['_ffi_nobodywho_uniffi_rust_future_free_i32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_i32', wasmExports['ffi_nobodywho_uniffi_rust_future_free_i32'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_i64 = Module['_ffi_nobodywho_uniffi_rust_future_free_i64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_i64', wasmExports['ffi_nobodywho_uniffi_rust_future_free_i64'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_i8 = Module['_ffi_nobodywho_uniffi_rust_future_free_i8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_i8', wasmExports['ffi_nobodywho_uniffi_rust_future_free_i8'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_free_rust_buffer'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_rust_buffer', wasmExports['ffi_nobodywho_uniffi_rust_future_free_rust_buffer'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_u16 = Module['_ffi_nobodywho_uniffi_rust_future_free_u16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_u16', wasmExports['ffi_nobodywho_uniffi_rust_future_free_u16'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_u32 = Module['_ffi_nobodywho_uniffi_rust_future_free_u32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_u32', wasmExports['ffi_nobodywho_uniffi_rust_future_free_u32'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_u64 = Module['_ffi_nobodywho_uniffi_rust_future_free_u64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_u64', wasmExports['ffi_nobodywho_uniffi_rust_future_free_u64'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_u8 = Module['_ffi_nobodywho_uniffi_rust_future_free_u8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_u8', wasmExports['ffi_nobodywho_uniffi_rust_future_free_u8'], 1);
  _ffi_nobodywho_uniffi_rust_future_free_void = Module['_ffi_nobodywho_uniffi_rust_future_free_void'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_free_void', wasmExports['ffi_nobodywho_uniffi_rust_future_free_void'], 1);
  _ffi_nobodywho_uniffi_rust_future_poll_f32 = Module['_ffi_nobodywho_uniffi_rust_future_poll_f32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_f32', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_f32'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_f64 = Module['_ffi_nobodywho_uniffi_rust_future_poll_f64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_f64', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_f64'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_i16 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_i16', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i16'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_i32 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_i32', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i32'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_i64 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_i64', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i64'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_i8 = Module['_ffi_nobodywho_uniffi_rust_future_poll_i8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_i8', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_i8'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_rust_buffer = Module['_ffi_nobodywho_uniffi_rust_future_poll_rust_buffer'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_rust_buffer', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_rust_buffer'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_u16 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u16'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_u16', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u16'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_u32 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u32'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_u32', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u32'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_u64 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u64'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_u64', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u64'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_u8 = Module['_ffi_nobodywho_uniffi_rust_future_poll_u8'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_u8', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_u8'], 3);
  _ffi_nobodywho_uniffi_rust_future_poll_void = Module['_ffi_nobodywho_uniffi_rust_future_poll_void'] = createExportWrapper('ffi_nobodywho_uniffi_rust_future_poll_void', wasmExports['ffi_nobodywho_uniffi_rust_future_poll_void'], 3);
  _ffi_nobodywho_uniffi_rustbuffer_alloc = Module['_ffi_nobodywho_uniffi_rustbuffer_alloc'] = createExportWrapper('ffi_nobodywho_uniffi_rustbuffer_alloc', wasmExports['ffi_nobodywho_uniffi_rustbuffer_alloc'], 3);
  _ffi_nobodywho_uniffi_rustbuffer_free = Module['_ffi_nobodywho_uniffi_rustbuffer_free'] = createExportWrapper('ffi_nobodywho_uniffi_rustbuffer_free', wasmExports['ffi_nobodywho_uniffi_rustbuffer_free'], 2);
  _ffi_nobodywho_uniffi_rustbuffer_from_bytes = Module['_ffi_nobodywho_uniffi_rustbuffer_from_bytes'] = createExportWrapper('ffi_nobodywho_uniffi_rustbuffer_from_bytes', wasmExports['ffi_nobodywho_uniffi_rustbuffer_from_bytes'], 3);
  _ffi_nobodywho_uniffi_rustbuffer_reserve = Module['_ffi_nobodywho_uniffi_rustbuffer_reserve'] = createExportWrapper('ffi_nobodywho_uniffi_rustbuffer_reserve', wasmExports['ffi_nobodywho_uniffi_rustbuffer_reserve'], 4);
  _ffi_nobodywho_uniffi_uniffi_contract_version = Module['_ffi_nobodywho_uniffi_uniffi_contract_version'] = createExportWrapper('ffi_nobodywho_uniffi_uniffi_contract_version', wasmExports['ffi_nobodywho_uniffi_uniffi_contract_version'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustchat_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustcrossencoder_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustdecision_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustencoder_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustspeechtotext_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rusttexttospeech_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rusttool_new_async'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_rustvoiceactivitydetection_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new = Module['_uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_samplerbuilder_new'], 0);
  _uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json = Module['_uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json', wasmExports['uniffi_nobodywho_uniffi_checksum_constructor_samplerconfig_from_json'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_cosine_similarity = Module['_uniffi_nobodywho_uniffi_checksum_func_cosine_similarity'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_cosine_similarity', wasmExports['uniffi_nobodywho_uniffi_checksum_func_cosine_similarity'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_download_model = Module['_uniffi_nobodywho_uniffi_checksum_func_download_model'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_download_model', wasmExports['uniffi_nobodywho_uniffi_checksum_func_download_model'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_get_cached_models = Module['_uniffi_nobodywho_uniffi_checksum_func_get_cached_models'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_get_cached_models', wasmExports['uniffi_nobodywho_uniffi_checksum_func_get_cached_models'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_load_model = Module['_uniffi_nobodywho_uniffi_checksum_func_load_model'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_load_model', wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_model'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text = Module['_uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text', wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_speech_to_text'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech = Module['_uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech', wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_text_to_speech'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection = Module['_uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection', wasmExports['uniffi_nobodywho_uniffi_checksum_func_load_voice_activity_detection'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_grammar'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_json_schema'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_constrain_with_regex'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_default'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_dry'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_greedy'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_json'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_temperature'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_k'], 0);
  _uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p = Module['_uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p', wasmExports['uniffi_nobodywho_uniffi_checksum_func_sampler_preset_top_p'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_ask = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_ask', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_ask'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_json_prompt'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_ask_with_prompt'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_complete = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_complete'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_complete', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_complete'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_chat_history'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_sampler_config_json'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_stats'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_system_prompt'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_get_template_variables'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_mtp_acceptance_rate'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_context'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_reset_history'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_chat_history'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_context_shift'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_sampler_config'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_system_prompt'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_template_variable'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_set_tools'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_stop_generation'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt = Module['_uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustchat_tokenize_with_prompt'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank = Module['_uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json = Module['_uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustcrossencoder_rank_and_sort_json'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide = Module['_uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustdecision_decide'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress = Module['_uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustdownloadprogresscallback_on_download_progress'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode = Module['_uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch = Module['_uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustencoder_encode_batch'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx = Module['_uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustmodel_max_ctx'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustmodel_source = Module['_uniffi_nobodywho_uniffi_checksum_method_rustmodel_source'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustmodel_source', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustmodel_source'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_file'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotext_transcribe_pcm'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_completed'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token = Module['_uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustspeechtotextstream_next_token'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttexttospeech_synthesize_async'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_completed'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttokenstream_next_token'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttool_get_schema_json'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttool_next_pending_call'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttool_resolve_pending_call'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call = Module['_uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rusttoolcallback_call'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish = Module['_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_finish'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push = Module['_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_push'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment = Module['_uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment', wasmExports['uniffi_nobodywho_uniffi_checksum_method_rustvoiceactivitydetection_segment'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_grammar'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_json_schema'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_constrain_with_regex'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dist'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dry'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_dynamic_temperature'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_greedy'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_json'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_logit_bias'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_min_p'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1 = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v1'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2 = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_mirostat_v2'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_penalties'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_seed'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_temperature'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_k'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_n_sigma'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_top_p'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_typical_p'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerbuilder_xtc'], 0);
  _uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json = Module['_uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json'] = createExportWrapper('uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json', wasmExports['uniffi_nobodywho_uniffi_checksum_method_samplerconfig_to_json'], 0);
  _uniffi_nobodywho_uniffi_fn_clone_rustchat = Module['_uniffi_nobodywho_uniffi_fn_clone_rustchat'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustchat', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustchat'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder = Module['_uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustcrossencoder'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rustdecision = Module['_uniffi_nobodywho_uniffi_fn_clone_rustdecision'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustdecision', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustdecision'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rustencoder = Module['_uniffi_nobodywho_uniffi_fn_clone_rustencoder'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustencoder', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustencoder'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rustmodel = Module['_uniffi_nobodywho_uniffi_fn_clone_rustmodel'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustmodel', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustmodel'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext = Module['_uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustspeechtotext'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream = Module['_uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustspeechtotextstream'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech = Module['_uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rusttexttospeech'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rusttokenstream = Module['_uniffi_nobodywho_uniffi_fn_clone_rusttokenstream'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rusttokenstream', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rusttokenstream'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rusttool = Module['_uniffi_nobodywho_uniffi_fn_clone_rusttool'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rusttool', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rusttool'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection = Module['_uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection', wasmExports['uniffi_nobodywho_uniffi_fn_clone_rustvoiceactivitydetection'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_samplerbuilder = Module['_uniffi_nobodywho_uniffi_fn_clone_samplerbuilder'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_samplerbuilder', wasmExports['uniffi_nobodywho_uniffi_fn_clone_samplerbuilder'], 2);
  _uniffi_nobodywho_uniffi_fn_clone_samplerconfig = Module['_uniffi_nobodywho_uniffi_fn_clone_samplerconfig'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_clone_samplerconfig', wasmExports['uniffi_nobodywho_uniffi_fn_clone_samplerconfig'], 2);
  _uniffi_nobodywho_uniffi_fn_constructor_rustchat_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustchat_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rustchat_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustchat_new'], 10);
  _uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustcrossencoder_new'], 3);
  _uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustdecision_new'], 3);
  _uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustencoder_new'], 3);
  _uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustspeechtotext_new'], 4);
  _uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rusttexttospeech_new'], 12);
  _uniffi_nobodywho_uniffi_fn_constructor_rusttool_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rusttool_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rusttool_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rusttool_new'], 5);
  _uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async = Module['_uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rusttool_new_async'], 4);
  _uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_rustvoiceactivitydetection_new'], 8);
  _uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new = Module['_uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_samplerbuilder_new'], 1);
  _uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json = Module['_uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json', wasmExports['uniffi_nobodywho_uniffi_fn_constructor_samplerconfig_from_json'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustchat = Module['_uniffi_nobodywho_uniffi_fn_free_rustchat'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustchat', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustchat'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustcrossencoder = Module['_uniffi_nobodywho_uniffi_fn_free_rustcrossencoder'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustcrossencoder', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustcrossencoder'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustdecision = Module['_uniffi_nobodywho_uniffi_fn_free_rustdecision'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustdecision', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustdecision'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustencoder = Module['_uniffi_nobodywho_uniffi_fn_free_rustencoder'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustencoder', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustencoder'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustmodel = Module['_uniffi_nobodywho_uniffi_fn_free_rustmodel'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustmodel', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustmodel'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustspeechtotext = Module['_uniffi_nobodywho_uniffi_fn_free_rustspeechtotext'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustspeechtotext', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustspeechtotext'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream = Module['_uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustspeechtotextstream'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rusttexttospeech = Module['_uniffi_nobodywho_uniffi_fn_free_rusttexttospeech'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rusttexttospeech', wasmExports['uniffi_nobodywho_uniffi_fn_free_rusttexttospeech'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rusttokenstream = Module['_uniffi_nobodywho_uniffi_fn_free_rusttokenstream'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rusttokenstream', wasmExports['uniffi_nobodywho_uniffi_fn_free_rusttokenstream'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rusttool = Module['_uniffi_nobodywho_uniffi_fn_free_rusttool'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rusttool', wasmExports['uniffi_nobodywho_uniffi_fn_free_rusttool'], 2);
  _uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection = Module['_uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection', wasmExports['uniffi_nobodywho_uniffi_fn_free_rustvoiceactivitydetection'], 2);
  _uniffi_nobodywho_uniffi_fn_free_samplerbuilder = Module['_uniffi_nobodywho_uniffi_fn_free_samplerbuilder'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_samplerbuilder', wasmExports['uniffi_nobodywho_uniffi_fn_free_samplerbuilder'], 2);
  _uniffi_nobodywho_uniffi_fn_free_samplerconfig = Module['_uniffi_nobodywho_uniffi_fn_free_samplerconfig'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_free_samplerconfig', wasmExports['uniffi_nobodywho_uniffi_fn_free_samplerconfig'], 2);
  _uniffi_nobodywho_uniffi_fn_func_cosine_similarity = Module['_uniffi_nobodywho_uniffi_fn_func_cosine_similarity'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_cosine_similarity', wasmExports['uniffi_nobodywho_uniffi_fn_func_cosine_similarity'], 3);
  _uniffi_nobodywho_uniffi_fn_func_download_model = Module['_uniffi_nobodywho_uniffi_fn_func_download_model'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_download_model', wasmExports['uniffi_nobodywho_uniffi_fn_func_download_model'], 3);
  _uniffi_nobodywho_uniffi_fn_func_get_cached_models = Module['_uniffi_nobodywho_uniffi_fn_func_get_cached_models'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_get_cached_models', wasmExports['uniffi_nobodywho_uniffi_fn_func_get_cached_models'], 2);
  _uniffi_nobodywho_uniffi_fn_func_load_model = Module['_uniffi_nobodywho_uniffi_fn_func_load_model'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_load_model', wasmExports['uniffi_nobodywho_uniffi_fn_func_load_model'], 5);
  _uniffi_nobodywho_uniffi_fn_func_load_speech_to_text = Module['_uniffi_nobodywho_uniffi_fn_func_load_speech_to_text'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_load_speech_to_text', wasmExports['uniffi_nobodywho_uniffi_fn_func_load_speech_to_text'], 3);
  _uniffi_nobodywho_uniffi_fn_func_load_text_to_speech = Module['_uniffi_nobodywho_uniffi_fn_func_load_text_to_speech'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_load_text_to_speech', wasmExports['uniffi_nobodywho_uniffi_fn_func_load_text_to_speech'], 11);
  _uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection = Module['_uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection', wasmExports['uniffi_nobodywho_uniffi_fn_func_load_voice_activity_detection'], 7);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_grammar'], 2);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_json_schema'], 2);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_constrain_with_regex'], 2);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_default = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_default'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_default', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_default'], 1);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_dry'], 1);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_greedy'], 1);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_json = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_json'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_json', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_json'], 1);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_temperature'], 2);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_k'], 2);
  _uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p = Module['_uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p', wasmExports['uniffi_nobodywho_uniffi_fn_func_sampler_preset_top_p'], 2);
  _uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback = Module['_uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback', wasmExports['uniffi_nobodywho_uniffi_fn_init_callback_vtable_rustdownloadprogresscallback'], 1);
  _uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback = Module['_uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback', wasmExports['uniffi_nobodywho_uniffi_fn_init_callback_vtable_rusttoolcallback'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_ask = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_ask'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_ask', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_ask'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_json_prompt'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_ask_with_prompt'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_complete = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_complete'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_complete', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_complete'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_chat_history'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_sampler_config_json'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_stats'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_system_prompt'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_get_template_variables'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_mtp_acceptance_rate'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_reset_context'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_reset_history'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_chat_history'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_context_shift'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_sampler_config'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_system_prompt'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_template_variable'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_set_tools'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_stop_generation'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt = Module['_uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustchat_tokenize_with_prompt'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank = Module['_uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json = Module['_uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustcrossencoder_rank_and_sort_json'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustdecision_decide = Module['_uniffi_nobodywho_uniffi_fn_method_rustdecision_decide'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustdecision_decide', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustdecision_decide'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustencoder_encode = Module['_uniffi_nobodywho_uniffi_fn_method_rustencoder_encode'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustencoder_encode', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustencoder_encode'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch = Module['_uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustencoder_encode_batch'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx = Module['_uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustmodel_max_ctx'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rustmodel_source = Module['_uniffi_nobodywho_uniffi_fn_method_rustmodel_source'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustmodel_source', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustmodel_source'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_file'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotext_transcribe_pcm'], 4);
  _uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_completed'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token = Module['_uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustspeechtotextstream_next_token'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize = Module['_uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize', wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize'], 4);
  _uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async = Module['_uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async', wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttexttospeech_synthesize_async'], 2);
  _uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed = Module['_uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed', wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttokenstream_completed'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token = Module['_uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token', wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttokenstream_next_token'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json = Module['_uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json', wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttool_get_schema_json'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call = Module['_uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call', wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttool_next_pending_call'], 1);
  _uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call = Module['_uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call', wasmExports['uniffi_nobodywho_uniffi_fn_method_rusttool_resolve_pending_call'], 4);
  _uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish = Module['_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_finish'], 3);
  _uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push = Module['_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_push'], 4);
  _uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment = Module['_uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment', wasmExports['uniffi_nobodywho_uniffi_fn_method_rustvoiceactivitydetection_segment'], 4);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_grammar'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_json_schema'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_constrain_with_regex'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dist'], 2);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dry'], 7);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_dynamic_temperature'], 5);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_greedy'], 2);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_json'], 2);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_logit_bias'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_min_p'], 4);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1 = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v1'], 5);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2 = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_mirostat_v2'], 4);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_penalties'], 6);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_seed'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_temperature'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_k'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_n_sigma'], 3);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_top_p'], 4);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_typical_p'], 4);
  _uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc = Module['_uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerbuilder_xtc'], 5);
  _uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json = Module['_uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json'] = createExportWrapper('uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json', wasmExports['uniffi_nobodywho_uniffi_fn_method_samplerconfig_to_json'], 3);
  _malloc = createExportWrapper('malloc', wasmExports['malloc'], 1);
  _realloc = createExportWrapper('realloc', wasmExports['realloc'], 2);
  _free = createExportWrapper('free', wasmExports['free'], 1);
  _fflush = createExportWrapper('fflush', wasmExports['fflush'], 1);
  _llg_cancel = Module['_llg_cancel'] = createExportWrapper('llg_cancel', wasmExports['llg_cancel'], 1);
  _llg_clone_cancellation_handle = Module['_llg_clone_cancellation_handle'] = createExportWrapper('llg_clone_cancellation_handle', wasmExports['llg_clone_cancellation_handle'], 1);
  _llg_clone_constraint = Module['_llg_clone_constraint'] = createExportWrapper('llg_clone_constraint', wasmExports['llg_clone_constraint'], 1);
  _llg_clone_matcher = Module['_llg_clone_matcher'] = createExportWrapper('llg_clone_matcher', wasmExports['llg_clone_matcher'], 1);
  _llg_clone_stop_controller = Module['_llg_clone_stop_controller'] = createExportWrapper('llg_clone_stop_controller', wasmExports['llg_clone_stop_controller'], 1);
  _llg_clone_tokenizer = Module['_llg_clone_tokenizer'] = createExportWrapper('llg_clone_tokenizer', wasmExports['llg_clone_tokenizer'], 1);
  _llg_commit_token = Module['_llg_commit_token'] = createExportWrapper('llg_commit_token', wasmExports['llg_commit_token'], 3);
  _llg_compute_mask = Module['_llg_compute_mask'] = createExportWrapper('llg_compute_mask', wasmExports['llg_compute_mask'], 2);
  _llg_constraint_init_set_defaults = Module['_llg_constraint_init_set_defaults'] = createExportWrapper('llg_constraint_init_set_defaults', wasmExports['llg_constraint_init_set_defaults'], 2);
  _llg_decode_tokens = Module['_llg_decode_tokens'] = createExportWrapper('llg_decode_tokens', wasmExports['llg_decode_tokens'], 6);
  _llg_flush_logs = Module['_llg_flush_logs'] = createExportWrapper('llg_flush_logs', wasmExports['llg_flush_logs'], 1);
  _llg_free_cancellation_handle = Module['_llg_free_cancellation_handle'] = createExportWrapper('llg_free_cancellation_handle', wasmExports['llg_free_cancellation_handle'], 1);
  _llg_free_constraint = Module['_llg_free_constraint'] = createExportWrapper('llg_free_constraint', wasmExports['llg_free_constraint'], 1);
  _llg_free_matcher = Module['_llg_free_matcher'] = createExportWrapper('llg_free_matcher', wasmExports['llg_free_matcher'], 1);
  _llg_free_stop_controller = Module['_llg_free_stop_controller'] = createExportWrapper('llg_free_stop_controller', wasmExports['llg_free_stop_controller'], 1);
  _llg_free_tokenizer = Module['_llg_free_tokenizer'] = createExportWrapper('llg_free_tokenizer', wasmExports['llg_free_tokenizer'], 1);
  _llg_get_error = Module['_llg_get_error'] = createExportWrapper('llg_get_error', wasmExports['llg_get_error'], 1);
  _llg_get_temperature = Module['_llg_get_temperature'] = createExportWrapper('llg_get_temperature', wasmExports['llg_get_temperature'], 1);
  _llg_get_version = Module['_llg_get_version'] = createExportWrapper('llg_get_version', wasmExports['llg_get_version'], 0);
  _llg_is_stopped = Module['_llg_is_stopped'] = createExportWrapper('llg_is_stopped', wasmExports['llg_is_stopped'], 1);
  _llg_matcher_compute_ff_tokens = Module['_llg_matcher_compute_ff_tokens'] = createExportWrapper('llg_matcher_compute_ff_tokens', wasmExports['llg_matcher_compute_ff_tokens'], 3);
  _llg_matcher_compute_mask = Module['_llg_matcher_compute_mask'] = createExportWrapper('llg_matcher_compute_mask', wasmExports['llg_matcher_compute_mask'], 1);
  _llg_matcher_compute_mask_into = Module['_llg_matcher_compute_mask_into'] = createExportWrapper('llg_matcher_compute_mask_into', wasmExports['llg_matcher_compute_mask_into'], 3);
  _llg_matcher_consume_token = Module['_llg_matcher_consume_token'] = createExportWrapper('llg_matcher_consume_token', wasmExports['llg_matcher_consume_token'], 2);
  _llg_matcher_consume_tokens = Module['_llg_matcher_consume_tokens'] = createExportWrapper('llg_matcher_consume_tokens', wasmExports['llg_matcher_consume_tokens'], 3);
  _llg_matcher_get_cancellation_handle = Module['_llg_matcher_get_cancellation_handle'] = createExportWrapper('llg_matcher_get_cancellation_handle', wasmExports['llg_matcher_get_cancellation_handle'], 1);
  _llg_matcher_get_error = Module['_llg_matcher_get_error'] = createExportWrapper('llg_matcher_get_error', wasmExports['llg_matcher_get_error'], 1);
  _llg_matcher_get_mask = Module['_llg_matcher_get_mask'] = createExportWrapper('llg_matcher_get_mask', wasmExports['llg_matcher_get_mask'], 1);
  _llg_matcher_get_mask_byte_size = Module['_llg_matcher_get_mask_byte_size'] = createExportWrapper('llg_matcher_get_mask_byte_size', wasmExports['llg_matcher_get_mask_byte_size'], 1);
  _llg_matcher_is_accepting = Module['_llg_matcher_is_accepting'] = createExportWrapper('llg_matcher_is_accepting', wasmExports['llg_matcher_is_accepting'], 1);
  _llg_matcher_is_cancelled = Module['_llg_matcher_is_cancelled'] = createExportWrapper('llg_matcher_is_cancelled', wasmExports['llg_matcher_is_cancelled'], 1);
  _llg_matcher_is_error = Module['_llg_matcher_is_error'] = createExportWrapper('llg_matcher_is_error', wasmExports['llg_matcher_is_error'], 1);
  _llg_matcher_is_stopped = Module['_llg_matcher_is_stopped'] = createExportWrapper('llg_matcher_is_stopped', wasmExports['llg_matcher_is_stopped'], 1);
  _llg_matcher_reset = Module['_llg_matcher_reset'] = createExportWrapper('llg_matcher_reset', wasmExports['llg_matcher_reset'], 1);
  _llg_matcher_rollback = Module['_llg_matcher_rollback'] = createExportWrapper('llg_matcher_rollback', wasmExports['llg_matcher_rollback'], 2);
  _llg_matcher_validate_tokens = Module['_llg_matcher_validate_tokens'] = createExportWrapper('llg_matcher_validate_tokens', wasmExports['llg_matcher_validate_tokens'], 3);
  _llg_new_constraint = Module['_llg_new_constraint'] = createExportWrapper('llg_new_constraint', wasmExports['llg_new_constraint'], 2);
  _llg_new_constraint_any = Module['_llg_new_constraint_any'] = createExportWrapper('llg_new_constraint_any', wasmExports['llg_new_constraint_any'], 3);
  _llg_new_constraint_json = Module['_llg_new_constraint_json'] = createExportWrapper('llg_new_constraint_json', wasmExports['llg_new_constraint_json'], 2);
  _llg_new_constraint_lark = Module['_llg_new_constraint_lark'] = createExportWrapper('llg_new_constraint_lark', wasmExports['llg_new_constraint_lark'], 2);
  _llg_new_constraint_regex = Module['_llg_new_constraint_regex'] = createExportWrapper('llg_new_constraint_regex', wasmExports['llg_new_constraint_regex'], 2);
  _llg_new_matcher = Module['_llg_new_matcher'] = createExportWrapper('llg_new_matcher', wasmExports['llg_new_matcher'], 3);
  _llg_new_stop_controller = Module['_llg_new_stop_controller'] = createExportWrapper('llg_new_stop_controller', wasmExports['llg_new_stop_controller'], 6);
  _llg_new_tokenizer = Module['_llg_new_tokenizer'] = createExportWrapper('llg_new_tokenizer', wasmExports['llg_new_tokenizer'], 3);
  _llg_new_tokenizer_v2 = Module['_llg_new_tokenizer_v2'] = createExportWrapper('llg_new_tokenizer_v2', wasmExports['llg_new_tokenizer_v2'], 3);
  _llg_par_compute_mask = Module['_llg_par_compute_mask'] = createExportWrapper('llg_par_compute_mask', wasmExports['llg_par_compute_mask'], 4);
  _llg_stop_commit_token = Module['_llg_stop_commit_token'] = createExportWrapper('llg_stop_commit_token', wasmExports['llg_stop_commit_token'], 4);
  _llg_stringify_tokens = Module['_llg_stringify_tokens'] = createExportWrapper('llg_stringify_tokens', wasmExports['llg_stringify_tokens'], 5);
  _llg_tokenize_bytes = Module['_llg_tokenize_bytes'] = createExportWrapper('llg_tokenize_bytes', wasmExports['llg_tokenize_bytes'], 5);
  _llg_tokenize_bytes_marker = Module['_llg_tokenize_bytes_marker'] = createExportWrapper('llg_tokenize_bytes_marker', wasmExports['llg_tokenize_bytes_marker'], 5);
  _llg_validate_grammar = Module['_llg_validate_grammar'] = createExportWrapper('llg_validate_grammar', wasmExports['llg_validate_grammar'], 5);
  _strerror = createExportWrapper('strerror', wasmExports['strerror'], 1);
  ___ubrn_alloc = Module['___ubrn_alloc'] = createExportWrapper('__ubrn_alloc', wasmExports['__ubrn_alloc'], 2);
  ___ubrn_free = Module['___ubrn_free'] = createExportWrapper('__ubrn_free', wasmExports['__ubrn_free'], 3);
  ___ubrn_install_panic_hook = Module['___ubrn_install_panic_hook'] = createExportWrapper('__ubrn_install_panic_hook', wasmExports['__ubrn_install_panic_hook'], 0);
  ___ubrn_set_panic_log = Module['___ubrn_set_panic_log'] = createExportWrapper('__ubrn_set_panic_log', wasmExports['__ubrn_set_panic_log'], 1);
  _emwgpuCreateBindGroup = createExportWrapper('emwgpuCreateBindGroup', wasmExports['emwgpuCreateBindGroup'], 1);
  _emwgpuCreateBindGroupLayout = createExportWrapper('emwgpuCreateBindGroupLayout', wasmExports['emwgpuCreateBindGroupLayout'], 1);
  _emwgpuCreateCommandBuffer = createExportWrapper('emwgpuCreateCommandBuffer', wasmExports['emwgpuCreateCommandBuffer'], 1);
  _emwgpuCreateCommandEncoder = createExportWrapper('emwgpuCreateCommandEncoder', wasmExports['emwgpuCreateCommandEncoder'], 1);
  _emwgpuCreateComputePassEncoder = createExportWrapper('emwgpuCreateComputePassEncoder', wasmExports['emwgpuCreateComputePassEncoder'], 1);
  _emwgpuCreateComputePipeline = createExportWrapper('emwgpuCreateComputePipeline', wasmExports['emwgpuCreateComputePipeline'], 1);
  _emwgpuCreateExternalTexture = createExportWrapper('emwgpuCreateExternalTexture', wasmExports['emwgpuCreateExternalTexture'], 1);
  _emwgpuCreatePipelineLayout = createExportWrapper('emwgpuCreatePipelineLayout', wasmExports['emwgpuCreatePipelineLayout'], 1);
  _emwgpuCreateQuerySet = createExportWrapper('emwgpuCreateQuerySet', wasmExports['emwgpuCreateQuerySet'], 1);
  _emwgpuCreateRenderBundle = createExportWrapper('emwgpuCreateRenderBundle', wasmExports['emwgpuCreateRenderBundle'], 1);
  _emwgpuCreateRenderBundleEncoder = createExportWrapper('emwgpuCreateRenderBundleEncoder', wasmExports['emwgpuCreateRenderBundleEncoder'], 1);
  _emwgpuCreateRenderPassEncoder = createExportWrapper('emwgpuCreateRenderPassEncoder', wasmExports['emwgpuCreateRenderPassEncoder'], 1);
  _emwgpuCreateRenderPipeline = createExportWrapper('emwgpuCreateRenderPipeline', wasmExports['emwgpuCreateRenderPipeline'], 1);
  _emwgpuCreateSampler = createExportWrapper('emwgpuCreateSampler', wasmExports['emwgpuCreateSampler'], 1);
  _emwgpuCreateSurface = createExportWrapper('emwgpuCreateSurface', wasmExports['emwgpuCreateSurface'], 1);
  _emwgpuCreateTexture = createExportWrapper('emwgpuCreateTexture', wasmExports['emwgpuCreateTexture'], 1);
  _emwgpuCreateTextureView = createExportWrapper('emwgpuCreateTextureView', wasmExports['emwgpuCreateTextureView'], 1);
  _emwgpuCreateAdapter = createExportWrapper('emwgpuCreateAdapter', wasmExports['emwgpuCreateAdapter'], 1);
  _emwgpuImportBuffer = createExportWrapper('emwgpuImportBuffer', wasmExports['emwgpuImportBuffer'], 1);
  _emwgpuCreateDevice = createExportWrapper('emwgpuCreateDevice', wasmExports['emwgpuCreateDevice'], 2);
  _emwgpuCreateQueue = createExportWrapper('emwgpuCreateQueue', wasmExports['emwgpuCreateQueue'], 1);
  _emwgpuCreateShaderModule = createExportWrapper('emwgpuCreateShaderModule', wasmExports['emwgpuCreateShaderModule'], 1);
  _emwgpuOnCompilationInfoCompleted = createExportWrapper('emwgpuOnCompilationInfoCompleted', wasmExports['emwgpuOnCompilationInfoCompleted'], 3);
  _emwgpuOnCreateComputePipelineCompleted = createExportWrapper('emwgpuOnCreateComputePipelineCompleted', wasmExports['emwgpuOnCreateComputePipelineCompleted'], 4);
  _emwgpuOnCreateRenderPipelineCompleted = createExportWrapper('emwgpuOnCreateRenderPipelineCompleted', wasmExports['emwgpuOnCreateRenderPipelineCompleted'], 4);
  _emwgpuOnDeviceLostCompleted = createExportWrapper('emwgpuOnDeviceLostCompleted', wasmExports['emwgpuOnDeviceLostCompleted'], 3);
  _emwgpuOnMapAsyncCompleted = createExportWrapper('emwgpuOnMapAsyncCompleted', wasmExports['emwgpuOnMapAsyncCompleted'], 3);
  _emwgpuOnPopErrorScopeCompleted = createExportWrapper('emwgpuOnPopErrorScopeCompleted', wasmExports['emwgpuOnPopErrorScopeCompleted'], 4);
  _emwgpuOnRequestAdapterCompleted = createExportWrapper('emwgpuOnRequestAdapterCompleted', wasmExports['emwgpuOnRequestAdapterCompleted'], 4);
  _emwgpuOnRequestDeviceCompleted = createExportWrapper('emwgpuOnRequestDeviceCompleted', wasmExports['emwgpuOnRequestDeviceCompleted'], 4);
  _emwgpuOnWorkDoneCompleted = createExportWrapper('emwgpuOnWorkDoneCompleted', wasmExports['emwgpuOnWorkDoneCompleted'], 2);
  _emwgpuOnUncapturedError = createExportWrapper('emwgpuOnUncapturedError', wasmExports['emwgpuOnUncapturedError'], 3);
  _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'];
  _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'];
  _htonl = createExportWrapper('htonl', wasmExports['htonl'], 1);
  _htons = createExportWrapper('htons', wasmExports['htons'], 1);
  _emscripten_builtin_memalign = createExportWrapper('emscripten_builtin_memalign', wasmExports['emscripten_builtin_memalign'], 2);
  _ntohs = createExportWrapper('ntohs', wasmExports['ntohs'], 1);
  _memalign = createExportWrapper('memalign', wasmExports['memalign'], 2);
  ___trap = wasmExports['__trap'];
  _emscripten_stack_init = wasmExports['emscripten_stack_init'];
  _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'];
  __emscripten_stack_restore = wasmExports['_emscripten_stack_restore'];
  __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'];
  _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'];
  ___cxa_decrement_exception_refcount = createExportWrapper('__cxa_decrement_exception_refcount', wasmExports['__cxa_decrement_exception_refcount'], 1);
  ___cxa_increment_exception_refcount = createExportWrapper('__cxa_increment_exception_refcount', wasmExports['__cxa_increment_exception_refcount'], 1);
  ___thrown_object_from_unwind_exception = createExportWrapper('__thrown_object_from_unwind_exception', wasmExports['__thrown_object_from_unwind_exception'], 1);
  ___get_exception_message = createExportWrapper('__get_exception_message', wasmExports['__get_exception_message'], 3);
  memory = wasmMemory = wasmExports['memory'];
  __indirect_function_table = wasmTable = wasmExports['__indirect_function_table'];
  ___cpp_exception = wasmExports['__cpp_exception'];
}

var wasmImports = {
  /** @export */
  __assert_fail: ___assert_fail,
  /** @export */
  __syscall_connect: ___syscall_connect,
  /** @export */
  __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */
  __syscall_fstat64: ___syscall_fstat64,
  /** @export */
  __syscall_getcwd: ___syscall_getcwd,
  /** @export */
  __syscall_getdents64: ___syscall_getdents64,
  /** @export */
  __syscall_getpeername: ___syscall_getpeername,
  /** @export */
  __syscall_getsockopt: ___syscall_getsockopt,
  /** @export */
  __syscall_ioctl: ___syscall_ioctl,
  /** @export */
  __syscall_linkat: ___syscall_linkat,
  /** @export */
  __syscall_lstat64: ___syscall_lstat64,
  /** @export */
  __syscall_mkdirat: ___syscall_mkdirat,
  /** @export */
  __syscall_newfstatat: ___syscall_newfstatat,
  /** @export */
  __syscall_openat: ___syscall_openat,
  /** @export */
  __syscall_poll: ___syscall_poll,
  /** @export */
  __syscall_poll_nonblocking: ___syscall_poll_nonblocking,
  /** @export */
  __syscall_readlinkat: ___syscall_readlinkat,
  /** @export */
  __syscall_recvfrom: ___syscall_recvfrom,
  /** @export */
  __syscall_renameat: ___syscall_renameat,
  /** @export */
  __syscall_sendto: ___syscall_sendto,
  /** @export */
  __syscall_setsockopt: ___syscall_setsockopt,
  /** @export */
  __syscall_shutdown: ___syscall_shutdown,
  /** @export */
  __syscall_socket: ___syscall_socket,
  /** @export */
  __syscall_stat64: ___syscall_stat64,
  /** @export */
  __syscall_uname: ___syscall_uname,
  /** @export */
  __syscall_unlinkat: ___syscall_unlinkat,
  /** @export */
  __throw_exception_with_stack_trace: ___throw_exception_with_stack_trace,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  _mmap_js: __mmap_js,
  /** @export */
  _munmap_js: __munmap_js,
  /** @export */
  _tzset_js: __tzset_js,
  /** @export */
  clock_time_get: _clock_time_get,
  /** @export */
  emscripten_clear_immediate: _emscripten_clear_immediate,
  /** @export */
  emscripten_clear_timeout: _emscripten_clear_timeout,
  /** @export */
  emscripten_err: _emscripten_err,
  /** @export */
  emscripten_get_heap_max: _emscripten_get_heap_max,
  /** @export */
  emscripten_get_now: _emscripten_get_now,
  /** @export */
  emscripten_has_asyncify: _emscripten_has_asyncify,
  /** @export */
  emscripten_promise_await: _emscripten_promise_await,
  /** @export */
  emscripten_promise_create: _emscripten_promise_create,
  /** @export */
  emscripten_promise_destroy: _emscripten_promise_destroy,
  /** @export */
  emscripten_promise_resolve: _emscripten_promise_resolve,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  emscripten_run_script_string: _emscripten_run_script_string,
  /** @export */
  emscripten_set_immediate: _emscripten_set_immediate,
  /** @export */
  emscripten_set_timeout: _emscripten_set_timeout,
  /** @export */
  emwgpuAdapterRequestDevice: _emwgpuAdapterRequestDevice,
  /** @export */
  emwgpuBufferDestroy: _emwgpuBufferDestroy,
  /** @export */
  emwgpuBufferGetConstMappedRange: _emwgpuBufferGetConstMappedRange,
  /** @export */
  emwgpuBufferMapAsync: _emwgpuBufferMapAsync,
  /** @export */
  emwgpuBufferUnmap: _emwgpuBufferUnmap,
  /** @export */
  emwgpuDelete: _emwgpuDelete,
  /** @export */
  emwgpuDeviceCreateBuffer: _emwgpuDeviceCreateBuffer,
  /** @export */
  emwgpuDeviceCreateShaderModule: _emwgpuDeviceCreateShaderModule,
  /** @export */
  emwgpuDeviceDestroy: _emwgpuDeviceDestroy,
  /** @export */
  emwgpuInstanceRequestAdapter: _emwgpuInstanceRequestAdapter,
  /** @export */
  emwgpuQueueOnSubmittedWorkDone: _emwgpuQueueOnSubmittedWorkDone,
  /** @export */
  emwgpuWaitAny: _emwgpuWaitAny,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_fdstat_get: _fd_fdstat_get,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write,
  /** @export */
  getaddrinfo: _getaddrinfo,
  /** @export */
  random_get: _random_get,
  /** @export */
  wgpuAdapterGetInfo: _wgpuAdapterGetInfo,
  /** @export */
  wgpuAdapterGetLimits: _wgpuAdapterGetLimits,
  /** @export */
  wgpuAdapterHasFeature: _wgpuAdapterHasFeature,
  /** @export */
  wgpuBufferGetSize: _wgpuBufferGetSize,
  /** @export */
  wgpuCommandEncoderBeginComputePass: _wgpuCommandEncoderBeginComputePass,
  /** @export */
  wgpuCommandEncoderCopyBufferToBuffer: _wgpuCommandEncoderCopyBufferToBuffer,
  /** @export */
  wgpuCommandEncoderFinish: _wgpuCommandEncoderFinish,
  /** @export */
  wgpuComputePassEncoderDispatchWorkgroups: _wgpuComputePassEncoderDispatchWorkgroups,
  /** @export */
  wgpuComputePassEncoderEnd: _wgpuComputePassEncoderEnd,
  /** @export */
  wgpuComputePassEncoderSetBindGroup: _wgpuComputePassEncoderSetBindGroup,
  /** @export */
  wgpuComputePassEncoderSetPipeline: _wgpuComputePassEncoderSetPipeline,
  /** @export */
  wgpuComputePipelineGetBindGroupLayout: _wgpuComputePipelineGetBindGroupLayout,
  /** @export */
  wgpuDeviceCreateBindGroup: _wgpuDeviceCreateBindGroup,
  /** @export */
  wgpuDeviceCreateCommandEncoder: _wgpuDeviceCreateCommandEncoder,
  /** @export */
  wgpuDeviceCreateComputePipeline: _wgpuDeviceCreateComputePipeline,
  /** @export */
  wgpuInstanceHasWGSLLanguageFeature: _wgpuInstanceHasWGSLLanguageFeature,
  /** @export */
  wgpuQueueSubmit: _wgpuQueueSubmit,
  /** @export */
  wgpuQueueWriteBuffer: _wgpuQueueWriteBuffer
};


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var calledRun;

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

async function run() {
  assert(!calledRun);
  calledRun = true;

  stackCheckInit();

  preRun();

  if (runDependencies) {
    await resolveRunDependencies();
  }

  var setStatus = Module['setStatus'];
  if (setStatus) {
    setStatus('Running...');
    // Yield to the event loop to allow the browser to paint "Running..."
    await new Promise((resolve) => setTimeout(resolve, 1));
    // Then we want to clear the status text, but only after the rest of this function runs.
    setTimeout(setStatus, 1, '');
  }

  if (ABORT) return;

  initRuntime();

  Module['onRuntimeInitialized']?.();
  consumedModuleProp('onRuntimeInitialized');

  assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

  postRun();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    for (var tty of Object.values(TTY.ttys)) {
      if (tty.output.length) {
        has = true;
      }
    }
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
  }
}

var wasmExports;

// In modularize mode the generated code is within a factory function so we
// can use await here (since it's not top-level-await).
wasmExports = await createWasm();
await run();

// end include: postamble.js

// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.

// Assertion for attempting to access module properties on the incoming
// moduleArg.  In the past we used this object as the prototype of the module
// and assigned properties to it, but now we return a distinct object.  This
// keeps the instance private until it is ready (i.e the promise has been
// resolved).
for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)
      }
    });
  }
}
// end include: postamble_modularize.js



  return Module;
}

// Export using a UMD style export, or ES6 exports if selected
export default Module;

