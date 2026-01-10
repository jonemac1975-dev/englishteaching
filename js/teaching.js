// teaching.js
import { db } from "./firebase.js"; // chỉ import db 1 lần
import { ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// ====== ELEMENT ======
const lessonTree = document.getElementById("lessonTree");
const homeworkTree = document.getElementById("homeworkTree");
const previewFrame = document.getElementById("previewFrame");
const bgSlider = document.getElementById("bgSlider");

// ====== HELPER: tạo toggle ======
function createToggle(text) {
    const li = document.createElement("li");
    li.classList.add("tree-item");
    const span = document.createElement("span");
    span.classList.add("toggle");
    span.textContent = "▶ " + text;
    span.style.cursor = "pointer";
    li.appendChild(span);
    const ul = document.createElement("ul");
    ul.style.display = "none";
    li.appendChild(ul);

    // Toggle open/close
    span.addEventListener("click", e => {
        e.stopPropagation();
        if (ul.style.display === "none") {
            ul.style.display = "block";
            span.textContent = "▼ " + text;
        } else {
            ul.style.display = "none";
            span.textContent = "▶ " + text;
        }
    });

    return li;
}

// ====== LOAD DATA ======
let monhocMap = {};
let giaovienMap = {};

// Load môn học
onValue(ref(db,"monhoc"), snap=>{
    const data = snap.val() || {};
    for(const k in data) monhocMap[k] = data[k].name;
});

// Load giáo viên
onValue(ref(db,"giaovien"), snap=>{
    const data = snap.val() || {};
    for(const k in data) giaovienMap[k] = data[k].name;
});

// ====== LOAD BÀI GIẢNG ======
onValue(ref(db,"baigiang"), snap=>{
    const data = snap.val() || {};
    lessonTree.innerHTML = "";

    for(const subjKey in data){
        const lessons = data[subjKey];
        const gvMap = {};

        // Nhóm theo gvID
        for(const k in lessons){
            const l = lessons[k];
            if(!gvMap[l.gvID]) gvMap[l.gvID] = [];
            gvMap[l.gvID].push({subjKey, lesson: l});
        }

        for(const gvID in gvMap){
            const liGV = createToggle(giaovienMap[gvID] || gvID);
            lessonTree.appendChild(liGV);

            gvMap[gvID].forEach(item=>{
                const liSubj = createToggle(monhocMap[item.subjKey] || item.subjKey);
                liGV.querySelector("ul").appendChild(liSubj);

                const liLesson = document.createElement("li");
                liLesson.textContent = item.lesson.name;
                liLesson.style.cursor = "pointer";
                liLesson.addEventListener("click", e=>{
                    e.stopPropagation();
                    const preview = {
                        name: item.lesson.name,
                        meta: `GV: ${giaovienMap[gvID] || gvID} | Môn: ${monhocMap[item.subjKey] || item.subjKey} | Ngày: ${item.lesson.date}`,
                        content: item.lesson.content
                    };
                    localStorage.setItem("lesson_preview", JSON.stringify(preview));
                    previewFrame.src = "preview.html";
                    previewFrame.style.display = "block";
                    bgSlider.style.display = "none";
                });
                liSubj.querySelector("ul").appendChild(liLesson);
            });
        }
    }
});

// ====== LOAD BÀI TẬP ======
onValue(ref(db,"baitap"), snap=>{
    const data = snap.val() || {};
    homeworkTree.innerHTML = "";

    for(const subjKey in data){
        const liSubj = createToggle(monhocMap[subjKey] || subjKey);
        homeworkTree.appendChild(liSubj);

        const lessons = data[subjKey];
        for(const k in lessons){
            const t = lessons[k];

            const liLesson = createToggle(t.lesson);
            liSubj.querySelector("ul").appendChild(liLesson);

            const liTask = document.createElement("li");
            liTask.textContent = t.title || t.name;
            liTask.style.cursor = "pointer";
            liTask.addEventListener("click", e=>{
                e.stopPropagation();
                const preview = {
                    name: t.title || t.name,
                    meta: `Môn: ${monhocMap[subjKey] || subjKey} | Bài học: ${t.lesson}`,
                    content: t.content
                };
                localStorage.setItem("lesson_preview", JSON.stringify(preview));
                previewFrame.src = "preview.html";
                previewFrame.style.display = "block";
                bgSlider.style.display = "none";
            });
            liLesson.querySelector("ul").appendChild(liTask);
        }
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
        // Hash SHA256 với CryptoJS (đã load <script> trong HTML)
        const hash = CryptoJS.SHA256(pass).toString(CryptoJS.enc.Hex);

        if (hash === PASS_HASH) {
            window.location.href = url;
        } else {
            alert("Mật khẩu sai! Không thể truy cập.");
        }
    } catch (err) {
        console.error("Lỗi kiểm tra pass:", err);
        alert("Lỗi kết nối Firebase, thử lại sau!");
    }
}

// Gán sự kiện cho 2 nút
document.getElementById("gogiaoanBtn").addEventListener("click", ()=> checkPassAndRedirect("giaoan.html"));
document.getElementById("goadminBtn").addEventListener("click", ()=> checkPassAndRedirect("danhmuc.html"));

// ====== GOOGLE MEET (GLOBAL) ======
const gmeetLink = document.getElementById("gmeetLink");

if (gmeetLink) {
    // Load link từ Firebase
    onValue(ref(db, "config/gmeet"), snap => {
        const url = snap.val();

        if (url && url.startsWith("https://")) {
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

    // 🔐 Bắt nhập pass khi click Google Meet
    gmeetLink.addEventListener("click", e => {
        e.preventDefault();
        if (!gmeetLink.href) return;
        checkPassAndRedirect(gmeetLink.href);
    });
}

// ====== UPDATE GOOGLE MEET (CÓ PASS) ======
const updateGmeetBtn = document.getElementById("updateGmeetBtn");

if (updateGmeetBtn) {
    updateGmeetBtn.addEventListener("click", async () => {
        // 1. HỎI PASS TRƯỚC
        const pass = prompt("Chỉ giáo viên mới được cập nhật.\nNhập mật khẩu:");
        if (!pass) return;

        try {
            const snap = await get(ref(db, "config/pass"));
            if (!snap.exists()) {
                alert("Chưa cấu hình mật khẩu!");
                return;
            }

            const PASS_HASH = snap.val();
            const hash = CryptoJS.SHA256(pass).toString(CryptoJS.enc.Hex);

            // 2. SAI PASS → DỪNG NGAY
            if (hash !== PASS_HASH) {
                alert("❌ Sai mật khẩu! Không có quyền cập nhật.");
                return;
            }

            // 3. ĐÚNG PASS → MỚI CHO NHẬP LINK
            const newLink = prompt("Dán link Google Meet mới:");
            if (!newLink) return;

            if (!newLink.startsWith("https://")) {
                alert("Link Google Meet không hợp lệ!");
                return;
            }

            // 4. LƯU VÀO FIREBASE
            await set(ref(db, "config/gmeet"), newLink);
            alert("✅ Đã cập nhật Google Meet thành công!");

        } catch (err) {
            console.error("Update gmeet error:", err);
            alert("Lỗi khi cập nhật Google Meet!");
        }
    });
}

// ====== BG SLIDER AUTO (10s) ======
const slides = document.querySelectorAll(".bg-slide");
let currentSlide = 0;

function changeBackground() {
    if (!slides.length) return;

    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
}

// bật slide đầu
if (slides.length) {
    slides[0].classList.add("active");
    setInterval(changeBackground, 10000); // 10 giây
}
