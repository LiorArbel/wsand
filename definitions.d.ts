declare module '*.wgsl';

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
  }