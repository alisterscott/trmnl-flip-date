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
        await page.getByRole("combobox").nth(2).selectOption({ label: "HTML" });
        await page.getByRole("link", { name: "Poll" }).click();
        const trmnlFrame = page.frameLocator("iframe");

        if (route === "/quadrant") {
          const weekday = trmnlFrame.locator(".fdp-dayofweek");
          const weekdayFontSize = () =>
            weekday.evaluate((element) => ({
              viewportWidth: element.ownerDocument.documentElement.clientWidth,
              fontSize: getComputedStyle(element).fontSize,
            }));
          const compactFontSize = (selector: string) =>
            trmnlFrame.locator(selector).evaluate((element) => ({
              viewportWidth: element.ownerDocument.documentElement.clientWidth,
              fontSize: getComputedStyle(element).fontSize,
            }));

          await expect.poll(weekdayFontSize).toEqual({
            viewportWidth: 800,
            fontSize: "104px",
          });
          await expect.poll(() => compactFontSize(".fdp-number")).toEqual({
            viewportWidth: 800,
            fontSize: "144px",
          });
          await expect.poll(() => compactFontSize(".fdp-month")).toEqual({
            viewportWidth: 800,
            fontSize: "144px",
          });

          await page.locator("iframe").evaluate((element) => {
            if (!(element instanceof HTMLIFrameElement)) {
              throw new Error("Preview frame was not an iframe");
            }
            element.style.width = "400px";
            element.style.height = "240px";
            element.style.border = "0";
          });

          await expect.poll(weekdayFontSize).toEqual({
            viewportWidth: 400,
            fontSize: "52px",
          });
          await expect.poll(() => compactFontSize(".fdp-number")).toEqual({
            viewportWidth: 400,
            fontSize: "72px",
          });
          await expect.poll(() => compactFontSize(".fdp-month")).toEqual({
            viewportWidth: 400,
            fontSize: "72px",
          });

          const weekdayTile = weekday;
          const textFitsTile = (text: string) =>
            weekdayTile.evaluate((element, content) => {
              const originalText = element.textContent;
              element.textContent = content;
              const textNode = element.firstChild;
              if (!textNode) {
                throw new Error("Weekday text was not rendered");
              }
              const range = element.ownerDocument.createRange();
              range.selectNodeContents(element);
              const textBounds = range.getBoundingClientRect();
              const tileBounds = element.getBoundingClientRect();
              element.textContent = originalText;
              return (
                textBounds.left >= tileBounds.left &&
                textBounds.right <= tileBounds.right &&
                textBounds.top >= tileBounds.top &&
                textBounds.bottom <= tileBounds.bottom
              );
            }, text);

          await expect.poll(() => textFitsTile("Quinta-feira")).toBe(true);

          await page
            .locator("iframe")
            .screenshot({
              path: path.join(
                __dirname,
                "..",
                "test-results",
                "compact-quadrant-400x240.png",
              ),
            });
        }

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
