import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

window.addEventListener('DOMContentLoaded', () => {

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

  const gvIDInput = document.getElementById('gvIDInput');
  const gvNameDisplay = document.getElementById('gvNameDisplay');
  const subjectSelect = document.getElementById('subjectSelect');
  const lessonName = document.getElementById('lessonName');
  const lessonHours = document.getElementById('lessonHours');
  const lessonDate = document.getElementById('lessonDate');
  const lessonFile = document.getElementById('lessonFile');
  const lessonYT = document.getElementById('lessonYT');
  const lessonGMeet = document.getElementById('lessonGMeet');
  const ytPreview = document.getElementById('ytPreview');
  const lessonList = document.getElementById('lessonList');
  const addLessonBtn = document.getElementById('addLesson');
  const saveLessonBtn = document.getElementById('saveLesson');
  const goBaigiangBtn = document.getElementById('goBaigiang');

  let currentGVKey = null;
  let selectedLessonKey = null;

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

  function setFormEnabled(enable){
    [lessonName, lessonHours, lessonDate, lessonFile, lessonYT, lessonGMeet, subjectSelect, addLessonBtn, saveLessonBtn, goBaigiangBtn]
      .forEach(el => { if(el) el.disabled = !enable; });
  }

  // --- Chuyển link Google Drive sang /preview ---
  function normalizeDriveLink(url){
    if(!url) return '';
    if(url.includes('drive.google.com')){
      if(url.includes('/file/d/')) return url.replace(/\/view(\?usp=.*)?$/,'/preview');
      if(url.includes('uc?export=download')){
        const match = url.match(/id=([a-zA-Z0-9_-]+)/);
        if(match) return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return url;
  }

  // --- Load môn học ---
  function loadSubjects(){
    if(!subjectSelect) return;
    onValue(ref(db,'monhoc'), snapshot=>{
      const data = snapshot.val()||{};
      subjectSelect.innerHTML='';
      for(const k in data){
        const opt = document.createElement('option');
        opt.value = k;
        opt.text = data[k].name;
        subjectSelect.appendChild(opt);
      }
      renderLessons();
    }, {onlyOnce:true});
  }

  if(gvIDInput){
    gvIDInput.addEventListener('input', ()=>{
      const id = gvIDInput.value.trim();
      currentGVKey = null;
      if(gvNameDisplay) gvNameDisplay.innerText='';
      setFormEnabled(false);
      if(!id) return;

      onValue(ref(db,'giaovien'), snapshot=>{
        const data = snapshot.val()||{};
        for(const k in data){
          if(data[k].id === id){
            currentGVKey = k;
            gvNameDisplay.innerText = data[k].name;
            setFormEnabled(true);
            loadSubjects();
            break;
          }
        }
        if(!currentGVKey) gvNameDisplay.innerText='ID không tồn tại';
      }, {onlyOnce:true});
    });
  }

  function renderLessons(){
    if(!lessonList) return;
    lessonList.innerHTML='';
    if(!currentGVKey) return;

    onValue(ref(db,'baigiang'), snapshot=>{
      const data = snapshot.val()||{};
      for(const subjKey in data){
        const lessons = data[subjKey];
        const gvLessons = {};
        for(const lKey in lessons){
          if(lessons[lKey].gvID===currentGVKey) gvLessons[lKey]=lessons[lKey];
        }
        if(Object.keys(gvLessons).length===0) continue;

        const div = document.createElement('div');
        div.className='lessonGroup';
        const subjName = subjectSelect.querySelector(`option[value="${subjKey}"]`)?.text || 'Unknown';
        div.innerHTML=`<h3>Môn học: ${subjName} <button class="delSubjectBtn">Xóa môn</button></h3>`;

        const table = document.createElement('table');
        table.className='lessonTable';
        table.innerHTML=`<thead><tr>
          <th>STT</th><th>Tên bài giảng</th><th>Số tiết</th><th>Ngày</th>
          <th>File</th><th>Youtube</th><th>GMeet</th><th>Xóa</th>
        </tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');

        let i=1;
        for(const k in gvLessons){
          const l = gvLessons[k];
          const row = document.createElement('tr');
          row.innerHTML=`<td>${i++}</td><td>${l.name||''}</td><td>${l.hours||''}</td><td>${l.date||''}</td>
            <td>${l.file||''}</td><td>${l.yt||''}</td><td>${l.gmeet||''}</td>
            <td><button class="delLessonBtn" data-subj="${subjKey}" data-key="${k}">Xóa</button></td>`;

          row.addEventListener('click', ()=>{
            selectedLessonKey = k;
            subjectSelect.value = subjKey;
            lessonName.value = l.name||'';
            lessonHours.value = l.hours||'';
            lessonDate.value = l.date||'';
            lessonFile.value = l.file||'';
            lessonYT.value = l.yt||'';
            lessonGMeet.value = l.gmeet||'';

            if(ytPreview){
              let ytEmbed = '';
              if(l.yt){
                if(l.yt.includes('youtube.com/watch')){
                  const videoId = new URL(l.yt).searchParams.get('v');
                  ytEmbed = `https://www.youtube.com/embed/${videoId}`;
                } else if(l.yt.includes('youtu.be/')){
                  const videoId = l.yt.split('/').pop();
                  ytEmbed = `https://www.youtube.com/embed/${videoId}`;
                } else ytEmbed = l.yt;
              }
              ytPreview.innerHTML = ytEmbed ? `<iframe width="200" height="100" src="${ytEmbed}" frameborder="0" allowfullscreen></iframe>` : '';
            }
          });
          tbody.appendChild(row);
        }

        div.appendChild(table);
        lessonList.appendChild(div);

        const delSubjectBtn = div.querySelector('.delSubjectBtn');
        if(delSubjectBtn){
          delSubjectBtn.addEventListener('click', ()=>{
            if(confirm('Xóa tất cả bài giảng môn này của giáo viên?')){
              for(const k in gvLessons){
                remove(ref(db,'baigiang/'+subjKey+'/'+k));
              }
              notify('Đã xóa môn học của giáo viên');
            }
          });
        }

        div.querySelectorAll('.delLessonBtn').forEach(btn=>{
          btn.addEventListener('click', e=>{
            e.stopPropagation();
            const key = btn.dataset.key;
            const subj = btn.dataset.subj;
            remove(ref(db,'baigiang/'+subj+'/'+key));
            notify('Đã xóa bài giảng');
          });
        });
      }
    });
  }

  if(addLessonBtn){
    addLessonBtn.addEventListener('click', ()=>{
      if(!currentGVKey){ notify('Nhập ID giáo viên đúng'); return; }
      if(!lessonName.value.trim()){ notify('Nhập tên bài giảng'); return; }
      const obj = {
        name: lessonName.value.trim(),
        hours: lessonHours.value,
        date: lessonDate.value,
        file: normalizeDriveLink(lessonFile.value.trim()),
        yt: lessonYT.value.trim(),
        gmeet: lessonGMeet.value.trim(),
        gvID: currentGVKey
      };
      push(ref(db,'baigiang/'+subjectSelect.value), obj);
      lessonName.value=''; lessonHours.value=''; lessonDate.value='';
      lessonFile.value=''; lessonYT.value=''; lessonGMeet.value='';
      ytPreview.innerHTML='';
      selectedLessonKey = null;
      renderLessons();
      notify('Đã thêm bài giảng');
    });
  }

  if(saveLessonBtn){
    saveLessonBtn.addEventListener('click', ()=>{
      if(!selectedLessonKey){ notify('Chọn bài cần lưu'); return; }
      const obj = {
        name: lessonName.value,
        hours: lessonHours.value,
        date: lessonDate.value,
        file: normalizeDriveLink(lessonFile.value.trim()),
        yt: lessonYT.value,
        gmeet: lessonGMeet.value,
        gvID: currentGVKey
      };
      set(ref(db,'baigiang/'+subjectSelect.value+'/'+selectedLessonKey), obj);
      lessonName.value=''; lessonHours.value=''; lessonDate.value='';
      lessonFile.value=''; lessonYT.value=''; lessonGMeet.value='';
      ytPreview.innerHTML='';
      selectedLessonKey = null;
      renderLessons();
      notify('Đã lưu bài giảng');
    });
  }

  if(lessonYT && ytPreview){
    lessonYT.addEventListener('input', ()=>{
      const url = lessonYT.value.trim();
      let ytEmbed = '';
      if(url){
        if(url.includes('youtube.com/watch')){
          const videoId = new URL(url).searchParams.get('v');
          ytEmbed = `https://www.youtube.com/embed/${videoId}`;
        } else if(url.includes('youtu.be/')){
          const videoId = url.split('/').pop();
          ytEmbed = `https://www.youtube.com/embed/${videoId}`;
        } else ytEmbed = url;
      }
      ytPreview.innerHTML = ytEmbed ? `<iframe width="200" height="100" src="${ytEmbed}" frameborder="0" allowfullscreen></iframe>` : '';
    });
  }

  if(goBaigiangBtn){
    goBaigiangBtn.addEventListener('click', ()=>window.location.href='baigiang.html');
  }

  setFormEnabled(false);

});
