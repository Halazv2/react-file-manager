export type DndKind = "folder" | "file";

export type DndState =
  | { status: "idle" }
  | { status: "dragging"; ids: string[]; primaryId: string; kind: DndKind }
  | { status: "hovering"; ids: string[]; primaryId: string; kind: DndKind; targetId: string | null }
  | { status: "springOpen"; ids: string[]; primaryId: string; kind: DndKind; targetId: string | null }
  | { status: "dropped"; ids: string[]; targetId: string | null }
  | { status: "cancelled" };

export type DndEvent =
  | { type: "START"; id: string; kind: DndKind; selectedIds: string[] }
  | { type: "HOVER"; targetId: string | null }
  | { type: "SPRING_OPEN" }
  | { type: "DROP"; targetId: string | null }
  | { type: "END" }
  | { type: "RESET" };

export const DND_IDLE: DndState = { status: "idle" };

function dragIds(id: string, selectedIds: string[]): string[] {
  return selectedIds.length > 1 && selectedIds.includes(id) ? selectedIds : [id];
}

export function dndReducer(state: DndState, event: DndEvent): DndState {
  switch (event.type) {
    case "START": {
      const ids = dragIds(event.id, event.selectedIds);
      return { status: "dragging", ids, primaryId: event.id, kind: event.kind };
    }
    case "HOVER": {
      if (state.status !== "dragging" && state.status !== "hovering" && state.status !== "springOpen") {
        return state;
      }
      if (state.status === "hovering" && state.targetId === event.targetId) return state;
      if (state.status === "springOpen" && state.targetId === event.targetId) return state;
      return {
        status: "hovering",
        ids: state.ids,
        primaryId: state.primaryId,
        kind: state.kind,
        targetId: event.targetId
      };
    }
    case "SPRING_OPEN": {
      if (state.status !== "hovering") return state;
      return { ...state, status: "springOpen" };
    }
    case "DROP": {
      if (state.status === "idle" || state.status === "cancelled" || state.status === "dropped") return state;
      return { status: "dropped", ids: state.ids, targetId: event.targetId };
    }
    case "END": {
      if (state.status === "dropped") return state;
      if (state.status === "idle") return state;
      return { status: "cancelled" };
    }
    case "RESET":
      return DND_IDLE;
    default:
      return state;
  }
}

export function isDndActive(state: DndState): boolean {
  return state.status === "dragging" || state.status === "hovering" || state.status === "springOpen";
}
