import React from "react";
import { Alert, Tag, Button } from "antd";
import { LinkOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";

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
  // Never duplicate the exact PAN match inside the similar clients list
  const filteredSimilar = (similarClients || []).filter(
    (c) => !panMatch || c.id !== panMatch.id
  );

  if (!panMatch && filteredSimilar.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {/* Exact PAN Match Alert */}
      {panMatch && (
        <Alert
          type="error"
          showIcon
          message={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-gray-900">
                PAN {panMatch.panNo} is already registered to {panMatch.name}
              </span>
              <div className="flex items-center gap-2">
                {panMatch.clientGroup && onSelectGroup && (
                  <Button
                    size="small"
                    icon={<LinkOutlined />}
                    onClick={() =>
                      onSelectGroup(
                        panMatch.clientGroup!.id,
                        panMatch.clientGroup!.name
                      )
                    }
                  >
                    Assign to {panMatch.clientGroup.name}
                  </Button>
                )}
                <Button
                  size="small"
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    window.open(`/client/view/${panMatch.id}`, "_blank")
                  }
                  className="px-1"
                >
                  View Client
                </Button>
              </div>
            </div>
          }
          description={
            <span className="text-xs text-gray-600">
              Status: {panMatch.status?.toUpperCase() || "ACTIVE"}
              {panMatch.clientGroup
                ? ` • Group: ${panMatch.clientGroup.name}`
                : " • Not assigned to a group"}
            </span>
          }
        />
      )}

      {/* Similar Names Warning */}
      {filteredSimilar.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={
            <span className="font-semibold text-gray-900 text-xs">
              Similar existing client{filteredSimilar.length > 1 ? "s" : ""} found ({filteredSimilar.length})
            </span>
          }
          description={
            <div className="flex flex-col gap-1.5 mt-1 max-h-40 overflow-y-auto">
              {filteredSimilar.map((client) => (
                <div
                  key={client.id}
                  className="bg-white px-2.5 py-1.5 rounded border border-gray-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag color="orange" className="m-0 text-[11px] shrink-0">
                      {client.score}% match
                    </Tag>
                    <span
                      className="font-medium text-gray-800 text-xs truncate"
                      title={client.name}
                    >
                      {client.name}
                    </span>
                    {client.panNo && (
                      <span className="text-[11px] text-gray-500 font-mono shrink-0">
                        PAN: {client.panNo}
                      </span>
                    )}
                    {client.clientGroup && (
                      <Tag color="blue" className="text-[10px] m-0 shrink-0">
                        {client.clientGroup.name}
                      </Tag>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {client.clientGroup && onSelectGroup ? (
                      <Button
                        size="small"
                        type="link"
                        icon={<LinkOutlined />}
                        onClick={() =>
                          onSelectGroup(
                            client.clientGroup!.id,
                            client.clientGroup!.name
                          )
                        }
                        className="text-xs px-1"
                      >
                        Link Group
                      </Button>
                    ) : onCreateGroupWithBrand ? (
                      <Button
                        size="small"
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const brandGuess =
                            client.name.split(/[- ]/)[0] || client.name;
                          onCreateGroupWithBrand(`${brandGuess} Group`);
                        }}
                        className="text-xs px-1"
                      >
                        Create Group
                      </Button>
                    ) : null}

                    <Button
                      size="small"
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() =>
                        window.open(`/client/view/${client.id}`, "_blank")
                      }
                      title="Open existing client"
                    />
                  </div>
                </div>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
};

export default ClientSimilarityAlert;
