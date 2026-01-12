import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

window.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */
  const firebaseConfig = {
    apiKey: "AIzaSyAFYzJMv3HYJwo7SbpD_kAQuqx_zMoMBj8",
    authDomain: "english-teaching-e4242.firebaseapp.com",
    databaseURL: "https://english-teaching-e4242-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "english-teaching-e4242",
    storageBucket: "english-teaching-e4242.appspot.com",
    messagingSenderId: "196358725024",
    appId: "1:196358725024:web:c82e9fc5f4e809cccc98c5"
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getDatabase(app);


  const btDate=document.getElementById("btDate");
  const btSubject=document.getElementById("btSubject");
  const btLesson=document.getElementById("btLesson");
  const btTitle=document.getElementById("btTitle");
  const btContent=document.getElementById("btContent");
  const btList=document.getElementById("btList");

  const btnAdd=document.getElementById("btnAdd");
  const btnSave=document.getElementById("btnSave");
  const btnDel=document.getElementById("btnDeleteSubject");
  const btnChooseFile=document.getElementById("btnChooseFile");
const btnpdf = document.getElementById("btnpdf");
  const btnAudio = document.getElementById("btnAudio");
  const fileInput=document.getElementById("fileInput");
  const btnYoutube=document.getElementById("btnYoutube");
  const btnPreview=document.getElementById("btnPreview");

  let allData={};
  let selectedKey=null;
  let selectedSubjectKey=null;

  // wrapper .value
  Object.defineProperty(btContent,"value",{get:()=>btContent.innerHTML,set:v=>btContent.innerHTML=v});

  function notify(msg){
    const d=document.createElement("div");
    d.textContent=msg;
    d.style.cssText="position:fixed;top:10px;right:10px;background:#0a7;color:#fff;padding:6px 12px;border-radius:6px;z-index:9999";
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),2000);
  }

  function clearForm(){
    btDate.value="";btLesson.value="";btTitle.value="";btContent.value="";selectedKey=null;selectedSubjectKey=null;
  }

  // paste Word/Docs giữ table, border, màu
  btContent.addEventListener("paste",e=>{
    e.preventDefault();
    const clipboardData=e.clipboardData||window.clipboardData;
    let html=clipboardData.getData("text/html")||clipboardData.getData("text/plain");
    if(!html) return;
    html=html.replace(/class="?Mso[a-zA-Z0-9]*"?/g,"")
             .replace(/style="[^"]*mso-[^"]*"/g,"")
             .replace(/<o:p>\s*<\/o:p>/g,"")
             .replace(/<v:.*?>/g,"").replace(/<\/v:.*?>/g,"")
             .replace(/<!--\[if.*?endif]-->/g,"");
    document.execCommand("insertHTML",false,html);
  });

  function insertAtCursor(html){btContent.focus();document.execCommand("insertHTML",false,html);}
  btnChooseFile.onclick=()=>fileInput.click();
  fileInput.onchange=()=>{
    const file=fileInput.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{
      let html="";
      if(file.type.startsWith("image/")) html=`<img src="${e.target.result}" style="max-width:70%;display:block;margin:16px auto;border-radius:6px;">`;
      else if(file.type.startsWith("audio/")) html=`<audio controls src="${e.target.result}" style="width:70%;display:block;margin:16px auto;"></audio>`;
      else if(file.type.startsWith("video/")) html=`<video controls src="${e.target.result}" style="width:70%;display:block;margin:16px auto;"></video>`;
      else { alert("Chỉ hỗ trợ ảnh/audio/video"); return;}
      insertAtCursor(html);
      fileInput.value="";
    };
    reader.readAsDataURL(file);
  };

btnAudio.addEventListener("click", () => {
  const url = prompt("Dán link mp3 Google Drive:");
  if (!url) return;

  const m = url.match(/\/d\/([^/]+)/);
  if (!m) {
    alert("Link Google Drive không hợp lệ");
    return;
  }

  const fileId = m[1];

  insertAtCursor(`
    <iframe
      src="https://drive.google.com/file/d/${fileId}/preview"
      style="width:33vw; max-width:400px; height:60px;"
      allow="autoplay">
    </iframe><br>
  `);
});

btnpdf.addEventListener("click", () => {
  const url = prompt("Dán link PDF Google Drive:");
  if (!url) return;

  const m = url.match(/\/d\/([^/]+)/);
  if (!m) {
    alert("Link Google Drive không hợp lệ");
    return;
  }

  const fileId = m[1];
  const preview = `https://drive.google.com/file/d/${fileId}/preview`;
  const open = `https://drive.google.com/file/d/${fileId}/view`;

  insertAtCursor(`
    <div style="
      margin:16px 0;
      padding:12px;
      border:1px solid #ddd;
      border-radius:8px;
      background:#fafafa;
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:8px;
        font-weight:600;
      ">
        <span>📄 Tài liệu PDF</span>
        <a href="${open}" target="_blank" style="
          font-size:13px;
          text-decoration:none;
          color:#1976d2;
        ">Mở toàn màn hình</a>
      </div>

      <iframe
        src="${preview}"
        style="width:100%; height:600px; border:none; border-radius:6px;"
        loading="lazy">
      </iframe>
    </div>
    <br>
  `);
});


// ================= MP4 GOOGLE DRIVE (BAI TAP) =================
document.getElementById("btnMp4").addEventListener("click", () => {
  const url = prompt("Dán link MP4 Google Drive:");
  if (!url) return;

  // bắt FILE_ID từ link Drive
  let fileId = "";
  const m1 = url.match(/\/d\/([^/]+)/);
  if (m1) fileId = m1[1];

  const m2 = url.match(/id=([^&]+)/);
  if (!fileId && m2) fileId = m2[1];

  if (!fileId) {
    alert("Link Google Drive không hợp lệ");
    return;
  }

  insertAtCursor(`
    <iframe
      src="https://drive.google.com/file/d/${fileId}/preview"
      style="width:33vw; max-width:400px; height:220px;"
      allow="autoplay">
    </iframe><br>
  `);
});



  btnYoutube.onclick=()=>{
    const url=prompt("Dán link YouTube:");
    if(!url) return;
    let id="";
    if(url.includes("watch?v=")) id=url.split("v=")[1].split("&")[0];
    else if(url.includes("youtu.be/")) id=url.split("/").pop();
    if(!id){ alert("Link không hợp lệ"); return;}
    insertAtCursor(`<iframe src="https://www.youtube.com/embed/${id}" style="width:70%;height:360px;display:block;margin:16px auto" frameborder="0" allowfullscreen></iframe>`);
  };

  btnPreview.onclick=()=>{
    if(!btContent.value.trim()){ notify("Chưa có nội dung để preview"); return;}
    localStorage.setItem("lesson_preview",JSON.stringify({
      name:btTitle.value||"Bài tập",
      meta:`Bài giảng: ${btLesson.value||""} | Ngày: ${btDate.value||""}`,
      content:btContent.value
    }));
    window.open("preview.html","_blank");
  };

  // load subjects
  onValue(ref(db,"monhoc"),snap=>{
    const data=snap.val()||{};
    btSubject.innerHTML='<option value="">-- chọn môn --</option>';
    for(const k in data) btSubject.innerHTML+=`<option value="${k}">${data[k].name}</option>`;
  },{onlyOnce:true});

  // load all baitap once
  onValue(ref(db,"baitap"),snap=>{
    allData=snap.val()||{};
    renderList();
  });

  function renderList(){
    btList.innerHTML="";
    const subjKey=btSubject.value;
    if(!subjKey) return;
    const data=allData[subjKey]||{};
    let i=1;
    for(const k in data){
      const bt=data[k];
      const div=document.createElement("div");
      div.className="bt-item";
      div.innerHTML=`<strong>${i++}. ${bt.title||""}</strong> (${bt.date||""})<br><em>Bài giảng: ${bt.lesson||""}</em><button>Xóa</button>`;
      div.onclick=()=>{
        selectedKey=k; selectedSubjectKey=subjKey;
        btDate.value=bt.date||""; btLesson.value=bt.lesson||""; btTitle.value=bt.title||""; btContent.value=bt.content||"";
      };
      div.querySelector("button").onclick=e=>{
        e.stopPropagation();
        if(confirm("Xóa bài tập này?")){
          remove(ref(db,`baitap/${subjKey}/${k}`));
          clearForm(); notify("Đã xóa");
        }
      };
      btList.appendChild(div);
    }
  }

  btSubject.addEventListener("change",renderList);

  btnAdd.onclick=()=>{
    if(!btSubject.value||!btLesson.value.trim()){ notify("Thiếu môn hoặc bài giảng"); return;}
    push(ref(db,`baitap/${btSubject.value}`),{
      date:btDate.value, lesson:btLesson.value.trim(), title:btTitle.value.trim(), content:btContent.value
    });
    clearForm(); renderList(); notify("Đã thêm bài tập");
  };

  btnSave.onclick=()=>{
    if(!selectedKey||!selectedSubjectKey){ notify("Chọn bài cần lưu"); return;}
    set(ref(db,`baitap/${selectedSubjectKey}/${selectedKey}`),{
      date:btDate.value, lesson:btLesson.value.trim(), title:btTitle.value.trim(), content:btContent.value
    });
    clearForm(); renderList(); notify("Đã lưu bài tập");
  };

  btnDel.onclick=()=>{
    if(!btSubject.value) return;
    if(confirm("Xóa toàn bộ bài tập môn này?")){
      remove(ref(db,`baitap/${btSubject.value}`));
      clearForm(); renderList(); notify("Đã xóa môn");
    }
  };
});
