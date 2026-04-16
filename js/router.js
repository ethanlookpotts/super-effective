// ═══════════════════════════════
// HASH ROUTER — restores view on reload
// Routes:
//   #/search                    default search view
//   #/search?type=<Type>        search with type filter
//   #/search?n=<dex>            search with Pokémon detail open
//   #/party | #/gyms | #/location | #/tms | #/settings
// ═══════════════════════════════
const ROUTE_PAGES = ['search','party','gyms','location','tms','settings'];

function parseRoute(hash){
  const raw = (hash != null ? hash : location.hash).replace(/^#\/?/, '');
  if(!raw) return { page:'search', params:{} };
  const [path, query] = raw.split('?');
  const page = ROUTE_PAGES.includes(path) ? path : 'search';
  const params = {};
  if(query){
    query.split('&').forEach(kv=>{
      const [k,v] = kv.split('=');
      if(k) params[decodeURIComponent(k)] = v!=null ? decodeURIComponent(v) : '';
    });
  }
  return { page, params };
}

function buildRoute(page, params){
  let hash = '#/' + page;
  const parts = Object.entries(params||{})
    .filter(([,v])=>v!=null && v!=='')
    .map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v));
  if(parts.length) hash += '?' + parts.join('&');
  return hash;
}

// Writes hash via history API so hashchange does NOT fire (avoids re-entry).
// popstate handler below catches real back/forward navigation.
function setRoute(page, params){
  const hash = buildRoute(page, params);
  if(hash === location.hash) return;
  history.pushState(null, '', hash);
}

function replaceRoute(page, params){
  const hash = buildRoute(page, params);
  if(hash === location.hash) return;
  history.replaceState(null, '', hash);
}

function applyRoute(){
  const { page, params } = parseRoute();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById('page-'+page);
  if(target) target.classList.add('active');
  document.querySelectorAll('.drawer-item').forEach(b=>b.classList.remove('active'));
  const di = document.querySelector(`.drawer-item[data-page="${page}"]`);
  if(di) di.classList.add('active');

  if(page === 'search'){
    if(params.n){
      const n = parseInt(params.n);
      const p = POKEMON.find(x=>x.n===n);
      if(p){
        activePoke = p;
        activeTypeFilter = null;
        document.getElementById('s-in').value = p.name;
        document.getElementById('s-cl').style.display = 'block';
        document.getElementById('s-drop').style.display = 'none';
        addRecent(p);
      } else {
        activePoke = null;
        activeTypeFilter = null;
      }
    } else if(params.type && TYPES.includes(params.type)){
      activeTypeFilter = params.type;
      activePoke = null;
      document.getElementById('s-in').value = '';
      document.getElementById('s-cl').style.display = 'none';
      document.getElementById('s-drop').style.display = 'none';
    } else {
      activePoke = null;
      activeTypeFilter = null;
      document.getElementById('s-in').value = '';
      document.getElementById('s-cl').style.display = 'none';
      document.getElementById('s-drop').style.display = 'none';
    }
    buildTypePills();
    renderSearch();
  } else if(page === 'party'){
    renderParty();
  } else if(page === 'settings'){
    renderSettings();
  }
}

window.addEventListener('popstate', applyRoute);
