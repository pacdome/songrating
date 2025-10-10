// ====================================
// 📝 BLOG.JS - Article Rendering & Filtering
// ====================================

let allArticles = [];
let filteredArticles = [];
let blogData = null;

// Load blog data from JSON
async function loadBlogData() {
  try {
    const response = await fetch('data/articles.json');
    blogData = await response.json();
    
    allArticles = blogData.articles;
    filteredArticles = [...allArticles];
    
    // Initialize the page
    initializeBlog();
    
    // Initialize map (async with boundaries loading)
    await initializeMap(allArticles, blogData.mapSettings.colorScheme);
    
  } catch (error) {
    console.error('Error loading blog data:', error);
    document.getElementById('articles').innerHTML = 
      '<div class="no-results">Fehler beim Laden der Daten 😢</div>';
  }
}

// Initialize blog elements
function initializeBlog() {
  // Set header info
  document.getElementById('blog-title').textContent = blogData.metadata.blogTitle;
  document.getElementById('blog-tagline').textContent = blogData.metadata.tagline;
  
  // Populate filter dropdowns
  populateFilters();
  
  // Render articles
  renderArticles(filteredArticles);
  
  // Update stats
  updateStats();
  
  // Setup event listeners
  setupEventListeners();
}

// Populate filter dropdowns
function populateFilters() {
  const countryFilter = document.getElementById('country-filter');
  const yearFilter = document.getElementById('year-filter');
  
  // Get unique countries
  const countries = [...new Set(allArticles.map(a => a.country))].sort();
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countryFilter.appendChild(option);
  });
  
  // Get unique years
  const years = [...new Set(allArticles.map(a => a.year))].sort((a, b) => b - a);
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });
}

// Render articles
function renderArticles(articles) {
  const container = document.getElementById('articles');
  
  if (articles.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        Keine Artikel gefunden!<br>
        <small>Versuche andere Filter-Einstellungen</small>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  articles.forEach(article => {
    const articleCard = createArticleCard(article);
    container.appendChild(articleCard);
  });
  
  // Update article count
  document.getElementById('article-count').textContent = 
    `${articles.length} ${articles.length === 1 ? 'Artikel' : 'Artikel'} gefunden`;
}

// Create article card element
function createArticleCard(article) {
  const card = document.createElement('div');
  card.className = 'article-card';
  card.id = `article-${article.id}`;
  
  // Format date
  const date = new Date(article.date);
  const formattedDate = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Create images HTML
  let imagesHTML = '';
  if (article.images && article.images.length > 0) {
    imagesHTML = `
      <div class="article-images">
        ${article.images.map(img => `
          <img src="${img}" alt="${article.title}" onclick="openLightbox('${img}')">
        `).join('')}
      </div>
    `;
  }
  
  // Create tags HTML
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
        <span>📍</span>
        <span><strong>${article.city}</strong>, ${article.country}</span>
      </div>
      <div class="meta-item">
        <span>📅</span>
        <span>${formattedDate}</span>
      </div>
      <div class="meta-item">
        <span>⏱️</span>
        <span>${article.readingTime} Min. Lesezeit</span>
      </div>
    </div>
    
    ${imagesHTML}
    
    <div class="article-content">
${article.content}
    </div>
    
    ${tagsHTML}
  `;
  
  return card;
}

// Filter articles
function filterArticles() {
  const country = document.getElementById('country-filter').value;
  const year = document.getElementById('year-filter').value;
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  
  filteredArticles = allArticles.filter(article => {
    // Country filter
    if (country && article.country !== country) return false;
    
    // Year filter
    if (year && article.year.toString() !== year) return false;
    
    // Search filter
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

// Reset filters
function resetFilters() {
  document.getElementById('country-filter').value = '';
  document.getElementById('year-filter').value = '';
  document.getElementById('search-input').value = '';
  
  filteredArticles = [...allArticles];
  renderArticles(filteredArticles);
  updateMap(filteredArticles, blogData.mapSettings.colorScheme);
  updateStats();
}

// Update statistics
function updateStats() {
  const totalCities = new Set(filteredArticles.map(a => a.city)).size;
  const totalCountries = new Set(filteredArticles.map(a => a.country)).size;
  const totalWords = filteredArticles.reduce((sum, a) => sum + a.wordCount, 0);
  
  document.getElementById('total-articles').textContent = filteredArticles.length;
  document.getElementById('total-cities').textContent = totalCities;
  document.getElementById('total-countries').textContent = totalCountries;
  document.getElementById('total-words').textContent = totalWords.toLocaleString('de-DE');
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('country-filter').addEventListener('change', filterArticles);
  document.getElementById('year-filter').addEventListener('change', filterArticles);
  document.getElementById('search-input').addEventListener('input', filterArticles);
  document.getElementById('reset-btn').addEventListener('click', resetFilters);
}

// Lightbox functionality
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

// Initialize visitor counter animation
function initVisitorCounter() {
  const counter = document.getElementById('visitor-counter');
  let count = 0;
  const target = 42069; // Nice retro number
  const duration = 2000;
  const increment = target / (duration / 50);
  
  const timer = setInterval(() => {
    count += increment;
    if (count >= target) {
      count = target;
      clearInterval(timer);
    }
    counter.textContent = Math.floor(count).toLocaleString('de-DE');
  }, 50);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadBlogData();
  initVisitorCounter();
  
  // Close lightbox on click
  document.getElementById('lightbox').addEventListener('click', closeLightbox);
});
