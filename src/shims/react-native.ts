if (typeof (globalThis as any).__DEV__ === "undefined") {
  (globalThis as any).__DEV__ = true;
}

export class NativeEventEmitter {
  addListener() {
    return { remove: () => {} };
  }
  removeListeners() {}
  removeAllListeners() {}
  emit() {}
}

export const Platform = {
  OS: "web" as const,
  select: (obj: Record<string, any>) => obj.web || obj.default,
};

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => null,
};

export const NativeModules = {};

export const processColor = (color: any) => color;

export const EventEmitter = NativeEventEmitter;

export default {
  NativeEventEmitter,
  Platform,
  TurboModuleRegistry,
  NativeModules,
  processColor,
  EventEmitter,
};
