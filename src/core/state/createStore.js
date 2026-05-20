import { createPubSub } from "../events/pubsub.js";

export function createStore(initialState = {}) {
  let state = structuredClone(initialState);
  const bus = createPubSub();

  return {
    getState() {
      return state;
    },
    setState(patch) {
      state = { ...state, ...patch };
      bus.emit("change", state);
    },
    reset() {
      state = structuredClone(initialState);
      bus.emit("change", state);
    },
    subscribe(callback) {
      callback(state);
      return bus.on("change", callback);
    }
  };
}
