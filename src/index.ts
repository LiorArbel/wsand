function component() : HTMLDivElement {
    const element = document.createElement('div');
  
    element.innerHTML = ['Hello', 'typescript'].join(' ');
  
    return element;
  }
  
  document.body.appendChild(component());