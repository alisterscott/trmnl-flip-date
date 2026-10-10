# trmnl-flip-date

A retro inspired flip date clock, with internationalisation support. Built for the TRMNL device.

![screenshot](./media/screen.png)

![screenshot of screen in Korean](./media/screenshotko.png)

## Setup

1. `brew install rbenv`
2. `brew install firefox@nightly`
3. `brew install ImageMagick`
4. `rbenv init`
5. `rbenv local`
6. `bundler install`
7. `npm install`
8. `npx playwright install`
9. `APP_ENV=production trmnlp serve`

## Pushing changes to TRMNL

1. `trmnlp login`
2. `trmnlp push`

## Updating TRMNL

1. Update `gem 'trmnl_preview', '0.11.0'` in `Gemfile`
2. `bundler install`

## Running tests

1. `npx playwright test`

The compact quadrant test also renders the preview at 400×240 pixels (one quadrant of the 800×480 TRMNL OG) and saves `test-results/compact-quadrant-400x240.png` for visual comparison.
