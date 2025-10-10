// ==========================================
// MAP.JS - Retro Style (NO CENTER MARKERS!)
// ==========================================

let map;
let cityMarkers = {};
let articlesData = [];
let europeBoundaries = null;

async function loadEuropeBoundaries() {
  try {
    const response = await fetch('data/europe.geojson');
    europeBoundaries = await response.json();
    console.log('✅ Ländergrenzen geladen:', europeBoundaries.features.length, 'Länder');
  } catch (error) {
    console.warn('⚠️ europe.geojson nicht gefunden');
  }
}

function initMap() {
  map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    dragging: true,
    doubleClickZoom: true,
    touchZoom: true,
    minZoom: 3,
    maxZoom: 7
  }).setView([50.0, 10.0], 4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  map.zoomControl.setPosition('topright');
}

function getCountryPolygon(countryName) {
  if (!europeBoundaries) return null;
  
  const feature = europeBoundaries.features.find(f => 
    f.properties.name === countryName || 
    f.properties.name_en === countryName
  );
  
  return feature ? feature.geometry : null;
}

function generateBlob(center, wordCount, countryName) {
  const [lat, lon] = center;
  const countryPolygon = getCountryPolygon(countryName);
  
  const baseRadius = Math.sqrt(wordCount) * 0.020;
  const maxRadius = Math.max(baseRadius, 0.35);
  
  if (!countryPolygon || typeof turf === 'undefined') {
    return generateSimpleBlob([lat, lon], maxRadius);
  }
  
  try {
    const initialBlob = generateSimpleBlob([lat, lon], maxRadius);
    
    const blobGeoJSON = {
      type: 'Polygon',
      coordinates: [initialBlob.map(c => [c[1], c[0]])]
    };
    
    const blobFeature = turf.polygon(blobGeoJSON.coordinates);
    const countryFeature = turf.polygon(countryPolygon.coordinates);
    
    const clipped = turf.intersect(blobFeature, countryFeature);
    
    if (clipped && clipped.geometry && clipped.geometry.coordinates[0]) {
      return clipped.geometry.coordinates[0].map(c => [c[1], c[0]]);
    }
  } catch (error) {
    console.warn('⚠️ Clipping fehlgeschlagen für', countryName, error);
  }
  
  return generateSimpleBlob([lat, lon], maxRadius);
}

function generateSimpleBlob(center, radius) {
  const [lat, lon] = center;
  const points = 14;
  const coords = [];
  
  for (let i = 0; i < points; i++) {
    const angle = (Math.PI * 2 / points) * i;
    const r = radius * (0.7 + Math.random() * 0.6);
    coords.push([
      lat + r * Math.cos(angle),
      lon + r * Math.sin(angle)
    ]);
  }
  
  coords.push(coords[0]);
  return coords;
}

function addCityMarkers(articles, colorScheme) {
  Object.values(cityMarkers).forEach(m => {
    if (m.blob) map.removeLayer(m.blob);
  });
  cityMarkers = {};
  
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
  
  Object.entries(citiesMap).forEach(([key, cityData]) => {
    const color = colorScheme[cityData.country] || '#00ff00';
    
    const blobCoords = generateBlob(
      cityData.coordinates,
      cityData.totalWords,
      cityData.country
    );
    
    const blob = L.polygon(blobCoords, {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      weight: 2,
      opacity: 0.9
    }).addTo(map);
    
    const popupContent = `
      <div style="text-align: center; min-width: 140px;">
        <strong style="font-size: 18px; color: #00ff00;">${cityData.city}</strong><br>
        <span style="font-size: 14px; color: #0f0;">${cityData.country}</span><br>
        <span style="font-size: 13px; color: #0a0;">─────────</span><br>
        <span style="font-size: 14px;">${cityData.totalWords} Wörter</span>
      </div>
    `;
    
    blob.bindPopup(popupContent);
    
    blob.on('mouseover', function() {
      this.setStyle({ fillOpacity: 0.7, weight: 3 });
    });
    
    blob.on('mouseout', function() {
      this.setStyle({ fillOpacity: 0.5, weight: 2 });
    });
    
    blob.on('click', function() {
      const firstArticle = cityData.articles[0];
      const el = document.getElementById(`article-${firstArticle.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.8)';
        setTimeout(() => { 
          el.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)'; 
        }, 2000);
      }
    });
    
    // NO CENTER MARKER! Just the blob!
    cityMarkers[key] = { blob };
  });
}

function updateMap(filteredArticles, colorScheme) {
  addCityMarkers(filteredArticles, colorScheme);
}

async function initializeMap(articles, colorScheme) {
  articlesData = articles;
  await loadEuropeBoundaries();
  initMap();
  addCityMarkers(articles, colorScheme);
}
