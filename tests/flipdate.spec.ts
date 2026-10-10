import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const previewSizes = [
  { width: 800, height: 480 },
  { width: 640, height: 384 },
  { width: 400, height: 240 },
];

async function expectTileFontsFit(page, trmnlFrame, size) {
  const preview = page.locator("iframe");
  await preview.evaluate((element, dimensions) => {
    if (!(element instanceof HTMLIFrameElement)) {
      throw new Error("Preview frame was not an iframe");
    }
    element.style.width = `${dimensions.width}px`;
    element.style.height = `${dimensions.height}px`;
    element.style.border = "0";
  }, size);

  await expect
    .poll(() =>
      trmnlFrame.locator(".fdp-tile").evaluateAll((tiles) => {
        const fitsAtCurrentSize = (tile) => {
          const styles = getComputedStyle(tile);
          const availableWidth =
            tile.clientWidth -
            parseFloat(styles.paddingLeft) -
            parseFloat(styles.paddingRight);
          const availableHeight =
            tile.clientHeight -
            parseFloat(styles.paddingTop) -
            parseFloat(styles.paddingBottom);
          const range = document.createRange();
          range.selectNodeContents(tile);
          const textBounds = range.getBoundingClientRect();
          return (
            textBounds.width <= availableWidth &&
            textBounds.height <= availableHeight
          );
        };

        return {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
          fits: tiles.length > 0 && tiles.every(fitsAtCurrentSize),
          maximized: tiles.every((tile) => {
            const size = parseFloat(getComputedStyle(tile).fontSize);
            tile.style.fontSize = `${size + 1}px`;
            const largerSizeFits = fitsAtCurrentSize(tile);
            tile.style.fontSize = `${size}px`;
            return !largerSizeFits;
          }),
        };
      }),
    )
    .toEqual({
      width: size.width,
      height: size.height,
      fits: true,
      maximized: true,
    });
}

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
        await page.locator("select.select-format").selectOption("html");
        await page.getByRole("link", { name: "Poll" }).click();
        const trmnlFrame = page.frameLocator("iframe");
        for (const size of previewSizes) {
          await expectTileFontsFit(page, trmnlFrame, size);
        }
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
        await page.locator("select.select-format").selectOption("html");
        await page.getByRole("link", { name: "Poll" }).click();
        const trmnlFrame = page.frameLocator("iframe");

        for (const size of previewSizes) {
          await expectTileFontsFit(page, trmnlFrame, size);
          if (route === "/quadrant" && size.width === 400) {
            await page.locator("iframe").screenshot({
              path: path.join(
                __dirname,
                "..",
                "test-results",
                "compact-quadrant-400x240.png",
              ),
            });
          }
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
