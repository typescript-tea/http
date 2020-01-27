import { createEffectManager } from "../effect-manager";

test("createEffectManager", () => {
  const map = createEffectManager();
  expect(Object.keys(map).length).toBe(5);
});
