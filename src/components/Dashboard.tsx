import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Mosque } from '../types';
import { Card } from './UI';
import { validateCoordinate } from '../utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard = ({ mosques }: { mosques: Mosque[] }) => {
  const communeData = useMemo(() => {
    const counts: Record<string, number> = {};
    mosques.forEach(m => {
      const c = m.commune || "Inconnu";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [mosques]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    mosques.forEach(m => {
      const t = m.type_de_mosquée || "Inconnu";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [mosques]);

  const etatData = useMemo(() => {
    const counts: Record<string, number> = {};
    mosques.forEach(m => {
      const e = m.etat_batiment || "Inconnu";
      counts[e] = (counts[e] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [mosques]);

  const surfaceData = useMemo(() => {
    const buckets = [
      { name: '0-100', count: 0 },
      { name: '100-300', count: 0 },
      { name: '300-600', count: 0 },
      { name: '600-1000', count: 0 },
      { name: '>1000', count: 0 },
    ];
    mosques.forEach(m => {
      const s = typeof m.surface_salle_de_prière_hommes === "string" ? parseFloat(m.surface_salle_de_prière_hommes) : m.surface_salle_de_prière_hommes;
      if (s === undefined || s === null || isNaN(s)) return;
      if (s <= 100) buckets[0].count++;
      else if (s <= 300) buckets[1].count++;
      else if (s <= 600) buckets[2].count++;
      else if (s <= 1000) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [mosques]);

  const coordinateData = useMemo(() => {
    // Calculate centroids for province outlier detection
    const provinceCentroids: Record<string, { sumLon: number; sumLat: number; count: number }> = {};
    mosques.forEach(m => {
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

    const stats = {
      total: mosques.length,
      null: 0,
      outsideMorocco: 0,
      incorrectFormat: 0,
      outsideProvince: 0,
      valid: 0
    };

    mosques.forEach(m => {
      const province = m.province || "Inconnu";
      const lonVal = m.longitude;
      const latVal = m.latitude;
      const lonRes = validateCoordinate(lonVal, "lon");
      const latRes = validateCoordinate(latVal, "lat");

      if (lonRes.isNull || latRes.isNull) {
        stats.null++;
      } else if (lonRes.reason === "Hors limites Maroc" || latRes.reason === "Hors limites Maroc") {
        stats.outsideMorocco++;
      } else if (!lonRes.isValid || !latRes.isValid || lonRes.isSuspicious || latRes.isSuspicious) {
        stats.incorrectFormat++;
      } else {
        const centroid = centroids[province];
        if (centroid) {
          const lon = typeof lonVal === "string" ? parseFloat(lonVal) : Number(lonVal);
          const lat = typeof latVal === "string" ? parseFloat(latVal) : Number(latVal);
          const dist = Math.sqrt(Math.pow(lon - centroid.avgLon, 2) + Math.pow(lat - centroid.avgLat, 2));
          
          if (dist > 1.5) {
            stats.outsideProvince++;
          } else {
            stats.valid++;
          }
        } else {
          stats.valid++;
        }
      }
    });

    return [
      { name: 'Total', value: stats.total, fill: '#64748b' },
      { name: 'Valide', value: stats.valid, fill: '#10b981' },
      { name: 'Manquant', value: stats.null, fill: '#94a3b8' },
      { name: 'Hors Maroc', value: stats.outsideMorocco, fill: '#f59e0b' },
      { name: 'Hors Province', value: stats.outsideProvince, fill: '#8b5cf6' },
      { name: 'Format Incorrect', value: stats.incorrectFormat, fill: '#ef4444' },
    ];
  }, [mosques]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Top 10 Communes (Nombre de mosquées)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={communeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Répartition par Type de Mosquée</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">État du Bâtiment</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={etatData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Surface Salle de Prière Hommes (m²)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={surfaceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Qualité des Coordonnées</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coordinateData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
