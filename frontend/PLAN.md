# Tailwind CSS v3 → v4 Migration Plan

## Step 1: Install Packages
```bash
npm install tailwindcss@latest @tailwindcss/postcss@latest
```

## Step 2: Run Migration Tool
```bash
npx @tailwindcss/upgrade
```
This auto-converts:
- `@tailwind base/components/utilities` → `@import "tailwindcss"`
- Identifies deprecated classes
- Suggests config changes

## Step 3: Update Config Files

### postcss.config.js
```js
// Before: tailwindcss plugin
plugins: {
  tailwindcss: {},
  autoprefixer: {},
}

// After: @tailwindcss/postcss plugin
plugins: {
  '@tailwindcss/postcss': {},
  autoprefixer: {},
}
```

### globals.css
```css
/* Before */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* After */
@import "tailwindcss";
```

Add `@theme` block with custom colors/fonts:
```css
@theme {
  --color-verdigris-50: #edf7f6;
  --color-verdigris-100: #dbf0ed;
  --color-verdigris-200: #b7e1db;
  --color-verdigris-300: #93d2c8;
  --color-verdigris-400: #6fc3b6;
  --color-verdigris-500: #4bb4a4;
  --color-verdigris-600: #3c9083;
  --color-verdigris-700: #2d6c62;
  --color-verdigris-800: #1e4842;
  --color-verdigris-900: #0f2421;
  --color-verdigris-950: #0b1917;

  --font-family-sans: var(--font-body), sans-serif;
  --font-family-display: var(--font-display), sans-serif;
  --font-family-mono: var(--font-mono), monospace;
}
```

Migrate `@layer components` to `@utility`:
```css
/* Before */
@layer components {
  .panel { @apply ...; }
}

/* After */
@utility panel {
  @apply ...;
}
```

## Step 4: Delete Obsolete Files
```bash
rm tailwind.config.ts
```

## Step 5: Build & Validate
```bash
npx next build    # Full build
npx next lint     # ESLint check
npx tsc --noEmit  # TypeScript check
```
