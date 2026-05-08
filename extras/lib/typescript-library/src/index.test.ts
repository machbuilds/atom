import { describe, expect, it } from "vitest";

import { greet } from "./index.js";

describe("greet", () => {
  it("returns the basic form when no options are passed", () => {
    expect(greet("world")).toBe("hello, world");
  });

  it("appends one bang per excitement level", () => {
    expect(greet("world", { excitement: 3 })).toBe("hello, world!!!");
  });

  it("treats negative or undefined excitement as zero", () => {
    expect(greet("world", { excitement: -2 })).toBe("hello, world");
    expect(greet("world", {})).toBe("hello, world");
  });
});
