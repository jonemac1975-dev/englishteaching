// js/danhmuc.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAFYzJMv3HYJwo7SbpD_kAQuqx_zMoMBj8",
  authDomain: "english-teaching-e4242.firebaseapp.com",
  databaseURL: "https://english-teaching-e4242-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "english-teaching-e4242",
  storageBucket: "english-teaching-e4242.appspot.com",
  messagingSenderId: "196358725024",
  appId: "1:196358725024:web:c82e9fc5f4e809cccc98c5"
};

// tránh duplicate app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

// ======================================================
// Helpers
// ======================================================
function notify(msg){
  const n = document.createElement('div');
  n.innerText = msg;
  n.style.position='fixed';
  n.style.top='10px';
  n.style.right='10px';
  n.style.background='#0a0';
  n.style.color='#fff';
  n.style.padding='5px 10px';
  n.style.borderRadius='5px';
  document.body.appendChild(n);
  setTimeout(()=>document.body.removeChild(n),2000);
}

async function hashPass(pass){
  const encoder = new TextEncoder();
  const data = encoder.encode(pass);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

// ======================================================
// Render table
// ======================================================
function renderTable(data, table, inputField, keyField='name'){
  const tbody = table.querySelector('tbody');
  if(!tbody) return;
  tbody.innerHTML='';
  let i=1;
  for(const key in data){
    const item = data[key];
    const value = item[keyField] || '';
    const row = document.createElement('tr');
    row.innerHTML = `<td>${i++}</td><td>${value}</td>`;
    row.addEventListener('click', ()=>{
      inputField.value = value;
      inputField.dataset.key = key;
    });
    tbody.appendChild(row);
  }
}

// ======================================================
// Setup danh mục
// ======================================================
function setupCategory(input, table, path){
  const r = ref(db, path);
  onValue(r, snapshot=>{
    renderTable(snapshot.val()||{}, table, input);
  });

  document.getElementById('add'+input.id.replace('input','')).addEventListener('click', ()=>{
    const v = input.value.trim();
    if(!v){ notify('Nhập giá trị!'); return; }
    push(r,{ name:v });
    input.value='';
    notify('Đã thêm');
  });

  document.getElementById('save'+input.id.replace('input','')).addEventListener('click', ()=>{
    const key = input.dataset.key;
    if(!key){ notify('Chọn dòng cần sửa'); return; }
    set(ref(db, path+'/'+key), { name: input.value });
    notify('Đã lưu');
  });

  document.getElementById('del'+input.id.replace('input','')).addEventListener('click', ()=>{
    const key = input.dataset.key;
    if(!key){ notify('Chọn dòng cần xóa'); return; }
    remove(ref(db, path+'/'+key));
    input.value=''; delete input.dataset.key;
    notify('Đã xóa');
  });
}

// ======================================================
// Giáo viên
// ======================================================
const gvInput = {
  name: document.getElementById('gvName'),
  gt: document.getElementById('gvGT'),
  ns: document.getElementById('gvNS'),
  sdt: document.getElementById('gvSDT'),
  hh: document.getElementById('gvHH'),
  cm: document.getElementById('gvCM'),
  cv: document.getElementById('gvCV'),
  pb: document.getElementById('gvPB'),
  mail: document.getElementById('gvMail'),
  fb: document.getElementById('gvFB'),
  zalo: document.getElementById('gvZalo'),
  id: document.getElementById('gvID'),
  img: document.getElementById('imgGV'),
  preview: document.getElementById('imgPreview')
};

const tableGV = document.getElementById('tableGV');
let selectedGV = null;

// ✅ thêm biến lưu ảnh hiện tại (ảnh cũ)
let currentGVImage = "";

// ======================================================
// Load dropdown
// ======================================================
function loadDropdown(id, path){
  const sel = document.getElementById(id);
  onValue(ref(db,path), snapshot=>{
    sel.innerHTML='';
    const data = snapshot.val()||{};
    for(const k in data){
      const name = data[k].name;
      const opt = document.createElement('option');
      opt.value=name;
      opt.text=name;
      sel.appendChild(opt);
    }
  });
}

// ======================================================
// Get GV data (đã fix ảnh)
// ======================================================
function getGVData(){
  return {
    name: gvInput.name.value,
    gt: gvInput.gt.value,
    ns: gvInput.ns.value,
    sdt: gvInput.sdt.value,
    hh: gvInput.hh.value,
    cm: gvInput.cm.value,
    cv: gvInput.cv.value,
    pb: gvInput.pb.value,
    mail: gvInput.mail.value,
    fb: gvInput.fb.value,
    zalo: gvInput.zalo.value,
    id: gvInput.gt.value[0]+gvInput.ns.value.replaceAll('/',''),

    // ✅ Giữ ảnh cũ nếu không upload ảnh mới
    img:
      gvInput.preview.dataset.base64 !== undefined
        ? gvInput.preview.dataset.base64
        : currentGVImage
  };
}

// ======================================================
// Load danh sách giáo viên
// ======================================================
const gvRef = ref(db,'giaovien');
onValue(gvRef, snapshot=>{
  const data = snapshot.val()||{};
  const tbody = tableGV.querySelector('tbody');
  tbody.innerHTML='';
  let i=1;

  for(const k in data){
    const gv = data[k];
    const row = document.createElement('tr');
    row.innerHTML=`
      <td>${i++}</td>
      <td>${gv.name||''}</td>
      <td>${gv.gt||''}</td>
      <td>${gv.ns||''}</td>
      <td>${gv.sdt||''}</td>
      <td>${gv.hh||''}</td>
      <td>${gv.cm||''}</td>
      <td>${gv.cv||''}</td>
      <td>${gv.pb||''}</td>
      <td>${gv.mail||''}</td>
      <td>${gv.fb||''}</td>
      <td>${gv.zalo||''}</td>
      <td>${gv.id||''}</td>
    `;

    row.addEventListener('click', ()=>{
      selectedGV = k;

      // ✅ Lưu ảnh cũ để không bị mất
      currentGVImage = gv.img || "";

      gvInput.name.value = gv.name || '';
      gvInput.gt.value = gv.gt || 'Nam';
      gvInput.ns.value = gv.ns || '';
      gvInput.sdt.value = gv.sdt || '';
      gvInput.hh.value = gv.hh || '';
      gvInput.cm.value = gv.cm || '';
      gvInput.cv.value = gv.cv || '';
      gvInput.pb.value = gv.pb || '';
      gvInput.mail.value = gv.mail || '';
      gvInput.fb.value = gv.fb || '';
      gvInput.zalo.value = gv.zalo || '';
      gvInput.id.value = gv.id || '';

      gvInput.preview.src = gv.img || '';
      gvInput.preview.dataset.base64 = gv.img || '';
    });

    tbody.appendChild(row);
  }
});

// ======================================================
// Add / Save / Delete giáo viên
// ======================================================
document.getElementById('addGV').addEventListener('click', ()=>{
  set(push(gvRef), getGVData());
  notify('Đã thêm giáo viên');
});

document.getElementById('saveGV').addEventListener('click', ()=>{
  if(!selectedGV){ notify('Chọn giáo viên cần sửa'); return; }
  set(ref(db,'giaovien/'+selectedGV), getGVData());
  notify('Đã lưu giáo viên');
});

document.getElementById('delGV').addEventListener('click', ()=>{
  if(!selectedGV){ notify('Chọn giáo viên cần xóa'); return; }
  remove(ref(db,'giaovien/'+selectedGV));
  Object.values(gvInput).forEach(el=>{
    if(el.tagName==='INPUT') el.value='';
    if(el.tagName==='IMG') el.src='';
  });
  currentGVImage = "";
  selectedGV=null;
  notify('Đã xóa giáo viên');
});

// ======================================================
// Nút footer
// ======================================================
document.getElementById('goMain').addEventListener('click', ()=>{ window.location.href='teaching.html'; });
document.getElementById('exportJSON').addEventListener('click', ()=>{ notify('Chức năng xuất JSON chưa triển khai'); });
document.getElementById('importJSON').addEventListener('click', ()=>{ notify('Chức năng nạp JSON chưa triển khai'); });

// ======================================================
// Đổi pass
// ======================================================
document.getElementById('changePassBtn').addEventListener('click', async ()=>{
  const oldPass = prompt('Nhập mật khẩu hiện tại');
  const passRef = ref(db,'config/pass');
  const snap = await get(passRef);
  const storedHash = snap.val();
  if(storedHash){
    const oldHash = await hashPass(oldPass);
    if(oldHash!==storedHash){ notify('Sai mật khẩu hiện tại!'); return; }
  }
  const newPass = prompt('Nhập mật khẩu mới');
  if(!newPass){ notify('Không thể để trống'); return; }
  const newHash = await hashPass(newPass);
  set(passRef,newHash);
  notify('Đổi pass thành công');
});

// ======================================================
// Tabs UI
// ======================================================
const tabs = document.querySelectorAll('.tabBtn');
const tabContents = document.querySelectorAll('.tabContent');
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    tabContents.forEach(sec=>sec.classList.remove('active'));
    const sel = document.getElementById(btn.dataset.tab);
    if(sel) sel.classList.add('active');
  });
});

// ======================================================
// Init danh mục
// ======================================================
setupCategory(document.getElementById('inputMonHoc'), document.getElementById('tableMonHoc'),'monhoc');
setupCategory(document.getElementById('inputHocHam'), document.getElementById('tableHocHam'),'hocham');
setupCategory(document.getElementById('inputChuyenMon'), document.getElementById('tableChuyenMon'),'chuyenmon');
setupCategory(document.getElementById('inputChucVu'), document.getElementById('tableChucVu'),'chucvu');
setupCategory(document.getElementById('inputPhongBan'), document.getElementById('tablePhongBan'),'phongban');

// Load dropdowns
loadDropdown('gvHH','hocham');
loadDropdown('gvCM','chuyenmon');
loadDropdown('gvCV','chucvu');
loadDropdown('gvPB','phongban');

// ======================================================
// Ảnh preview
// ======================================================
gvInput.img.addEventListener('change',(e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload=(ev)=>{
    gvInput.preview.src = ev.target.result;
    gvInput.preview.dataset.base64 = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('delImg').addEventListener('click',()=>{
  gvInput.preview.src='';
  gvInput.img.value='';
  gvInput.preview.dataset.base64='';
  currentGVImage = "";
});
