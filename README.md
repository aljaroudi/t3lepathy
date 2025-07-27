# t3.chat clone

## Web

### Stack

- [Svelte](https://github.com/sveltejs/svelte)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) ([shadcn/ui](https://github.com/shadcn-ui/ui) for Svelte)

### Install dependencies (requires [pnpm](https://pnpm.io/installation#using-other-package-managers))

```bash
pnpm --filter web install
```

### Run

```bash
pnpm --filter web dev
```

## Mobile

### Stack

- [React Native](https://github.com/facebook/react-native) + [Expo](https://expo.dev/)
- [NativeWind](https://github.com/nativewind/nativewind) ([Tailwind CSS](https://tailwindcss.com/) for RN)
- [React Native Reusables](https://github.com/mrzachnugent/react-native-reusables) ([shadcn/ui](https://github.com/shadcn-ui/ui) for RN)

### Install dependencies (requires [pnpm](https://pnpm.io/installation#using-other-package-managers))

```bash
pnpm --filter mobile install
```

### Run

```bash
pnpm --filter mobile dev
```

### Build for iOS (requires [Xcode](https://developer.apple.com/xcode/))

```bash
pnpm --filter mobile build:ios
```

### Build for Android (requires [Android SDK](https://developer.android.com/studio))

```bash
pnpm --filter mobile build:android
```
