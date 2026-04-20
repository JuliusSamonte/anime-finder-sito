// 👇 INCOLLA IL TUO VERO LINK RENDER QUI (Senza lo slash finale / ) 👇
const BASE_URL = "https://ecommerce-backend-h83g.onrender.com";

const btnCerca = document.getElementById('btnCerca');
const btnRandom = document.getElementById('btnRandom');
const btnResetTags = document.getElementById('btnResetTags');
const listaContainer = document.getElementById('listaAnime');
const modal = document.getElementById('animeModal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close-btn');
const totalResults = document.getElementById('totalResults');

const paginationBox = document.getElementById('paginationBox');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const pageInfo = document.getElementById('pageInfo');

const radios = document.querySelectorAll('input[name="mediaType"]');
const boxStagione = document.getElementById('boxStagione');
const boxMangaType = document.getElementById('boxMangaType');
const lblMaxEp = document.getElementById('lblMaxEp');

function updateMediaTypeUI() {
    const isManga = document.querySelector('input[name="mediaType"]:checked').value === 'manga';
    if (isManga) {
        boxStagione.style.display = 'none';
        boxMangaType.style.display = 'flex';
        lblMaxEp.innerText = "Max Ch."; 
        document.getElementById('selectStagione').value = ""; 
    } else {
        boxStagione.style.display = 'flex';
        boxMangaType.style.display = 'none';
        lblMaxEp.innerText = "Max Ep."; 
        document.getElementById('selectMangaType').value = ""; 
    }
}

radios.forEach(radio => radio.addEventListener('change', updateMediaTypeUI));

let risultatiCorrenti = [];
let paginaAttuale = 1;
let filtriAttivi = {};

document.querySelectorAll('.genre-badge').forEach(badge => {
    badge.addEventListener('click', () => {
        let state = parseInt(badge.getAttribute('data-state'));
        state = (state + 1) % 3; 
        badge.setAttribute('data-state', state);
    });
});

btnResetTags.addEventListener('click', () => {
    document.querySelectorAll('.genre-badge').forEach(badge => {
        badge.setAttribute('data-state', '0');
    });
});

function getTags() {
    let included = [];
    let excluded = [];
    document.querySelectorAll('.genre-badge').forEach(badge => {
        const state = badge.getAttribute('data-state');
        const id = badge.getAttribute('data-id');
        if (state === '1') included.push(id);
        if (state === '2') excluded.push(id);
    });
    return { included: included.join(','), excluded: excluded.join(',') };
}

async function eseguiRicerca(nuova = true) {
    if (nuova) {
        paginaAttuale = 1;
        const tags = getTags();
        filtriAttivi = {
            mediaType: document.querySelector('input[name="mediaType"]:checked').value,
            q: document.getElementById('inputNome').value,
            genre: tags.included,
            exclude: tags.excluded,
            min_score: document.getElementById('inputScore').value,
            status: document.getElementById('selectStato').value,
            year: document.getElementById('inputAnno').value,
            season: document.getElementById('selectStagione').value,
            manga_type: document.getElementById('selectMangaType').value,
            episodes: document.getElementById('inputEpisodi').value
        };
    }

    listaContainer.innerHTML = "<div class='loader'>Searching the database... 🌌</div>";
    paginationBox.style.display = 'none';
    totalResults.innerText = "Searching...";

    try {
        if (BASE_URL.includes("TUO-LINK-RENDER-QUI")) {
            throw new Error("Devi inserire l'URL di Render alla riga 2 del file script.js!");
        }

        const query = `mediaType=${filtriAttivi.mediaType}&q=${encodeURIComponent(filtriAttivi.q)}&genre=${filtriAttivi.genre}&exclude_genre=${filtriAttivi.exclude}&min_score=${filtriAttivi.min_score}&status=${filtriAttivi.status}&year=${filtriAttivi.year}&season=${filtriAttivi.season}&manga_type=${filtriAttivi.manga_type}&episodes=${filtriAttivi.episodes}&page=${paginaAttuale}`;
        
        const response = await fetch(`${BASE_URL}/api/search?${query}`);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
             throw new Error("Il server si sta svegliando (Render gratuito). Riprova tra 30 secondi!");
        }

        const data = await response.json();
        
        if (data.errore) throw new Error(data.errore);

        risultatiCorrenti = data.anime; 
        listaContainer.innerHTML = "";

        if (!risultatiCorrenti || risultatiCorrenti.length === 0) {
            listaContainer.innerHTML = "<p style='text-align:center; width:100%;'>No results found.</p>";
            totalResults.innerText = "0 found";
            return;
        }

        const totale = data.pagination.items ? data.pagination.items.total : risultatiCorrenti.length;
        totalResults.innerText = `${totale} found`;

        risultatiCorrenti.forEach((item, i) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => mostraDettagli(i);
            const imageUrl = item.images?.jpg?.image_url || 'https://via.placeholder.com/220x300?text=No+Image';
            
            const dateStr = item.year ? item.year : (item.published?.prop?.from?.year || item.aired?.prop?.from?.year || '');
            const unitType = filtriAttivi.mediaType === 'manga' ? 'Ch' : 'Ep';
            const units = filtriAttivi.mediaType === 'manga' ? item.chapters : item.episodes;

            card.innerHTML = `<img src="${imageUrl}"> <div class="card-body"><h3>${item.title}</h3><p>${dateStr} • ${units || '?'} ${unitType}</p></div>`;
            listaContainer.appendChild(card);
        });

        if (data.pagination) {
            paginationBox.style.display = 'flex';
            pageInfo.innerText = `Page ${paginaAttuale}`;
            btnPrev.disabled = paginaAttuale === 1;
            btnNext.disabled = !data.pagination.has_next_page;
        }

    } catch (e) { 
        listaContainer.innerHTML = `<p style='text-align:center; width:100%; color:var(--accent);'>${e.message}</p>`; 
        totalResults.innerText = "Error";
    }
}

async function animeRandom() {
    listaContainer.innerHTML = "<div class='loader'>Summoning a true random title... ✨</div>";
    paginationBox.style.display = 'none';
    totalResults.innerText = "1 found";
    
    try {
        if (BASE_URL.includes("TUO-LINK-RENDER-QUI")) {
            throw new Error("Devi inserire l'URL di Render alla riga 2 del file script.js!");
        }

        const tags = getTags(); 
        const mediaType = document.querySelector('input[name="mediaType"]:checked').value;
        const minScore = document.getElementById('inputScore').value;

        const response = await fetch(`${BASE_URL}/api/random?mediaType=${mediaType}&genre=${tags.included}&exclude_genre=${tags.excluded}&min_score=${minScore}`);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
             throw new Error("Il server si sta svegliando (Render gratuito). Riprova tra 30 secondi!");
        }

        const data = await response.json();
        
        if (data.errore) throw new Error(data.errore);

        const item = data;
        risultatiCorrenti = [item]; 
        filtriAttivi.mediaType = mediaType; 
        mostraDettagli(0); 
        
        listaContainer.innerHTML = "<p style='text-align:center; width:100%; color:var(--text-muted);'>Click 'Surprise Me' again or use the search bar!</p>";
    } catch (error) {
        listaContainer.innerHTML = `<p style='color:var(--accent); text-align:center; width:100%;'>${error.message}</p>`;
        totalResults.innerText = "0 found";
    }
}

function mostraDettagli(i) {
    const a = risultatiCorrenti[i];
    const genresList = (a.genres && a.genres.length > 0) ? a.genres.map(g => g.name).join(', ') : '';
    const themesList = (a.themes && a.themes.length > 0) ? a.themes.map(g => g.name).join(', ') : '';
    const demoList = (a.demographics && a.demographics.length > 0) ? a.demographics.map(g => g.name).join(', ') : '';
    
    const allTags = [genresList, themesList, demoList].filter(Boolean).join(', ');
    const imageUrl = a.images?.jpg?.large_image_url || 'https://via.placeholder.com/250x350?text=No+Image';
    
    const formatName = a.type || 'Unknown';
    
    modalBody.innerHTML = `
        <div class="modal-grid">
            <img src="${imageUrl}">
            <div style="text-align: left;">
                <h2>${a.title}</h2>
                <p><span class="score-badge">⭐ ${a.score || 'N/A'}</span> | <strong>Status:</strong> ${a.status} | <strong>Format:</strong> ${formatName}</p>
                <div style="margin: 20px 0; line-height: 1.6; color: var(--text-main); max-height: 250px; overflow-y: auto; padding-right: 10px;">
                    ${a.synopsis || 'No synopsis available.'}
                </div>
                <p><strong style="color:var(--text-muted)">Tags:</strong> ${allTags || 'Unknown'}</p>
                <br>
                <a href="${a.url}" target="_blank" style="display:inline-block; background:var(--primary); color:white; padding:10px 15px; border-radius:5px; text-decoration:none; font-weight:bold;">View on MAL</a>
            </div>
        </div>
    `;
    modal.style.display = "block";
}

btnPrev.onclick = () => { paginaAttuale--; eseguiRicerca(false); window.scrollTo(0,0); };
btnNext.onclick = () => { paginaAttuale++; eseguiRicerca(false); window.scrollTo(0,0); };

btnCerca.onclick = () => eseguiRicerca(true);
btnRandom.onclick = animeRandom; 

closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };
document.addEventListener('keypress', function (e) { if (e.key === 'Enter') eseguiRicerca(true); });