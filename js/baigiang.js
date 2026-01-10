import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAFYzJMv3HYJwo7SbpD_kAQuqx_zMoMBj8",
  authDomain: "english-teaching-e4242.firebaseapp.com",
  databaseURL: "https://english-teaching-e4242-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "english-teaching-e4242",
  storageBucket: "english-teaching-e4242.appspot.com",
  messagingSenderId: "196358725024",
  appId: "1:196358725024:web:c82e9fc5f4e809cccc98c5"
};

// Khởi tạo app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

// DOM
const gvContainer = document.getElementById('gvContainer');
const goGiaoanBtn = document.getElementById('goGiaoan');
goGiaoanBtn.addEventListener('click', () => window.location.href = 'giaoan.html');

// Lấy danh sách môn học
let monHocMap = {};
onValue(ref(db, 'monhoc'), snap => {
  const data = snap.val() || {};
  for (const key in data) {
    monHocMap[key] = data[key].name;
  }
});

// Render bài giảng
function renderBaigiang() {
  onValue(ref(db, 'giaovien'), snapshot => {
    const gvData = snapshot.val() || {};
    gvContainer.innerHTML = '';

    for (const gvKey in gvData) {
      const gv = gvData[gvKey];
      const card = document.createElement('div');
      card.className = 'gvCard';
      card.innerHTML = `<h2>${gv.name}</h2>`;
      gvContainer.appendChild(card);

      const lessonsDiv = document.createElement('div');
      card.appendChild(lessonsDiv);

      onValue(ref(db, 'baigiang'), snapLesson => {
        const lessonsData = snapLesson.val() || {};
        lessonsDiv.innerHTML = ''; 

        for (const subjKey in lessonsData) {
          const subjLessons = Object.values(lessonsData[subjKey])
            .filter(l => l.gvID === gvKey);
          if (subjLessons.length === 0) continue;

          const subjTitle = document.createElement('div');
          subjTitle.className = 'subjectTitle';
          subjTitle.textContent = `Môn: ${monHocMap[subjKey] || subjKey}`;
          lessonsDiv.appendChild(subjTitle);

          const wrapper = document.createElement('div');
          wrapper.className = 'tableWrapper';
          lessonsDiv.appendChild(wrapper);

          const table = document.createElement('table');
          table.className = 'lessonTable';
          table.innerHTML = `<thead>
            <tr>
              <th>STT</th><th>Dạy</th><th>Tên bài giảng</th><th>File</th><th>Số tiết</th><th>Ngày</th>
              <th>Youtube</th><th>GMeet</th>
            </tr>
          </thead><tbody></tbody>`;
          wrapper.appendChild(table);
          const tbody = table.querySelector('tbody');

          subjLessons.forEach((l, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${i + 1}</td>
                            <td><button class="teachBtn">Dạy</button></td>
                            <td>${l.name || ''}</td>
                            <td>${l.file || ''}</td>
                            <td>${l.hours || ''}</td>
                            <td>${l.date || ''}</td>
                            <td>${l.yt || ''}</td>
                            <td>${l.gmeet || ''}</td>`;
            tr.querySelector('.teachBtn').addEventListener('click', () => {
              localStorage.setItem('teachingData', JSON.stringify({
                ...l,
                gvName: gv.name,
                subjName: monHocMap[subjKey] || subjKey
              }));
              window.location.href = 'teaching.html';
            });
            tbody.appendChild(tr);
          });
        }
      }, { onlyOnce: true });
    }
  });
}

renderBaigiang();
