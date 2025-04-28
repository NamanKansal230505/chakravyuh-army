
import { Node, Alert, NetworkConnection, AlertType } from "./types";

// Mock node data
export const mockNodes: Node[] = [
  {
    id: "node1",
    name: "Node #01",
    sector: "Sector A",
    status: "online",
    battery: 85,
    signalStrength: 92,
    lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    location: { lat: 21.152, lng: 79.088 },
    type: "gateway"
  },
  {
    id: "node2",
    name: "Node #02",
    sector: "Sector A",
    status: "online",
    battery: 72,
    signalStrength: 88,
    lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    location: { lat: 21.155, lng: 79.091 },
    type: "standard"
  },
  {
    id: "node3",
    name: "Node #03",
    sector: "Sector B",
    status: "online",
    battery: 95,
    signalStrength: 78,
    lastActivity: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    location: { lat: 21.158, lng: 79.082 },
    type: "advanced"
  },
  {
    id: "node4",
    name: "Node #04",
    sector: "Sector B",
    status: "warning",
    battery: 35,
    signalStrength: 65,
    lastActivity: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    location: { lat: 21.148, lng: 79.079 },
    type: "standard"
  },
  {
    id: "node5",
    name: "Node #05",
    sector: "Sector B",
    status: "online",
    battery: 82,
    signalStrength: 91,
    lastActivity: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    location: { lat: 21.145, lng: 79.095 },
    type: "standard"
  },
  {
    id: "node6",
    name: "Node #06",
    sector: "Sector C",
    status: "offline",
    battery: 10,
    signalStrength: 0,
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    location: { lat: 21.162, lng: 79.097 },
    type: "advanced"
  },
  {
    id: "node7",
    name: "Node #07",
    sector: "Sector C",
    status: "online",
    battery: 76,
    signalStrength: 83,
    lastActivity: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
    location: { lat: 21.159, lng: 79.102 },
    type: "standard"
  },
  {
    id: "node8",
    name: "Node #08",
    sector: "Sector A",
    status: "online",
    battery: 88,
    signalStrength: 95,
    lastActivity: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
    location: { lat: 21.149, lng: 79.089 },
    type: "standard"
  },
  {
    id: "node9",
    name: "Node #09",
    sector: "Sector D",
    status: "online",
    battery: 92,
    signalStrength: 89,
    lastActivity: new Date(Date.now() - 7 * 60 * 1000), // 7 minutes ago
    location: { lat: 21.157, lng: 79.087 },
    type: "standard"
  },
  {
    id: "node10",
    name: "Node #10",
    sector: "Sector D",
    status: "warning",
    battery: 42,
    signalStrength: 61,
    lastActivity: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
    location: { lat: 21.154, lng: 79.075 },
    type: "standard"
  },
  {
    id: "node11",
    name: "Node #11",
    sector: "Sector E",
    status: "online",
    battery: 81,
    signalStrength: 94,
    lastActivity: new Date(Date.now() - 9 * 60 * 1000), // 9 minutes ago
    location: { lat: 21.146, lng: 79.084 },
    type: "advanced"
  },
  {
    id: "node12",
    name: "Node #12",
    sector: "Sector E",
    status: "online",
    battery: 85,
    signalStrength: 92,
    lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    location: { lat: 21.151, lng: 79.098 },
    type: "standard"
  }
];

// Alert descriptions by type
const alertDescriptions: Record<AlertType, string[]> = {
  gun_sound: ["Gun Reload Detected", "Gunshot Detected", "Multiple Gunshots Detected"],
  footsteps: ["Footsteps Detected", "Multiple Footsteps", "Heavy Footsteps Detected"],
  motion: ["Movement Detected", "Fast Movement Detected", "Motion Alert"],
  whisper: ["Whispers Detected", "Quiet Speech Detected", "Low Voice Conversation"],
  suspicious_activity: ["Suspicious Activity", "Unusual Pattern Detected", "Unidentified Activity"]
};

// Alert severities by type
const alertSeverities: Record<AlertType, "critical" | "warning" | "info"> = {
  gun_sound: "critical",
  footsteps: "warning",
  motion: "info",
  whisper: "warning",
  suspicious_activity: "critical"
};

// Generate mock alerts
export const mockAlerts: Alert[] = [
  // Recent alerts
  {
    id: "alert1",
    type: "gun_sound",
    nodeId: "node5",
    timestamp: new Date(2023, 3, 24, 19, 33, 14),
    description: "Gun Reload Detected",
    severity: "critical",
    acknowledged: false
  },
  {
    id: "alert2",
    type: "footsteps",
    nodeId: "node8",
    timestamp: new Date(2023, 3, 24, 19, 30, 22),
    description: "Multiple Footsteps",
    severity: "warning",
    acknowledged: false
  },
  {
    id: "alert3",
    type: "whisper",
    nodeId: "node8",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    description: "Whispers Detected",
    severity: "warning",
    acknowledged: false
  },
  {
    id: "alert4",
    type: "footsteps",
    nodeId: "node12",
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
    description: "Footsteps Detected",
    severity: "warning",
    acknowledged: false
  },
  {
    id: "alert5",
    type: "motion",
    nodeId: "node3",
    timestamp: new Date(Date.now() - 32 * 60 * 1000),
    description: "Movement Detected",
    severity: "info",
    acknowledged: true
  },
  {
    id: "alert6",
    type: "suspicious_activity",
    nodeId: "node10",
    timestamp: new Date(Date.now() - 58 * 60 * 1000),
    description: "Unusual Pattern Detected",
    severity: "critical",
    acknowledged: true
  }
];

// Mock network connections between nodes
export const mockConnections: NetworkConnection[] = [
  { source: "node1", target: "node2", strength: 88 },
  { source: "node1", target: "node8", strength: 95 },
  { source: "node1", target: "node5", strength: 85 },
  { source: "node2", target: "node3", strength: 72 },
  { source: "node3", target: "node7", strength: 65 },
  { source: "node5", target: "node4", strength: 78 },
  { source: "node5", target: "node9", strength: 83 },
  { source: "node8", target: "node10", strength: 79 },
  { source: "node8", target: "node11", strength: 90 },
  { source: "node9", target: "node12", strength: 86 }
];

// Mock network status
export const mockNetworkStatus = {
  activeNodes: 10,
  totalNodes: 12,
  networkHealth: 98
};

// Function to generate a new mock alert
export function generateMockAlert(): Alert {
  const alertTypeKeys = Object.keys(alertDescriptions) as AlertType[];
  const randomType = alertTypeKeys[Math.floor(Math.random() * alertTypeKeys.length)];
  
  const nodeIndex = Math.floor(Math.random() * mockNodes.length);
  const node = mockNodes[nodeIndex];
  
  const descriptionsForType = alertDescriptions[randomType];
  const randomDescription = descriptionsForType[Math.floor(Math.random() * descriptionsForType.length)];
  
  return {
    id: `alert${Date.now()}`,
    type: randomType,
    nodeId: node.id,
    timestamp: new Date(),
    description: randomDescription,
    severity: alertSeverities[randomType],
    acknowledged: false
  };
}

// Function to generate a new node
export function generateNewNode(name: string, sector: string, location: { lat: number; lng: number }): Node {
  return {
    id: `node${Date.now()}`,
    name,
    sector,
    status: "online",
    battery: 100,
    signalStrength: 95,
    lastActivity: new Date(),
    location,
    type: "standard"
  };
}
