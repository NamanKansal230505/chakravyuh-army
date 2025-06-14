
import { useState, useEffect, useCallback } from 'react';
import { Node, Alert, NetworkConnection, NetworkStatus, AlertType } from '@/lib/types';
import { serialComm, parseLoRaWANData, getDefaultNetworkStatus, getDefaultConnections } from '@/lib/serialCommunication';

interface SerialPortInfo {
  port: SerialPort;
  name: string;
  vendorId?: number;
  productId?: number;
}

interface UseSerialReturn {
  nodes: Node[];
  alerts: Alert[];
  connections: NetworkConnection[];
  networkStatus: NetworkStatus;
  selectedNode: Node | null;
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  availablePorts: SerialPortInfo[];
  connectToPort: (portInfo: SerialPortInfo) => Promise<boolean>;
  requestNewPort: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshPorts: () => Promise<void>;
  shouldPlayAlertSound: boolean;
  alertSeverity: 'critical' | 'warning' | 'info';
  handleSoundPlayed: () => void;
}

export function useSerial(): UseSerialReturn {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>(getDefaultConnections());
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(getDefaultNetworkStatus());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [shouldPlayAlertSound, setShouldPlayAlertSound] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<'critical' | 'warning' | 'info'>('info');

  // Refresh available ports
  const refreshPorts = useCallback(async () => {
    try {
      const ports = await serialComm.getAvailablePorts();
      setAvailablePorts(ports);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get serial ports'));
    }
  }, []);

  // Connect to a specific port
  const connectToPort = useCallback(async (portInfo: SerialPortInfo): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await serialComm.connect(portInfo);
      setIsConnected(success);
      
      if (success) {
        console.log('Connected to serial port:', portInfo.name);
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect to serial port'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Request access to a new port
  const requestNewPort = useCallback(async (): Promise<boolean> => {
    try {
      const portInfo = await serialComm.requestPort();
      if (portInfo) {
        setAvailablePorts(prev => [...prev, portInfo]);
        return await connectToPort(portInfo);
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to request new port'));
      return false;
    }
  }, [connectToPort]);

  // Disconnect from current port
  const disconnect = useCallback(async () => {
    try {
      await serialComm.disconnect();
      setIsConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect'));
    }
  }, []);

  // Handle sound played
  const handleSoundPlayed = useCallback(() => {
    setShouldPlayAlertSound(false);
  }, []);

  // Process incoming serial data
  const handleSerialData = useCallback((data: string) => {
    console.log('Received serial data:', data);
    
    const parsed = parseLoRaWANData(data);
    if (!parsed) return;

    const { nodeId, alertType, value } = parsed;

    // Update or create node
    setNodes(prevNodes => {
      const existingNodeIndex = prevNodes.findIndex(n => n.id === nodeId);
      
      if (existingNodeIndex >= 0) {
        // Update existing node
        const updatedNodes = [...prevNodes];
        updatedNodes[existingNodeIndex] = {
          ...updatedNodes[existingNodeIndex],
          alerts: {
            ...updatedNodes[existingNodeIndex].alerts,
            [alertType]: value === 1
          },
          lastActivity: new Date(),
          status: 'online' as const
        };
        return updatedNodes;
      } else {
        // Create new node
        const newNode: Node = {
          id: nodeId,
          name: `Node #${nodeId.replace('node', '')}`,
          sector: `Sector ${nodeId.replace('node', '').toUpperCase()}`,
          status: 'online',
          battery: 100,
          signalStrength: 95,
          lastActivity: new Date(),
          location: { 
            lat: 21 + (Math.random() * 0.01), 
            lng: 79 + (Math.random() * 0.01) 
          },
          type: 'standard',
          alerts: {
            gun: false,
            footsteps: false,
            motion: false,
            whisper: false,
            suspicious_activity: false,
            drone: false,
            help: false,
            [alertType]: value === 1
          }
        };
        return [...prevNodes, newNode];
      }
    });

    // Create alert if value is 1
    if (value === 1) {
      const alertSeverityMap: Record<AlertType, 'critical' | 'warning' | 'info'> = {
        gun: 'critical',
        footsteps: 'warning',
        motion: 'info',
        whisper: 'warning',
        suspicious_activity: 'critical',
        drone: 'warning',
        help: 'critical'
      };

      const severity = alertSeverityMap[alertType];
      
      const newAlert: Alert = {
        id: `${nodeId}-${alertType}-${Date.now()}`,
        type: alertType,
        nodeId,
        timestamp: new Date(),
        description: `${alertType.replace('_', ' ')} detected`,
        severity,
        acknowledged: false
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 99)]); // Keep last 100 alerts
      setAlertSeverity(severity);
      setShouldPlayAlertSound(true);
    }
  }, []);

  // Setup serial data listener
  useEffect(() => {
    serialComm.onData(handleSerialData);
    
    // Initial port refresh
    refreshPorts();
    
    return () => {
      serialComm.disconnect();
    };
  }, [handleSerialData, refreshPorts]);

  // Update network status based on nodes
  useEffect(() => {
    const activeNodes = nodes.filter(n => n.status === 'online').length;
    setNetworkStatus({
      activeNodes,
      totalNodes: nodes.length,
      networkHealth: nodes.length > 0 ? Math.round((activeNodes / nodes.length) * 100) : 0
    });
  }, [nodes]);

  return {
    nodes,
    alerts,
    connections,
    networkStatus,
    selectedNode,
    loading,
    error,
    isConnected,
    availablePorts,
    connectToPort,
    requestNewPort,
    disconnect,
    refreshPorts,
    shouldPlayAlertSound,
    alertSeverity,
    handleSoundPlayed
  };
}
