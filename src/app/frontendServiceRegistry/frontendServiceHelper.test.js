import { expandServiceUrl } from "./frontendServiceHelper";

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
});
