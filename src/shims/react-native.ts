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

export const Linking = {
  openURL: async (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
    return Promise.resolve();
  },
  canOpenURL: async (_url: string) => Promise.resolve(true),
  getInitialURL: async () => Promise.resolve(null),
  addEventListener: () => ({ remove: () => {} }),
};

export default {
  NativeEventEmitter,
  Platform,
  TurboModuleRegistry,
  NativeModules,
  processColor,
  EventEmitter,
  Linking,
};
