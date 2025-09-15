// -------- State --------
let data = {};
let commentsData = {};

let activeCategory = 'genres';
let selectedItem = null;        
let selectedAuthor = null;      
let selectedSeries = null;      
let selectedTitle = null;       

// -------- Elements --------
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const quickBtns = document.querySelectorAll('.quick-buttons button');
const menuBtn = document.getElementById('menuBtn');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarList = document.getElementById('sidebarList');
const topbarControls = document.getElementById('topbarControls');
const categoryName = document.getElementById('categoryName');
const topicTitle = document.getElementById('topicTitle');
const commentInput = document.getElementById('commentInput');
const modal = document.getElementById('modal');
const sortButtons = document.querySelectorAll('.sort-buttons button');
const commentsContainer = document.getElementById('comments');

// -------- Helpers --------
function isMobile() { return window.innerWidth < 768; }

function getItemsForCategory(cat){
  if(cat === 'genres') return data.genres.slice();
  if(cat === 'authors') return Object.keys(data.authors);
  if(cat === 'series') return Object.keys(data.series);
  if(cat === 'titles') return Object.keys(data.titles);
  return [];
}

function updateHeaderText(){
  categoryName.textContent = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
  topicTitle.textContent = selectedItem || 'Select a topic';
}

// -------- Sidebar --------
function updateSidebarList(cat){
  sidebarList.innerHTML = '';
  const items = getItemsForCategory(cat);
  items.forEach(item=>{
    const el = document.createElement('div');
    el.className = 'sidebar-item';
    el.textContent = item;
    el.tabIndex = 0;
    el.setAttribute('role','button');
    el.onclick = () => {
      selectedItem = item;
      if(cat === 'authors'){ selectedAuthor = item; selectedSeries = null; selectedTitle = null; }
      if(cat === 'series'){ selectedSeries = item; selectedAuthor = null; selectedTitle = null; }
      if(cat === 'titles'){ selectedTitle = item; selectedAuthor = null; selectedSeries = null; }
      updateHeaderText();
      renderTopbarControls();
      highlightSidebarActive();
      if (isMobile()) closeSidebar();
    };
    el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); el.click(); } });
    sidebarList.appendChild(el);
  });
  highlightSidebarActive();
}

function highlightSidebarActive(){
  const nodes = sidebarList.querySelectorAll('.sidebar-item');
  nodes.forEach(n=>{
    n.classList.toggle('active', selectedItem && n.textContent === selectedItem);
  });
}

// -------- Comments --------
function renderComments(title) {
  commentsContainer.innerHTML = '';

  if (!title || !commentsData[title]) {
    commentsContainer.innerHTML = '<p class="no-comments">No comments yet.</p>';
    return;
  }

  commentsData[title].forEach(c => {
    const div = document.createElement('div');
    div.className = 'comment';
    div.setAttribute('data-time', c.time);

    div.innerHTML = `
      <div class="comment-avatar" style="background:#444;"></div>
      <div class="comment-content">
        <div class="comment-username">Anonymous</div>
        <div class="comment-time">${new Date(c.time).toLocaleString()}</div>
        <div class="comment-rating">Rating: <span class="stars">★★★★★ ${c.rating.toFixed(1)}</span></div>
        <div class="comment-text">${c.text}</div>
        <div class="comment-footer">
          <div class="reply-link">Reply</div>
<div class="comment-actions">
  <span>💬 ${c.replies || 0}</span>
  <span>👍 ${c.upvotes || 0}</span>
</div>
        </div>
      </div>
    `;

    commentsContainer.appendChild(div);
  });

  const activeSortBtn = document.querySelector('.sort-buttons button.active');
  if (activeSortBtn) sortComments(activeSortBtn.dataset.sort);
}

// -------- Topbar contextual controls --------
function clearTopbarControls(){
  topbarControls.innerHTML = '';
  const dot = document.createElement('div'); 
  dot.className='address-dot'; 
  dot.setAttribute('aria-hidden','true');
  topbarControls.appendChild(dot);
}

function renderTopbarControls() {
  clearTopbarControls();

  function makeSelect(options = [], value = null, className = 'topic-select') {
    const s = document.createElement('select');
    s.className = className;
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.text = opt;
      s.appendChild(o);
    });
    if (value !== null && options.includes(value)) s.value = value;
    return s;
  }

  // ---- GENRES ----
  if (activeCategory === 'genres') {
    selectedItem = selectedItem || data.genres[0];
    topicTitle.textContent = selectedItem;
  }

  // ---- AUTHORS ----
  else if (activeCategory === 'authors') {
    selectedAuthor = selectedAuthor || Object.keys(data.authors)[0];
    selectedItem = selectedAuthor;
    topicTitle.textContent = selectedAuthor;

    // Titles by this author
    const titles = data.authors[selectedAuthor].titles || [];
    if (titles.length) {
      const selTitles = makeSelect(titles, selectedTitle || null, 'topic-subselect');
      selTitles.addEventListener('change', () => {
        selectedTitle = selTitles.value;
        switchCategory('titles', selectedTitle);
      });
      topbarControls.appendChild(selTitles);
    }

    // Series by this author
    const sers = data.authors[selectedAuthor].series || [];
    if (sers.length) {
      const selSeries = makeSelect(sers, selectedSeries || null, 'topic-subselect');
      selSeries.addEventListener('change', () => {
        selectedSeries = selSeries.value;
        switchCategory('series', selectedSeries);
      });
      topbarControls.appendChild(selSeries);
    }
  }

  // ---- SERIES ----
  else if (activeCategory === 'series') {
    selectedSeries = selectedSeries || Object.keys(data.series)[0];
    selectedItem = selectedSeries;
    topicTitle.textContent = selectedSeries;

    // Author of this series (needs mapping in data.seriesAuthor)
    if (data.seriesAuthor && data.seriesAuthor[selectedSeries]) {
      const spanAuthor = document.createElement('span');
      spanAuthor.textContent = data.seriesAuthor[selectedSeries];
      topbarControls.appendChild(spanAuthor);
    }

    // Titles in this series
    const titles = data.series[selectedSeries] || [];
    if (titles.length) {
      const selTitles = makeSelect(titles, selectedTitle || null, 'topic-subselect');
      selTitles.addEventListener('change', () => {
        selectedTitle = selTitles.value;
        switchCategory('titles', selectedTitle);
      });
      topbarControls.appendChild(selTitles);
    }
  }

  // ---- TITLES ----
  else if (activeCategory === 'titles') {
    selectedTitle = selectedTitle || Object.keys(data.titles)[0];
    selectedItem = selectedTitle;
    topicTitle.textContent = selectedTitle;

    const info = data.titles[selectedTitle] || {};

    // Author of this title
    if (info.author) {
      const spanAuthor = document.createElement('span');
      spanAuthor.textContent = info.author;
      topbarControls.appendChild(spanAuthor);
    }

    // Series of this title
    if (info.series) {
      const spanSeries = document.createElement('span');
      spanSeries.textContent = info.series;
      topbarControls.appendChild(spanSeries);
    }

    // Always show comments for titles
    renderComments(selectedTitle);
  }

  // Make sure topicTitle is always right after the dot
if (!topbarControls.contains(topicTitle)) {
  // insert after the first child (the dot)
  topbarControls.insertBefore(topicTitle, topbarControls.children[1] || null);
} else {
  // if it already exists but is not in the right spot, move it
  if (topbarControls.children[1] !== topicTitle) {
    topbarControls.removeChild(topicTitle);
    topbarControls.insertBefore(topicTitle, topbarControls.children[1] || null);
  }
}

}


// -------- Category switching --------
function switchCategory(cat, preselect = null){
  activeCategory = cat;
  quickBtns.forEach(btn=>{
    const is = btn.dataset.category === cat;
    btn.classList.toggle('active', is);
    btn.setAttribute('aria-selected', is ? 'true' : 'false');
  });
  if(preselect){
    if(cat === 'authors'){ selectedAuthor = preselect; selectedItem = preselect; selectedSeries = null; selectedTitle = null; }
    if(cat === 'series'){ selectedSeries = preselect; selectedItem = preselect; selectedAuthor = null; selectedTitle = null; }
    if(cat === 'titles'){ selectedTitle = preselect; selectedItem = preselect; selectedAuthor = null; selectedSeries = null; }
    if(cat === 'genres'){ selectedItem = preselect; }
  } else {
    const items = getItemsForCategory(cat);
    if(items.length && !getItemsForCategory(cat).includes(selectedItem)) {
      selectedItem = items[0];
      if(cat === 'authors') selectedAuthor = selectedItem;
      if(cat === 'series') selectedSeries = selectedItem;
      if(cat === 'titles') selectedTitle = selectedItem;
    }
  }

  updateSidebarList(cat);
  renderTopbarControls();
  updateHeaderText();
  highlightSidebarActive();

  if (cat === 'titles' && selectedTitle) {
    renderComments(selectedTitle);
  }
}

// -------- Sidebar open/close --------
menuBtn.addEventListener('click', () => { if(!isMobile()) return; sidebar.classList.add('open'); overlay.hidden = false; document.body.classList.add('no-scroll'); });
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);
function closeSidebar(){ sidebar.classList.remove('open'); overlay.hidden = true; document.body.classList.remove('no-scroll'); }
window.addEventListener('resize', ()=>{ if(!isMobile()) closeSidebar(); });

// -------- Quick buttons --------
quickBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const cat = btn.dataset.category;
    switchCategory(cat);
  });
});

// -------- Comments modal & sort --------
commentInput.addEventListener('click', ()=>{ modal.style.display = 'flex'; });
window.addEventListener('click', (e)=>{ if(e.target === modal) modal.style.display = 'none'; });

sortButtons.forEach(button=>{
  button.addEventListener('click', ()=>{
    sortButtons.forEach(b=>b.classList.remove('active'));
    button.classList.add('active');
    const sortBy = button.dataset.sort;
    sortComments(sortBy);
  });
});

function sortComments(sortBy){
  const comments = Array.from(commentsContainer.getElementsByClassName('comment'));
  comments.sort((a,b)=>{
    const timeA = new Date(a.getAttribute('data-time'));
    const timeB = new Date(b.getAttribute('data-time'));
    const getUpvotes = (el)=>{
      const spans = el.querySelectorAll('.comment-actions span');
      return spans.length ? parseInt((spans[spans.length-1].textContent||'').replace(/[^\d]/g,''))||0 : 0;
    };
    const upA = getUpvotes(a), upB = getUpvotes(b);
    if(sortBy === 'newest') return timeB - timeA;
    if(sortBy === 'recommended' || sortBy === 'hot') return (upB - upA) || (timeB - timeA);
    if(sortBy === 'rating'){
      const getRating = el => {
        const s = el.querySelector('.stars');
        if(!s) return 0;
        const txt = s.textContent || '';
        const match = txt.match(/([\d.]+)$/);
        return match ? parseFloat(match[1]) : 0;
      };
      return getRating(b) - getRating(a) || (timeB - timeA);
    }
    return timeB - timeA;
  });
  comments.forEach(c => commentsContainer.appendChild(c));
}

// -------- Programmatic API --------
window.setTopic = (category, item) => {
  category = String(category).toLowerCase();
  if(!['genres','authors','series','titles'].includes(category)) return;
  const items = getItemsForCategory(category);
  if(!items.includes(item)) return;
  switchCategory(category, item);
  selectedItem = item;
  updateHeaderText();
  renderTopbarControls();
};

// -------- Init (load both data & comments) --------
Promise.all([
  fetch('data.json').then(r => r.json()),
  fetch('comments.json').then(r => r.json())
])
.then(([jsonData, jsonComments]) => {
  data = jsonData;
  commentsData = jsonComments;

 // Start in Titles view with the first available title
switchCategory('titles');
const initial = getItemsForCategory('titles')[0];
if (initial) {
  selectedTitle = initial;
  selectedItem = initial;
  updateHeaderText();
  renderTopbarControls();
  renderComments(initial);
}

})
.catch(err => console.error('Failed to load JSON:', err));
