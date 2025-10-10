// ====================================
// MAP.JS - Simple & Functional Blobs
// ====================================

let map;
let cityMarkers = {};
let articlesData = [];
let europeBoundaries = null;

// Load Europe GeoJSON boundaries
async function loadEuropeBoundaries() {
  try {
    const response = await fetch('data/europe.geojson');
    europeBoundaries = await response.json();
    console.log('✅ Ländergrenzen geladen:', europeBoundaries.features.length, 'Länder');
  } catch (error) {
    console.warn('⚠️ europe.geojson nicht gefunden');
  }
}

// Initialize the map
function initMap() {
  map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    dragging: true,
    minZoom: 3,
    maxZoom: 7
  }).setView([50.0, 10.0], 4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  map.zoomControl.setPosition('topright');
}

// Get country polygon
function getCountryPolygon(countryName) {
  if (!europeBoundaries) return null;
  
  const feature = europeBoundaries.features.find(f => 
    f.properties.name === countryName || 
    f.properties.name_en === countryName
  );
  
  return feature ? feature.geometry : null;
}

// Generate blob coordinates
function generateBlob(center, wordCount, countryName) {
  const [lat, lon] = center;
  const countryPolygon = getCountryPolygon(countryName);
  
  // Berechne Radius basierend auf wordCount
  const baseRadius = Math.sqrt(wordCount) * 0.020;
  const maxRadius = Math.max(baseRadius, 0.35);
  
  if (!countryPolygon || typeof turf === 'undefined') {
    return generateSimpleBlob([lat, lon], maxRadius);
  }
  
  try {
    // Generiere initial Blob
    const initialBlob = generateSimpleBlob([lat, lon], maxRadius);
    
    // Konvertiere zu GeoJSON [lon, lat]
    const blobGeoJSON = {
      type: 'Polygon',
      coordinates: [initialBlob.map(c => [c[1], c[0]])]
    };
    
    const blobFeature = turf.polygon(blobGeoJSON.coordinates);
    const countryFeature = turf.polygon(countryPolygon.coordinates);
    
    // Clip blob to country
    const clipped = turf.intersect(blobFeature, countryFeature);
    
    if (clipped && clipped.geometry && clipped.geometry.coordinates[0]) {
      // Zurück zu Leaflet [lat, lon]
      return clipped.geometry.coordinates[0].map(c => [c[1], c[0]]);
    }
  } catch (error) {
    console.warn('⚠️ Clipping fehlgeschlagen für', countryName, error);
  }
  
  return generateSimpleBlob([lat, lon], maxRadius);
}

// Simple blob generation
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

// Add city markers
function addCityMarkers(articles, colorScheme) {
  Object.values(cityMarkers).forEach(m => {
    if (m.blob) map.removeLayer(m.blob);
    if (m.marker) map.removeLayer(m.marker);
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
    const color = colorScheme[cityData.country] || '#999';
    
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
      opacity: 0.8
    }).addTo(map);
    
    const popupContent = `
      <div style="text-align: center; min-width: 120px;">
        <strong style="font-size: 14px;">${cityData.city}</strong><br>
        <span style="font-size: 11px; color: #666;">${cityData.country}</span><br>
        <span style="font-size: 11px;">${cityData.totalWords} Wörter</span>
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
        el.style.border = '3px solid #336699';
        setTimeout(() => { el.style.border = '1px solid #999'; }, 2000);
      }
    });
    
    // VIEL KLEINERER Stadt-Marker
    const marker = L.circleMarker(cityData.coordinates, {
      radius: 3,
      fillColor: '#fff',
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 1
    }).addTo(map);
    
    marker.bindPopup(popupContent);
    
    cityMarkers[key] = { blob, marker };
  });
}

// Update map
function updateMap(filteredArticles, colorScheme) {
  addCityMarkers(filteredArticles, colorScheme);
}

// Initialize
async function initializeMap(articles, colorScheme) {
  articlesData = articles;
  await loadEuropeBoundaries();
  initMap();
  addCityMarkers(articles, colorScheme);
}
