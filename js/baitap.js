import { initializeApp, getApps } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, remove
} from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

window.onload = () => {

  /* ===== FIREBASE ===== */
  const firebaseConfig = {
    apiKey: "AIzaSyAFYzJMv3HYJwo7SbpD_kAQuqx_zMoMBj8",
    authDomain: "english-teaching-e4242.firebaseapp.com",
    databaseURL: "https://english-teaching-e4242-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "english-teaching-e4242",
    storageBucket: "english-teaching-e4242.appspot.com",
    messagingSenderId: "196358725024",
    appId: "1:196358725024:web:c82e9fc5f4e809cccc98c5"
  };

  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

  const db = getDatabase(app);

  /* ===== DOM ===== */
  const dateInput   = document.getElementById("btDate");
  const subjectSel  = document.getElementById("btSubject");
  const lessonInput = document.getElementById("btLesson");
  const titleInput  = document.getElementById("btTitle");
  const contentBox  = document.getElementById("btContent");
  const listWrap    = document.getElementById("btList");

  const btnAdd   = document.getElementById("btnAdd");
  const btnSave  = document.getElementById("btnSave");
  const btnDel   = document.getElementById("btnDeleteSubject");

  const btnChooseFile = document.getElementById("btnChooseFile");
  const fileInput     = document.getElementById("fileInput");
  const btnYoutube    = document.getElementById("btnYoutube");
  const btnPreview    = document.getElementById("btnPreview");

  let selectedKey = null;
  let selectedSubjectKey = null;
  let subjectMap = {};

  /* ===== GUARD ===== */
  if (!listWrap) {
    console.error("❌ Không tìm thấy #btList trong HTML");
    return;
  }

  /* ===== NOTIFY ===== */
  function notify(msg){
    const d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = `
      position:fixed;top:10px;right:10px;
      background:#0a7;color:#fff;
      padding:8px 14px;border-radius:6px;
      z-index:9999`;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),2000);
  }

  function clearForm(){
    dateInput.value = "";
    lessonInput.value = "";
    titleInput.value = "";
    contentBox.value = "";
    selectedKey = null;
    selectedSubjectKey = null;
  }

  /* ===== FILE → HTML ===== */
  btnChooseFile.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      let html = "";

      if (file.type.startsWith("image/")) {
        html = `<img src="${e.target.result}" style="max-width:70%;display:block;margin:16px auto;">`;
      } else if (file.type.startsWith("audio/")) {
        html = `<audio controls src="${e.target.result}" style="width:70%;display:block;margin:16px auto;"></audio>`;
      } else if (file.type.startsWith("video/")) {
        html = `<video controls src="${e.target.result}" style="width:70%;display:block;margin:16px auto;"></video>`;
      } else {
        alert("Chỉ hỗ trợ ảnh / audio / video");
        return;
      }

      contentBox.value += "\n" + html + "\n";
      fileInput.value = "";
    };
    reader.readAsDataURL(file);
  };

  /* ===== YOUTUBE ===== */
  btnYoutube.onclick = () => {
    const url = prompt("Dán link YouTube:");
    if (!url) return;

    let id = "";
    if (url.includes("watch?v=")) id = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) id = url.split("/").pop();

    if (!id) return alert("Link không hợp lệ");

    contentBox.value += `
<iframe src="https://www.youtube.com/embed/${id}"
style="width:70%;height:360px;display:block;margin:16px auto"
frameborder="0" allowfullscreen></iframe>\n`;
  };

  /* ===== PREVIEW ===== */
  btnPreview.onclick = () => {
    localStorage.setItem("lesson_preview", JSON.stringify({
      title: titleInput.value,
      meta: `Ngày: ${dateInput.value || ""}`,
      content: contentBox.value
    }));
    window.open("preview.html", "_blank");
  };

  /* ===== LOAD SUBJECT ===== */
  onValue(ref(db,"monhoc"), snap => {
    subjectMap = snap.val() || {};
    subjectSel.innerHTML = `<option value="">-- chọn môn --</option>`;
    for (const k in subjectMap) {
      subjectSel.innerHTML +=
        `<option value="${k}">${subjectMap[k].name}</option>`;
    }
  }, { onlyOnce:true });

  /* ===== RENDER LIST ===== */
  onValue(ref(db,"baitap"), snap => {
    listWrap.innerHTML = "";
    const all = snap.val() || {};

    let i = 1;
    for (const subjKey in all) {
      for (const k in all[subjKey]) {
        const it = all[subjKey][k];
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${i++}</td>
          <td>${it.date || ""}</td>
          <td>${it.lesson || ""}</td>
          <td>${it.title || ""}</td>
          <td>${it.content ? "✔" : ""}</td>
          <td><button>Xóa</button></td>
        `;

        tr.onclick = () => {
          selectedKey = k;
          selectedSubjectKey = subjKey;
          subjectSel.value = subjKey;
          dateInput.value = it.date || "";
          lessonInput.value = it.lesson || "";
          titleInput.value = it.title || "";
          contentBox.value = it.content || "";
        };

        tr.querySelector("button").onclick = e => {
          e.stopPropagation();
          if (confirm("Xóa bài tập này?")) {
            remove(ref(db,`baitap/${subjKey}/${k}`));
            clearForm();
            notify("Đã xóa");
          }
        };

        listWrap.appendChild(tr);
      }
    }
  });

  /* ===== ADD ===== */
  btnAdd.onclick = () => {
    if (!subjectSel.value || !lessonInput.value.trim()) {
      notify("Thiếu môn hoặc bài giảng");
      return;
    }

    push(ref(db,`baitap/${subjectSel.value}`),{
      date: dateInput.value,
      lesson: lessonInput.value.trim(),
      title: titleInput.value.trim(),
      content: contentBox.value
    });

    clearForm();
    notify("Đã thêm bài tập");
  };

  /* ===== SAVE ===== */
  btnSave.onclick = () => {
    if (!selectedKey) return notify("Chọn bài cần lưu");

    set(ref(db,`baitap/${selectedSubjectKey}/${selectedKey}`),{
      date: dateInput.value,
      lesson: lessonInput.value.trim(),
      title: titleInput.value.trim(),
      content: contentBox.value
    });

    clearForm();
    notify("Đã lưu");
  };

  /* ===== DELETE SUBJECT ===== */
  btnDel.onclick = () => {
    if (!subjectSel.value) return;
    if (confirm("Xóa toàn bộ bài tập môn này?")) {
      remove(ref(db,`baitap/${subjectSel.value}`));
      clearForm();
      notify("Đã xóa môn");
    }
  };
};
