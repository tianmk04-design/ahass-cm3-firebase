/* fb.js — Firebase (Firestore + Auth) transport shared by index.html and frontdesk.html.
   Each record is one document {j:"<json>"} so the apps' own data model never changes.
   Parts also carry a numeric `stock` that is written with increment() (safe for 2 devices selling at once). */
(function(){
var V="11.0.2",U="https://www.gstatic.com/firebasejs/"+V+"/",CFG=window.FIREBASE_CONFIG;
var FB=window.FB={M:{},user:null,err:"",cols:[],_cb:null,_auth:[],_t:0,_unsub:[],_p:null,_loaded:null};
FB.ok=!!(CFG&&CFG.apiKey&&CFG.apiKey.indexOf("PASTE")<0);
var S={};
FB.init=function(){
 if(FB._p)return FB._p;
 if(!FB.ok)return FB._p=Promise.reject(new Error("firebase-config.js belum diisi."));
 return FB._p=Promise.all([import(U+"firebase-app.js"),import(U+"firebase-auth.js"),import(U+"firebase-firestore.js")]).then(function(m){
  S.app=m[0];S.au=m[1];S.fs=m[2];
  var app=S.app.initializeApp(CFG);S.a=S.au.getAuth(app);
  try{S.db=S.fs.initializeFirestore(app,{localCache:S.fs.persistentLocalCache({tabManager:S.fs.persistentMultipleTabManager()})})}
  catch(e){S.db=S.fs.getFirestore(app)}
  return new Promise(function(res){var first=true;S.au.onAuthStateChanged(S.a,function(u){
   FB.user=u||null;FB._auth.forEach(function(f){try{f(u)}catch(e){}});if(first){first=false;res()}})});
 });
};
FB.onAuth=function(f){FB._auth.push(f)};
FB.login=function(email,pw){return FB.init().then(function(){return S.au.signInWithEmailAndPassword(S.a,email,pw)})};
FB.logout=function(){FB.stop();return FB.init().then(function(){return S.au.signOut(S.a)})};
FB.msg=function(e){var c=e&&e.code||"";return /invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)?"Email atau password salah.":/network/.test(c)?"Tidak ada koneksi internet.":/too-many/.test(c)?"Terlalu banyak percobaan. Coba lagi nanti.":(e&&e.message||String(e))};
/* listen to collections; M[col] = Map(id -> data). cb() is debounced and runs after any change. */
FB.start=function(cols,cb){
 if(FB._loaded&&FB.cols.join()===cols.join())return FB._loaded;
 FB.stop();FB.cols=cols.slice();FB._cb=cb;
 return FB._loaded=FB.init().then(function(){
  if(!FB.user)throw new Error("Belum masuk ke Firebase.");
  var pend=new Set(cols);
  return new Promise(function(res){
   var done=function(){res()},tm=setTimeout(done,9000);
   cols.forEach(function(c){
    var m=FB.M[c]=FB.M[c]||new Map();
    FB._unsub.push(S.fs.onSnapshot(S.fs.collection(S.db,c),function(s){
     s.docChanges().forEach(function(ch){if(ch.type==="removed")m.delete(ch.doc.id);else m.set(ch.doc.id,ch.doc.data())});
     if(!s.metadata.fromCache)pend.delete(c);
     if(!pend.size){clearTimeout(tm);done()}
     clearTimeout(FB._t);FB._t=setTimeout(function(){FB._cb&&FB._cb()},400);
    },function(e){FB.err=e&&e.code==="permission-denied"?"Akses ditolak oleh aturan Firestore.":(e&&e.message||"");pend.delete(c);if(!pend.size){clearTimeout(tm);done()}}));
   });
  });
 });
};
FB.stop=function(){FB._unsub.forEach(function(u){try{u()}catch(e){}});FB._unsub=[];FB._loaded=null;FB.M={}};
/* ops: {c,id,d:{...}, inc:n}  |  {c,id,del:1}. Resolves "sent" (server confirmed) or "queued" (offline, kept by the SDK and sent later). */
FB.commit=function(ops){
 return FB.init().then(function(){
  var f=S.fs,all=[],i,b,n;
  for(i=0;i<ops.length;i+=450){b=f.writeBatch(S.db);ops.slice(i,i+450).forEach(function(o){
   var r=f.doc(S.db,o.c,String(o.id));
   if(o.del)b.delete(r);else{var d=Object.assign({},o.d);if(o.inc)d.stock=f.increment(o.inc);b.set(r,d,{merge:true})}});
   all.push(b.commit())}
  return Promise.race([Promise.all(all).then(function(){return "sent"}),new Promise(function(r){setTimeout(function(){r("queued")},10000)})]);
 });
};
})();
