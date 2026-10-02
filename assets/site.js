/* La langue au Chat — comportements. Vanilla JS, aucune dépendance, fonctionne en file://. */
(function(){
  'use strict';
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var root=document.documentElement;
  var store={
    get:function(k,def){try{var v=localStorage.getItem(k);return v==null?def:JSON.parse(v)}catch(e){return def}},
    set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  };
  var reduceMotion=function(){return root.getAttribute('data-motion')==='off'||window.matchMedia('(prefers-reduced-motion: reduce)').matches};

  /* ---- annonces / toast ---- */
  var toast=document.createElement('div');
  toast.className='toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
  document.body.appendChild(toast);
  var tt;
  function say(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('show')},2200)}

  /* ---- menu mobile + menu « La visite » ---- */
  var burger=$('.burger'),nav=$('#nav');
  if(burger&&nav){
    burger.addEventListener('click',function(){
      var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o);
      document.body.style.overflow=o?'hidden':'';
    });
    nav.addEventListener('click',function(e){ if(e.target.closest('a')){nav.classList.remove('open');burger.setAttribute('aria-expanded','false');document.body.style.overflow=''} });
  }
  var menu=$('details.menu');
  if(menu){
    document.addEventListener('click',function(e){ if(menu.open&&!menu.contains(e.target)) menu.open=false });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ if(menu.open){menu.open=false;$('summary',menu).focus()} if(nav&&nav.classList.contains('open')){nav.classList.remove('open');burger.setAttribute('aria-expanded','false');document.body.style.overflow='';burger.focus()} } });
  }

  /* ---- réglages d'accessibilité ---- */
  var prefs=store.get('llc-prefs',{});
  function applyPref(k,v){
    if(v==null||v==='auto'||v==='0'&&(k==='text'||k==='spacing')){root.removeAttribute('data-'+k)}
    else root.setAttribute('data-'+k,v);
    prefs[k]=v;store.set('llc-prefs',prefs);
  }
  var adlg=$('#a11y');
  $$('[data-open-a11y]').forEach(function(b){b.addEventListener('click',function(){
    $$('input[type=radio]',adlg).forEach(function(r){ var cur=prefs[r.name]; if(cur==null) cur='auto'; if(r.name==='text'||r.name==='spacing'){ cur=cur==='auto'?'0':cur } r.checked=(String(cur)===r.value) });
    adlg.showModal();
  })});
  if(adlg){
    adlg.addEventListener('change',function(e){ var t=e.target; if(t.type==='radio'){ applyPref(t.name,t.value) } });
    $$('[data-close]',adlg).forEach(function(b){b.addEventListener('click',function(){adlg.close()})});
    var rst=$('[data-reset]',adlg);
    if(rst) rst.addEventListener('click',function(){ prefs={};store.set('llc-prefs',prefs);['theme','text','spacing','motion','contrast','decor'].forEach(function(k){root.removeAttribute('data-'+k)}); $$('input[type=radio]',adlg).forEach(function(r){r.checked=(r.value==='auto'||r.value==='0')}); });
    adlg.addEventListener('click',function(e){ if(e.target===adlg) adlg.close() });
  }
  var tq=$('[data-toggle-theme]');
  if(tq) tq.addEventListener('click',function(){
    var cur=root.getAttribute('data-theme');
    if(!cur) cur=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    applyPref('theme',cur==='dark'?'light':'dark');
  });

  /* ---- barre de progression + sommaire (scrollspy) ---- */
  var bar=$('.progress span');
  if(bar){
    var tick=false;
    var upd=function(){var h=document.documentElement;var m=h.scrollHeight-h.clientHeight;bar.style.width=(m>0?Math.min(100,h.scrollTop/m*100):0)+'%';tick=false};
    window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});upd();
  }
  var tocD=$('.toc details');if(tocD&&window.matchMedia&&matchMedia('(max-width:1020px)').matches)tocD.removeAttribute('open');
  var tocLinks=$$('.toc a[href^="#"]');
  if(tocLinks.length&&'IntersectionObserver' in window){
    var map={};tocLinks.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
    var targets=Object.keys(map).map(function(id){return document.getElementById(id)}).filter(Boolean);
    var vis={};
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){vis[e.target.id]=e.isIntersecting});
      var first=targets.filter(function(t){return vis[t.id]})[0];
      if(first){tocLinks.forEach(function(a){a.removeAttribute('aria-current')});map[first.id].setAttribute('aria-current','true')}
    },{rootMargin:'-15% 0px -65% 0px'});
    targets.forEach(function(t){io.observe(t)});
  }

  /* ---- apparitions douces ---- */
  var rv=$$('.reveal');
  if(rv.length){
    if(!('IntersectionObserver' in window)||reduceMotion()){rv.forEach(function(e){e.classList.add('in')})}
    else{
      var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io2.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
      rv.forEach(function(e){io2.observe(e)});
      setTimeout(function(){rv.forEach(function(e){e.classList.add('in')})},2500);
    }
  }

  /* ---- onglets (Ce qu'on observe / Limites / Nos pistes) ---- */
  $$('.reflect').forEach(function(rf){
    var tabs=$$('[role=tab]',rf),panels=$$('[role=tabpanel]',rf);
    function sel(t,focus){
      tabs.forEach(function(x,i){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;panels[i].hidden=!on});
      if(focus)t.focus();
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){sel(t)});
      t.addEventListener('keydown',function(e){
        var k=e.key,n=tabs.length,j=null;
        if(k==='ArrowRight')j=(i+1)%n;else if(k==='ArrowLeft')j=(i+n-1)%n;else if(k==='Home')j=0;else if(k==='End')j=n-1;
        if(j!=null){e.preventDefault();sel(tabs[j],true)}
      });
    });
    rf._sel=sel;rf._tabs=tabs;rf._panels=panels;
  });
  function openHash(){
    var id=decodeURIComponent(location.hash.slice(1));if(!id)return;
    var el=document.getElementById(id);if(!el)return;
    var p=el.closest('[role=tabpanel]');
    if(p){var rf=p.closest('.reflect');var i=rf._panels.indexOf(p);if(i>-1)rf._sel(rf._tabs[i])}
    else if(el.matches('[role=tabpanel]')){var rf2=el.closest('.reflect');var j=rf2._panels.indexOf(el);rf2._sel(rf2._tabs[j])}
  }
  window.addEventListener('hashchange',openHash);openHash();
  /* les liens « ancre » du sommaire vers un onglet l'ouvrent */
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href^="#"]');if(!a)return;
    var id=decodeURIComponent(a.getAttribute('href').slice(1));var el=document.getElementById(id);
    if(el&&(el.matches('[role=tabpanel]')||el.closest('[role=tabpanel]'))){setTimeout(openHash,0)}
  });

  /* ---- copier ---- */
  function copyText(txt){
    if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(txt)}
    return new Promise(function(res,rej){
      var ta=document.createElement('textarea');ta.value=txt;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy')?res():rej()}catch(e){rej(e)}ta.remove();
    });
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-copy]');if(!b)return;
    var txt;
    var sel=b.getAttribute('data-copy');
    if(sel==='text'){txt=b.getAttribute('data-text')}
    else{var src=document.getElementById(sel);txt=src?src.innerText.trim():''}
    copyText(txt).then(function(){say(b.getAttribute('data-ok')||'Copié !')},function(){say('Copie impossible : sélectionnez le texte à la main.')});
  });

  /* ---- QR en fenêtre ---- */
  var qd=$('#qrdlg');
  if(qd){
    var qimg=$('img',qd),qt=$('.qr-title',qd),qu=$('.url',qd),qo=$('.qr-open',qd),qc=$('.qr-copy',qd),cur='';
    document.addEventListener('click',function(e){
      var b=e.target.closest('[data-qr]');if(!b)return;
      cur=b.getAttribute('data-url');
      qimg.src=b.getAttribute('data-qr');qimg.alt='QR code : '+(b.getAttribute('data-title')||cur);
      qt.textContent=b.getAttribute('data-title')||'';
      qu.textContent=cur;qo.href=cur;
      qd.showModal();
    });
    $$('[data-close]',qd).forEach(function(b){b.addEventListener('click',function(){qd.close()})});
    qd.addEventListener('click',function(e){ if(e.target===qd) qd.close() });
    qc.addEventListener('click',function(){copyText(cur).then(function(){say('Lien copié !')},function(){say('Copie impossible.')})});
  }

  /* ---- passeport : stations visitées et défis relevés ---- */
  var visited=store.get('llc-visited',[]);
  var sn=document.body.getAttribute('data-station');
  if(sn&&visited.indexOf(sn)<0){visited.push(sn);store.set('llc-visited',visited)}
  var defis=store.get('llc-defis',{});
  $$('.cta[data-id]').forEach(function(c){
    var id=c.getAttribute('data-id'),cb=$('input[type=checkbox]',c);
    if(!cb)return;
    function paint(){c.classList.toggle('done',!!defis[id])}
    cb.checked=!!defis[id];paint();
    cb.addEventListener('change',function(){ if(cb.checked)defis[id]=1;else delete defis[id]; store.set('llc-defis',defis);paint(); if(cb.checked)say('Tampon posé !') });
  });
  $$('.st-card[data-n]').forEach(function(c){ if(visited.indexOf(c.getAttribute('data-n'))>-1)c.classList.add('done') });
  var pb=$('.passport');
  if(pb){
    var n=0;$$('.st-card[data-n]').forEach(function(c){if(c.classList.contains('done'))n++});
    var tot=$$('.st-card[data-n]').length||7;
    var i=$('.bar i',pb);if(i)i.style.width=(n/tot*100)+'%';
    var o=$('.pp-count',pb);if(o)o.textContent=n+' / '+tot;
    var dn=$('.pp-defis',pb);if(dn)dn.textContent=Object.keys(defis).length;
  }

  /* ---- explorateur AIAS ---- */
  var lad=$('.ladder');
  if(lad){
    var panels=$$('.lv-panel',lad),list=document.createElement('div');
    list.className='lv-tabs';list.setAttribute('role','tablist');list.setAttribute('aria-label','Niveaux de l’échelle');
    var tabs=panels.map(function(p,i){
      var b=document.createElement('button');b.type='button';b.className='lv-tab lv-'+(i+1);b.setAttribute('role','tab');
      b.id='lvt'+(i+1);b.setAttribute('aria-controls',p.id);b.textContent=i+1;
      b.setAttribute('aria-label',p.getAttribute('data-label'));
      if(p.hasAttribute('data-focus'))b.setAttribute('data-focus','');
      p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);p.tabIndex=0;
      list.appendChild(b);return b;
    });
    lad.insertBefore(list,panels[0]);
    function pick(i,f){tabs.forEach(function(t,j){var on=i===j;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;panels[j].hidden=!on});if(f)tabs[i].focus()}
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){pick(i)});
      t.addEventListener('keydown',function(e){var k=e.key,j=null,n=tabs.length;
        if(k==='ArrowRight'||k==='ArrowDown')j=(i+1)%n;else if(k==='ArrowLeft'||k==='ArrowUp')j=(i+n-1)%n;else if(k==='Home')j=0;else if(k==='End')j=n-1;
        if(j!=null){e.preventDefault();pick(j,true)}});
    });
    var start=0;panels.forEach(function(p,i){if(p.hasAttribute('data-focus'))start=i});
    pick(start);
    lad.classList.add('ready');
  }

  /* ---- catalogue : recherche + filtres ---- */
  var cg=$('#cat-grid');
  if(cg){
    var items=$$('.cat-item',cg),q=$('#q'),cnt=$('#count'),empty=$('.empty');
    var forms=$('#filters');
    function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
    items.forEach(function(it){it._t=norm(it.getAttribute('data-text'))});
    function checked(name){return $$('input[name='+name+']:checked',forms).map(function(i){return i.value})}
    function run(){
      var st=checked('st'),lv=checked('lv'),ty=checked('ty'),terms=norm(q.value).split(/\s+/).filter(Boolean);
      var n=0;
      items.forEach(function(it){
        var ok=true;
        if(st.length&&st.indexOf(it.getAttribute('data-st'))<0)ok=false;
        if(ok&&ty.length&&ty.indexOf(it.getAttribute('data-ty'))<0)ok=false;
        if(ok&&lv.length){var l=(it.getAttribute('data-lv')||'').split(' ');ok=lv.some(function(x){return l.indexOf(x)>-1})}
        if(ok&&terms.length)ok=terms.every(function(t){return it._t.indexOf(t)>-1});
        it.hidden=!ok;if(ok)n++;
      });
      cnt.textContent=n+(n>1?' résultats':' résultat');
      empty.style.display=n?'none':'block';
      try{
        var p=new URLSearchParams();
        if(q.value)p.set('q',q.value);
        [['st',st],['lv',lv],['ty',ty]].forEach(function(x){if(x[1].length)p.set(x[0],x[1].join(','))});
        history.replaceState(null,'',p.toString()?'?'+p.toString():location.pathname.split('/').pop());
      }catch(e){}
    }
    forms.addEventListener('change',run);q.addEventListener('input',run);
    forms.addEventListener('submit',function(e){e.preventDefault()});
    function rst(){ q.value='';$$('input[type=checkbox]',forms).forEach(function(c){c.checked=false});run();q.focus() }
    var rs=$('#reset');if(rs)rs.addEventListener('click',rst);
    var rs2=$('[data-empty-reset]');if(rs2)rs2.addEventListener('click',rst);
    try{
      var sp=new URLSearchParams(location.search);
      if(sp.get('q'))q.value=sp.get('q');
      [['st','st'],['lv','lv'],['ty','ty']].forEach(function(x){ var v=sp.get(x[0]);if(v)v.split(',').forEach(function(val){var c=$('input[name='+x[1]+'][value="'+val+'"]',forms);if(c)c.checked=true}) });
      var nv=sp.get('niveau');if(nv){var c2=$('input[name=lv][value="'+nv+'"]',forms);if(c2)c2.checked=true}
    }catch(e){}
    run();
  }
})();
