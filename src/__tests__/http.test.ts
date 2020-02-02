import { createEffectManager } from "../http";

test("createEffectManager", () => {
  const map = createEffectManager();
  expect(Object.keys(map).length).toBe(5);
});
