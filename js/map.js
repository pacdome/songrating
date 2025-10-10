// ====================================
// 🗺️ MAP.JS - Leaflet Map with Organic Blobs
// ====================================

let map;
let cityMarkers = {};
let articlesData = [];

// Initialize the map
function initMap() {
  // Create map centered on Europe
  map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    dragging: true,
    minZoom: 3,
    maxZoom: 7
  }).setView([50.0, 10.0], 4);

  // Add a simple tile layer (CartoDB Positron - clean and light)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Style map controls
  map.zoomControl.setPosition('topright');
}

// Generate organic blob coordinates around a center point
function generateBlobCoordinates(center, wordCount, colorScheme) {
  const [lat, lon] = center;
  
  // Calculate radius based on word count (VIEL GRÖSSER für bessere Sichtbarkeit!)
  // Formel: Je mehr Wörter, desto größer die Fläche
  const baseRadius = Math.sqrt(wordCount) * 0.03; // 4x größer als vorher!
  const radius = Math.max(baseRadius, 0.5); // Minimum size auch größer (0.5 statt 0.15)
  
  // Number of points for the blob (mehr Punkte = organischer)
  const numPoints = 10; // von 8 auf 10 erhöht
  const coordinates = [];
  
  // Generate organic blob shape with random variation
  for (let i = 0; i < numPoints; i++) {
    const angle = (Math.PI * 2 / numPoints) * i;
    
    // Add randomness for organic look (zwischen 0.5 und 1.5 für mehr Variation)
    const randomFactor = 0.5 + Math.random() * 1.0;
    const distance = radius * randomFactor;
    
    // Calculate point coordinates
    const pointLat = lat + distance * Math.cos(angle);
    const pointLon = lon + distance * Math.sin(angle);
    
    coordinates.push([pointLat, pointLon]);
  }
  
  // Close the polygon
  coordinates.push(coordinates[0]);
  
  return coordinates;
}

// Add city markers to the map
function addCityMarkers(articles, colorScheme) {
  // Clear existing markers
  Object.values(cityMarkers).forEach(marker => map.removeLayer(marker));
  cityMarkers = {};
  
  // Group articles by city
  const citiesMap = {};
  articles.forEach(article => {
    const key = `${article.city}-${article.country}`;
    if (!citiesMap[key]) {
      citiesMap[key] = {
        city: article.city,
        country: article.country,
        coordinates: article.coordinates,
        articles: [],
        totalWords: 0
      };
    }
    citiesMap[key].articles.push(article);
    citiesMap[key].totalWords += article.wordCount;
  });
  
  // Create markers for each city
  Object.entries(citiesMap).forEach(([key, cityData]) => {
    const color = colorScheme[cityData.country] || '#95e1d3';
    
    // Generate organic blob
    const blobCoords = generateBlobCoordinates(
      cityData.coordinates,
      cityData.totalWords,
      colorScheme
    );
    
    // Create blob polygon
    const blob = L.polygon(blobCoords, {
      color: color,
      fillColor: color,
      fillOpacity: 0.7,  // Erhöht von 0.6 auf 0.7 für bessere Sichtbarkeit
      weight: 3,         // Erhöht von 2 auf 3 für sichtbarere Ränder
      opacity: 1.0       // Erhöht von 0.8 auf 1.0
    }).addTo(map);
    
    // Create popup content
    const popupContent = `
      <div style="text-align: center; min-width: 150px;">
        <h3 style="margin: 0 0 10px 0; color: ${color}; font-size: 1.3em;">${cityData.city}</h3>
        <p style="margin: 5px 0; color: #666;"><strong>${cityData.country}</strong></p>
        <p style="margin: 5px 0;">${cityData.articles.length} Artikel</p>
        <p style="margin: 5px 0; font-size: 0.9em; color: #999;">${cityData.totalWords} Wörter</p>
      </div>
    `;
    
    blob.bindPopup(popupContent);
    
    // Add hover effect
    blob.on('mouseover', function(e) {
      this.setStyle({
        fillOpacity: 0.9,  // Noch intensiver beim Hover
        weight: 4
      });
    });
    
    blob.on('mouseout', function(e) {
      this.setStyle({
        fillOpacity: 0.7,
        weight: 3
      });
    });
    
    // Click to scroll to first article of this city
    blob.on('click', function(e) {
      const firstArticle = cityData.articles[0];
      const articleElement = document.getElementById(`article-${firstArticle.id}`);
      if (articleElement) {
        articleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        articleElement.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.8)';
        setTimeout(() => {
          articleElement.style.boxShadow = '5px 5px 0px rgba(0,0,0,0.2)';
        }, 2000);
      }
    });
    
    // Add city marker (größerer Kreis in der Mitte der Stadt)
    const marker = L.circleMarker(cityData.coordinates, {
      radius: 6,          // Größer (war 4)
      fillColor: '#fff',  // Weiß statt schwarz für besseren Kontrast
      color: '#333',
      weight: 3,          // Dickerer Rand
      opacity: 1,
      fillOpacity: 1
    }).addTo(map);
    
    marker.bindPopup(popupContent);
    
    cityMarkers[key] = { blob, marker };
  });
}

// Update map with filtered articles
function updateMap(filteredArticles, colorScheme) {
  addCityMarkers(filteredArticles, colorScheme);
}

// Create legend
function createLegend(colorScheme) {
  const legendContainer = document.getElementById('map-legend');
  legendContainer.innerHTML = '';
  
  Object.entries(colorScheme).forEach(([country, color]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-color" style="background-color: ${color};"></div>
      <span>${country}</span>
    `;
    legendContainer.appendChild(item);
  });
}

// Initialize map when data is loaded
function initializeMap(articles, colorScheme) {
  articlesData = articles;
  initMap();
  addCityMarkers(articles, colorScheme);
  createLegend(colorScheme);
}
