const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'cursor-scrub-video.js'), 'utf8');

class MockElement {
  constructor(name) {
    this.name=name; this.dataset={}; this.attributes={}; this.children=[]; this.listeners={};
    this.style={opacity:'',display:'',setProperty:(key,value)=>{this.style[key]=value;}};
    this.duration=10; this.currentTime=0; this.paused=true; this.readyState=0;
  }
  addEventListener(type,fn){(this.listeners[type] ||= []).push(fn)}
  removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(item=>item!==fn)}
  emit(type,event={}){for(const fn of this.listeners[type]||[]) fn(event)}
  setAttribute(name,value){this.attributes[name]=String(value)}
  getAttribute(name){return this.attributes[name] ?? null}
  hasAttribute(name){return name in this.attributes}
  removeAttribute(name){delete this.attributes[name]}
  replaceChildren(...children){this.children=children}
  getBoundingClientRect(){return {left:10,top:20,width:100,height:200}}
  load(){this.loadCount=(this.loadCount||0)+1}
  play(){this.paused=false;return Promise.reject(new Error('autoplay blocked'))}
  pause(){this.paused=true}
}

function createHarness(options={}) {
  const rafs=new Map(); let nextRaf=1;
  const root=new MockElement('root');
  const win=new MockElement('window'); win.innerWidth=800; win.innerHeight=600;
  win.setTimeout=setTimeout; win.clearTimeout=clearTimeout;
  const doc=new MockElement('document'); doc.hidden=false; doc.readyState='complete'; doc.baseURI='https://portfolio.test/';
  doc.createElement=tag=>new MockElement(tag);
  doc.querySelectorAll=()=>[];
  const mediaQuery=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  const context={
    document:doc,window:win,matchMedia:mediaQuery,Blob,URL,location:{hostname:'portfolio.test',search:''},
    console:{warn(){}},setTimeout,clearTimeout,
    requestAnimationFrame:fn=>{const id=nextRaf++;rafs.set(id,fn);return id;},
    cancelAnimationFrame:id=>rafs.delete(id)
  };
  vm.runInNewContext(source,context);
  const instance=new win.CursorScrubVideo(root,options);
  return {
    root,win,doc,instance,rafs,
    flushRaf(){const [id,fn]=rafs.entries().next().value||[];if(fn){rafs.delete(id);fn(0)}},
  };
}

test('component tracking uses local coordinates, vertical axis, reverse and clamping',()=>{
  const h=createHarness({videoFile:'test.mp4',trackingArea:'component',axis:'vertical',reverse:true});
  h.instance.ready=true;
  h.root.emit('pointermove',{clientX:30,clientY:70});
  assert.equal(h.instance.targetTime,7.5); // y=50 of a 200px region, reversed.
  h.root.emit('pointermove',{clientX:30,clientY:500});
  assert.equal(h.instance.targetTime,0);
  h.instance.destroy();
});

test('window tracking normalizes horizontal and vertical cursor positions',()=>{
  const h=createHarness({videoFile:'test.mp4',trackingArea:'window',axis:'horizontal'});
  h.instance.ready=true;
  h.win.emit('pointermove',{clientX:200,clientY:300});
  assert.equal(h.instance.targetTime,2.5);
  h.instance.update({axis:'vertical'});
  h.win.emit('pointermove',{clientX:200,clientY:300});
  assert.equal(h.instance.targetTime,5);
  h.instance.destroy();
});

test('reverse maps the opposite endpoint and smoothing seeks incrementally',()=>{
  const h=createHarness({videoFile:'test.mp4',trackingArea:'component',axis:'horizontal',reverse:true,smoothing:.5});
  h.instance.ready=true;
  h.instance.video.duration=10;
  h.root.emit('pointermove',{clientX:10,clientY:20});
  assert.equal(h.instance.targetTime,10);
  h.flushRaf();
  assert.equal(h.instance.video.currentTime,5);
  h.instance.destroy();
  assert.equal(h.rafs.size,0);
});

test('empty source keeps an explicit fallback state and releases listeners on destroy',()=>{
  const h=createHarness({trackingArea:'window'});
  assert.equal(h.root.dataset.scrubState,'empty');
  assert.equal(h.root.children[2].textContent,'Add a video file');
  assert.equal((h.win.listeners.pointermove||[]).length,0);
  h.instance.destroy();
  assert.equal(h.root.dataset.scrubState,'destroyed');
});
