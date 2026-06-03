import { describe, expect, it } from "vitest";
import { clearMesaCaptainIfPerson, toggleMesaCaptainId } from "./mesas-utils";

describe("toggleMesaCaptainId", () => {
  it("selects a seated person as table captain when they are not the current captain", () => {
    expect(toggleMesaCaptainId(undefined, "grupo-1:principal")).toBe("grupo-1:principal");
    expect(toggleMesaCaptainId("grupo-2:principal", "grupo-1:principal")).toBe("grupo-1:principal");
  });

  it("removes the table captain when clicking the current captain again", () => {
    expect(toggleMesaCaptainId("grupo-1:principal", "grupo-1:principal")).toBeUndefined();
  });
});

describe("clearMesaCaptainIfPerson", () => {
  it("clears the captain only when the removed person is the current captain", () => {
    expect(clearMesaCaptainIfPerson("grupo-1:principal", "grupo-1:principal")).toBeUndefined();
    expect(clearMesaCaptainIfPerson("grupo-1:principal", "grupo-2:principal")).toBe("grupo-1:principal");
  });
});
