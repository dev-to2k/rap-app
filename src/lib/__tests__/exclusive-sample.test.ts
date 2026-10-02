import { describe, expect, it } from "vitest";
import { exclusiveSampleIsClean } from "@/lib/exclusive-sample";

describe("exclusiveSampleIsClean", () => {
  it("allows exclusive only for the exact flag clean", () => {
    expect(exclusiveSampleIsClean("clean")).toBe(true);
  });

  it("blocks uncleared, missing, empty, and unexpected flags", () => {
    for (const flag of ["uncleared", "", " ", "CLEAN", "Clean", "unknown", "pending", null, undefined]) {
      expect(exclusiveSampleIsClean(flag)).toBe(false);
    }
  });
});
