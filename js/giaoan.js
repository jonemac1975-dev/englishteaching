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

  /* ================= ELEMENT ================= */
  const gvIDInput = document.getElementById("gvIDInput");
  const gvNameDisplay = document.getElementById("gvNameDisplay");
  const subjectSelect = document.getElementById("subjectSelect");

  const lessonName = document.getElementById("lessonName");
  const lessonHours = document.getElementById("lessonHours");
  const lessonDate = document.getElementById("lessonDate");
  const lessonContent = document.getElementById("lessonContent");
  const lessonGMeet = document.getElementById("lessonGMeet");

  const lessonList = document.getElementById("lessonList");
  const addLessonBtn = document.getElementById("addLesson");
  const saveLessonBtn = document.getElementById("saveLesson");
  const goBaigiangBtn = document.getElementById("goBaigiang");
  const goBaitapBtn = document.getElementById("goBaitap");


  let currentGVKey = null;
  let selectedLessonKey = null;

  /* ================= HELPER ================= */
  function notify(msg) {
    const n = document.createElement("div");
    n.innerText = msg;
    n.style.position = "fixed";
    n.style.top = "10px";
    n.style.right = "10px";
    n.style.background = "#0a0";
    n.style.color = "#fff";
    n.style.padding = "6px 12px";
    n.style.borderRadius = "6px";
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
  }

  function setFormEnabled(enable) {
    [
      lessonName,
      lessonHours,
      lessonDate,
      lessonContent,
      lessonGMeet,
      subjectSelect,
      addLessonBtn,
      saveLessonBtn,
      goBaigiangBtn
    ].forEach(el => el && (el.disabled = !enable));
  }

  /* ================= LOAD SUBJECT ================= */
  function loadSubjects() {
    onValue(ref(db, "monhoc"), snap => {
      const data = snap.val() || {};
      subjectSelect.innerHTML = "";
      for (const k in data) {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = data[k].name;
        subjectSelect.appendChild(opt);
      }
      renderLessons();
    }, { onlyOnce: true });
  }

  /* ================= CHECK GV ================= */
  gvIDInput.addEventListener("input", () => {
    const id = gvIDInput.value.trim();
    currentGVKey = null;
    gvNameDisplay.innerText = "";
    setFormEnabled(false);
    if (!id) return;

    onValue(ref(db, "giaovien"), snap => {
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
    }, { onlyOnce: true });
  });

  /* ================= RENDER LESSON ================= */
  function renderLessons() {
    lessonList.innerHTML = "";
    if (!currentGVKey) return;

    onValue(ref(db, "baigiang"), snap => {
      const data = snap.val() || {};

      for (const subjKey in data) {
        const lessons = data[subjKey];
        const gvLessons = {};

        for (const k in lessons) {
          if (lessons[k].gvID === currentGVKey) gvLessons[k] = lessons[k];
        }
        if (!Object.keys(gvLessons).length) continue;

        const div = document.createElement("div");
        div.className = "lessonGroup";

        const subjName =
          subjectSelect.querySelector(`option[value="${subjKey}"]`)?.text || "Unknown";

        div.innerHTML = `
          <h3>Môn học: ${subjName}
            <button class="delSubjectBtn">Xóa môn</button>
          </h3>
        `;

        const table = document.createElement("table");
        table.className = "lessonTable";
        table.innerHTML = `
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên bài</th>
              <th>Số tiết</th>
              <th>Ngày</th>
              <th>Nội dung</th>
              <th>GMeet</th>
              <th>Xóa</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");
        let i = 1;

        for (const k in gvLessons) {
          const l = gvLessons[k];
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${i++}</td>
            <td>${l.name || ""}</td>
            <td>${l.hours || ""}</td>
            <td>${l.date || ""}</td>
            <td>${l.content ? "✔ Có" : ""}</td>
            <td>${l.gmeet || ""}</td>
            <td><button class="delLessonBtn">Xóa</button></td>
          `;

          tr.addEventListener("click", () => {
            selectedLessonKey = k;
            subjectSelect.value = subjKey;
            lessonName.value = l.name || "";
            lessonHours.value = l.hours || "";
            lessonDate.value = l.date || "";
            lessonContent.value = l.content || "";
            lessonGMeet.value = l.gmeet || "";
          });

          tr.querySelector(".delLessonBtn").addEventListener("click", e => {
            e.stopPropagation();
            remove(ref(db, `baigiang/${subjKey}/${k}`));
            notify("Đã xóa bài giảng");
          });

          tbody.appendChild(tr);
        }

        div.appendChild(table);
        lessonList.appendChild(div);

        div.querySelector(".delSubjectBtn").addEventListener("click", () => {
          if (confirm("Xóa toàn bộ bài giảng môn này?")) {
            for (const k in gvLessons) {
              remove(ref(db, `baigiang/${subjKey}/${k}`));
            }
            notify("Đã xóa môn học");
          }
        });
      }
    });
  }

  /* ================= ADD ================= */
  addLessonBtn.addEventListener("click", () => {
    if (!currentGVKey) return notify("Nhập ID giáo viên");
    if (!lessonName.value.trim()) return notify("Nhập tên bài giảng");

    const obj = {
      name: lessonName.value.trim(),
      hours: lessonHours.value,
      date: lessonDate.value,
      content: lessonContent.value.trim(),
      gmeet: lessonGMeet.value.trim(),
      gvID: currentGVKey
    };

    push(ref(db, `baigiang/${subjectSelect.value}`), obj);
    clearForm();
    notify("Đã thêm bài giảng");
  });

  /* ================= SAVE ================= */
  saveLessonBtn.addEventListener("click", () => {
    if (!selectedLessonKey) return notify("Chọn bài cần lưu");

    const obj = {
      name: lessonName.value.trim(),
      hours: lessonHours.value,
      date: lessonDate.value,
      content: lessonContent.value.trim(),
      gmeet: lessonGMeet.value.trim(),
      gvID: currentGVKey
    };

    set(ref(db, `baigiang/${subjectSelect.value}/${selectedLessonKey}`), obj);
    clearForm();
    notify("Đã lưu bài giảng");
  });


function openPreview() {
  if (!lessonContent.value.trim()) {
    notify("Chưa có nội dung để preview");
    return;
  }

  const data = {
    name: lessonName.value,
    meta: `Số tiết: ${lessonHours.value || ''} | Ngày: ${lessonDate.value || ''}`,
    content: lessonContent.value
  };

  localStorage.setItem("lesson_preview", JSON.stringify(data));
  window.open("preview.html", "_blank");
}

window.openPreview = openPreview;

function insertImage() {
  const file = document.getElementById("imgUpload").files[0];
  if (!file) return notify("Chưa chọn ảnh");

  const reader = new FileReader();
  reader.onload = () => {
    const imgTag = `<img src="${reader.result}" style="max-width:100%">`;
    lessonContent.value += "\\n" + imgTag;
  };
  reader.readAsDataURL(file);
}

window.insertImage = insertImage;



  function clearForm() {
    lessonName.value = "";
    lessonHours.value = "";
    lessonDate.value = "";
    lessonContent.value = "";
    lessonGMeet.value = "";
    selectedLessonKey = null;
  }

const btnChooseFile = document.getElementById("btnChooseFile");
const fileInput = document.getElementById("fileInput");

btnChooseFile.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    // chèn ảnh vào textarea
    insertAtCursor(`<img src="${e.target.result}" style="max-width:100%;"><br>`);
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
};

  /* ================= NAV ================= */
  goBaigiangBtn.addEventListener("click", () => location.href = "baigiang.html");
  goBaitapBtn.addEventListener("click", () => location.href = "baitap.html");

  setFormEnabled(false);
});
