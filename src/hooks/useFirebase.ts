
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
  seedInitialData
} from '@/lib/firebase';
import { Node, Alert, NetworkConnection, NetworkStatus } from '@/lib/types';

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
    try {
      const unsubscribeNodes = subscribeToNodes(setNodes);
      const unsubscribeAlerts = subscribeToAlerts(setAlerts);
      const unsubscribeConnections = subscribeToConnections(setConnections);
      const unsubscribeNetworkStatus = subscribeToNetworkStatus(setNetworkStatus);
      
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
      
      // Cleanup subscriptions
      return () => {
        unsubscribeNodes();
        unsubscribeAlerts();
        unsubscribeConnections();
        unsubscribeNetworkStatus();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
    }
  }, [options.seedDataIfEmpty]);
  
  // Subscribe to specific node if nodeId is provided
  useEffect(() => {
    if (!options.nodeId) return;
    
    try {
      const unsubscribeNode = subscribeToSpecificNode(options.nodeId, setSelectedNode);
      
      // Cleanup subscription
      return () => {
        unsubscribeNode();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    }
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

  return {
    nodes,
    alerts,
    connections,
    networkStatus,
    selectedNode,
    loading,
    error,
    handleAddNode
  };
}
