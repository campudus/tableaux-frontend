import { expandServiceUrl, isServiceAllowed } from "./frontendServiceHelper";

describe("frontend service helper", () => {
  const values = { firstName: "Monty", lastName: "Python" };
  const urlTemplate = "/person/{{lastName}}/{{firstName}}";

  describe("expandServiceUrl()", () => {
    it("is nil safe", () => {
      expect(expandServiceUrl(null, urlTemplate)).toEqual(urlTemplate);
      expect(expandServiceUrl(values, null)).toBe(null);
    });

    it("expands arbitrary moustaches", () => {
      expect(expandServiceUrl(values, urlTemplate)).toEqual(
        "/person/Python/Monty"
      );
    });
  });

  describe("isServiceAllowed()", () => {
    const column = {
      id: 1,
      ordering: 1,
      name: "state",
      kind: "shorttext",
      multilanguage: false,
      identifier: true,
      displayName: { "de-DE": "Bundesland", "en-GB": "federal state" },
      description: {
        "de-DE":
          "Ein Land ist nach der föderalen Verfassungsordnung der Bundesrepublik Deutschland einer ihrer teilsouveränen Gliedstaaten.",
        "en-GB":
          "Germany is a federal republic consisting of sixteen federal states (German: Bundesland, or Land)."
      },
      separator: true,
      status: "ok"
    };
    it("should allow tables with plain matches", () => {
      expect(isServiceAllowed({ name: "state" }, column)).toBe(true);
      expect(
        isServiceAllowed({ "displayName.de-DE": "Bundesland" }, column)
      ).toBe(true);
    });

    it("should allow tables with plain regex matches", () => {
      expect(isServiceAllowed({ name: ".*ate.*" }, column)).toBe(true);
    });

    it("should deny tables with plain matches", () => {
      expect(isServiceAllowed({ name: "country" }, column)).toBe(false);
    });

    it("should deny tables with plain regex matches", () => {
      expect(isServiceAllowed({ name: ".*drank.*" }, column)).toBe(false);
    });

    it("should allow tables matching include clause", () => {
      expect(isServiceAllowed({ includes: { name: ".*ate.*" } }, column)).toBe(
        true
      );
    });
    it("should deny tables not matching `includes` clause", () => {
      expect(
        isServiceAllowed({ includes: { name: ".*drank.*" } }, column)
      ).toBe(false);
    });
    it("should deny tables matching `excludes` clause", () => {
      expect(isServiceAllowed({ excludes: { name: ".*ate.*" } }, column)).toBe(
        false
      );
    });
  });
});
