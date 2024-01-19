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

setTimeout(async () => {
  const { element, renderFunc } = await comp();

  document.body.appendChild(element);

  const btn = document.createElement("button");
  btn.textContent = "next frame";
  btn.onclick = renderFunc;
  document.body.appendChild(btn);

  renderFunc();
}, 0);
