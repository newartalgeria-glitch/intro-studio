(function(){
  var L=['ar','fr','en'],lang='ar';
  try{var s=localStorage.getItem('npa_lang');if(L.indexOf(s)>-1)lang=s;else{var n=(navigator.language||'').slice(0,2);if(L.indexOf(n)>-1)lang=n}}catch(e){}
  function apply(l){
    lang=l;
    document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';
    document.querySelectorAll('[data-lang]').forEach(function(e){e.hidden=e.getAttribute('data-lang')!==l});
    var t=document.querySelector('title'),d=document.querySelector('meta[name=description]');
    if(t&&t.getAttribute('data-title-'+l))t.textContent=t.getAttribute('data-title-'+l);
    if(d&&d.getAttribute('data-desc-'+l))d.setAttribute('content',d.getAttribute('data-desc-'+l));
    var sel=document.getElementById('lang-sel');if(sel)sel.value=l;
  }
  function init(){
    apply(lang);
    var sel=document.getElementById('lang-sel');
    if(sel)sel.addEventListener('change',function(){try{localStorage.setItem('npa_lang',sel.value)}catch(e){}apply(sel.value)});
    document.querySelectorAll('a.mail').forEach(function(a){
      var m=a.getAttribute('data-mail-user')+'@'+a.getAttribute('data-mail-domain');
      a.textContent=m;a.href='mailto:'+m;
    });
    var c=window.ADSENSE_CLIENT;
    if(c&&document.body.classList.contains('guide')){
      var sc=document.createElement('script');sc.async=true;sc.crossOrigin='anonymous';
      sc.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+c;document.head.appendChild(sc);
      document.querySelectorAll('article:not([hidden]) .adsbygoogle').forEach(function(){try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}});
    }else{document.querySelectorAll('.adwrap').forEach(function(e){e.remove()})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
