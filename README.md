# Frequency-Based Training (FBT) 🏋️‍♂️

A mobile-first gym tracker designed around **muscle recovery frequencies** rather than fixed calendar days.

Instead of arbitrary "Monday is Chest Day", you define how often each muscle group should be trained (e.g. Chest every 4 days, Quads every 5 days, Side Delts every 3 days). The app keeps a running countdown and dynamically surfaces **overdue muscle groups** first so you always know what needs training.

---

## ✨ Features

- **Dynamic Recovery Countdowns**: Real-time tracking of days elapsed vs. target frequency for each muscle group.
- **Urgency Filtering**: Filter at a glance by **All**, **🚨 Overdue**, **Due Today**, and **Upcoming**.
- **1-Tap Quick Hit & Multi-Select Split Logger**:
  - Quick single-group reset button.
  - Multi-select modal with split presets (*Push, Pull, Legs, Upper, All Overdue*).
- **Customizable Muscle Groups**: Add, edit target frequencies, or delete muscle groups on the fly.
- **Workout History**: Timestamped log of past training sessions with muscle tags and notes.
- **Dual Storage Mode**:
  - **Instant Local Mode**: Works immediately offline via browser storage with zero setup.
  - **Firebase & Google One Tap Sync**: Log in with Google to synchronize your workouts to Cloud Firestore across all devices.

---

## 🛠️ Tech Stack

- **Toolchain**: [Vite](https://vite.dev) + [VoidZero](https://voidzero.dev) ecosystem ([Oxlint](https://oxc.rs), [Vitest](https://vitest.dev))
- **Frontend**: React 19 + TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (mobile-first, dark gym aesthetic)
- **Icons**: [Lucide React](https://lucide.dev)
- **Backend / Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore) + [Firebase Auth](https://firebase.google.com/docs/auth)
- **Authentication**: Google One Tap + Google Sign-In (with LocalStorage fallback)

---

## 🚀 Quickstart

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run linting & unit tests
```bash
npm run lint   # Fast Oxlint check
npm test       # Vitest unit test suite
```

### 4. Build for production
```bash
npm run build
```

---

## 🔑 Firebase & Google One Tap Setup (Optional)

To enable cross-device cloud sync and Google login:

1. Create a free project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** (Google provider) and create a **Cloud Firestore** database.
3. Apply the security rules from [`firestore.rules`](./firestore.rules).
4. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Fill in your Firebase API keys and Google Client ID.

---

## 🌐 Free Deployment (Vercel)

1. Push to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and import `frequency-based-training`.
3. Add any environment variables from `.env.local`.
4. Deploy! Any future commits to `main` will automatically build and deploy.
