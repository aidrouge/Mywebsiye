    // -------- Data (sample JSON) --------
    const data = {
      genres: ['Fiction','Non-Fiction','Mystery','Sci-Fi','Romance','Thriller','Fantasy'],
      authors: {
        "Author A": { titles: ["Title A1","Title A2"], series: ["Series A1"] },
        "Author B": { titles: ["Title B1"], series: ["Series B1","Series B2"] },
        "Author C": { titles: ["Title C1","Title C2","Title C3"], series: [] },
        "Author D": { titles: ["Title D1"], series: ["Series D1"] }
      },
      series: {
        "Series A1": ["Title A1","Title A2"],
        "Series B1": ["Title B1"],
        "Series B2": ["Title B2-1","Title B2-2"],
        "Series D1": ["Title D1"]
      },
      titles: {
        "Title A1": { author: "Author A", series: "Series A1" },
        "Title A2": { author: "Author A", series: "Series A1" },
        "Title B1": { author: "Author B", series: "Series B1" },
        "Title B2-1": { author: "Author B", series: "Series B2" },
        "Title B2-2": { author: "Author B", series: "Series B2" },
        "Title C1": { author: "Author C", series: null },
        "Title C2": { author: "Author C", series: null },
        "Title C3": { author: "Author C", series: null },
        "Title D1": { author: "Author D", series: "Series D1" }
      }
    };

    // -------- State --------
    let activeCategory = 'genres';
    let selectedItem = null;        // current selected visible item (depends on category)
    let selectedAuthor = null;      // used when activeCategory === 'authors'
    let selectedSeries = null;      // used when activeCategory === 'series'
    let selectedTitle = null;       // used when activeCategory === 'titles'

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

    // -------- Sidebar (flat list only) --------
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
          // when clicking a sidebar item, update relevant selection state for topbar
          if(cat === 'authors'){ selectedAuthor = item; selectedSeries = null; selectedTitle = null; }
          if(cat === 'series'){ selectedSeries = item; selectedAuthor = null; selectedTitle = null; }
          if(cat === 'titles'){ selectedTitle = item; selectedAuthor = null; selectedSeries = null; }
          updateHeaderText();
          renderTopbarControls(); // reflect selection in topbar controls
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

    // -------- Topbar contextual controls --------
    function clearTopbarControls(){
      // preserve first child (address-dot) if present, and the topicTitle element (we'll re-add it)
      topbarControls.innerHTML = '';
      // re-add address-dot
      const dot = document.createElement('div'); dot.className='address-dot'; dot.setAttribute('aria-hidden','true');
      topbarControls.appendChild(dot);
    }

    function renderTopbarControls(){
      clearTopbarControls();

      // small helper to create selects
      function makeSelect(options = [], value = null, className='topic-select'){
        const s = document.createElement('select'); s.className = className;
        options.forEach(opt => {
          const o = document.createElement('option'); o.value = opt; o.text = opt;
          s.appendChild(o);
        });
        if(value !== null && options.includes(value)) s.value = value;
        return s;
      }

      // Genre: simple select of genres
      if(activeCategory === 'genres'){
        const sel = makeSelect(data.genres, selectedItem || data.genres[0], 'topic-select');
        sel.addEventListener('change', () => {
          selectedItem = sel.value;
          // clear other selection trackers
          selectedAuthor = selectedSeries = selectedTitle = null;
          updateHeaderText();
          highlightSidebarActive();
        });
        topbarControls.appendChild(sel);
        selectedItem = selectedItem || data.genres[0];
        updateHeaderText();
      }

      // Authors: author select -> if author chosen show that author's titles & series selects
      else if(activeCategory === 'authors'){
        const authors = Object.keys(data.authors);
        const selAuthor = makeSelect(authors, selectedAuthor || authors[0], 'topic-select');
        selAuthor.addEventListener('change', () => {
          selectedAuthor = selAuthor.value;
          selectedItem = selectedAuthor;
          selectedSeries = null;
          selectedTitle = null;
          // re-render so nested selects appear for the new author
          renderTopbarControls();
          updateHeaderText();
          highlightSidebarActive();
        });
        topbarControls.appendChild(selAuthor);

        // use selectedAuthor (fallback to first)
        selectedAuthor = selectedAuthor || authors[0];
        selectedItem = selectedAuthor;
        // Titles by this author
        const titles = data.authors[selectedAuthor].titles || [];
        if(titles.length){
          const selTitles = makeSelect(titles, selectedTitle || null, 'topic-subselect');
          selTitles.insertAdjacentHTML('beforebegin',''); // no-op just to keep structure
          selTitles.addEventListener('change', () => {
            selectedTitle = selTitles.value;
            selectedItem = selectedTitle;
            // go to titles category for clarity
            switchCategory('titles', selectedTitle);
          });
          topbarControls.appendChild(selTitles);
        }

        // Series by this author
        const sers = data.authors[selectedAuthor].series || [];
        if(sers.length){
          const selSeries = makeSelect(sers, selectedSeries || null, 'topic-subselect');
          selSeries.addEventListener('change', () => {
            selectedSeries = selSeries.value;
            selectedItem = selectedSeries;
            // switch to series category
            switchCategory('series', selectedSeries);
          });
          topbarControls.appendChild(selSeries);
        }

        updateHeaderText();
      }

      // Series: series select -> then titles for selected series
      else if(activeCategory === 'series'){
        const seriesList = Object.keys(data.series);
        const selSeries = makeSelect(seriesList, selectedSeries || seriesList[0], 'topic-select');
        selSeries.addEventListener('change', () => {
          selectedSeries = selSeries.value;
          selectedItem = selectedSeries;
          selectedTitle = null;
          // re-render to show titles for this series
          renderTopbarControls();
          updateHeaderText();
          highlightSidebarActive();
        });
        topbarControls.appendChild(selSeries);

        selectedSeries = selectedSeries || seriesList[0];
        selectedItem = selectedSeries;

        const titles = data.series[selectedSeries] || [];
        if(titles.length){
          const selTitles = makeSelect(titles, selectedTitle || null, 'topic-subselect');
          selTitles.addEventListener('change', () => {
            selectedTitle = selTitles.value;
            selectedItem = selectedTitle;
            switchCategory('titles', selectedTitle);
          });
          topbarControls.appendChild(selTitles);
        }

        updateHeaderText();
      }

      // Titles: titles select -> after select show two buttons for author and series
      else if(activeCategory === 'titles'){
        const titlesAll = Object.keys(data.titles);
        const selTitle = makeSelect(titlesAll, selectedTitle || titlesAll[0], 'topic-select');
        selTitle.addEventListener('change', () => {
          selectedTitle = selTitle.value;
          selectedItem = selectedTitle;
          // re-render to show author/series actions
          renderTopbarControls();
          updateHeaderText();
          highlightSidebarActive();
        });
        topbarControls.appendChild(selTitle);

        selectedTitle = selectedTitle || titlesAll[0];
        selectedItem = selectedTitle;

        const info = data.titles[selectedTitle];
        if(info && info.author){
          const btnAuthor = document.createElement('button');
          btnAuthor.className = 'topic-action';
          btnAuthor.textContent = info.author;
          btnAuthor.title = `Go to author: ${info.author}`;
          btnAuthor.addEventListener('click', () => {
            // switch to authors and preselect this author
            switchCategory('authors', info.author);
            selectedAuthor = info.author;
            selectedItem = info.author;
            renderTopbarControls();
            updateHeaderText();
            highlightSidebarActive();
          });
          topbarControls.appendChild(btnAuthor);
        }
        if(info && info.series){
          const btnSeries = document.createElement('button');
          btnSeries.className = 'topic-action';
          btnSeries.textContent = info.series;
          btnSeries.title = `Go to series: ${info.series}`;
          btnSeries.addEventListener('click', () => {
            switchCategory('series', info.series);
            selectedSeries = info.series;
            selectedItem = info.series;
            renderTopbarControls();
            updateHeaderText();
            highlightSidebarActive();
          });
          topbarControls.appendChild(btnSeries);
        }

        updateHeaderText();
      }

      // Always show current selected topic text (keeps layout stable)
      // Move topicTitle element to end of controls so text updates are visible
      if(!topbarControls.contains(topicTitle)){
        topbarControls.appendChild(topicTitle);
      }
    }

    // -------- Category switching --------
    function switchCategory(cat, preselect = null){
      activeCategory = cat;
      // update quick button visuals
      quickBtns.forEach(btn=>{
        const is = btn.dataset.category === cat;
        btn.classList.toggle('active', is);
        btn.setAttribute('aria-selected', is ? 'true' : 'false');
      });
      // set preselected items into state where appropriate
      if(preselect){
        if(cat === 'authors'){ selectedAuthor = preselect; selectedItem = preselect; selectedSeries = null; selectedTitle = null; }
        if(cat === 'series'){ selectedSeries = preselect; selectedItem = preselect; selectedAuthor = null; selectedTitle = null; }
        if(cat === 'titles'){ selectedTitle = preselect; selectedItem = preselect; selectedAuthor = null; selectedSeries = null; }
        if(cat === 'genres'){ selectedItem = preselect; }
      } else {
        // ensure some sensible default selectedItem if none
        const items = getItemsForCategory(cat);
        if(items.length && !getItemsForCategory(cat).includes(selectedItem)) {
          selectedItem = items[0];
          if(cat === 'authors') selectedAuthor = selectedItem;
          if(cat === 'series') selectedSeries = selectedItem;
          if(cat === 'titles') selectedTitle = selectedItem;
        }
      }

      // update UI
      updateSidebarList(cat);
      renderTopbarControls();
      updateHeaderText();
      highlightSidebarActive();
    }

    // -------- Sidebar open/close (mobile) --------
    menuBtn.addEventListener('click', () => { if(!isMobile()) return; sidebar.classList.add('open'); overlay.hidden = false; document.body.classList.add('no-scroll'); });
    sidebarClose.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    function closeSidebar(){ sidebar.classList.remove('open'); overlay.hidden = true; document.body.classList.remove('no-scroll'); }
    window.addEventListener('resize', ()=>{ if(!isMobile()) closeSidebar(); });

    // quick buttons
    quickBtns.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const cat = btn.dataset.category;
        switchCategory(cat);
      });
    });

    // -------- Comments sorting & modal (unchanged behaviour) --------
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
      // ensure selectedItem updated
      selectedItem = item;
      updateHeaderText();
      renderTopbarControls();
    };

    // -------- Init --------
    // start with genres
    switchCategory('genres');
    // ensure selectedItem is set
    const initial = getItemsForCategory(activeCategory)[0];
    if(initial) { selectedItem = initial; updateHeaderText(); }
    renderTopbarControls();

    // accessibility / assistive announcements can be added (aria-live region)
    document.addEventListener('topic:selected', (e)=> console.log('topic:selected', e.detail));
