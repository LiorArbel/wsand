export class Keyboard{
    keysPressed: Record<string, boolean> = {};

    cleanup = () => {};
    constructor(el: HTMLElement){
        el.addEventListener("keydown", this.onKeydown.bind(this));
            
        el.addEventListener("keyup", this.onKeyup.bind(this));

        this.cleanup = () => {
            el.removeEventListener("keydown", this.onKeydown)
            el.removeEventListener("keyup", this.onKeyup)
        }
    }

    isDown(key: string){
        return this.keysPressed[key];
    }
    private onKeydown(e: KeyboardEvent){
        console.log("keydown");
        this.keysPressed["alt"] = e.altKey;
        this.keysPressed[e.key] = true
    }

    private onKeyup(e: KeyboardEvent){
        if(!e.altKey){
            this.keysPressed["alt"] = false;    
        }
        this.keysPressed[e.key] = false
    }

    destroy(){
        this.cleanup();
    }
}