import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, remove, update } from "firebase/database";
import { Node, Alert, NetworkConnection, NetworkStatus } from "./types";

// Firebase configuration (using the provided database URL)
const firebaseConfig = {
  apiKey: "AIzaSyAq9oeMQ4cXZcB5um7yF9AUXGl9YBaND9w", // This is a public demo API key
  authDomain: "shadow-alert-network.firebaseapp.com",
  databaseURL: "https://saarthi-84622-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "saarthi-84622",
  storageBucket: "saarthi-84622.appspot.com",
  messagingSenderId: "765432109",
  appId: "1:765432109:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// References to database paths
const nodesRef = ref(database, "nodes");
const alertHistoryRef = ref(database, "alertHistory");
const connectionsRef = ref(database, "connections");
const networkStatusRef = ref(database, "networkStatus");

// Function to get a specific node reference
export const getNodeRef = (nodeId: string) => {
  return ref(database, `nodes/${nodeId}`);
};

// Functions to interact with Firebase
export const subscribeToNodes = (callback: (nodes: Node[]) => void) => {
  const unsubscribe = onValue(nodesRef, (snapshot) => {
    const data = snapshot.val() || {};
    const nodesList: Node[] = [];
    
    // Convert object to array and process nodes
    Object.entries(data).forEach(([nodeId, nodeData]: [string, any]) => {
      const node: Node = {
        id: nodeId,
        name: nodeData.name || `Node #${nodeId.replace('node', '')}`,
        sector: nodeData.sector || 'Unknown Sector',
        status: nodeData.status || 'online',
        battery: nodeData.battery || 100,
        signalStrength: nodeData.signalStrength || 100,
        lastActivity: nodeData.lastActivity ? new Date(nodeData.lastActivity) : new Date(),
        location: nodeData.location || { lat: 21.15, lng: 79.08 },
        type: nodeData.type || 'standard',
        alerts: nodeData.alerts || {
          gun_sound: false,
          footsteps: false,
          motion: false,
          whisper: false,
          suspicious_activity: false
        }
      };
      
      nodesList.push(node);
    });
    
    callback(nodesList);
  });
  
  return unsubscribe;
};

export const subscribeToAlerts = (callback: (alerts: Alert[]) => void) => {
  const unsubscribe = onValue(alertHistoryRef, (snapshot) => {
    const data = snapshot.val() || {};
    const alertsList: Alert[] = [];
    
    // Convert object to array and process alerts
    Object.entries(data).forEach(([alertId, alertData]: [string, any]) => {
      const alert: Alert = {
        id: alertId,
        type: alertData.type || 'unknown',
        nodeId: alertData.nodeId || '',
        // Generate a new timestamp on the frontend instead of using Firebase's
        timestamp: new Date(),
        description: alertData.description || '',
        severity: alertData.severity || 'info',
        acknowledged: alertData.acknowledged || false
      };
      
      alertsList.push(alert);
    });
    
    callback(alertsList);
  });
  
  return unsubscribe;
};

export const subscribeToConnections = (callback: (connections: NetworkConnection[]) => void) => {
  const unsubscribe = onValue(connectionsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const connectionsList = Object.values(data) as NetworkConnection[];
    callback(connectionsList);
  });
  
  return unsubscribe;
};

export const subscribeToNetworkStatus = (callback: (status: NetworkStatus) => void) => {
  const unsubscribe = onValue(networkStatusRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data as NetworkStatus);
  });
  
  return unsubscribe;
};

export const subscribeToSpecificNode = (nodeId: string, callback: (node: Node | null) => void) => {
  const nodeRef = ref(database, `nodes/${nodeId}`);
  const unsubscribe = onValue(nodeRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Create a properly formatted node object
      const node: Node = {
        id: nodeId,
        name: data.name || `Node #${nodeId.replace('node', '')}`,
        sector: data.sector || 'Unknown Sector',
        status: data.status || 'online',
        battery: data.battery || 100,
        signalStrength: data.signalStrength || 100,
        lastActivity: data.lastActivity ? new Date(data.lastActivity) : new Date(),
        location: data.location || { lat: 21.15, lng: 79.08 },
        type: data.type || 'standard',
        alerts: data.alerts || {
          gun_sound: false,
          footsteps: false,
          motion: false,
          whisper: false,
          suspicious_activity: false
        }
      };
      
      callback(node);
    } else {
      callback(null);
    }
  });
  
  return unsubscribe;
};

export const addNewNode = async (node: Node) => {
  const nodeRef = ref(database, `nodes/${node.id}`);
  await set(nodeRef, {
    name: node.name,
    sector: node.sector,
    status: node.status,
    battery: node.battery,
    signalStrength: node.signalStrength,
    lastActivity: node.lastActivity.toISOString(),
    location: node.location,
    type: node.type,
    alerts: {
      gun_sound: false,
      footsteps: false,
      motion: false,
      whisper: false,
      suspicious_activity: false
    }
  });
  
  // Update network status
  const networkStatusSnapshot = await new Promise<any>((resolve) => {
    onValue(networkStatusRef, (snapshot) => {
      resolve(snapshot.val() || {});
    }, { onlyOnce: true });
  });
  
  const currentStatus = networkStatusSnapshot as NetworkStatus;
  
  await set(networkStatusRef, {
    ...currentStatus,
    activeNodes: (currentStatus.activeNodes || 0) + 1,
    totalNodes: (currentStatus.totalNodes || 0) + 1
  });
  
  return node;
};

// New function to update node alert status
export const updateNodeAlert = async (nodeId: string, alertType: string, isActive: boolean) => {
  const nodeAlertRef = ref(database, `nodes/${nodeId}/alerts/${alertType}`);
  await set(nodeAlertRef, isActive);
  
  // If alert is active, add minimal data to alert history in Firebase
  // Timestamp will be generated on the frontend
  if (isActive) {
    const alertHistoryEntryRef = push(alertHistoryRef);
    
    await set(alertHistoryEntryRef, {
      type: alertType,
      nodeId: nodeId,
      acknowledged: false
    });
  }
  
  return { nodeId, alertType, isActive };
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

export const addAlert = async (alert: Alert) => {
  // First update the node's alert status
  await updateNodeAlert(alert.nodeId, alert.type, true);
  
  // Then add to alert history (without timestamp)
  const alertRef = ref(database, `alertHistory/${alert.id}`);
  await set(alertRef, {
    type: alert.type,
    nodeId: alert.nodeId,
    acknowledged: alert.acknowledged
  });
  
  return alert;
};

export const addConnection = async (connection: NetworkConnection) => {
  const newConnectionRef = push(connectionsRef);
  await set(newConnectionRef, connection);
  return connection;
};

export const seedInitialData = async () => {
  try {
    // Import mock data
    const { mockNodes, mockAlerts, mockConnections, mockNetworkStatus } = await import('./mockData');
    
    // Seed nodes with alert properties
    for (const node of mockNodes) {
      // Add alerts property to each node
      const nodeWithAlerts = {
        ...node,
        lastActivity: node.lastActivity.toISOString(),
        alerts: {
          gun_sound: false,
          footsteps: false,
          motion: false,
          whisper: false,
          suspicious_activity: false
        }
      };
      
      await set(ref(database, `nodes/${node.id}`), nodeWithAlerts);
    }
    
    // Seed alert history (without timestamps)
    for (const alert of mockAlerts) {
      await set(ref(database, `alertHistory/${alert.id}`), {
        type: alert.type,
        nodeId: alert.nodeId,
        acknowledged: alert.acknowledged
      });
      
      // Also set alert flag on the corresponding node
      if (!alert.acknowledged) {
        await set(ref(database, `nodes/${alert.nodeId}/alerts/${alert.type}`), true);
      }
    }
    
    // Seed connections
    for (const connection of mockConnections) {
      const newConnectionRef = push(connectionsRef);
      await set(newConnectionRef, connection);
    }
    
    // Seed network status
    await set(networkStatusRef, mockNetworkStatus);
    
    console.log("Initial data seeded successfully");
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
};

export { database };
