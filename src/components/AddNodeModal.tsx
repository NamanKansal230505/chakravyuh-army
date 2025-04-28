
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateNewNode } from "@/lib/mockData";
import { Plus } from "lucide-react";

interface AddNodeModalProps {
  open: boolean;
  onClose: () => void;
  onAddNode: (node: any) => void;
}

const AddNodeModal: React.FC<AddNodeModalProps> = ({ open, onClose, onAddNode }) => {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !sector || !latitude || !longitude) return;

    setLoading(true);
    
    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinates");
      }
      
      const newNode = generateNewNode(name, sector, { lat, lng });
      onAddNode(newNode);
      
      // Reset form
      setName("");
      setSector("");
      setLatitude("");
      setLongitude("");
      
      onClose();
    } catch (error) {
      console.error("Error creating node:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy New Sensor Node</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="name">Node Name</Label>
            <Input
              id="name"
              placeholder="Enter node name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="sector">Sector</Label>
            <Select value={sector} onValueChange={setSector} required>
              <SelectTrigger id="sector">
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sector A">Sector A</SelectItem>
                <SelectItem value="Sector B">Sector B</SelectItem>
                <SelectItem value="Sector C">Sector C</SelectItem>
                <SelectItem value="Sector D">Sector D</SelectItem>
                <SelectItem value="Sector E">Sector E</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                placeholder="E.g. 21.152"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                placeholder="E.g. 79.088"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Deploying..." : "Deploy Node"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddNodeButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Add Sensor Node</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-20">
        <Button 
          onClick={onClick}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" /> Deploy New Node
        </Button>
      </CardContent>
    </Card>
  );
};

export { AddNodeModal, AddNodeButton };
