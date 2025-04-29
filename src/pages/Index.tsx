
import React, { useState, useEffect } from "react";
import NetworkStatus from "@/components/NetworkStatus";
import { AddNodeButton, AddNodeModal } from "@/components/AddNodeModal";
import AlertsList from "@/components/AlertsList";
import ActivityLog from "@/components/ActivityLog";
import DeploymentMap from "@/components/DeploymentMap";
import NodeDetails from "@/components/NodeDetails";
import { generateMockAlert } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";
import { Alert, Node, AlertType } from "@/lib/types";
import { useFirebase } from "@/hooks/useFirebase";
import { useNavigate, useLocation } from "react-router-dom";
import { updateNodeAlert } from "@/lib/firebase";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  
  // Extract node ID from URL if present
  const nodeIdMatch = location.pathname.match(/^\/node(\d+)$/);
  const nodeId = nodeIdMatch ? `node${nodeIdMatch[1]}` : null;

  // Use our Firebase hook
  const {
    nodes,
    alerts,
    connections,
    networkStatus,
    selectedNode: firebaseSelectedNode,
    loading,
    error,
    handleAddNode,
    handleUpdateNodeAlert
  } = useFirebase({
    seedDataIfEmpty: true,
    nodeId: nodeId || undefined
  });

  // Local selected node state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Update selected node when Firebase node changes or when URL changes
  useEffect(() => {
    if (nodeId && firebaseSelectedNode) {
      setSelectedNode(firebaseSelectedNode);
    } else if (nodeId && nodes.length > 0) {
      // Try to find the node in our nodes array
      const foundNode = nodes.find(node => node.id === nodeId);
      if (foundNode) {
        setSelectedNode(foundNode);
      }
    }
  }, [nodeId, firebaseSelectedNode, nodes]);

  // We'll keep the mock alert generation for demonstration purposes
  // In a real implementation, alerts would come directly from backend/firebase
  useEffect(() => {
    // Generate new alert simulation every 45-90 seconds
    const alertInterval = setInterval(() => {
      if (Math.random() > 0.5 && nodes.length > 0) {
        // Select random node and alert type
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        const alertTypes: AlertType[] = ["gun_sound", "footsteps", "motion", "whisper", "suspicious_activity"];
        const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        
        // Update the node's alert status in Firebase
        handleUpdateNodeAlert(randomNode.id, randomType, true);
        
        // Determine severity for toast notifications
        let severity: "critical" | "warning" | "info" = "info";
        if (randomType === "gun_sound" || randomType === "suspicious_activity") {
          severity = "critical";
        } else if (randomType === "footsteps" || randomType === "whisper") {
          severity = "warning";
        }
        
        // Show toast notification for critical alerts
        if (severity === "critical") {
          toast({
            title: "Critical Alert",
            description: `${randomType.replace("_", " ")} - Node ${randomNode.id.replace("node", "")}`,
            variant: "destructive",
          });
        } else if (severity === "warning") {
          toast({
            title: "Warning Alert",
            description: `${randomType.replace("_", " ")} - Node ${randomNode.id.replace("node", "")}`,
            variant: "default",
          });
        }
      }
    }, 45000 + Math.random() * 45000);

    return () => clearInterval(alertInterval);
  }, [nodes, handleUpdateNodeAlert]);

  // Handle node selection
  const handleSelectNode = (node: Node) => {
    setSelectedNode(node);
    
    // Update URL to reflect selected node
    navigate(`/node${node.id.replace("node", "")}`);
    
    // Display node selection toast
    toast({
      title: `Selected ${node.name}`,
      description: `${node.sector} - ${node.status}`,
      duration: 3000,
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl font-bold">Loading Chakravyuh</div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 bg-red-500/10 rounded-lg">
          <div className="text-xl font-bold text-red-500">Error Loading Data</div>
          <div className="text-muted-foreground">{error.message}</div>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Create a derived list of active alerts from nodes with active alerts
  const activeAlerts = nodes.reduce((result: Alert[], node) => {
    if (!node.alerts) return result;
    
    Object.entries(node.alerts).forEach(([type, isActive]) => {
      if (isActive) {
        // Determine severity based on alert type
        let severity: "critical" | "warning" | "info" = "info";
        if (type === "gun_sound" || type === "suspicious_activity") {
          severity = "critical";
        } else if (type === "footsteps" || type === "whisper") {
          severity = "warning";
        }
        
        // Format description based on alert type
        let description = type.replace(/_/g, " ");
        switch (type) {
          case "gun_sound": 
            description = "Gunshots Detected"; 
            break;
          case "footsteps": 
            description = "Footsteps Detected"; 
            break;
          case "whisper": 
            description = "Whispers Detected"; 
            break;
          case "motion": 
            description = "Motion Detected"; 
            break;
          case "suspicious_activity": 
            description = "Suspicious Activity"; 
            break;
        }
        
        result.push({
          id: `${node.id}-${type}-${Date.now()}`,
          type: type as AlertType,
          nodeId: node.id,
          timestamp: new Date(),
          description,
          severity,
          acknowledged: false
        });
      }
    });
    
    return result;
  }, []);
  
  // Combine historical alerts with active alerts
  const combinedAlerts = [...activeAlerts, ...alerts];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chakravyuh</h1>
            <p className="text-muted-foreground">Army Perimeter Defense System</p>
          </div>
          {selectedNode && (
            <button
              onClick={() => {
                navigate("/");
                setSelectedNode(null);
              }}
              className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
            >
              Back to Overview
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NetworkStatus status={networkStatus} />
          <AddNodeButton onClick={() => setIsAddNodeModalOpen(true)} />
          <AlertsList alerts={combinedAlerts} />
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
          <ActivityLog alerts={combinedAlerts} />
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
