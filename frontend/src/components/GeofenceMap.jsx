import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SCHOOL = {
  lat: 10.813308852984058,
  lng: 106.77209163591941,
  radius: 200,
  name: 'Trường Cao Đẳng Kinh Tế Đối Ngoại',
};

export default function GeofenceMap({ gpsData, onClose }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current || instanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [SCHOOL.lat, SCHOOL.lng], 16
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // School marker
    const schoolIcon = L.divIcon({
      html: '<div style="font-size:28px;line-height:1">🏫</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
    L.marker([SCHOOL.lat, SCHOOL.lng], { icon: schoolIcon })
      .addTo(map)
      .bindPopup(`<b>${SCHOOL.name}</b><br>Vùng điểm danh: ${SCHOOL.radius}m`)
      .openPopup();

    // 200m radius circle
    L.circle([SCHOOL.lat, SCHOOL.lng], {
      radius: SCHOOL.radius,
      color: '#3b82f6',
      weight: 2,
      fillColor: '#93c5fd',
      fillOpacity: 0.25,
    }).addTo(map);

    // Student marker
    if (gpsData?.lat && gpsData?.lng) {
      const inside = gpsData.distance <= SCHOOL.radius;
      const studentIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;background:${inside ? '#22c55e' : '#ef4444'};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([gpsData.lat, gpsData.lng], { icon: studentIcon })
        .addTo(map)
        .bindPopup(
          `<b>📍 Vị trí của bạn</b><br>
           Cách trường: <b style="color:${inside ? 'green' : 'red'}">${gpsData.distance}m</b><br>
           Độ chính xác: ±${gpsData.accuracy}m<br>
           ${inside ? '✅ Trong vùng điểm danh' : '❌ Ngoài vùng điểm danh'}`
        );

      // Line from school to student
      L.polyline([[SCHOOL.lat, SCHOOL.lng], [gpsData.lat, gpsData.lng]], {
        color: inside ? '#22c55e' : '#ef4444',
        weight: 2,
        dashArray: '6 4',
        opacity: 0.7,
      }).addTo(map);

      // Fit both markers
      map.fitBounds([
        [SCHOOL.lat, SCHOOL.lng],
        [gpsData.lat, gpsData.lng],
      ], { padding: [40, 40] });
    }

    instanceRef.current = map;
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [gpsData]);

  const inside = gpsData && gpsData.distance <= SCHOOL.radius;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            🗺️ Bản đồ vùng điểm danh
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} style={{ height: '320px', width: '100%' }} />

        {/* Footer info */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block border border-white" /> Vùng điểm danh ({SCHOOL.radius}m)
          </span>
          {gpsData && (
            <span className={`flex items-center gap-1 font-medium ${inside ? 'text-green-600' : 'text-red-500'}`}>
              <span className={`w-3 h-3 rounded-full inline-block ${inside ? 'bg-green-500' : 'bg-red-500'}`} />
              Bạn: {gpsData.distance}m {inside ? '(✓ Trong vùng)' : '(✗ Ngoài vùng)'}
            </span>
          )}
          {!gpsData && <span className="text-gray-400">Chưa lấy được vị trí</span>}
        </div>
      </div>
    </div>
  );
}
