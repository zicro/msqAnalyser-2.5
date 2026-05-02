import { Mosque, NUMERIC_FIELDS, BOOLEAN_FIELDS, CommuneStats, NUMERIC_FIELD_THRESHOLDS, ComparisonResult } from "./types";
import * as XLSX from 'xlsx';
import proj4 from 'proj4';

// Moroccan Lambert Zone II (Merchich) - Most common for national datasets
// +proj=lcc +lat_1=31.7 +lat_2=34.9 +lat_0=33.3 +lon_0=-5.4 +x_0=500000 +y_0=300000 +ellps=clrk80ign +towgs84=31,146,47,0,0,0,0 +units=m +no_defs
const LAMBERT_MOROCCO_ZONE2 = "+proj=lcc +lat_1=31.7 +lat_2=34.9 +lat_0=33.3 +lon_0=-5.4 +x_0=500000 +y_0=300000 +ellps=clrk80ign +towgs84=31,146,47,0,0,0,0 +units=m +no_defs";
const WGS84 = "EPSG:4326";

export function convertLambertToWGS84(x: number, y: number): [number, number] | null {
  try {
    // Basic validation: Lambert X/Y are usually large positive numbers in Morocco
    if (x < 0 || y < 0 || x > 2000000 || y > 2000000) return null;
    
    const [lon, lat] = proj4(LAMBERT_MOROCCO_ZONE2, WGS84, [x, y]);
    return [lat, lon];
  } catch (err) {
    console.error("Conversion error:", err);
    return null;
  }
}

export function getBestCoordinates(mosque: Mosque): { lat: number; lon: number; type: string; isValid: boolean } {
  // 1. Check Latitude/Longitude first (WGS84)
  const latVal = mosque.latitude;
  const lonVal = mosque.longitude;
  const latRes = validateCoordinate(latVal, "lat");
  const lonRes = validateCoordinate(lonVal, "lon");

  if (latRes.isValid && lonRes.isValid && !latRes.isSuspicious && !lonRes.isSuspicious) {
    return {
      lat: typeof latVal === "string" ? parseFloat(latVal) : Number(latVal),
      lon: typeof lonVal === "string" ? parseFloat(lonVal) : Number(lonVal),
      type: "WGS84 (Lat/Lon)",
      isValid: true
    };
  }

  // 2. Check X/Y (Lambert)
  const xVal = mosque.x || mosque.X || mosque.coordonnée_x || mosque.coordonnee_x;
  const yVal = mosque.y || mosque.Y || mosque.coordonnée_y || mosque.coordonnee_y;

  if (!isNullOrMissing(xVal) && !isNullOrMissing(yVal)) {
    const x = typeof xVal === "string" ? parseFloat(xVal) : Number(xVal);
    const y = typeof yVal === "string" ? parseFloat(yVal) : Number(yVal);

    if (!isNaN(x) && !isNaN(y)) {
      const converted = convertLambertToWGS84(x, y);
      if (converted) {
        const [lat, lon] = converted;
        const latResConv = validateCoordinate(lat, "lat");
        const lonResConv = validateCoordinate(lon, "lon");
        
        if (latResConv.isValid && lonResConv.isValid) {
          return {
            lat,
            lon,
            type: "Lambert (X/Y) Converti",
            isValid: true
          };
        }
      }
    }
  }

  // 3. Fallback to suspicious Lat/Lon if available
  if (latRes.isValid && lonRes.isValid) {
    return {
      lat: typeof latVal === "string" ? parseFloat(latVal) : Number(latVal),
      lon: typeof lonVal === "string" ? parseFloat(lonVal) : Number(lonVal),
      type: "WGS84 (Suspect)",
      isValid: false
    };
  }

  return { lat: 0, lon: 0, type: "Inconnu", isValid: false };
}

export function parseMosqueFile(file: File): Promise<Mosque[]> {
  return new Promise<Mosque[]>((resolve, reject) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onerror = () => {
      reject(new Error(`Error reading file: ${file.name}`));
    };

    reader.onload = (event) => {
      try {
        if (extension === 'json') {
          const json = JSON.parse(event.target?.result as string);
          const data = Array.isArray(json) ? json : [json];
          resolve(data as Mosque[]);
        } else if (extension === 'xlsx' || extension === 'xls') {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData as Mosque[]);
        } else {
          resolve([]);
        }
      } catch (err) {
        reject(err);
      }
    };

    if (extension === 'json') {
      reader.readAsText(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      resolve([]);
    }
  });
}

export const MOROCCO_BOUNDS = {
  minLon: -14,
  maxLon: -1,
  minLat: 27,
  maxLat: 36
};

export function isNullOrMissing(value: any): boolean {
  return value === null || value === undefined || value === "";
}

export function validateCoordinate(val: any, type: "lon" | "lat"): { isValid: boolean; isSuspicious: boolean; isNull: boolean; reason?: string } {
  if (val === null || val === undefined || val === "") return { isValid: false, isSuspicious: false, isNull: true };
  
  const floatVal = typeof val === "string" ? parseFloat(val) : val;
  
  if (isNaN(floatVal)) return { isValid: false, isSuspicious: true, isNull: false, reason: "Non numérique" };
  
  // Projected coordinates check (usually large numbers)
  if (Math.abs(floatVal) > 1000) return { isValid: false, isSuspicious: true, isNull: false, reason: "Format projeté (X/Y)" };

  const isLon = type === "lon";
  const min = isLon ? -180 : -90;
  const max = isLon ? 180 : 90;

  if (floatVal < min || floatVal > max) return { isValid: false, isSuspicious: true, isNull: false, reason: "Hors limites mondiales" };

  const moroccoMin = isLon ? MOROCCO_BOUNDS.minLon : MOROCCO_BOUNDS.minLat;
  const moroccoMax = isLon ? MOROCCO_BOUNDS.maxLon : MOROCCO_BOUNDS.maxLat;

  if (floatVal < moroccoMin || floatVal > moroccoMax) {
    return { isValid: true, isSuspicious: true, isNull: false, reason: "Hors limites Maroc" };
  }

  return { isValid: true, isSuspicious: false, isNull: false };
}

export function calculateStats(data: Mosque[], customThresholds?: Record<string, Threshold>): CommuneStats[] {
  const thresholdsToUse = customThresholds || NUMERIC_FIELD_THRESHOLDS;
  // First pass: Calculate province centroids for outlier detection
  const provinceCentroids: Record<string, { sumLon: number; sumLat: number; count: number }> = {};
  data.forEach(m => {
    const province = m.province || "Inconnu";
    const lonRes = validateCoordinate(m.longitude, "lon");
    const latRes = validateCoordinate(m.latitude, "lat");
    
    if (lonRes.isValid && !lonRes.isSuspicious && latRes.isValid && !latRes.isSuspicious) {
      if (!provinceCentroids[province]) {
        provinceCentroids[province] = { sumLon: 0, sumLat: 0, count: 0 };
      }
      provinceCentroids[province].sumLon += typeof m.longitude === "string" ? parseFloat(m.longitude) : Number(m.longitude);
      provinceCentroids[province].sumLat += typeof m.latitude === "string" ? parseFloat(m.latitude) : Number(m.latitude);
      provinceCentroids[province].count++;
    }
  });

  const centroids = Object.entries(provinceCentroids).reduce((acc, [name, stats]) => {
    acc[name] = {
      avgLon: stats.sumLon / stats.count,
      avgLat: stats.sumLat / stats.count
    };
    return acc;
  }, {} as Record<string, { avgLon: number; avgLat: number }>);

  const grouped = data.reduce((acc, mosque) => {
    const commune = mosque.commune || "Inconnu";
    const province = mosque.province || "Inconnu";

    if (!acc[commune]) {
      acc[commune] = {
        commune,
        count: 0,
        numericFields: {},
        booleanFields: {},
        coordinates: { valid: 0, invalid: 0, null: 0, outsideMorocco: 0, incorrectFormat: 0, outsideProvince: 0 }
      };
      NUMERIC_FIELDS.forEach(f => acc[commune].numericFields[f] = { total: 0, nullMissing: 0, flaggedCount: 0 });
      BOOLEAN_FIELDS.forEach(f => acc[commune].booleanFields[f] = { totalY: 0, totalN: 0, nullMissing: 0 });
    }
    
    const stats = acc[commune];
    stats.count++;

    // Numeric
    NUMERIC_FIELDS.forEach(f => {
      const val = mosque[f];
      if (isNullOrMissing(val)) {
        stats.numericFields[f].nullMissing++;
      } else {
        const num = typeof val === "string" ? parseFloat(val) : val;
        if (!isNaN(num)) {
          stats.numericFields[f].total++;
          const threshold = thresholdsToUse[f] || { value: 1000, operator: '>' };
          const isFlagged = threshold.operator === '>' 
            ? num > threshold.value 
            : num < threshold.value;
          if (isFlagged) stats.numericFields[f].flaggedCount++;
        } else {
          stats.numericFields[f].nullMissing++;
        }
      }
    });

    // Boolean
    BOOLEAN_FIELDS.forEach(f => {
      const val = mosque[f];
      const strVal = String(val).toLowerCase();
      if (isNullOrMissing(val)) {
        stats.booleanFields[f].nullMissing++;
      } else if (strVal === "y" || strVal === "o" || strVal === "oui" || val === true || val === 1 || val === "1") {
        stats.booleanFields[f].totalY++;
      } else if (strVal === "n" || strVal === "non" || val === false || val === 0 || val === "0") {
        stats.booleanFields[f].totalN++;
      } else {
        stats.booleanFields[f].nullMissing++;
      }
    });

    // Coordinates
    const lonVal = mosque.longitude;
    const latVal = mosque.latitude;
    const lonRes = validateCoordinate(lonVal, "lon");
    const latRes = validateCoordinate(latVal, "lat");

    if (lonRes.isNull || latRes.isNull) {
      stats.coordinates.null++;
    } else if (lonRes.reason === "Hors limites Maroc" || latRes.reason === "Hors limites Maroc") {
      stats.coordinates.outsideMorocco++;
      stats.coordinates.invalid++;
    } else if (!lonRes.isValid || !latRes.isValid || lonRes.isSuspicious || latRes.isSuspicious) {
      stats.coordinates.incorrectFormat++;
      stats.coordinates.invalid++;
    } else {
      // Check if outside province (outlier detection)
      const centroid = centroids[province];
      if (centroid) {
        const lon = typeof lonVal === "string" ? parseFloat(lonVal) : Number(lonVal);
        const lat = typeof latVal === "string" ? parseFloat(latVal) : Number(latVal);
        const dist = Math.sqrt(Math.pow(lon - centroid.avgLon, 2) + Math.pow(lat - centroid.avgLat, 2));
        
        // 1.5 degrees is roughly 150km, which is a safe margin for most Moroccan provinces
        if (dist > 1.5) {
          stats.coordinates.outsideProvince++;
          stats.coordinates.invalid++;
        } else {
          stats.coordinates.valid++;
        }
      } else {
        stats.coordinates.valid++;
      }
    }

    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}

export function compareMosqueData(before: Mosque[], after: Mosque[]): ComparisonResult {
  const beforeMap = new Map(before.map(m => [String(m.code), m]));
  const afterMap = new Map(after.map(m => [String(m.code), m]));

  const added: Mosque[] = [];
  const removed: Mosque[] = [];
  const modified: { before: Mosque; after: Mosque; changes: string[] }[] = [];

  let surfaceChanges = 0;
  let coordinateChanges = 0;
  let latrineChanges = 0;

  // Check for added and modified
  after.forEach(afterMosque => {
    const code = String(afterMosque.code);
    const beforeMosque = beforeMap.get(code);

    if (!beforeMosque) {
      added.push(afterMosque);
    } else {
      const changes: string[] = [];
      let hasSurfaceChange = false;
      let hasCoordChange = false;
      let hasLatrineChange = false;

      // Compare all keys
      const allKeys = new Set([...Object.keys(beforeMosque), ...Object.keys(afterMosque)]);
      allKeys.forEach(key => {
        if (key === 'code') return;
        const valBefore = beforeMosque[key];
        const valAfter = afterMosque[key];
        
        if (String(valBefore ?? "") !== String(valAfter ?? "")) {
          changes.push(key);
          
          if (key === 'surface_salle_de_prière_hommes' || key === 'surface_salle_de_prière_femme') {
            hasSurfaceChange = true;
          }
          if (key === 'longitude' || key === 'latitude') {
            hasCoordChange = true;
          }
          if (key === 'surface_latrines_homme' || key === 'surface_latrines_femme') {
            hasLatrineChange = true;
          }
        }
      });

      if (changes.length > 0) {
        modified.push({ before: beforeMosque, after: afterMosque, changes });
        if (hasSurfaceChange) surfaceChanges++;
        if (hasCoordChange) coordinateChanges++;
        if (hasLatrineChange) latrineChanges++;
      }
    }
  });

  // Check for removed
  before.forEach(beforeMosque => {
    if (!afterMap.has(String(beforeMosque.code))) {
      removed.push(beforeMosque);
    }
  });

  return {
    added,
    removed,
    modified,
    summary: {
      totalBefore: before.length,
      totalAfter: after.length,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
      surfaceChanges,
      coordinateChanges,
      latrineChanges
    }
  };
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? "")).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function transliterateArabic(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  const mapping: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'a', 'ى': 'a', 'ء': 'a', 'ئ': 'y',
    'ؤ': 'o', ' ': ' ', '؟': '?', '،': ',', '؛': ';'
  };

  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Handle 'la' combination
    if (char === 'ل' && text[i+1] === 'ا') {
      result += 'la';
      i++;
    } else {
      result += mapping[char] || char;
    }
  }

  // Remove all single quotes as requested
  return result.replace(/'/g, "");
}
