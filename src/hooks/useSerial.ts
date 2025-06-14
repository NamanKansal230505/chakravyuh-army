
import { useState, useEffect, useCallback } from 'react';
import { Node, Alert, NetworkConnection, NetworkStatus, AlertType } from '@/lib/types';
import { serialComm, parseMotionData, getDefaultNetworkStatus, getDefaultConnections } from '@/lib/serialCommunication';

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
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
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
      console.log('Refreshing available ports...');
      const ports = await serialComm.getAvailablePorts();
      console.log('Available ports found:', ports);
      setAvailablePorts(ports);
    } catch (err) {
      console.error('Error refreshing ports:', err);
      setError(err instanceof Error ? err : new Error('Failed to get serial ports'));
    }
  }, []);

  // Connect to a specific port
  const connectToPort = useCallback(async (portInfo: SerialPortInfo): Promise<boolean> => {
    try {
      console.log('Connecting to port:', portInfo);
      setLoading(true);
      setError(null);
      
      const success = await serialComm.connect(portInfo);
      setIsConnected(success);
      
      if (success) {
        console.log('Successfully connected to serial port:', portInfo.name);
      } else {
        console.error('Failed to connect to serial port');
      }
      
      return success;
    } catch (err) {
      console.error('Error connecting to port:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect to serial port'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Request access to a new port
  const requestNewPort = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Requesting new port...');
      const portInfo = await serialComm.requestPort();
      if (portInfo) {
        console.log('New port obtained:', portInfo);
        setAvailablePorts(prev => [...prev, portInfo]);
        return await connectToPort(portInfo);
      }
      console.log('No port selected by user');
      return false;
    } catch (err) {
      console.error('Error requesting new port:', err);
      setError(err instanceof Error ? err : new Error('Failed to request new port'));
      return false;
    }
  }, [connectToPort]);

  // Disconnect from current port
  const disconnect = useCallback(async () => {
    try {
      console.log('Disconnecting from serial port...');
      await serialComm.disconnect();
      setIsConnected(false);
      console.log('Disconnected successfully');
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err instanceof Error ? err : new Error('Failed to disconnect'));
    }
  }, []);

  // Handle sound played
  const handleSoundPlayed = useCallback(() => {
    setShouldPlayAlertSound(false);
  }, []);

  // Update node function
  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    console.log('Updating node:', nodeId, 'with updates:', updates);
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }, []);

  // Process incoming serial data for motion detection
  const handleSerialData = useCallback((data: string) => {
    console.log('handleSerialData called with:', data);
    
    const parsed = parseMotionData(data);
    if (!parsed) {
      console.log('No parsed data returned from parseMotionData');
      return;
    }

    console.log('Parsed motion data:', parsed);

    // Process each node's motion data
    parsed.forEach(({ nodeId, motion }) => {
      console.log('Processing node:', nodeId, 'motion:', motion);
      
      setNodes(prevNodes => {
        console.log('Current nodes before update:', prevNodes.map(n => n.id));
        
        const existingNodeIndex = prevNodes.findIndex(n => n.id === nodeId);
        
        if (existingNodeIndex >= 0) {
          // Update existing node
          console.log('Updating existing node at index:', existingNodeIndex);
          const updatedNodes = [...prevNodes];
          updatedNodes[existingNodeIndex] = {
            ...updatedNodes[existingNodeIndex],
            alerts: {
              gun: false,
              footsteps: false,
              motion: motion,
              whisper: false,
              suspicious_activity: false,
              drone: false,
              help: false
            },
            lastActivity: new Date(),
            status: 'online' as const
          };
          console.log('Updated node:', updatedNodes[existingNodeIndex]);
          return updatedNodes;
        } else {
          // Create new node with default coordinates
          console.log('Creating new node for:', nodeId);
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
              motion: motion,
              whisper: false,
              suspicious_activity: false,
              drone: false,
              help: false
            }
          };
          console.log('Created new node:', newNode);
          const newNodes = [...prevNodes, newNode];
          console.log('New nodes array:', newNodes.map(n => n.id));
          return newNodes;
        }
      });

      // Create alert if motion is detected
      if (motion) {
        console.log('Motion detected, creating alert for:', nodeId);
        const newAlert: Alert = {
          id: `${nodeId}-motion-${Date.now()}`,
          type: 'motion' as AlertType,
          nodeId,
          timestamp: new Date(),
          description: 'Motion detected',
          severity: 'info',
          acknowledged: false
        };

        setAlerts(prev => {
          console.log('Adding new alert:', newAlert);
          const newAlerts = [newAlert, ...prev.slice(0, 99)];
          console.log('Current alerts count:', newAlerts.length);
          return newAlerts;
        });
        setAlertSeverity('info');
        setShouldPlayAlertSound(true);
      }
    });
  }, []);

  // Setup serial data listener
  useEffect(() => {
    console.log('Setting up serial data listener...');
    serialComm.onData(handleSerialData);
    
    // Initial port refresh
    refreshPorts();
    
    return () => {
      console.log('Cleaning up serial connection...');
      serialComm.disconnect();
    };
  }, [handleSerialData, refreshPorts]);

  // Update network status based on nodes
  useEffect(() => {
    const activeNodes = nodes.filter(n => n.status === 'online').length;
    const newNetworkStatus = {
      activeNodes,
      totalNodes: nodes.length,
      networkHealth: nodes.length > 0 ? Math.round((activeNodes / nodes.length) * 100) : 0
    };
    console.log('Updating network status:', newNetworkStatus);
    setNetworkStatus(newNetworkStatus);
  }, [nodes]);

  // Debug current state
  useEffect(() => {
    console.log('Current state - nodes:', nodes.length, 'alerts:', alerts.length, 'connected:', isConnected);
  }, [nodes, alerts, isConnected]);

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
    handleSoundPlayed,
    updateNode
  };
}
