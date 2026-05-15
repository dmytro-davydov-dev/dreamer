export const analytics = { capture: jest.fn() };
export const startAiTimer = jest.fn(() => ({ stop: jest.fn(() => 0) }));
export const initAnalytics = jest.fn();
export const initSentry = jest.fn();
export const captureError = jest.fn();
export const identifyUser = jest.fn();
