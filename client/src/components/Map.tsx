import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DepartmentFeature } from '../types.js';
import geoData from '../data/la_rioja.json';
import { Plus, Minus, Layers } from 'lucide-react';

interface MapProps {
  onHover: (dept: DepartmentFeature['properties'] | null) => void;
  onClick: (dept: DepartmentFeature['properties']) => void;
  selectedDept: DepartmentFeature['properties'] | null;
}

// A component to handle map bounds zooming when a department is selected
function MapBoundsController({ selectedDept }: { selectedDept: DepartmentFeature['properties'] | null }) {
  const map = useMap();
  
  useEffect(() => {
    // Initial configuration: calculate full province bounds
    const provinceLayer = L.geoJSON(geoData as any);
    const provinceBounds = provinceLayer.getBounds();
    
    // Constrain the map to the province area (with slight padding)
    map.setMaxBounds(provinceBounds.pad(0.1));
    
    // Calculate and lock the minimum zoom required to show the whole province
    const minZoom = map.getBoundsZoom(provinceBounds, false, L.point(20, 20));
    map.setMinZoom(minZoom);

    if (selectedDept) {
      // Find the feature
      const feature = geoData.features.find(f => f.properties.id === selectedDept.id);
      if (feature) {
        const layer = L.geoJSON(feature as any);
        map.fitBounds(layer.getBounds(), { padding: [50, 50], animate: true });
      }
    } else {
      // Reset to La Rioja bounds
      map.fitBounds(provinceBounds, { padding: [20, 20], animate: true });
    }
  }, [selectedDept, map]);

  return null;
}

function CustomZoomControl() {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
      <button 
        onClick={(e) => { e.stopPropagation(); map.zoomIn(); }}
        className="w-10 h-10 bg-[#0c0c0e]/90 border border-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#18181b] hover:border-amber-500/50 backdrop-blur-md transition-all shadow-xl pointer-events-auto"
        title="Acercar"
      >
        <Plus className="w-5 h-5" />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); map.zoomOut(); }}
        className="w-10 h-10 bg-[#0c0c0e]/90 border border-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#18181b] hover:border-amber-500/50 backdrop-blur-md transition-all shadow-xl pointer-events-auto"
        title="Alejar"
      >
        <Minus className="w-5 h-5" />
      </button>
    </div>
  );
}

type MapStyle = 'satellite' | 'terrain' | 'minimal';

export default function InteractiveMap({ onHover, onClick, selectedDept }: MapProps) {
  const geoJsonRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite');
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Default center and zoom will be overridden by MapBoundsController anyway
  const defaultCenter: [number, number] = [-29.4134, -66.8564]; // La Rioja Center
  
  const style = (feature: any) => {
    const isSelected = selectedDept?.id === feature.properties.id;
    
    if (mapStyle === 'minimal') {
      return {
        fillColor: isSelected ? "rgba(245, 158, 11, 0.15)" : "transparent",
        weight: isSelected ? 2 : 1,
        opacity: 1,
        color: isSelected ? "#fcd34d" : "#52525b",
        fillOpacity: 1,
        className: "transition-all duration-300 outline-none"
      };
    }
    
    return {
      fillColor: isSelected ? "#f59e0b" : "#000000",
      weight: isSelected ? 3 : 1.5,
      opacity: isSelected ? 1 : 0.8,
      color: isSelected ? "#fcd34d" : "#fbbf24", // Elegant gold/amber borders
      fillOpacity: isSelected ? 0.35 : 0.1,
      className: "transition-all duration-300 outline-none"
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        // if not selected, highlight it slightly with elegant styling
        if (selectedDept?.id !== feature.properties.id) {
          if (mapStyle === 'minimal') {
            layer.setStyle({
              weight: 1.5,
              color: '#a1a1aa',
              fillColor: '#27272a',
              fillOpacity: 0.5
            });
          } else {
            layer.setStyle({
              weight: 2,
              color: '#fde68a', // lighter amber on hover
              fillOpacity: 0.25,
              fillColor: '#f59e0b'
            });
          }
          layer.bringToFront();
        }
        onHover(feature.properties as DepartmentFeature['properties']);
      },
      mouseout: (e: any) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
        onHover(null);
      },
      click: (e: any) => {
        onClick(feature.properties as DepartmentFeature['properties']);
        
        // Ensure the clicked layer comes to front
        const layer = e.target;
        layer.bringToFront();
      }
    });
  };

  return (
    <div className="w-full h-full relative z-0 bg-[#09090b]">
      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        scrollWheelZoom={false} 
        doubleClickZoom={false}
        zoomControl={false}
        className="w-full h-full z-0 drop-shadow-[0_0_30px_rgba(251,191,36,0.15)] bg-[#09090b]"
      >
        {mapStyle === 'satellite' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}
        {mapStyle === 'terrain' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}
        
        <GeoJSON 
          key={mapStyle}
          ref={geoJsonRef}
          data={geoData as any} 
          style={style} 
          onEachFeature={onEachFeature} 
        />
        <MapBoundsController selectedDept={selectedDept} />
        <CustomZoomControl />
      </MapContainer>
      
      {/* Map Style Selector */}
      <div className="absolute top-4 left-4 z-[400]">
        <div className="relative">
          <button 
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            onBlur={() => setTimeout(() => setShowStyleMenu(false), 200)}
            className="h-10 px-4 bg-[#0c0c0e]/90 border border-white/10 rounded-full flex items-center justify-center gap-2 text-slate-300 hover:text-white hover:bg-[#18181b] hover:border-amber-500/50 backdrop-blur-md transition-all shadow-xl pointer-events-auto cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest font-semibold hidden sm:inline">
              {mapStyle === 'satellite' ? 'Satélite' : mapStyle === 'terrain' ? 'Relieve' : 'Minimalista'}
            </span>
          </button>
          
          {showStyleMenu && (
            <div className="absolute top-full left-0 mt-2 w-36 sm:w-40 bg-[#0c0c0e]/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col py-1 pointer-events-auto">
              <button 
                onClick={() => setMapStyle('satellite')}
                className={`px-4 py-2 text-left text-xs font-mono uppercase tracking-widest transition-colors ${mapStyle === 'satellite' ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                Satélite
              </button>
              <button 
                onClick={() => setMapStyle('terrain')}
                className={`px-4 py-2 text-left text-xs font-mono uppercase tracking-widest transition-colors ${mapStyle === 'terrain' ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                Relieve
              </button>
              <button 
                onClick={() => setMapStyle('minimal')}
                className={`px-4 py-2 text-left text-xs font-mono uppercase tracking-widest transition-colors ${mapStyle === 'minimal' ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                Minimalista
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[400] bg-[#0c0c0e]/80 p-3 rounded border border-white/10 backdrop-blur-md shadow-xl pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500/35 border-2 border-amber-300"></div>
          <span className="text-[10px] text-slate-200 uppercase tracking-widest font-mono">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-black/10 border-2 border-amber-500"></div>
          <span className="text-[10px] text-slate-200 uppercase tracking-widest font-mono">Otras Regiones</span>
        </div>
      </div>
    </div>
  );
}
