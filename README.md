# ✨ V0 Playground ✨

A lightweight, interactive playground for rapidly testing and showcasing your React components with built-in Tailwind CSS support and live prop controls.

Perfect for prototyping components, sharing usage examples, or building your own version of tools like [v0.dev](https://v0.dev).

---

## ✅ Features

- ⚡️ Minimal setup, works out of the box with Tailwind
- 🎛️ Live-editable props using `useControls`
- 🧩 Fully typed, headless playground architecture
- 🌓 Dark mode compatible
- 🛠️ Easily themeable with Tailwind and tokens
- 🧪 Great for testing component variants in isolation

---

## 📦 Peer Dependencies

To use `@toriistudio/v0-playground`, you’ll need to install the following peer dependencies:

```bash
yarn add @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate lodash
```

Or automate it with:

```json
"scripts": {
  "install:peers": "npm install $(node -p \"Object.keys(require('./package.json').peerDependencies).join(' ')\")"
}
```

## 🚀 Installation

Install the package and its peer dependencies:

```bash
npm install @toriistudio/v0-playground
# or
yarn add @toriistudio/v0-playground
```

## 🧩 Tailwind Setup

Make sure your `tailwind.config.ts` includes the preset and relevant content paths:

```ts
import preset from "@toriistudio/v0-playground/preset";

export default {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@toriistudio/**/*.{js,ts,jsx,tsx}", // 👈 Required
  ],
};
```

## 🧪 Usage

Use `Playground` to wrap any component and control props with `useControls`:

```ts
import { Playground, useControls } from "@toriistudio/v0-playground";

function MyComponent() {
  const { label } = useControls({
    label: { type: "string", value: "Click me" },
  });

  return <button>{label}</button>;
}

export default function App() {
  return (
    <Playground>
      <MyComponent />
    </Playground>
  );
}
```

## 💡 Example Use Cases

- Build custom component sandboxes
- Share interactive component demos
- Prototype interfaces quickly with real data
- Debug and test variants visually

## 📄 License

MIT

## 🤝 Contributing

We welcome contributions!

If you'd like to improve the playground, add new features, or fix bugs:

1. **Fork** this repository
2. **Clone** your fork: `git clone https://github.com/your-username/v0-playground`
3. **Install** dependencies: `yarn` or `npm install`
4. Make your changes in a branch: `git checkout -b my-new-feature`
5. **Push** your branch and open a pull request

Before submitting a PR:

- Run `yarn build` to ensure everything compiles
- Make sure the playground runs without errors (`yalc push` or `npm link` for local testing)
- Keep the code style clean and consistent

We’re excited to see what you’ll build 🛠️✨
