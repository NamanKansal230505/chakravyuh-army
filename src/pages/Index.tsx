
import React, { useState, useEffect } from "react";
import NetworkStatus from "@/components/NetworkStatus";
import { AddNodeButton, AddNodeModal } from "@/components/AddNodeModal";
import AlertsList from "@/components/AlertsList";
import ActivityLog from "@/components/ActivityLog";
import DeploymentMap from "@/components/DeploymentMap";
import NodeDetails from "@/components/NodeDetails";
import { mockNodes, mockAlerts, mockConnections, mockNetworkStatus, generateMockAlert } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";
import { Alert, Node } from "@/lib/types";

const Index = () => {
  const [nodes, setNodes] = useState<Node[]>(mockNodes);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [networkStatus, setNetworkStatus] = useState(mockNetworkStatus);
  const [connections, setConnections] = useState(mockConnections);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);

  // Mock the incoming alerts
  useEffect(() => {
    // Generate new alert every 45-90 seconds
    const alertInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const newAlert = generateMockAlert();
        setAlerts(prev => [newAlert, ...prev]);
        
        // Show toast notification for critical alerts
        if (newAlert.severity === "critical") {
          toast({
            title: "Critical Alert",
            description: `${newAlert.description} - Node ${newAlert.nodeId.replace("node", "")}`,
            variant: "destructive",
          });
        } else if (newAlert.severity === "warning") {
          toast({
            title: "Warning Alert",
            description: `${newAlert.description} - Node ${newAlert.nodeId.replace("node", "")}`,
            variant: "default",
          });
        }
      }
    }, 45000 + Math.random() * 45000);

    return () => clearInterval(alertInterval);
  }, []);

  // Handle node selection
  const handleSelectNode = (node: Node) => {
    setSelectedNode(node);
    
    // Display node selection toast
    toast({
      title: `Selected ${node.name}`,
      description: `${node.sector} - ${node.status}`,
      duration: 3000,
    });
  };

  // Handle new node addition
  const handleAddNode = (newNode: Node) => {
    setNodes(prev => [...prev, newNode]);
    
    // Add connections to nearby nodes (2 closest nodes)
    const nearbyNodes = [...nodes]
      .filter(n => n.id !== newNode.id)
      .sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a.location.lat - newNode.location.lat, 2) + 
          Math.pow(a.location.lng - newNode.location.lng, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.location.lat - newNode.location.lat, 2) + 
          Math.pow(b.location.lng - newNode.location.lng, 2)
        );
        return distA - distB;
      })
      .slice(0, 2);
    
    const newConnections = nearbyNodes.map(node => ({
      source: newNode.id,
      target: node.id,
      strength: 80 + Math.floor(Math.random() * 15) // 80-95% strength
    }));
    
    setConnections(prev => [...prev, ...newConnections]);
    
    // Update network status
    setNetworkStatus(prev => ({
      ...prev,
      activeNodes: prev.activeNodes + 1,
      totalNodes: prev.totalNodes + 1
    }));
    
    // Show toast notification
    toast({
      title: "Node Deployed",
      description: `${newNode.name} has been deployed in ${newNode.sector}`,
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Shadow Alert Network</h1>
          <p className="text-muted-foreground">Army Perimeter Defense System</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NetworkStatus status={networkStatus} />
          <AddNodeButton onClick={() => setIsAddNodeModalOpen(true)} />
          <AlertsList alerts={alerts} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <DeploymentMap
              nodes={nodes}
              connections={connections}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedNode?.id || null}
            />
          </div>
          <div className="md:col-span-1">
            <NodeDetails node={selectedNode} />
          </div>
        </div>

        <div>
          <ActivityLog alerts={alerts} />
        </div>
      </div>

      <AddNodeModal
        open={isAddNodeModalOpen}
        onClose={() => setIsAddNodeModalOpen(false)}
        onAddNode={handleAddNode}
      />
    </div>
  );
};

export default Index;
