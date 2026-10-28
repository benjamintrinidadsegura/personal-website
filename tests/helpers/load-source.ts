import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileFunction } from "node:vm";
import ts from "typescript";

const compiled = new Map<string, string>();

/** Execute production code with explicit boundaries; never load a real service client. */
export function loadSource<T>(path: string, dependencies: Record<string, unknown>, globals: Record<string, unknown> = {}): T {
  let code = compiled.get(path);
  if (!code) {
    code = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    compiled.set(path, code);
  }
  const exports = {};
  const require = (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency in ${path}: ${name}`);
    return dependencies[name];
  };
  compileFunction(code, ["require", "exports", ...Object.keys(globals)], { filename: path })(require, exports, ...Object.values(globals));
  return exports as T;
}
