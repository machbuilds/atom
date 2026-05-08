/**
 * Public API surface — only export what consumers should depend on.
 * Keep types and runtime exports separate; use `export type` for
 * type-only exports so they get stripped by `verbatimModuleSyntax`.
 */

export type GreetOptions = {
  /** Optional excitement level. Each level appends one "!". */
  excitement?: number;
};

/**
 * Greet someone by name.
 *
 * @example
 * greet("world") // "hello, world"
 * greet("world", { excitement: 3 }) // "hello, world!!!"
 */
export function greet(name: string, options: GreetOptions = {}): string {
  const bangs = "!".repeat(Math.max(0, options.excitement ?? 0));
  return `hello, ${name}${bangs}`;
}
