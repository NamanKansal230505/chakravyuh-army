
import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Node, NetworkConnection } from "@/lib/types";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DeploymentMapProps {
  nodes: Node[];
  connections: NetworkConnection[];
  onSelectNode: (node: Node) => void;
  selectedNodeId: string | null;
}

const DeploymentMap: React.FC<DeploymentMapProps> = ({ 
  nodes, 
  connections, 
  onSelectNode,
  selectedNodeId 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const linesRef = useRef<L.Polyline[]>([]);

  // OpenStreetMap API credentials
  const CLIENT_ID = "XlraMtQw7RmuVFEj1ftuRgIZ5eHKV1Sv9k0DhiJ1p8w";
  const CLIENT_SECRET = "qZXqlXs-rcnsUZiHG8YOXElc5h_AasqcJ09f5VaSRfs";

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current).setView([21.076, 79.044], 13);

    // Add OpenStreetMap tile layer with API authentication
    L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map with nodes and connections
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and lines
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current.clear();
    linesRef.current.forEach(line => map.removeLayer(line));
    linesRef.current = [];

    // Add connection lines
    connections.forEach(connection => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode) {
        const line = L.polyline([
          [sourceNode.location.lat, sourceNode.location.lng],
          [targetNode.location.lat, targetNode.location.lng]
        ], {
          color: '#10B981',
          weight: 3,
          opacity: connection.strength / 100,
          className: 'connection-line'
        }).addTo(map);
        
        linesRef.current.push(line);
      }
    });

    // Add node markers
    nodes.forEach(node => {
      // Create custom icon based on node status and type
      let iconColor = '#10B981'; // online - green
      if (node.status === 'warning') iconColor = '#F97316'; // orange
      if (node.status === 'offline') iconColor = '#EF4444'; // red

      const iconSize = node.type === 'gateway' ? 20 : node.type === 'advanced' ? 16 : 12;
      
      // Create custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-node-marker',
        html: `
          <div style="
            width: ${iconSize}px;
            height: ${iconSize}px;
            background: ${iconColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: white;
            font-weight: bold;
            ${node.id === selectedNodeId ? 'box-shadow: 0 0 0 4px rgba(255,255,255,0.5);' : ''}
          ">
            ${node.id.replace('node', '')}
          </div>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2]
      });

      const marker = L.marker([node.location.lat, node.location.lng], {
        icon: customIcon
      }).addTo(map);

      // Add click handler
      marker.on('click', () => {
        onSelectNode(node);
      });

      // Add popup with node information
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold">${node.name}</h3>
          <p class="text-sm">${node.sector}</p>
          <p class="text-sm">Status: <span class="font-medium" style="color: ${iconColor}">${node.status}</span></p>
          <p class="text-sm">Battery: ${node.battery}%</p>
          <p class="text-sm">Signal: ${node.signalStrength}%</p>
        </div>
      `);

      markersRef.current.set(node.id, marker);
    });

    // Fit map to show all nodes
    if (nodes.length > 0) {
      const group = new L.featureGroup(Array.from(markersRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [nodes, connections, selectedNodeId, onSelectNode]);

  return (
    <Card className="h-full border-army-khaki/30 bg-gradient-to-b from-army-olive/80 to-army-green/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Deployment Map</CardTitle>
      </CardHeader>
      <CardContent className="p-1">
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-md"
          style={{
            background: 'linear-gradient(to bottom, rgba(75, 83, 32, 0.8), rgba(16, 185, 129, 0.8))'
          }}
        />
      </CardContent>
    </Card>
  );
};

export default DeploymentMap;
