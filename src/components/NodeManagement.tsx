
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Node } from "@/lib/types";
import { MapPin, Save } from "lucide-react";

interface NodeManagementProps {
  nodes: Node[];
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
}

const NodeManagement: React.FC<NodeManagementProps> = ({ nodes, onUpdateNode }) => {
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [tempCoords, setTempCoords] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' });

  const handleEditNode = (node: Node) => {
    setEditingNode(node.id);
    setTempCoords({
      lat: node.location.lat.toString(),
      lng: node.location.lng.toString()
    });
  };

  const handleSaveCoordinates = (nodeId: string) => {
    const lat = parseFloat(tempCoords.lat);
    const lng = parseFloat(tempCoords.lng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      onUpdateNode(nodeId, {
        location: { lat, lng }
      });
      setEditingNode(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
    setTempCoords({ lat: '', lng: '' });
  };

  if (nodes.length === 0) {
    return (
      <Card className="border-army-khaki/30 bg-card/90">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Node Management
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          No nodes discovered yet. Connect to serial port to detect nodes.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-army-khaki/30 bg-card/90">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Node Management ({nodes.length} nodes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={nodes[0]?.id} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            {nodes.slice(0, 3).map((node) => (
              <TabsTrigger key={node.id} value={node.id}>
                {node.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {nodes.map((node) => (
            <TabsContent key={node.id} value={node.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{node.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  node.alerts?.motion ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {node.alerts?.motion ? 'Motion Detected' : 'No Motion'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Node ID</Label>
                  <div className="text-sm font-mono">{node.id}</div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="text-sm capitalize">{node.status}</div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Coordinates</Label>
                  {editingNode === node.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Latitude"
                          value={tempCoords.lat}
                          onChange={(e) => setTempCoords(prev => ({ ...prev, lat: e.target.value }))}
                          className="h-8 text-xs"
                        />
                        <Input
                          placeholder="Longitude"
                          value={tempCoords.lng}
                          onChange={(e) => setTempCoords(prev => ({ ...prev, lng: e.target.value }))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveCoordinates(node.id)}
                          className="h-6 text-xs"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-6 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-mono">
                        {node.location.lat.toFixed(6)}, {node.location.lng.toFixed(6)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditNode(node)}
                        className="h-6 text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NodeManagement;
