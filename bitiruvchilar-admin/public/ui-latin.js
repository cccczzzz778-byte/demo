'use strict';
(()=>{
  const hasCyr=/[А-Яа-яЁёЎўҚқҒғҲҳ]/;
  const map={
    'А':'A','а':'a','Б':'B','б':'b','В':'V','в':'v','Г':'G','г':'g','Д':'D','д':'d',
    'Е':'E','е':'e','Ё':'Yo','ё':'yo','Ж':'J','ж':'j','З':'Z','з':'z','И':'I','и':'i',
    'Й':'Y','й':'y','К':'K','к':'k','Л':'L','л':'l','М':'M','м':'m','Н':'N','н':'n',
    'О':'O','о':'o','П':'P','п':'p','Р':'R','р':'r','С':'S','с':'s','Т':'T','т':'t',
    'У':'U','у':'u','Ф':'F','ф':'f','Х':'X','х':'x','Ц':'Ts','ц':'ts','Ч':'Ch','ч':'ch',
    'Ш':'Sh','ш':'sh','Щ':'Shch','щ':'shch','Ъ':'’','ъ':'’','Ы':'Y','ы':'y','Ь':'','ь':'',
    'Э':'E','э':'e','Ю':'Yu','ю':'yu','Я':'Ya','я':'ya','Ў':'O‘','ў':'o‘','Қ':'Q','қ':'q',
    'Ғ':'G‘','ғ':'g‘','Ҳ':'H','ҳ':'h'
  };
  function toLatin(value){
    const s=String(value??'');
    if(!hasCyr.test(s))return s;
    let out='';
    for(const ch of s)out+=Object.prototype.hasOwnProperty.call(map,ch)?map[ch]:ch;
    return out;
  }
  window.toLatinUz=toLatin;
  const skip=new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA']);
  function textNode(node){
    if(!node||node.nodeType!==Node.TEXT_NODE||!node.parentElement||skip.has(node.parentElement.tagName))return;
    const next=toLatin(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;
  }
  function attrs(el){
    if(!el||el.nodeType!==Node.ELEMENT_NODE)return;
    for(const name of ['placeholder','title','aria-label','alt']){
      if(!el.hasAttribute(name))continue;
      const old=el.getAttribute(name),next=toLatin(old);if(next!==old)el.setAttribute(name,next);
    }
  }
  function scan(root){
    if(!root)return;
    if(root.nodeType===Node.TEXT_NODE){textNode(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
    if(root.nodeType===Node.ELEMENT_NODE)attrs(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    let n;while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)textNode(n);else attrs(n)}
  }
  function addOption(select,value,label=value){
    if(!select||[...select.options].some(o=>o.value===value))return;
    const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);
  }
  function validateAdminGraduateForm(){
    const pinfl=document.getElementById('e-pinfl');
    if(pinfl&&pinfl.value.trim()){
      const digits=pinfl.value.replace(/\D/g,'');
      if(digits.length!==14)return'JSHSHIR 14 ta raqamdan iborat bo‘lishi kerak.';
      pinfl.value=digits;
    }
    for(const id of ['e-amb','e-inp','e-oper','e-wd','e-wr','e-wrep']){
      const input=document.getElementById(id);if(!input||input.value==='')continue;
      if(input.value!=='0'&&input.value!=='1')return`${input.previousElementSibling?.textContent||id} faqat 0 yoki 1 bo‘lishi kerak.`;
    }
    const dateRe=/^(?:\d{4}-\d{2}-\d{2}|\d{2}[./-]\d{2}[./-]\d{4})$/;
    for(const id of ['e-birth','e-orderdate','e-examdate']){
      const input=document.getElementById(id);if(input&&input.value.trim()&&!dateRe.test(input.value.trim()))return`${input.previousElementSibling?.textContent||'Sana'} noto‘g‘ri formatda.`;
    }
    return'';
  }
  function setupAdminEditor(){
    const tbody=document.getElementById('tb'),save=document.getElementById('save');
    if(!tbody||!save)return;
    addOption(document.getElementById('employment'),'D nazoratda turgan');
    addOption(document.getElementById('e-emp'),'D nazoratda turgan');
    const table=tbody.closest('table'),head=table?.querySelector('thead tr');
    if(head&&!head.querySelector('[data-edit-col]')){const th=document.createElement('th');th.setAttribute('data-edit-col','1');th.textContent='Tahrirlash';head.append(th)}
    const enhanceRows=()=>{
      for(const tr of tbody.querySelectorAll('tr[data-id]')){
        if(tr.querySelector('[data-edit-id]'))continue;
        const td=document.createElement('td'),button=document.createElement('button');
        button.type='button';button.className='btn';button.textContent='Tahrirlash';button.setAttribute('data-edit-id',tr.dataset.id||'');
        button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();tr.click()});
        td.append(button);tr.append(td);
      }
    };
    enhanceRows();
    new MutationObserver(enhanceRows).observe(tbody,{childList:true});
    save.addEventListener('click',event=>{
      const error=validateAdminGraduateForm();
      if(!error)return;
      event.preventDefault();event.stopImmediatePropagation();alert(error);
    },true);
  }
  function start(){
    document.documentElement.lang='uz-Latn';
    document.title=toLatin(document.title);
    scan(document.body);
    setupAdminEditor();
    const observer=new MutationObserver(list=>{
      for(const m of list){
        if(m.type==='characterData')textNode(m.target);
        else if(m.type==='attributes')attrs(m.target);
        else for(const n of m.addedNodes)scan(n);
      }
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
