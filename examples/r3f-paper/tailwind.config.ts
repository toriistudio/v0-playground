import preset from "@toriistudio/v0-playground/preset";

export default {
  presets: [preset],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../src/**/*.{ts,tsx}",
    "../../dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@toriistudio/**/*.{js,ts,jsx,tsx}",
  ],
};
