// teaching.js

import { db } from "./firebase.js";
import { ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// ====== ELEMENT ======
const lessonTree = document.getElementById("lessonTree");
const homeworkTree = document.getElementById("homeworkTree");
const previewFrame = document.getElementById("previewFrame");
const bgSlider = document.getElementById("bgSlider");

// ====== POPUP CONTROL ======
const btnLesson = document.getElementById("btnLesson");
const btnHomework = document.getElementById("btnHomework");
const lessonPopup = document.getElementById("lessonPopup");
const homeworkPopup = document.getElementById("homeworkPopup");

// toggle popup
function togglePopup(popup, btn) {
  [lessonPopup, homeworkPopup].forEach(p => { if(p!==popup) p.classList.remove("show"); });
  [btnLesson, btnHomework].forEach(b => { if(b!==btn) b.classList.remove("active"); });

  popup.classList.toggle("show");
  btn.classList.toggle("active");
}

// click button
btnLesson.addEventListener("click", e => { e.stopPropagation(); togglePopup(lessonPopup, btnLesson); });
btnHomework.addEventListener("click", e => { e.stopPropagation(); togglePopup(homeworkPopup, btnHomework); });

// click ngoài => đóng popup
document.addEventListener("click", () => {
  lessonPopup.classList.remove("show");
  homeworkPopup.classList.remove("show");
  btnLesson.classList.remove("active");
  btnHomework.classList.remove("active");
});

// ====== HELPER: tạo toggle ======
function createToggle(text) {
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.classList.add("toggle");
  span.textContent = "▶ " + text;
  li.appendChild(span);

  const ul = document.createElement("ul");
  li.appendChild(ul);

  span.addEventListener("click", e => {
    e.stopPropagation();
    ul.style.display = (ul.style.display === "block") ? "none" : "block";
    span.textContent = (ul.style.display === "block") ? "▼ " + text : "▶ " + text;
  });

  return li;
}


// ====== LOAD DATA ======
let monhocMap = {};
let giaovienMap = {};

// Load môn học
onValue(ref(db,"monhoc"), snap => {
    const data = snap.val() || {};
    for(const k in data) monhocMap[k] = data[k].name;
});

// Load giáo viên
onValue(ref(db,"giaovien"), snap => {
    const data = snap.val() || {};
    for(const k in data) giaovienMap[k] = data[k].name;
});

// ====== LOAD BÀI GIẢNG ======
onValue(ref(db,"baigiang"), snap => {
    const data = snap.val() || {};
    lessonTree.innerHTML = "";

    for(const subjKey in data){
        const lessons = data[subjKey];
        const gvMap = {};
        for(const k in lessons){
            const l = lessons[k];
            if(!gvMap[l.gvID]) gvMap[l.gvID] = [];
            gvMap[l.gvID].push({subjKey, lesson: l});
        }

        for(const gvID in gvMap){
    const liGV = createToggle(giaovienMap[gvID] || gvID);
    lessonTree.appendChild(liGV);

    const subjectMap = {}; // lưu liSubj theo môn
    gvMap[gvID].forEach(item => {
        const mon = monhocMap[item.subjKey] || item.subjKey;
        if(!subjectMap[mon]){
            const liSubj = createToggle(mon);
            liGV.querySelector("ul").appendChild(liSubj);
            subjectMap[mon] = liSubj;
        }

        const liLesson = document.createElement("li");
        liLesson.textContent = item.lesson.name;
        liLesson.style.cursor = "pointer";
        liLesson.addEventListener("click", e => {
            e.stopPropagation();
            lessonPopup.classList.remove("show");
            btnLesson.classList.remove("active");

            const preview = {
                name: item.lesson.name,
                meta: `GV: ${giaovienMap[gvID] || gvID} | Môn: ${mon}`,
                content: item.lesson.content
            };
            localStorage.setItem("lesson_preview", JSON.stringify(preview));
            previewFrame.src = "preview.html";
            previewFrame.style.display = "block";
            bgSlider.style.display = "none";
        });

        subjectMap[mon].querySelector("ul").appendChild(liLesson);
    });
}

    }
});

// ====== LOAD BÀI TẬP THEO MÔN ======
onValue(ref(db, "baitap"), snap => {
    const data = snap.val() || {};
    homeworkTree.innerHTML = "";

    for (const monhocId in data) {
        const monData = data[monhocId];
        if (!monData || typeof monData !== "object") continue;

        const monName = monhocMap?.[monhocId] || "Môn chưa đặt tên";

        // node môn
        const liSubj = createToggle(monName);
        homeworkTree.appendChild(liSubj);

        // danh sách bài
        const lessons = Object.values(monData)
            .filter(v => v && typeof v === "object");

        lessons
            .sort((a, b) => {
                const tA = a.title || a.lesson || "";
                const tB = b.title || b.lesson || "";
                return tA.localeCompare(tB, undefined, {
                    numeric: true,
                    sensitivity: "base"
                });
            })
            .forEach(t => {
                const liTask = document.createElement("li");
                liTask.textContent = t.title || t.lesson || "(Không tiêu đề)";
                liTask.style.cursor = "pointer";
                liTask.style.color = "blue";

                liTask.onclick = e => {
                    e.stopPropagation();

                    homeworkPopup.classList.remove("show");
                    btnHomework.classList.remove("active");

                    const preview = {
                        name: t.title || t.lesson || "(Không tiêu đề)",
                        meta: `Môn: ${monName}`,
                        content: t.content
                    };

                    localStorage.setItem(
                        "lesson_preview",
                        JSON.stringify(preview)
                    );

                    previewFrame.src = "preview.html";
                    previewFrame.style.display = "block";
                    bgSlider.style.display = "none";
                };

                liSubj.querySelector("ul").appendChild(liTask);
            });
    }
});




// ====== NÚT CHUYỂN TRANG CÓ PASS ======
async function checkPassAndRedirect(url) {
  const pass = prompt("Nhập mật khẩu để truy cập:");
  if (!pass) return;

  try {
    const snap = await get(ref(db, "/config/pass"));
    if (!snap.exists()) {
      alert("Không tìm thấy mật khẩu cấu hình!");
      return;
    }

    const PASS_HASH = snap.val(); 
    const hash = CryptoJS.SHA256(pass).toString(CryptoJS.enc.Hex);

    if (hash === PASS_HASH) window.location.href = url;
    else alert("Mật khẩu sai! Không thể truy cập.");
  } catch (err) {
    console.error("Lỗi kiểm tra pass:", err);
    alert("Lỗi kết nối Firebase, thử lại sau!");
  }
}

document.getElementById("gogiaoanBtn").addEventListener("click", ()=> checkPassAndRedirect("giaoan.html"));
document.getElementById("goadminBtn").addEventListener("click", ()=> checkPassAndRedirect("danhmuc.html"));

// ====== GOOGLE MEET ======
const gmeetLink = document.getElementById("gmeetLink");

if(gmeetLink){
  onValue(ref(db,"config/gmeet"), snap => {
    const url = snap.val();
    if(url && url.startsWith("https://")){
      gmeetLink.href = url;
      gmeetLink.textContent = "Google Meet";
      gmeetLink.style.opacity = "1";
      gmeetLink.style.pointerEvents = "auto";
    } else {
      gmeetLink.textContent = "Google Meet (chưa bật)";
      gmeetLink.removeAttribute("href");
      gmeetLink.style.opacity = "0.4";
      gmeetLink.style.pointerEvents = "none";
    }
  });

  gmeetLink.addEventListener("click", e => {
    e.preventDefault();
    if(!gmeetLink.href) return;
    checkPassAndRedirect(gmeetLink.href);
  });
}

// ====== UPDATE GOOGLE MEET ======
const updateGmeetBtn = document.getElementById("updateGmeetBtn");

if(updateGmeetBtn){
  updateGmeetBtn.addEventListener("click", async ()=>{
    const pass = prompt("Chỉ giáo viên mới được cập nhật.\nNhập mật khẩu:");
    if(!pass) return;

    try{
      const snap = await get(ref(db,"config/pass"));
      if(!snap.exists()){ alert("Chưa cấu hình mật khẩu!"); return; }

      const PASS_HASH = snap.val();
      const hash = CryptoJS.SHA256(pass).toString(CryptoJS.enc.Hex);
      if(hash !== PASS_HASH){ alert("❌ Sai mật khẩu! Không có quyền cập nhật."); return; }

      const newLink = prompt("Dán link Google Meet mới:");
      if(!newLink) return;
      if(!newLink.startsWith("https://")){ alert("Link Google Meet không hợp lệ!"); return; }

      await set(ref(db,"config/gmeet"), newLink);
      alert("✅ Đã cập nhật Google Meet thành công!");
    } catch(err){
      console.error("Update gmeet error:", err);
      alert("Lỗi khi cập nhật Google Meet!");
    }
  });
}

// ====== BG SLIDER AUTO ======
const slides = document.querySelectorAll(".bg-slide");
let currentSlide = 0;

function changeBackground(){
  if(!slides.length) return;
  slides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add("active");
}

if(slides.length){
  slides[0].classList.add("active");
  setInterval(changeBackground, 10000);
}
