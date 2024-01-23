const LOGGING_MOUSE = false;

const mouse = {
  x: 0,
  y: 0,
  rightClick: false,
  leftClick: false,
};

window.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  logMouse();
});

window.addEventListener("mousedown", (e) => {
    if(e.button == 2){
        mouse.rightClick = true;
    } else {
        mouse.leftClick = true;
    }
    logMouse("mouse down");
});

window.addEventListener("contextmenu", (e) => {
    // mouse.rightClick = true;
    e.preventDefault();
    logMouse("context");
});

window.addEventListener("mouseup", (e) => {
    mouse.leftClick = false;
    mouse.rightClick = false;
    logMouse("mouse up")
});

function logMouse(e = ""){
    if(!LOGGING_MOUSE){
        return;
    }
    console.log(e, mouse);
}

export function getMouse() {
  return mouse;
}
