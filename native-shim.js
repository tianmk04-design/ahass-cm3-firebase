/* Dipakai hanya di versi APK: WebView Android tidak bisa mengunduh file blob,
   jadi file yang dibuat aplikasi (xlsx/csv) disimpan lalu dibuka lewat menu Bagikan/Simpan. */
(function(){
 var orig=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){
  var a=this,C=window.Capacitor,P=C&&C.Plugins;
  if(C&&C.isNativePlatform&&C.isNativePlatform()&&P&&P.Filesystem&&P.Share&&a.hasAttribute('download')&&/^blob:/.test(a.href)){
   var name=a.getAttribute('download')||'file';
   fetch(a.href).then(function(r){return r.blob()}).then(function(b){
    return new Promise(function(res,rej){var f=new FileReader();f.onload=function(){res(String(f.result).split(',')[1])};f.onerror=rej;f.readAsDataURL(b)})
   }).then(function(data){
    return P.Filesystem.writeFile({path:name,data:data,directory:'CACHE'})
   }).then(function(r){
    return P.Share.share({title:name,url:r.uri,dialogTitle:'Simpan / buka '+name})
   }).catch(function(e){
    if(e&&/cancel/i.test(e.message||''))return;
    alert('Gagal menyimpan file: '+((e&&e.message)||e));
   });
   return;
  }
  return orig.apply(this,arguments);
 };
})();
