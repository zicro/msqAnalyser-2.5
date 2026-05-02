import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Mosque } from '../types';
import { validateCoordinate, getBestCoordinates } from '../utils';

// Fix for default marker icons in Leaflet with React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to handle map centering
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const MosqueMap = ({ 
  mosques, 
  selectedMosque 
}: { 
  mosques: Mosque[];
  selectedMosque?: Mosque | null;
}) => {
  const [mapMosques, setMapMosques] = useState<any[]>([]);

  const defaultCenter: [number, number] = [31.7917, -7.0926];
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [zoom, setZoom] = useState(6);

  useEffect(() => {
    if (selectedMosque) {
      const best = getBestCoordinates(selectedMosque);
      if (best.lat !== 0 && best.lon !== 0) {
        setCenter([best.lat, best.lon]);
        setZoom(15);
      }
    }
  }, [selectedMosque]);

  useEffect(() => {
    const validMosques = mosques.map(m => {
      const best = getBestCoordinates(m);
      
      return {
        ...m,
        lat: best.lat,
        lon: best.lon,
        coordType: best.type,
        isValid: best.isValid
      };
    }).filter(m => m.lat !== 0 && m.lon !== 0);
    
    setMapMosques(validMosques.slice(0, 1000)); // Limit to 1000 for performance
  }, [mosques]);

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapMosques.map((m, idx) => {
          const isSelected = selectedMosque && selectedMosque.code === m.code;
          
          // Determine icon color
          let icon = greenIcon;
          if (m.coordType.includes("Lambert")) icon = blueIcon;
          if (!m.isValid) icon = redIcon;

          return (
            <Marker 
              key={idx} 
              position={[m.lat, m.lon]} 
              icon={icon}
              eventHandlers={{
                add: (e) => {
                  if (isSelected) {
                    e.target.openPopup();
                  }
                }
              }}
            >
              <Popup>
                <div className="text-sm text-right" dir="auto">
                  <p className="font-bold text-lg mb-1">{m.dénomination_en_arabe || m.dénomination_en_français || "بدون اسم"}</p>
                  <p className="text-zinc-500 font-medium">{m.dénomination_en_français}</p>
                  <p className="text-xs text-emerald-600 font-mono mt-1">Code: {m.code}</p>
                  <p className="text-zinc-500 mt-1">{m.commune}</p>
                  <p className="text-zinc-500">État: {m.etat_batiment || "N/A"}</p>
                  <div className="mt-2 pt-2 border-t border-zinc-100 text-left" dir="ltr">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Source Coordonnées</p>
                    <p className="font-mono text-xs">{m.coordType}</p>
                    <p className="text-[10px] text-zinc-400">[{m.lat.toFixed(6)}, {m.lon.toFixed(6)}]</p>
                  </div>
                  {!m.isValid && <p className="text-red-500 font-bold mt-1 text-left" dir="ltr">⚠️ Coordonnées suspectes</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
