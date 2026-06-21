import { buildLocalPart } from "../local-part";

describe("buildLocalPart", () => {
  it("joins ascii-folded first.last lowercased", () => {
    expect(buildLocalPart("Ali", "Veli", new Set())).toBe("ali.veli");
  });
  it("folds Turkish chars", () => {
    expect(buildLocalPart("Çağrı", "Şişman", new Set())).toBe("cagri.sisman");
  });
  it("suffixes on collision", () => {
    expect(buildLocalPart("Ali", "Veli", new Set(["ali.veli"]))).toBe("ali.veli.2");
    expect(buildLocalPart("Ali", "Veli", new Set(["ali.veli", "ali.veli.2"]))).toBe("ali.veli.3");
  });
});
