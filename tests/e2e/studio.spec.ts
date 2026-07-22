import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Studio" }).click({ timeout: 2500 }).catch(() => undefined);
});

test("app loads directly into the studio with default scenes", async ({ page }) => {
  await expect(page.locator(".sf-titlebar")).toContainText("StreamForge Studio");
  await expect(page.getByRole("navigation", { name: "Application menu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenes" })).toBeVisible();
  await expect(page.getByText("Main Scene", { exact: true })).toBeVisible();
});

test("scene and text source can be added", async ({ page }) => {
  const scenes = page.locator(".sf-list").first().locator("> button");
  const count = await scenes.count();
  await page.getByRole("button", { name: "Add scene" }).click();
  await expect(scenes).toHaveCount(count + 1);
  await page.getByRole("button", { name: "Add source" }).click();
  await page.getByRole("button", { name: /Text/ }).click();
  await expect(page.locator(".sf-sources").getByRole("button", { name: "Text", exact: true })).toBeVisible();
});

test("project export downloads JSON", async ({ page }) => {
  await page.getByRole("button", { name: "File", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export Project" }).click();
  expect((await download).suggestedFilename()).toContain("streamforge.json");
});

test("invalid project import shows a useful error", async ({ page }) => {
  await page.getByRole("button", { name: "File", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("menuitem", { name: "Import Project" }).click();
  await (await chooser).setFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{}") });
  await expect(page.getByText(/Import failed/)).toBeVisible();
});

test("resized dock widths persist after reload", async ({ page }) => {
  const scenesDock = page.locator('[data-dock="scenes"]');
  const divider = page.getByRole("separator", { name: "Resize scenes dock" });
  const before = await scenesDock.evaluate((element) => element.getBoundingClientRect().width);
  const box = await divider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + 85, box!.y + box!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.locator(".sf-save").textContent()).toBe("Saved");
  await page.reload();
  await expect(scenesDock).toBeVisible();
  const after = await scenesDock.evaluate((element) => element.getBoundingClientRect().width);
  expect(after).toBeGreaterThan(before + 45);
});
