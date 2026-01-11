import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, set, get, remove } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

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

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getDatabase(app);

  /* ================= ELEMENT ================= */
  const gvIDInput = document.getElementById("gvIDInput");
  const gvNameDisplay = document.getElementById("gvNameDisplay");
  const subjectSelect = document.getElementById("subjectSelect");

  const lessonName = document.getElementById("lessonName");
  const lessonHours = document.getElementById("lessonHours");
  const lessonDate = document.getElementById("lessonDate");
  const lessonContent = document.getElementById("lessonContent");

  const lessonList = document.getElementById("lessonList");
  const addLessonBtn = document.getElementById("addLesson");
  const saveLessonBtn = document.getElementById("saveLesson");
  const goBaitapBtn = document.getElementById("goBaitap");

  const btnChooseFile = document.getElementById("btnChooseFile");
  const fileInput = document.getElementById("fileInput");

  let currentGVKey = null;
  let selectedLessonKey = null;

  /* ================= HELPER ================= */
  function notify(msg) {
    const n = document.createElement("div");
    n.innerText = msg;
    n.style.cssText = `
      position:fixed;top:10px;right:10px;
      background:#0a0;color:#fff;
      padding:6px 12px;border-radius:6px;z-index:9999
    `;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
  }

  function setFormEnabled(enable) {
    [
      lessonName,
      lessonHours,
      lessonDate,
      lessonContent,
      subjectSelect,
      addLessonBtn,
      saveLessonBtn
    ].forEach(el => el && (el.disabled = !enable));
  }

  /* ================= CONTENTEDITABLE ================= */
  Object.defineProperty(lessonContent, "value", {
    get() { return lessonContent.innerHTML; },
    set(v) { lessonContent.innerHTML = v; }
  });

  function insertAtCursor(html) {
    lessonContent.focus();
    document.execCommand("insertHTML", false, html);
  }

  lessonContent.addEventListener("paste", e => {
    e.preventDefault();
    const cd = e.clipboardData || window.clipboardData;
    let html = cd.getData("text/html") || cd.getData("text/plain");
    if (!html) return;

    html = html.replace(/class="?Mso.*?"/g, "");
    html = html.replace(/style="[^"]*mso-[^"]*"/g, "");
    html = html.replace(/<o:p>\s*<\/o:p>/g, "");

    insertAtCursor(html);
  });

  /* ================= LOAD SUBJECT ================= */
  async function loadSubjects() {
    const snap = await get(ref(db, "monhoc"));
    const data = snap.val() || {};
    subjectSelect.innerHTML = "";
    for (const k in data) {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = data[k].name;
      subjectSelect.appendChild(opt);
    }
    renderLessons();
  }

  /* ================= CHECK GV ================= */
  gvIDInput.addEventListener("input", async () => {
    const id = gvIDInput.value.trim();
    currentGVKey = null;
    gvNameDisplay.innerText = "";
    setFormEnabled(false);
    if (!id) return;

    const snap = await get(ref(db, "giaovien"));
    const data = snap.val() || {};

    for (const k in data) {
      if (data[k].id === id) {
        currentGVKey = k;
        gvNameDisplay.innerText = data[k].name;
        setFormEnabled(true);
        loadSubjects();
        return;
      }
    }
    gvNameDisplay.innerText = "ID không tồn tại";
  });

  /* ================= RENDER ================= */
  async function renderLessons() {
    lessonList.innerHTML = "";
    if (!currentGVKey) return;

    const snap = await get(ref(db, "baigiang"));
    const data = snap.val() || {};

    for (const subjKey in data) {
      const lessons = data[subjKey];
      const gvLessons = Object.entries(lessons)
        .filter(([_, v]) => v.gvID === currentGVKey);

      if (!gvLessons.length) continue;

      const div = document.createElement("div");
      const subjName =
        subjectSelect.querySelector(`option[value="${subjKey}"]`)?.text || "Unknown";

      div.innerHTML = `<h3>Môn học: ${subjName}</h3>`;

      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>STT</th><th>Tên</th><th>Tiết</th>
            <th>Ngày</th><th>Nội dung</th><th>Xóa</th>
          </tr>
        </thead><tbody></tbody>
      `;

      const tbody = table.querySelector("tbody");

      gvLessons.forEach(([key, l], idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${l.name || ""}</td>
          <td>${l.hours || ""}</td>
          <td>${l.date || ""}</td>
          <td>${l.content ? "✔ Có" : ""}</td>
          <td><button>Xóa</button></td>
        `;

        tr.onclick = () => {
          selectedLessonKey = key;
          subjectSelect.value = subjKey;
          lessonName.value = l.name || "";
          lessonHours.value = l.hours || "";
          lessonDate.value = l.date || "";
          lessonContent.value = l.content || "";
        };

        tr.querySelector("button").onclick = async e => {
          e.stopPropagation();
          if (!confirm("Xóa bài giảng này?")) return;
          await remove(ref(db, `baigiang/${subjKey}/${key}`));
          notify("Đã xóa bài giảng");
          renderLessons();
        };

        tbody.appendChild(tr);
      });

      div.appendChild(table);
      lessonList.appendChild(div);
    }
  }

  /* ================= ADD ================= */
  addLessonBtn.onclick = async () => {
    if (!currentGVKey) return notify("Nhập ID giáo viên");
    if (!lessonName.value.trim()) return notify("Nhập tên bài");

    await push(ref(db, `baigiang/${subjectSelect.value}`), {
      name: lessonName.value.trim(),
      hours: lessonHours.value,
      date: lessonDate.value,
      content: lessonContent.value.trim(),
      gvID: currentGVKey
    });

    notify("Đã thêm bài giảng");
    clearForm();
    renderLessons();
  };

  /* ================= SAVE ================= */
  saveLessonBtn.onclick = async () => {
    if (!selectedLessonKey) return notify("Chọn bài cần lưu");

    await set(ref(db, `baigiang/${subjectSelect.value}/${selectedLessonKey}`), {
      name: lessonName.value.trim(),
      hours: lessonHours.value,
      date: lessonDate.value,
      content: lessonContent.value.trim(),
      gvID: currentGVKey
    });

    notify("Đã lưu bài giảng");
    clearForm();
    renderLessons();
  };

  /* ================= PREVIEW ================= */
  window.openPreview = () => {
    if (!lessonContent.value.trim()) return notify("Chưa có nội dung");

    localStorage.setItem("lesson_preview", JSON.stringify({
      name: lessonName.value,
      meta: `Số tiết: ${lessonHours.value || ""} | Ngày: ${lessonDate.value || ""}`,
      content: lessonContent.value
    }));

    window.open("preview.html", "_blank");
  };

  /* ================= IMAGE ================= */
  btnChooseFile.onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = e => insertAtCursor(`<img src="${e.target.result}" style="max-width:100%"><br>`);
    r.readAsDataURL(file);
    fileInput.value = "";
  };

// ================= AUDIO GOOGLE DRIVE =================
window.addAudio = function () {
  const url = prompt("Dán link mp3 Google Drive:");
  if (!url) return;

  // bắt FILE_ID từ link Drive
  const m = url.match(/\/d\/([^/]+)/);
  if (!m) {
    alert("Link Google Drive không hợp lệ");
    return;
  }

  const fileId = m[1];

  const iframe = `
  <iframe
    src="https://drive.google.com/file/d/${fileId}/preview"
    style="width:33vw; max-width:400px; height:60px;"
    allow="autoplay">
  </iframe><br>
`;


  insertAtCursor(iframe);
};

// ================= MP4 GOOGLE DRIVE =================
document.getElementById("btnMp4").onclick = () => {
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

  const iframe = `
    <iframe
      src="https://drive.google.com/file/d/${fileId}/preview"
      style="width:33vw; max-width:400px; height:220px;"
      allow="autoplay"
    ></iframe><br>
  `;

  insertAtCursor(iframe);
};



  /* ================= NAV ================= */
  goBaitapBtn?.addEventListener("click", () => location.href = "baitap.html");

  function clearForm() {
    lessonName.value = "";
    lessonHours.value = "";
    lessonDate.value = "";
    lessonContent.value = "";
    selectedLessonKey = null;
  }

  setFormEnabled(false);
});
