# Rent mobile app (React Native / Expo)

API URL: `http://187.127.177.233:5000`

Website PC par `npm run dev` chalao — yeh `0.0.0.0:5000` pe listen karta hai taaki phone us IP se API hit kar sake. Windows Firewall mein port **5000** allow karo.

## Phone pe chalane ke 2 tarike

### 1) Jaldi test (Expo Go) — Play Store / App Store se Expo Go install

PC:

```bash
cd mobile
npx expo start
```

Phone aur PC same Wi‑Fi par hon, QR scan karo (Android: Expo Go, iOS: Camera).  
Alag network ho (4G) to Expo tunnel:

```bash
npx expo start --tunnel
```

API phir bhi `http://187.127.177.233:5000` pe hi jayegi.

### 2) APK export (Android, bina Expo Go)

Expo account chahiye ([expo.dev](https://expo.dev)):

```bash
cd mobile
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Build complete hone ke baad download link milega — APK phone pe install karo (Unknown sources allow).

Play Store ke liye baad mein `--profile production` (AAB) use karo.

iOS App Store / TestFlight ke liye Apple Developer account + `npx eas-cli build --platform ios` chahiye.

USB se local Android build (Android Studio / SDK installed):

```bash
cd mobile
npx expo run:android
```
