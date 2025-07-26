# t3.chat clone

## Instructions

### Web

#### Install dependencies (requires [pnpm](https://pnpm.io/installation#using-other-package-managers))

```bash
pnpm --filter web install
```

#### Run

```bash
pnpm --filter web dev
```

### Mobile

#### Install dependencies (requires [pnpm](https://pnpm.io/installation#using-other-package-managers))

```bash
pnpm --filter mobile install
```

#### Run

```bash
pnpm --filter mobile dev
```

#### Build for iOS (requires [Xcode](https://developer.apple.com/xcode/))

```bash
pnpm --filter mobile build:ios
```

#### Build for Android (requires [Android SDK](https://developer.android.com/studio))

```bash
pnpm --filter mobile build:android
```
