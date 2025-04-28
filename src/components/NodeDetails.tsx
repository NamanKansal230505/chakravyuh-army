
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Node } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface NodeDetailsProps {
  node: Node | null;
}

const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  if (!node) {
    return (
      <Card className="bg-card/50 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Node Details</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Select a node to view details
        </CardContent>
      </Card>
    );
  }

  const lastActivityTime = formatDistanceToNow(new Date(node.lastActivity), {
    addSuffix: true,
  });

  const batteryColor =
    node.battery > 70
      ? "bg-alert-success"
      : node.battery > 30
      ? "bg-alert-warning"
      : "bg-alert-critical";

  const signalColor =
    node.signalStrength > 70
      ? "bg-alert-success"
      : node.signalStrength > 30
      ? "bg-alert-warning"
      : "bg-alert-critical";

  const statusBadge =
    node.status === "online"
      ? "status-badge status-badge-success"
      : node.status === "warning"
      ? "status-badge status-badge-warning"
      : "status-badge status-badge-critical";

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Selected Node: #{node.id.replace("node", "")}
          </CardTitle>
          <span className={statusBadge}>{node.status}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">Battery</span>
            <span className="text-xs font-mono">{node.battery}%</span>
          </div>
          <Progress
            value={node.battery}
            className="h-1.5"
            indicatorClassName={batteryColor}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">Signal Strength</span>
            <span className="text-xs font-mono">{node.signalStrength}%</span>
          </div>
          <Progress
            value={node.signalStrength}
            className="h-1.5"
            indicatorClassName={signalColor}
          />
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Location</div>
            <div className="font-mono">
              {node.location.lat.toFixed(3)}, {node.location.lng.toFixed(3)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Last Activity</div>
            <div>{lastActivityTime}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Sector</div>
            <div>{node.sector}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Type</div>
            <div className="capitalize">{node.type}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeDetails;
