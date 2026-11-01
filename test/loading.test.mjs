import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const text=path=>readFile(new URL(path,root),'utf8');
const [css,fx,i18n]=await Promise.all(['css/site.css','js/fx.js','js/i18n.js'].map(text));

test('all pages use local font resources and refreshed shared styles',async()=>{
  let checked=0;
  for(const dir of ['', 'apps/', 'projects/', 'admin/']){
    for(const name of await readdir(new URL(dir,root))){
      if(!name.endsWith('.html'))continue;
      const page=await text(dir+name);
      assert.doesNotMatch(page,/fonts\.(?:googleapis|gstatic)\.com/,dir+name);
      if(page.includes('css/site.css'))assert.match(page,/css\/site\.css\?v=20261101a/,dir+name);
      checked++;
    }
  }
  assert.ok(checked>=28);
  assert.match(css,/font-display:\s*swap/);
  assert.match(css,/\.\.\/assets\/fonts\/Vazirmatn-variable\.woff2/);
  const font=await readFile(new URL('assets/fonts/Vazirmatn-variable.woff2',root));
  assert.equal(font.subarray(0,4).toString(),'wOF2');
  assert.match(await text('assets/fonts/Vazirmatn-OFL.txt'),/SIL OPEN FONT LICENSE/);
});

test('homepage scripts download without blocking parsing and retain dependency order',async()=>{
  const page=await text('index.html');
  const scripts=[...page.matchAll(/<script([^>]+)src="([^"]+)"/g)];
  assert.equal(scripts.length,9);
  scripts.forEach(([,attrs])=>assert.match(attrs,/\bdefer\b/));
  const paths=scripts.map(([, ,src])=>src.split('?')[0]);
  assert.ok(paths.indexOf('js/i18n.js')<paths.indexOf('js/layout.js'));
  assert.ok(paths.indexOf('js/fx.js')<paths.indexOf('js/main.js'));
  assert.ok(paths.indexOf('js/terminal.js')<paths.indexOf('js/main.js'));
});

test('content remains visible even when optional JavaScript never loads',()=>{
  const rule=css.match(/\.reveal\s*\{([^}]+)\}/)[1];
  assert.match(rule,/opacity:\s*1\b/);
  assert.match(rule,/transform:\s*none/);
  assert.match(css,/\.reveal,\s*\.reveal\.in\s*\{[^}]*animation:\s*none/);
});

function effectsContext({reduced=false,observer}={}){
  const classes=new Set();
  const element={classList:{add:name=>classes.add(name)},querySelectorAll:()=>[]};
  const document={
    querySelectorAll:selector=>selector==='.reveal:not(.in)'&&!classes.has('in')?[element]:[],
    getElementById:()=>null,addEventListener(){}
  };
  const context=vm.createContext({window:{matchMedia:()=>({matches:reduced})},document,...(observer?{IntersectionObserver:observer}:{})});
  vm.runInContext(fx,context);
  return {context,classes,element};
}
test('shared effects initialize independently and reveal content without IntersectionObserver',()=>{
  assert.equal(effectsContext().classes.has('in'),true);
  const NeverConstruct=class{constructor(){throw Error('Reduced motion must not use scroll animation');}};
  assert.equal(effectsContext({reduced:true,observer:NeverConstruct}).classes.has('in'),true);
});
test('scroll reveals share one observer when pages initialize again',()=>{
  let instances=0,callback,unobserved=0;
  class Observer{constructor(fn){instances++;callback=fn;}observe(){}unobserve(){unobserved++;}}
  const {context,classes,element}=effectsContext({observer:Observer});
  vm.runInContext('observeReveals(); observeReveals();',context);
  assert.equal(instances,1);
  callback([{isIntersecting:true,target:element}]);
  assert.equal(classes.has('in'),true);
  assert.equal(unobserved,1);
});

function translate(raw){
  let value=raw,writes=0,callback;
  const parent={closest:()=>null};
  const node={nodeType:3,parentElement:parent,get nodeValue(){return value;},set nodeValue(next){writes++;value=next;}};
  const body={nodeType:1,closest:()=>null,getAttribute:()=>null,childNodes:[node]};
  const context=vm.createContext({
    window:{},localStorage:{getItem:()=> 'fa'},
    document:{body,title:'Waish',documentElement:{classList:{add(){}}},addEventListener(){}},
    MutationObserver:class{constructor(fn){callback=fn;}observe(){}}
  });
  vm.runInContext(i18n,context);
  callback([{type:'characterData',target:node,addedNodes:[]}]);
  return {value,writes};
}
test('Persian identity translations do not keep triggering their own observer',()=>{
  for(const value of ['EN','(','waish@computer']){
    assert.deepEqual(translate(value),{value,writes:0});
  }
  const translated=translate('Computer');
  assert.equal(translated.value,'کامپیوتر');
  assert.equal(translated.writes,1);
});
