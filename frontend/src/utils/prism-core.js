import * as PrismModule from "prismjs";

const Prism = PrismModule.default || PrismModule;

if (typeof window !== "undefined") {
  // Explicitly set it on window to ensure it's available as a global variable
  // for prismjs language components.
  window.Prism = Prism;
}

export default Prism;
