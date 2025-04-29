import { useState, useEffect } from 'react';
import { 
  subscribeToNodes, 
  subscribeToAlerts, 
  subscribeToConnections, 
  subscribeToNetworkStatus,
  subscribeToSpecificNode,
  addNewNode,
  addAlert,
  addConnection,
  updateNodeAlert,
  seedInitialData
} from '@/lib/firebase';
import { Node, Alert, NetworkConnection, NetworkStatus, AlertType } from '@/lib/types';

type UseFirebaseOptions = {
  seedDataIfEmpty?: boolean;
  nodeId?: string;
};

export function useFirebase(options: UseFirebaseOptions = {}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    activeNodes: 0,
    totalNodes: 0,
    networkHealth: 0
  });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to data changes
  useEffect(() => {
    let unsubscribeNodes: (() => void) | undefined;
    let unsubscribeAlerts: (() => void) | undefined;
    let unsubscribeConnections: (() => void) | undefined;
    let unsubscribeNetworkStatus: (() => void) | undefined;

    try {
      unsubscribeNodes = subscribeToNodes(setNodes);
      unsubscribeAlerts = subscribeToAlerts((firebaseAlerts) => {
        // Add frontend timestamps to alerts that come from Firebase
        const alertsWithLocalTimestamps = firebaseAlerts.map(alert => ({
          ...alert,
          timestamp: alert.timestamp || new Date()
        }));
        setAlerts(alertsWithLocalTimestamps);
      });
      unsubscribeConnections = subscribeToConnections(setConnections);
      unsubscribeNetworkStatus = subscribeToNetworkStatus(setNetworkStatus);
      
      // Set loading to false after initial data is loaded
      setTimeout(() => setLoading(false), 1000);
      
      // If no data and seedDataIfEmpty is true, seed initial data
      if (options.seedDataIfEmpty) {
        setTimeout(() => {
          if (nodes.length === 0) {
            seedInitialData().catch((err) => console.error("Error seeding data:", err));
          }
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
    }
    
    // Cleanup subscriptions
    return () => {
      if (unsubscribeNodes) unsubscribeNodes();
      if (unsubscribeAlerts) unsubscribeAlerts();
      if (unsubscribeConnections) unsubscribeConnections();
      if (unsubscribeNetworkStatus) unsubscribeNetworkStatus();
    };
  }, [options.seedDataIfEmpty, nodes.length]);
  
  // Subscribe to specific node if nodeId is provided
  useEffect(() => {
    let unsubscribeNode: (() => void) | undefined;
    
    if (!options.nodeId) return;
    
    try {
      unsubscribeNode = subscribeToSpecificNode(options.nodeId, setSelectedNode);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    }
    
    // Cleanup subscription
    return () => {
      if (unsubscribeNode) unsubscribeNode();
    };
  }, [options.nodeId]);

  // Handle node addition
  const handleAddNode = async (newNode: Node) => {
    try {
      await addNewNode(newNode);
      
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
      
      // Add connections to database
      for (const connection of newConnections) {
        await addConnection(connection);
      }
      
      return newNode;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add node'));
      throw err;
    }
  };
  
  // New function to handle updating node alerts
  const handleUpdateNodeAlert = async (nodeId: string, alertType: AlertType, isActive: boolean) => {
    try {
      // Generate a timestamp on the frontend
      const now = new Date();
      
      // Send alert type status to Firebase, but keep timestamp on frontend
      await updateNodeAlert(nodeId, alertType, isActive);
      
      // If alert is active, add it to our local alerts state with frontend timestamp
      if (isActive) {
        const alertSeverity = getAlertSeverity(alertType);
        const alertDescription = getAlertDescription(alertType);
        
        const newAlert: Alert = {
          id: `${nodeId}-${alertType}-${Date.now()}`,
          type: alertType,
          nodeId: nodeId,
          timestamp: now,
          description: alertDescription,
          severity: alertSeverity,
          acknowledged: false
        };
        
        // Add to local alerts state
        setAlerts(prevAlerts => [...prevAlerts, newAlert]);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update node alert'));
      return false;
    }
  };
  
  // Helper function to get alert severity based on type
  const getAlertSeverity = (alertType: string): "critical" | "warning" | "info" => {
    switch (alertType) {
      case "gun_sound":
      case "suspicious_activity":
        return "critical";
      case "footsteps":
      case "whisper":
        return "warning";
      default:
        return "info";
    }
  };

  // Helper function to get alert description based on type
  const getAlertDescription = (alertType: string): string => {
    switch (alertType) {
      case "gun_sound":
        return "Gunshots Detected";
      case "footsteps":
        return "Footsteps Detected";
      case "whisper":
        return "Whispers Detected";
      case "motion":
        return "Motion Detected";
      case "suspicious_activity":
        return "Suspicious Activity";
      default:
        return alertType.replace(/_/g, " ");
    }
  };

  return {
    nodes,
    alerts,
    connections,
    networkStatus,
    selectedNode,
    loading,
    error,
    handleAddNode,
    handleUpdateNodeAlert
  };
}
