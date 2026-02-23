import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test("can see a standard sized flip date for a given date in English", async ({
  page,
}) => {
  const sourceFile = path.join(__dirname, "english.trmnlp.yml");
  const destFile = path.join(__dirname, "..", ".trmnlp.yml");

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }

  if (!fs.existsSync(destFile)) {
    throw new Error(`Destination file not found: ${destFile}`);
  }

  const originalContent = fs.readFileSync(destFile, "utf-8"); // Save original content to restore later

  fs.copyFileSync(sourceFile, destFile);

  try {
    const routes = ["/quadrant", "/full", "/half_vertical", "/half_horizontal"];

    for (const route of routes) {
      await test.step(`Testing route: ${route}`, async () => {
        await page.goto(route);
        await page.getByRole("link", { name: "Poll" }).click();
        const trmnlFrame = page.frameLocator("iframe");
        if (route === "/full") {
          await expect
            .soft(trmnlFrame.locator("div.fdp-dayofweek"))
            .toHaveText("Friday");
        }
        await expect
          .soft(trmnlFrame.locator("div.fdp-number"))
          .toHaveText("20");
        if (route !== "/quadrant") {
          await expect
            .soft(trmnlFrame.locator("div.fdp-month"))
            .toHaveText("Feb");
        }
      });
    }
  } finally {
    fs.writeFileSync(destFile, originalContent, "utf-8"); // Restore original content
  }
});

test("can see a compact flip date for a given date in French", async ({
  page,
}) => {
  const sourceFile = path.join(__dirname, "fr.trmnlp.yml");
  const destFile = path.join(__dirname, "..", ".trmnlp.yml");

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }

  if (!fs.existsSync(destFile)) {
    throw new Error(`Destination file not found: ${destFile}`);
  }

  const originalContent = fs.readFileSync(destFile, "utf-8"); // Save original content to restore later

  fs.copyFileSync(sourceFile, destFile);

  try {
    const routes = ["/quadrant", "/full", "/half_vertical", "/half_horizontal"];

    for (const route of routes) {
      await test.step(`Testing route: ${route}`, async () => {
        await page.goto(route);
        await page.getByRole("link", { name: "Poll" }).click();
        const trmnlFrame = page.frameLocator("iframe");

        await expect
          .soft(trmnlFrame.locator("div.fdp-dayofweek"))
          .toHaveText("Vendredi");
        await expect
          .soft(trmnlFrame.locator("div.fdp-number"))
          .toHaveText("20");
        await expect
          .soft(trmnlFrame.locator("div.fdp-month"))
          .toHaveText("Fév");
      });
    }
  } finally {
    fs.writeFileSync(destFile, originalContent, "utf-8"); // Restore original content
  }
});
