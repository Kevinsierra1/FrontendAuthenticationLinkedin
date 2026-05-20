export function createPubSub() {
  const listeners = new Map();

  return {
    on(event, callback) {
      const bucket = listeners.get(event) || new Set();
      bucket.add(callback);
      listeners.set(event, bucket);
      return () => bucket.delete(callback);
    },
    emit(event, payload) {
      (listeners.get(event) || []).forEach((callback) => callback(payload));
    }
  };
}
