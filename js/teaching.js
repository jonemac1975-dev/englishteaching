// teaching.js (full, đã fix import sha256)
import "https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/build/sha256.min.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// --- Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAFYzJMv3HYJwo7SbpD_kAQuqx_zMoMBj8",
  authDomain: "english-teaching-e4242.firebaseapp.com",
  databaseURL: "https://english-teaching-e4242-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "english-teaching-e4242",
  storageBucket: "english-teaching-e4242.appspot.com",
  messagingSenderId: "196358725024",
  appId: "1:196358725024:web:c82e9fc5f4e809cccc98c5"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- DOM elements ---
const slide = document.getElementById("slideFrame");
const yt    = document.getElementById("ytFrame");
const vid   = document.getElementById("videoPlayer");
const main  = document.getElementById("screen");

const btnSlide = document.getElementById("btnSlide");
const btnYT    = document.getElementById("btnYT");
const btnDual  = document.getElementById("btnDual");
const btnVideo = document.getElementById("btnVideo");
const gmeetLink = document.getElementById("gmeetLink");
const goBaigiangBtn = document.getElementById("goBaigiangBtn");
const goAdminBtn = document.getElementById("goAdminBtn");

// --- Login button ---
const loginBtn = document.createElement("button");
loginBtn.innerText="🔒";;
loginBtn.style.position="fixed";
loginBtn.style.top="5px";
loginBtn.style.left="10px";
loginBtn.style.width="35px";
loginBtn.style.height="35px";
loginBtn.style.borderRadius="50%";
document.body.appendChild(loginBtn);

let isLoggedIn=false;

// --- Đồng hồ ---
const clockEl = document.getElementById("clock");
setInterval(()=>{ if(clockEl) clockEl.innerText = new Date().toLocaleTimeString(); },1000);

// --- Lấy dữ liệu bài giảng ---
const d = JSON.parse(localStorage.getItem("teachingData")||"{}");
const fileLink = d.file?.trim() || '';
const ytLink   = d.yt?.trim() || '';
const videoLink= d.video || '';

// --- Chuẩn hóa ---
function normalizeDriveLink(url){
    if(!url) return '';
    if(url.includes('drive.google.com')){
        if(url.includes('/file/d/')) return url.replace(/\/view(\?usp=.*)?$/,'/preview');
        if(url.includes('uc?export=download')){
            const m = url.match(/id=([a-zA-Z0-9_-]+)/);
            if(m) return `https://drive.google.com/file/d/${m[1]}/preview`;
        }
    }
    return url;
}
function normalizeYTLink(url){
    if(!url) return '';
    if(url.includes('youtube.com/watch')){
        const vid = new URL(url).searchParams.get('v');
        return vid ? `https://www.youtube.com/embed/${vid}` : '';
    } else if(url.includes('youtu.be/')){
        const vid = url.split('/').pop();
        return `https://www.youtube.com/embed/${vid}`;
    } else return url;
}

// --- Gán iframe/video ---
if(fileLink) slide.src = normalizeDriveLink(fileLink);
if(ytLink) yt.src = normalizeYTLink(ytLink);
if(videoLink) vid.src = videoLink;
if(d.gmeet) gmeetLink.href = d.gmeet;

// --- Chế độ hiển thị ---
function modeSlide(){ 
    main.className="fullSlide"; 
    slide.style.display="block"; yt.style.display="none"; vid.style.display="none"; 
    slide.style.width='100%'; slide.style.height='calc(100vh - 150px)';
}
function modeYT(){ 
    main.className=""; 
    yt.style.display="block"; slide.style.display="none"; vid.style.display="none";
}
function modeDual(){ 
    main.className="dual"; 
    slide.style.display="block"; yt.style.display="block"; vid.style.display="none";
    if(window.innerWidth<=768){
        slide.style.width='100%'; slide.style.height='250px';
        yt.style.width='100%'; yt.style.height='250px';
    } else {
        slide.style.width='48%'; slide.style.height='400px';
        yt.style.width='48%'; yt.style.height='400px';
    }
}
function modeVideo(){ 
    main.className=""; vid.style.display="block"; slide.style.display="none"; yt.style.display="none";
}

// --- Gán nút (không hỏi pass nữa) ---
btnSlide.onclick = modeSlide;
btnYT.onclick    = modeYT;
btnDual.onclick  = modeDual;
goBaigiangBtn.onclick = ()=>{ if(isLoggedIn) window.location.href='baigiang.html'; else alert("Login trước!"); };
goAdminBtn.onclick    = ()=>{ if(isLoggedIn) window.location.href='danhmuc.html'; else alert("Login trước!"); };

// --- Dark/Light mode ---
const themeToggle = document.createElement("button");
themeToggle.innerText="🌙/☀";
themeToggle.style.position="fixed";
themeToggle.style.top="5px"; 
themeToggle.style.right="10px";
themeToggle.style.padding="3px 8px"; // chữ nhật nhỏ gọn
themeToggle.style.borderRadius="0"; // bỏ tròn
themeToggle.style.border="1px solid #000";
themeToggle.style.background="#fff";
themeToggle.style.cursor="pointer";
themeToggle.onclick=()=> document.body.classList.toggle("light");
document.body.appendChild(themeToggle);

// --- Resize dual mode ---
window.addEventListener('resize', ()=>{
    if(main.classList.contains('dual')) modeDual();
});

// --- Login button ---
loginBtn.onclick = async ()=>{
    if(isLoggedIn){ alert("Đã login"); return; }
    const pass = prompt("Nhập mật khẩu giáo viên:");
    if(!pass) return;

    // Lấy pass hash từ Firebase
    const passRef = ref(db,'config/pass');
    onValue(passRef, snapshot=>{
        const hashFromFire = snapshot.val() || '';
        if(window.sha256(pass)===hashFromFire){
            alert("Login thành công!");
            isLoggedIn=true;
        } else {
            alert("Sai mật khẩu!");
        }
    }, { onlyOnce: true });
};
