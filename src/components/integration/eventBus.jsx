class BioneeroEventBus {
  constructor() { this._handlers = {}; }

  subscribe(eventType, handler) {
    if (!this._handlers[eventType]) this._handlers[eventType] = [];
    this._handlers[eventType].push(handler);
    return () => this.unsubscribe(eventType, handler);
  }

  unsubscribe(eventType, handler) {
    this._handlers[eventType] = (this._handlers[eventType] || []).filter(h => h !== handler);
  }

  emit(eventType, payload) {
    (this._handlers[eventType] || []).forEach(h => {
      try { h({ type: eventType, payload }); }
      catch (e) { console.error(`[EventBus] Handler error for ${eventType}:`, e); }
    });
  }
}

export const eventBus = new BioneeroEventBus();