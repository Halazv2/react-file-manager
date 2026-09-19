import { describe, expect, it } from "vitest";

import { DND_IDLE, dndReducer } from "./dndMachine";

describe("dndReducer", () => {
  it("starts a drag, hovers, spring-opens, and drops", () => {
    let state = dndReducer(DND_IDLE, { type: "START", id: "readme", kind: "file", selectedIds: [] });
    expect(state).toMatchObject({ status: "dragging", ids: ["readme"] });

    state = dndReducer(state, { type: "HOVER", targetId: "docs" });
    expect(state).toMatchObject({ status: "hovering", targetId: "docs" });

    state = dndReducer(state, { type: "SPRING_OPEN" });
    expect(state).toMatchObject({ status: "springOpen", targetId: "docs" });

    state = dndReducer(state, { type: "DROP", targetId: "docs" });
    expect(state).toMatchObject({ status: "dropped", ids: ["readme"], targetId: "docs" });
  });

  it("cancels when the drag ends without a drop", () => {
    let state = dndReducer(DND_IDLE, { type: "START", id: "a", kind: "file", selectedIds: ["a"] });
    state = dndReducer(state, { type: "END" });
    expect(state.status).toBe("cancelled");
    state = dndReducer(state, { type: "RESET" });
    expect(state).toEqual(DND_IDLE);
  });

  it("keeps multi-select ids when the primary item is in the selection", () => {
    const state = dndReducer(DND_IDLE, {
      type: "START",
      id: "a",
      kind: "file",
      selectedIds: ["a", "b"]
    });
    expect(state).toMatchObject({ status: "dragging", ids: ["a", "b"] });
  });
});
