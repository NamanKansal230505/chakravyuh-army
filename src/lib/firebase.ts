
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, remove } from "firebase/database";
import { Node, Alert, NetworkConnection, NetworkStatus } from "./types";

// Firebase configuration (using a public database)
const firebaseConfig = {
  apiKey: "AIzaSyAq9oeMQ4cXZcB5um7yF9AUXGl9YBaND9w", // This is a public demo API key
  authDomain: "shadow-alert-network.firebaseapp.com",
  databaseURL: "https://shadow-alert-network-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shadow-alert-network",
  storageBucket: "shadow-alert-network.appspot.com",
  messagingSenderId: "765432109",
  appId: "1:765432109:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// References to database paths
const nodesRef = ref(database, "nodes");
const alertsRef = ref(database, "alerts");
const connectionsRef = ref(database, "connections");
const networkStatusRef = ref(database, "networkStatus");

// Function to get a specific node reference
export const getNodeRef = (nodeId: string) => {
  return ref(database, `nodes/${nodeId}`);
};

// Functions to interact with Firebase
export const subscribeToNodes = (callback: (nodes: Node[]) => void) => {
  onValue(nodesRef, (snapshot) => {
    const data = snapshot.val() || {};
    const nodesList = Object.values(data) as Node[];
    
    // Ensure date objects are properly parsed
    nodesList.forEach((node: any) => {
      if (node.lastActivity) {
        node.lastActivity = new Date(node.lastActivity);
      }
    });
    
    callback(nodesList);
  });
};

export const subscribeToAlerts = (callback: (alerts: Alert[]) => void) => {
  onValue(alertsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const alertsList = Object.values(data) as Alert[];
    
    // Ensure date objects are properly parsed
    alertsList.forEach((alert: any) => {
      if (alert.timestamp) {
        alert.timestamp = new Date(alert.timestamp);
      }
    });
    
    callback(alertsList);
  });
};

export const subscribeToConnections = (callback: (connections: NetworkConnection[]) => void) => {
  onValue(connectionsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const connectionsList = Object.values(data) as NetworkConnection[];
    callback(connectionsList);
  });
};

export const subscribeToNetworkStatus = (callback: (status: NetworkStatus) => void) => {
  onValue(networkStatusRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data as NetworkStatus);
  });
};

export const subscribeToSpecificNode = (nodeId: string, callback: (node: Node | null) => void) => {
  const nodeRef = ref(database, `nodes/${nodeId}`);
  onValue(nodeRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Ensure date objects are properly parsed
      if (data.lastActivity) {
        data.lastActivity = new Date(data.lastActivity);
      }
      callback(data as Node);
    } else {
      callback(null);
    }
  });
};

export const addNewNode = async (node: Node) => {
  const nodeRef = ref(database, `nodes/${node.id}`);
  await set(nodeRef, {
    ...node,
    lastActivity: node.lastActivity.toISOString()
  });
  
  // Update network status
  const statusSnapshot = await Promise.resolve((await onValue(networkStatusRef, () => {})).val() || {});
  const currentStatus = statusSnapshot as NetworkStatus;
  
  await set(networkStatusRef, {
    ...currentStatus,
    activeNodes: (currentStatus.activeNodes || 0) + 1,
    totalNodes: (currentStatus.totalNodes || 0) + 1
  });
  
  return node;
};

export const addAlert = async (alert: Alert) => {
  const alertRef = ref(database, `alerts/${alert.id}`);
  await set(alertRef, {
    ...alert,
    timestamp: alert.timestamp.toISOString()
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
    
    // Seed nodes
    for (const node of mockNodes) {
      await set(ref(database, `nodes/${node.id}`), {
        ...node,
        lastActivity: node.lastActivity.toISOString()
      });
    }
    
    // Seed alerts
    for (const alert of mockAlerts) {
      await set(ref(database, `alerts/${alert.id}`), {
        ...alert,
        timestamp: alert.timestamp.toISOString()
      });
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
