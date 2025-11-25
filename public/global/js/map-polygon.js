// 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Polygon management for location finder map
// ⚠️⚠️⚠️ - [map-polygon.js] Handles polygon normalization, drawing, geometry operations, and center calculation
(function(global) {
  'use strict';

  // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Polygon manager implementation
  class PolygonManager {
    constructor(eventBus, coordinateOrder) {
      this.eventBus = eventBus;
      this.coordinateOrder = (coordinateOrder === 'lat-lng' || coordinateOrder === 'lng-lat') 
        ? coordinateOrder 
        : 'lng-lat'; // Default fallback
      this.polygon = null; // Google Maps Polygon instance
      this.normalizedPaths = null; // Normalized polygon paths
      this.center = null; // Calculated center point
      
      const now = () => new Date().toISOString();
      this.logInfo = (message, payload) => console.log(`🟡🟡🟡 - [PolygonManager ${now()}] ${message}`, payload ?? '');
      this.logSuccess = (message, payload) => console.log(`✅✅✅ - [PolygonManager ${now()}] ${message}`, payload ?? '');
      this.logWarn = (message, payload) => console.warn(`⚠️⚠️⚠️ - [PolygonManager ${now()}] ${message}`, payload ?? '');
      this.logError = (message, payload) => console.error(`❗❗❗ - [PolygonManager ${now()}] ${message}`, payload ?? '');

      this.logInfo('PolygonManager initialized', { coordinateOrder: this.coordinateOrder });
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Normalize polygon paths from various formats
    normalizePaths(raw) {
      if (!Array.isArray(raw)) {
        this.logWarn('Polygon data is not an array', { raw });
        return null;
      }
      if (raw.length < 3) {
        this.logWarn('Polygon has insufficient points', { count: raw.length });
        return null;
      }
      
      const points = [];
      raw.forEach((entry, index) => {
        if (Array.isArray(entry) && entry.length >= 2) {
          const first = Number(entry[0]);
          const second = Number(entry[1]);
          if (!Number.isFinite(first) || !Number.isFinite(second)) {
            this.logWarn('Skipped polygon entry with invalid numeric pair', { index, entry });
            return;
          }
          
          // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Normalize coordinate order based on configuration
          let lat, lng;
          
          // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [map-polygon.js] SECURITY FIX: Auto-detection removed - coordinate order must be explicitly configured
          if (this.coordinateOrder === 'lng-lat') {
            // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Force [lng, lat] interpretation: first is longitude, second is latitude
            lng = first;
            lat = second;
          } else if (this.coordinateOrder === 'lat-lng') {
            // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Force [lat, lng] interpretation: first is latitude, second is longitude
            lat = first;
            lng = second;
          } else {
            // 2025-12-XXT00:00:00Z ⚠️⚠️⚠️ - [map-polygon.js] Invalid configuration - coordinate order must be specified
            this.logError('Invalid coordinate order configuration - must be "lng-lat" or "lat-lng"', { order: this.coordinateOrder });
            return; // Skip this point
          }
          
          points.push({ lat, lng });
          if (index < 3) {
            this.logInfo('Normalized polygon point', { index, original: entry, normalized: { lat, lng }, order: this.coordinateOrder });
          }
        } else if (entry && typeof entry === 'object') {
          const lat = Number(entry.lat ?? entry.latitude);
          const lng = Number(entry.lng ?? entry.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            points.push({ lat, lng });
            if (index < 3) {
              this.logInfo('Normalized polygon point from object', { index, normalized: { lat, lng } });
            }
          } else {
            this.logWarn('Skipped polygon entry with invalid lat/lng object', { index, entry });
          }
        } else {
          this.logWarn('Skipped polygon entry with unsupported format', { index, entry });
        }
      });
      
      if (points.length < 3) {
        this.logWarn('Polygon normalization resulted in insufficient points', { originalCount: raw.length, normalizedCount: points.length });
        return null;
      }
      
      this.normalizedPaths = points;
      this.logSuccess('Polygon paths normalized', { 
        originalCount: raw.length, 
        normalizedCount: points.length, 
        firstPoint: points[0], 
        lastPoint: points[points.length - 1], 
        order: this.coordinateOrder 
      });
      
      return points;
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Calculate polygon center using bounding box center
    // ⚠️⚠️⚠️ - [map-polygon.js] This ensures the center point is always within the polygon for initial positioning
    calculateCenter(paths) {
      if (!paths || paths.length < 3) {
        this.logWarn('Cannot calculate center - insufficient points', { count: paths ? paths.length : 0 });
        return null;
      }

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Calculate bounding box
      const bounds = paths.reduce((acc, p) => {
        acc.minLat = Math.min(acc.minLat, p.lat);
        acc.maxLat = Math.max(acc.maxLat, p.lat);
        acc.minLng = Math.min(acc.minLng, p.lng);
        acc.maxLng = Math.max(acc.maxLng, p.lng);
        return acc;
      }, {
        minLat: Infinity,
        maxLat: -Infinity,
        minLng: Infinity,
        maxLng: -Infinity
      });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Calculate center of bounding box
      const center = {
        lat: (bounds.minLat + bounds.maxLat) / 2,
        lng: (bounds.minLng + bounds.maxLng) / 2
      };

      this.center = center;
      this.logSuccess('Polygon center calculated', { center, bounds });

      // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Emit center calculated event
      this.eventBus.emit('polygon:center:calculated', center);

      return center;
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Draw polygon on Google Maps
    drawPolygon(paths, map) {
      try {
        if (!map) {
          this.logError('Cannot draw polygon - map not initialized');
          return null;
        }
        if (!Array.isArray(paths) || paths.length < 3) {
          this.logError('Cannot draw polygon - invalid paths', { numPoints: Array.isArray(paths) ? paths.length : 0 });
          return null;
        }
        
        this.logInfo('Drawing polygon with paths', { numPoints: paths.length, firstPath: paths[0], lastPath: paths[paths.length - 1] });
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Remove existing polygon if any
        if (this.polygon) {
          this.polygon.setMap(null);
          this.polygon = null;
          this.logInfo('Removed existing polygon');
        }
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Convert paths to LatLng objects for Google Maps
        const googlePaths = paths.map((point) => {
          return new window.google.maps.LatLng(point.lat, point.lng);
        });
        
        this.logInfo('Converted paths to Google Maps LatLng', { numPoints: googlePaths.length });
        
        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Create polygon with visible styling
        this.polygon = new window.google.maps.Polygon({
          paths: googlePaths,
          strokeColor: '#1565C0',
          strokeOpacity: 0.9,
          strokeWeight: 3,
          fillColor: '#42A5F5',
          fillOpacity: 0.25,
          map: map,
          clickable: false,
          zIndex: 1,
        });
        
        const polygonOnMap = this.polygon.getMap() === map;
        this.logSuccess('Polygon created and added to map', { 
          numPoints: paths.length,
          polygonExists: !!this.polygon,
          polygonOnMap: polygonOnMap,
          firstPoint: paths[0],
          lastPoint: paths[paths.length - 1]
        });

        // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Emit polygon ready event when polygon is on map
        if (polygonOnMap) {
          this.eventBus.emit('polygon:ready', {
            polygon: this.polygon,
            paths: paths,
            center: this.center
          });
        }
        
        return this.polygon;
      } catch (err) {
        this.logError('Failed to draw polygon', { error: err, message: err?.message, stack: err?.stack });
        return null;
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Check if a point is inside the polygon
    isPointInside(lat, lng) {
      try {
        if (!this.polygon) {
          this.logWarn('Polygon not available for containment check', { lat, lng });
          return false;
        }
        if (!window.google?.maps?.geometry?.poly?.containsLocation) {
          this.logError('Google Maps geometry library not available for containment check');
          return false;
        }
        
        const point = new window.google.maps.LatLng(lat, lng);
        const within = window.google.maps.geometry.poly.containsLocation(point, this.polygon);
        
        this.logInfo('Polygon containment check', { lat, lng, within, hasPolygon: !!this.polygon });
        return within;
      } catch (err) {
        this.logError('Polygon containment check failed', { error: err, lat, lng, hasPolygon: !!this.polygon });
        return false;
      }
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Check if polygon is ready (exists and on map)
    isReady() {
      if (!this.polygon) {
        return false;
      }
      return this.polygon.getMap() !== null;
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Get polygon instance
    getPolygon() {
      return this.polygon;
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Get normalized paths
    getPaths() {
      return this.normalizedPaths;
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Get calculated center
    getCenter() {
      return this.center;
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Update polygon styling (for violation states)
    setViolationStyle(isViolation) {
      if (!this.polygon) {
        return;
      }

      if (isViolation) {
        this.polygon.setOptions({
          strokeColor: '#C62828',
          fillColor: '#EF5350',
          fillOpacity: 0.15
        });
      } else {
        this.polygon.setOptions({
          strokeColor: '#1565C0',
          fillColor: '#42A5F5',
          fillOpacity: 0.12
        });
      }
      
      this.logInfo(isViolation ? 'Polygon style set to violation state' : 'Polygon style reset to normal');
    }

    // 2025-12-XXT00:00:00Z 🟡🟡🟡 - [map-polygon.js] Fit map bounds to polygon
    fitBounds(map) {
      if (!this.normalizedPaths || !map) {
        this.logWarn('Cannot fit bounds - polygon paths or map not available');
        return;
      }

      try {
        const bounds = new window.google.maps.LatLngBounds();
        this.normalizedPaths.forEach((point) => {
          bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
        });
        map.fitBounds(bounds);
        this.logSuccess('Map bounds fitted to polygon', { bounds: bounds.toJSON() });
      } catch (err) {
        this.logError('Failed to fit bounds to polygon', { error: err });
      }
    }
  }

  // 2025-12-XXT00:00:00:00Z 🟡🟡🟡 - [map-polygon.js] Export factory function
  global.createPolygonManager = function(eventBus, coordinateOrder) {
    return new PolygonManager(eventBus, coordinateOrder);
  };
  
  console.log(`✅✅✅ - [map-polygon.js ${new Date().toISOString()}] PolygonManager module loaded`);
})(window);

