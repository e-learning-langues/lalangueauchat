/* Appliqué avant le premier rendu : réglages d'accessibilité mémorisés dans ce navigateur (optionnel). */
(function(){
  var d=document.documentElement;
  d.classList.add('js');
  try{
    var p=JSON.parse(localStorage.getItem('llc-prefs')||'{}');
    ['theme','text','spacing','motion','contrast','decor'].forEach(function(k){ if(p[k]!=null && p[k]!=='auto') d.setAttribute('data-'+k,p[k]); });
  }catch(e){}
})();
