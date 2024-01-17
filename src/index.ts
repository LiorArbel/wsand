import { createRenderer } from "./renderer";

async function comp() {
  const canvas = document.createElement("canvas");
  canvas.height = 512;
  canvas.width = 512;
  const renderFunc = await createRenderer(canvas);
  const element = document.createElement("div");

  element.innerHTML = ["Hello", "typescript"].join(" ");
  element.appendChild(canvas);

  return { renderFunc, element };
}

(async () => {
  const { element, renderFunc } = await comp();

  document.body.appendChild(element);

  renderFunc();
})();
