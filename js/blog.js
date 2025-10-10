// ==========================================
// BLOG.JS - Retro Style Article Rendering
// ==========================================

let allArticles = [];
let filteredArticles = [];
let blogData = null;

async function loadBlogData() {
  try {
    const response = await fetch('data/articles.json');
    blogData = await response.json();
    
    allArticles = blogData.articles;
    filteredArticles = [...allArticles];
    
    initializeBlog();
    await initializeMap(allArticles, blogData.mapSettings.colorScheme);
    
  } catch (error) {
    console.error('Error loading blog data:', error);
    document.getElementById('articles').innerHTML = 
      '<div class="no-results">FEHLER BEIM LADEN DER DATEN</div>';
  }
}

function initializeBlog() {
  document.getElementById('blog-title').textContent = blogData.metadata.blogTitle || 'EUROPA.EXE';
  document.getElementById('blog-tagline').textContent = '> ' + (blogData.metadata.tagline || 'Reiseblog_v1.0');
  
  populateFilters();
  renderArticles(filteredArticles);
  updateStats();
  setupEventListeners();
}

function populateFilters() {
  const countryFilter = document.getElementById('country-filter');
  const yearFilter = document.getElementById('year-filter');
  
  const countries = [...new Set(allArticles.map(a => a.country))].sort();
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countryFilter.appendChild(option);
  });
  
  const years = [...new Set(allArticles.map(a => a.year))].sort((a, b) => b - a);
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });
}

function renderArticles(articles) {
  const container = document.getElementById('articles');
  
  if (articles.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        KEINE ARTIKEL GEFUNDEN!<br>
        <small style="font-size: 14px;">Andere Filter probieren...</small>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  articles.forEach(article => {
    const articleCard = createArticleCard(article);
    container.appendChild(articleCard);
  });
  
  document.getElementById('article-count').textContent = 
    `[ ${articles.length} Artikel gefunden ]`;
}

function createArticleCard(article) {
  const card = document.createElement('div');
  card.className = 'article-card';
  card.id = `article-${article.id}`;
  
  const date = new Date(article.date);
  const formattedDate = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  let imagesHTML = '';
  if (article.images && article.images.length > 0) {
    imagesHTML = `
      <div class="article-images">
        ${article.images.map(img => `
          <img src="${img}" alt="${article.title}" onclick="openLightbox('${img}')" loading="lazy">
        `).join('')}
      </div>
    `;
  }
  
  let tagsHTML = '';
  if (article.tags && article.tags.length > 0) {
    tagsHTML = `
      <div class="article-tags">
        ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    `;
  }
  
  card.innerHTML = `
    <div class="article-header">
      <h3 class="article-title">${article.title}</h3>
      ${article.mood ? `<span class="article-mood">${article.mood}</span>` : ''}
    </div>
    
    <div class="article-meta">
      <div class="meta-item">
        <strong>${article.city}</strong>, ${article.country}
      </div>
      <div class="meta-item">
        ${formattedDate}
      </div>
      <div class="meta-item">
        ${article.readingTime} Min. Lesezeit
      </div>
    </div>
    
    ${imagesHTML}
    
    <div class="article-content">${article.content}</div>
    
    ${tagsHTML}
  `;
  
  return card;
}

function filterArticles() {
  const country = document.getElementById('country-filter').value;
  const year = document.getElementById('year-filter').value;
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  
  filteredArticles = allArticles.filter(article => {
    if (country && article.country !== country) return false;
    if (year && article.year.toString() !== year) return false;
    
    if (searchTerm) {
      const searchableText = `
        ${article.title} 
        ${article.city} 
        ${article.country} 
        ${article.content}
        ${article.tags?.join(' ')}
      `.toLowerCase();
      
      if (!searchableText.includes(searchTerm)) return false;
    }
    
    return true;
  });
  
  renderArticles(filteredArticles);
  updateMap(filteredArticles, blogData.mapSettings.colorScheme);
  updateStats();
}

function resetFilters() {
  document.getElementById('country-filter').value = '';
  document.getElementById('year-filter').value = '';
  document.getElementById('search-input').value = '';
  
  filteredArticles = [...allArticles];
  renderArticles(filteredArticles);
  updateMap(filteredArticles, blogData.mapSettings.colorScheme);
  updateStats();
}

function updateStats() {
  // Stats removed but function kept for compatibility
}

function setupEventListeners() {
  document.getElementById('country-filter').addEventListener('change', filterArticles);
  document.getElementById('year-filter').addEventListener('change', filterArticles);
  document.getElementById('search-input').addEventListener('input', filterArticles);
  document.getElementById('reset-btn').addEventListener('click', resetFilters);
}

function openLightbox(imageSrc) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  
  lightboxImg.src = imageSrc;
  lightbox.classList.add('active');
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  loadBlogData();
  document.getElementById('lightbox').addEventListener('click', closeLightbox);
});
