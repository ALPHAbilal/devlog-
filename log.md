  let el = document.querySelector('.truncate');
  let chain = [];
  while (el && el !== document.body) {
    const w = el.getBoundingClientRect().width;
    chain.push(w.toFixed(0) + 'px - ' + (el.className?.slice(0,40) || el.tagName));
    el = el.parentElement;
  }
  chain.forEach(c => console.log(c));
index-DZ6sHkHP.js:26 229px - flex-1 min-w-0 truncate transition-all d
index-DZ6sHkHP.js:26 329px - 
          w-full min-w-0 overflow-hidde
index-DZ6sHkHP.js:26 329px - w-full min-w-0 overflow-hidden group
index-DZ6sHkHP.js:26 353px - w-full min-w-0 overflow-hidden pl-2 pr-4
index-DZ6sHkHP.js:26 353px - w-full min-w-0 overflow-hidden py-2
index-DZ6sHkHP.js:26 353px - DIV
index-DZ6sHkHP.js:26 278px - h-full w-full max-w-full rounded-[inheri
index-DZ6sHkHP.js:26 278px - relative overflow-hidden flex-1
index-DZ6sHkHP.js:26 278px - flex flex-col h-full min-w-0
index-DZ6sHkHP.js:26 279px - overflow-hidden bg-[#0d0d0d] border-r bo
index-DZ6sHkHP.js:26 328px - h-full flex bg-[#0a0a0a] border-r border
index-DZ6sHkHP.js:26 1844px - flex-1 min-h-0 flex overflow-hidden
index-DZ6sHkHP.js:26 1844px - h-screen flex flex-col overflow-hidden b
index-DZ6sHkHP.js:26 1844px - flex-1 min-h-0 overflow-hidden pb-16 md:
index-DZ6sHkHP.js:26 1844px - h-full bg-dark-primary flex flex-col
index-DZ6sHkHP.js:26 1844px - DIV
undefined