import { describe, expect, it } from "vitest";
import { stageTone, statusTone, toCsv } from "@/lib/admin-ui";

describe("status colours", () => {
  it("uses amber for in-progress sales", () => expect(statusTone("in_progress")).toBe("warning"));
  it("uses red for suspended listings", () => expect(statusTone("suspended")).toBe("danger"));
  it("uses green for completed deals", () => expect(stageTone("completed")).toBe("success"));
  it("uses red for disputes", () => expect(stageTone("disputed")).toBe("danger"));
});
describe("csv export", () => {
  it("quotes values with commas", () => expect(toCsv([{ a: "x,y" }])).toBe('a\n"x,y"'));
});
