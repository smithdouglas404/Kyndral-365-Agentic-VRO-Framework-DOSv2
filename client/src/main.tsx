import { createRoot } from "react-dom/client";

const root = document.getElementById("root")!;

root.innerHTML = '<h1 style="color:red;font-size:48px;padding:40px">RENDER TEST - If you see this, React works</h1>';

import("./App").then(({ default: App }) => {
  import("./index.css");
  createRoot(root).render(<App />);
}).catch((err) => {
  root.innerHTML = `<pre style="color:red;padding:40px;font-size:14px">MODULE LOAD ERROR:\n${err.message}\n${err.stack}</pre>`;
});
