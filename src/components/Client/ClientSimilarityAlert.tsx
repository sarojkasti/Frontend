import React from "react";
import { Alert, Tag, Space, Button, Typography } from "antd";
import { WarningOutlined, CloseCircleOutlined, LinkOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";

interface SimilarClient {
  id: string;
  name: string;
  shortName?: string;
  panNo?: string;
  status?: string;
  score?: number;
  matchType?: string;
  clientGroup?: { id: string; name: string; code?: string } | null;
}

interface ClientSimilarityAlertProps {
  panMatch?: SimilarClient | null;
  similarClients?: SimilarClient[];
  onSelectGroup?: (groupId: string, groupName: string) => void;
  onCreateGroupWithBrand?: (brandName: string) => void;
}

export const ClientSimilarityAlert: React.FC<ClientSimilarityAlertProps> = ({
  panMatch,
  similarClients = [],
  onSelectGroup,
  onCreateGroupWithBrand,
}) => {
  if (!panMatch && (!similarClients || similarClients.length === 0)) {
    return null;
  }

  return (
    <div className="mb-4 transition-all">
      {/* Exact PAN Match Alert */}
      {panMatch && (
        <Alert
          type="error"
          showIcon
          icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
          className="mb-2 border-red-300 bg-red-50/70"
          message={
            <div className="flex flex-col gap-1">
              <div className="font-bold text-red-800 text-sm flex items-center justify-between">
                <span>⚠️ Exact PAN Collision: PAN {panMatch.panNo} is already registered!</span>
                <Tag color="red">Existing Entity</Tag>
              </div>
              <div className="text-xs text-red-700">
                This PAN is already registered to <strong>{panMatch.name}</strong> ({panMatch.status?.toUpperCase()}).
                {panMatch.clientGroup ? (
                  <span> Belongs to <strong>{panMatch.clientGroup.name}</strong>.</span>
                ) : (
                  <span> Not currently grouped.</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  size="small"
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(`/client/view/${panMatch.id}`, "_blank")}
                  className="p-0 text-red-700 underline text-xs"
                >
                  View Existing Client
                </Button>
                {panMatch.clientGroup && onSelectGroup && (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<LinkOutlined />}
                    onClick={() => onSelectGroup(panMatch.clientGroup!.id, panMatch.clientGroup!.name)}
                    className="text-xs h-6"
                  >
                    Assign to {panMatch.clientGroup.name}
                  </Button>
                )}
              </div>
            </div>
          }
        />
      )}

      {/* Fuzzy Similar Names Warning */}
      {similarClients.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined style={{ color: "#fa8c16" }} />}
          className="border-amber-300 bg-amber-50/80"
          message={
            <div className="flex flex-col gap-2">
              <div className="font-bold text-amber-900 text-xs uppercase tracking-wide">
                Similar Client(s) Detected ({similarClients.length}) — Potential Sibling / Duplicate / Group Member:
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {similarClients.map((client) => {
                  const scoreColor = (client.score || 0) >= 80 ? "red" : "orange";
                  return (
                    <div
                      key={client.id}
                      className="bg-white/90 p-2 rounded border border-amber-200 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tag color={scoreColor} className="m-0 font-bold text-[10px]">
                          {client.score}% Match
                        </Tag>
                        <span className="font-semibold text-slate-800 text-xs truncate" title={client.name}>
                          {client.name}
                        </span>
                        {client.panNo && (
                          <span className="text-[11px] text-slate-500 font-mono shrink-0">
                            (PAN: {client.panNo})
                          </span>
                        )}
                        {client.clientGroup && (
                          <Tag color="blue" className="text-[10px] m-0 shrink-0">
                            Group: {client.clientGroup.name}
                          </Tag>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {client.clientGroup && onSelectGroup ? (
                          <Button
                            size="small"
                            type="dashed"
                            icon={<LinkOutlined />}
                            onClick={() => onSelectGroup(client.clientGroup!.id, client.clientGroup!.name)}
                            className="text-[11px] h-6 text-blue-600 border-blue-300 hover:text-blue-700"
                          >
                            Link to {client.clientGroup.name}
                          </Button>
                        ) : onCreateGroupWithBrand ? (
                          <Button
                            size="small"
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              const brandGuess = client.name.split(/[- ]/)[0] || client.name;
                              onCreateGroupWithBrand(`${brandGuess} Group`);
                            }}
                            className="text-[11px] h-6"
                          >
                            Create Group
                          </Button>
                        ) : null}

                        <Button
                          size="small"
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => window.open(`/client/view/${client.id}`, "_blank")}
                          className="text-[11px] h-6 px-1.5 text-slate-500"
                          title="Open in new tab"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default ClientSimilarityAlert;
