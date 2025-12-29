// Minimal social features: signup/login (localStorage), posts, comments, likes
(() => {
  // storage helpers
  const STORE_USERS = 'vibe_users';
  const STORE_CUR = 'vibe_currentUser';
  const STORE_POSTS = 'vibe_posts';

  const $ = id => document.getElementById(id);

  function getUsers(){ return JSON.parse(localStorage.getItem(STORE_USERS) || '{}'); }
  function saveUsers(u){ localStorage.setItem(STORE_USERS, JSON.stringify(u)); }
  function getCurrent(){ return localStorage.getItem(STORE_CUR) || null; }
  function setCurrent(name){ if(name) localStorage.setItem(STORE_CUR, name); else localStorage.removeItem(STORE_CUR); }
  function getPosts(){ return JSON.parse(localStorage.getItem(STORE_POSTS) || '[]'); }
  function savePosts(p){ localStorage.setItem(STORE_POSTS, JSON.stringify(p)); }

  // UI helpers
  function showModal(html){ const m = $('modal'); m.classList.remove('hidden'); $('modal-content').innerHTML = html; }
  function closeModal(){ $('modal').classList.add('hidden'); $('modal-content').innerHTML = ''; }

  // forms
  function renderLogin(){
    showModal(`
      <h3>Login</h3>
      <div class="form-row"><input id="login-user" placeholder="username"></div>
      <div class="form-row"><input id="login-pass" placeholder="password" type="password"></div>
      <div style="text-align:right"><button id="login-submit" class="btn-primary">Login</button></div>
    `);
    $('login-submit').addEventListener('click', ()=>{
      const u = $('login-user').value.trim(); const p = $('login-pass').value;
      const users = getUsers();
      if(!u){ alert('Enter username'); return; }
      if(users[u] && users[u].password === p){ setCurrent(u); updateAuthUI(); closeModal(); }
      else alert('Invalid credentials');
    });
  }

  function renderSignup(){
    showModal(`
      <h3>Sign Up</h3>
      <div class="form-row"><input id="signup-user" placeholder="username"></div>
      <div class="form-row"><input id="signup-pass" placeholder="password" type="password"></div>
      <div style="text-align:right"><button id="signup-submit" class="btn-primary">Create</button></div>
    `);
    $('signup-submit').addEventListener('click', ()=>{
      const u = $('signup-user').value.trim(); const p = $('signup-pass').value;
      if(!u||!p){ alert('Enter username and password'); return; }
      const users = getUsers();
      if(users[u]){ alert('Username taken'); return; }
      users[u] = {password:p, created:Date.now()}; saveUsers(users); setCurrent(u); updateAuthUI(); closeModal();
    });
  }

  function socialLogin(provider){
    // simulate provider by creating a short username
    const name = provider + '_' + Math.random().toString(36).slice(2,8);
    const users = getUsers();
    users[name] = users[name] || {password: null, social:true};
    saveUsers(users); setCurrent(name); updateAuthUI();
  }

  // Posts
  function createPost(text){
    const user = getCurrent(); if(!user){ alert('Please sign in to post'); return; }
    if(!text||!text.trim()) return;
    const posts = getPosts();
    posts.unshift({id:Date.now(), author:user, text:text.trim(), time:Date.now(), likes:0, comments:[]});
    savePosts(posts); renderPosts(); $('postText').value='';
  }

  function renderPosts(){
    const container = $('posts'); container.innerHTML='';
    const posts = getPosts();
    if(posts.length===0) container.innerHTML='<div style="color:'+ '#6b7280' +'">No posts yet</div>';
    posts.forEach(p=>{
      const el = document.createElement('div'); el.className='post';
      el.innerHTML = `
        <div class="meta"><strong>${escapeHtml(p.author)}</strong> • ${new Date(p.time).toLocaleString()}</div>
        <div class="text">${escapeHtml(p.text)}</div>
        <div class="actions">
          <button data-id="${p.id}" class="btn-like">Like (${p.likes})</button>
          <button data-id="${p.id}" class="btn-comment">Comment</button>
        </div>
        <div class="comments" id="c-${p.id}">
          ${p.comments.map(c=>`<div class="comment"><strong>${escapeHtml(c.author)}</strong>: ${escapeHtml(c.text)}</div>`).join('')}
          <div style="margin-top:8px"><input placeholder="Write a comment" id="input-c-${p.id}" style="width:70%"><button data-id="${p.id}" class="btn-add-comment">Send</button></div>
        </div>
      `;
      container.appendChild(el);
    });

    // attach events
    document.querySelectorAll('.btn-like').forEach(b=> b.addEventListener('click', e=>{
      const id = Number(e.currentTarget.dataset.id); const posts = getPosts();
      const idx = posts.findIndex(x=>x.id===id); if(idx>-1){ posts[idx].likes++; savePosts(posts); renderPosts(); }
    }));

    document.querySelectorAll('.btn-add-comment').forEach(b=> b.addEventListener('click', e=>{
      const id = Number(e.currentTarget.dataset.id); const input = $(`input-c-${id}`) || $(`input-c-${id}`);
      const val = (document.getElementById(`input-c-${id}`) || {}).value || '';
      const user = getCurrent(); if(!user){ alert('Sign in to comment'); return; }
      if(!val.trim()) return;
      const posts = getPosts(); const idx = posts.findIndex(x=>x.id===id);
      if(idx>-1){ posts[idx].comments.push({id:Date.now(), author:user, text:val.trim(), time:Date.now()}); savePosts(posts); renderPosts(); }
    }));
  }

  function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  function updateAuthUI(){ const cur = getCurrent(); const curSpan = $('currentUser');
    if(cur){ curSpan.textContent = cur; $('btn-show-login').style.display='none'; $('btn-show-signup').style.display='none'; $('btn-logout').style.display='inline-block'; }
    else{ curSpan.textContent = 'Not signed in'; $('btn-show-login').style.display='inline-block'; $('btn-show-signup').style.display='inline-block'; $('btn-logout').style.display='none'; }
  }

  // events
  document.addEventListener('DOMContentLoaded', ()=>{
    updateAuthUI(); renderPosts();
    // buttons
    $('btn-show-login').addEventListener('click', renderLogin);
    $('btn-show-signup').addEventListener('click', renderSignup);
    $('modal-close').addEventListener('click', closeModal);
    document.querySelectorAll('.social-btn').forEach(b=> b.addEventListener('click', e=>{
      const provider = e.currentTarget.dataset.provider || 'Social'; socialLogin(provider);
    }));
    $('btn-post').addEventListener('click', ()=> createPost($('postText').value));
    $('btn-logout').addEventListener('click', ()=>{ setCurrent(null); updateAuthUI(); });
    $('ad-action').addEventListener('click', ()=>{ alert('Thanks for checking the ad — this is a demo.'); });
  });

  // expose for tests
  window.vibe = {getUsers, getPosts, getCurrent, createPost, renderPosts};

})();
