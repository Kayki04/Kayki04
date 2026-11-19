import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../AppContext';

const RIO = [-22.94, -43.27];

export default function MapView({ roles, height = 260 }) {
  const { peopleAt, navigate, myPoint } = useApp();
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(RIO, 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    roles.forEach((r) => {
      const n = peopleAt(r.id).length;
      const icon = L.divIcon({
        className: '',
        html: `<div class="map-pin ${r.live ? 'live' : ''}"><img src="${r.capa}" onerror="this.style.display='none'"/><span>${r.live ? '● ' : ''}${n}</span></div>`,
        iconSize: [46, 46], iconAnchor: [23, 46],
      });
      L.marker([r.lat, r.lng], { icon }).addTo(layer.current)
        .bindTooltip(`<b>${r.nome}</b><br/>${r.bairro} · ${n} pessoas`, { direction: 'top', offset: [0, -48] })
        .on('click', () => navigate('role', { id: r.id }));
    });
    if (myPoint) {
      L.marker([myPoint.lat, myPoint.lng], { icon: L.divIcon({ className: '', html: '<div class="me-pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) })
        .addTo(layer.current).bindTooltip('Você');
    }
  }, [roles, peopleAt, navigate, myPoint]);

  return <div ref={el} className="map" style={{ height }} />;
}
