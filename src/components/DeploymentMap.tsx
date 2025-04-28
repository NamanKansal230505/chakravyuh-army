
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Node, NetworkConnection } from "@/lib/types";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [backgroundImage] = useState("/lovable-uploads/6e0aff5c-acb9-4b64-bce6-2ff626040349.png");

  // Map boundaries (these would ideally be calculated from your real data)
  const mapBounds = {
    minLat: 20.9,
    maxLat: 21.3,
    minLng: 78.9,
    maxLng: 79.3
  };

  // Convert lat/lng to canvas x/y coordinates
  const latLngToXY = (lat: number, lng: number, width: number, height: number) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * width;
    const y = height - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * height;
    return { x, y };
  };

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas dimensions to match container
    const { width, height } = container.getBoundingClientRect();
    setDimensions({ width, height });
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = backgroundImage;
    
    image.onload = () => {
      // Draw background image
      ctx.drawImage(image, 0, 0, width, height);
      
      // Draw network connections
      connections.forEach(connection => {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        
        if (sourceNode && targetNode) {
          const sourcePos = latLngToXY(
            sourceNode.location.lat, 
            sourceNode.location.lng, 
            width, 
            height
          );
          const targetPos = latLngToXY(
            targetNode.location.lat, 
            targetNode.location.lng, 
            width, 
            height
          );
          
          // Draw line with connection strength alpha
          ctx.beginPath();
          ctx.moveTo(sourcePos.x, sourcePos.y);
          ctx.lineTo(targetPos.x, targetPos.y);
          ctx.strokeStyle = `rgba(16, 185, 129, ${connection.strength / 100})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
      
      // Draw nodes
      nodes.forEach(node => {
        const { x, y } = latLngToXY(node.location.lat, node.location.lng, width, height);
        
        // Node status color
        let nodeColor;
        switch (node.status) {
          case "online":
            nodeColor = "#10B981"; // Green
            break;
          case "warning":
            nodeColor = "#F97316"; // Orange
            break;
          case "offline":
            nodeColor = "#EF4444"; // Red
            break;
          default:
            nodeColor = "#10B981";
        }
        
        // Node size based on type
        const nodeSize = node.type === "gateway" ? 10 : 
                          node.type === "advanced" ? 8 : 6;
        
        // Draw node outline
        if (node.id === selectedNodeId) {
          ctx.beginPath();
          ctx.arc(x, y, nodeSize + 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fill();
        }
        
        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        
        // Node border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };
  }, [nodes, connections, dimensions, backgroundImage, selectedNodeId]);

  // Handle node selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find the node that was clicked (within a certain radius)
    const clickedNode = nodes.find(node => {
      const { x, y } = latLngToXY(
        node.location.lat, 
        node.location.lng, 
        dimensions.width, 
        dimensions.height
      );
      const distance = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2));
      return distance <= 15; // Detection radius in pixels
    });

    if (clickedNode) {
      onSelectNode(clickedNode);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Deployment Map</CardTitle>
      </CardHeader>
      <CardContent className="p-1" ref={containerRef}>
        <canvas 
          ref={canvasRef} 
          onClick={handleCanvasClick}
          className="w-full h-[400px] rounded-md cursor-pointer"
        />
      </CardContent>
    </Card>
  );
};

export default DeploymentMap;
