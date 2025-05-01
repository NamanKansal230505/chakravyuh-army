
import { Node, Alert, AlertType } from '@/lib/types';

// Maps alert types to their severity levels
export const getAlertSeverity = (alertType: AlertType): "critical" | "warning" | "info" => {
  if (alertType === "gun" || alertType === "suspicious_activity" || alertType === "help") {
    return "critical";
  } else if (alertType === "footsteps" || alertType === "whisper" || alertType === "drone") {
    return "warning";
  } else {
    return "info";
  }
};

// Format description based on alert type
export const getAlertDescription = (alertType: AlertType): string => {
  switch (alertType) {
    case "gun": 
      return "Gunshots Detected"; 
    case "footsteps": 
      return "Footsteps Detected"; 
    case "whisper": 
      return "Whispers Detected"; 
    case "motion": 
      return "Motion Detected"; 
    case "suspicious_activity": 
      return "Suspicious Activity"; 
    case "drone": 
      return "Drone Detected"; 
    case "help": 
      return "Help Call Detected"; 
    default:
      return alertType.replace(/_/g, " ");
  }
};

// Process nodes and extract alerts from their alert status
export const processNodeAlerts = (
  node: Node, 
  setAlertSeverity: (severity: 'critical' | 'warning' | 'info') => void,
  setShouldPlayAlertSound: (play: boolean) => void,
  currentAlertSeverity: 'critical' | 'warning' | 'info'
): Alert[] => {
  if (!node.alerts) return [];
  
  const result: Alert[] = [];
  
  Object.entries(node.alerts).forEach(([type, isActive]) => {
    if (isActive) {
      // Skip if not a valid alert type
      if (!['gun', 'footsteps', 'motion', 'whisper', 'suspicious_activity', 'drone', 'help'].includes(type)) {
        return;
      }
      
      // Determine severity based on alert type
      const alertType = type as AlertType;
      const severity = getAlertSeverity(alertType);
      
      // Update alert severity state based on priority
      if (severity === 'critical') {
        setAlertSeverity('critical');
        setShouldPlayAlertSound(true);
      } else if (severity === 'warning' && currentAlertSeverity !== 'critical') {
        setAlertSeverity('warning');
        setShouldPlayAlertSound(true);
      } else if (severity === 'info' && currentAlertSeverity !== 'critical' && currentAlertSeverity !== 'warning') {
        setAlertSeverity('info');
        setShouldPlayAlertSound(true);
      }
      
      // Create a new alert object
      const newAlert = {
        id: `${node.id}-${type}-${Date.now()}`,
        type: alertType,
        nodeId: node.id,
        timestamp: new Date(),
        description: getAlertDescription(alertType),
        severity,
        acknowledged: false
      };

      result.push(newAlert);
    }
  });
  
  return result;
};
