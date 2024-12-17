import { Hash, User, Link as LinkIcon, Calendar, Clock, History, Wrench } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { Skeleton } from "~/components/ui/LoadingState";
import { CONTRACT_ADDRESSES, RepairRequestStatusType } from "~/utils/blockchain/config";
import { getEtherscanLink, toChecksumAddress, type Address } from "~/utils/blockchain/types";
import { type BlockchainEvent, formatTimestamp } from "~/utils/repair-request";

interface BlockchainRequest {
  descriptionHash: string;
  workDetailsHash?: string;
  initiator: string;
  createdAt: bigint;
  updatedAt: bigint;
}

interface Props {
  isLoading: boolean;
  isError: boolean;
  blockchainRequest: BlockchainRequest | null;
  events: BlockchainEvent[];
}

export function RepairRequestBlockchain({
  isLoading,
  isError,
  blockchainRequest,
  events,
}: Props) {
  return (
    <Card
      accent="purple"
      header={{
        title: "Blockchain Information",
        icon: <LinkIcon className="h-5 w-5" />,
        iconBackground: true
      }}
    >
      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : isError ? (
          <p className="text-white/70">Error loading blockchain data</p>
        ) : blockchainRequest ? (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-white/70">Description Hash</p>
                  <p className="text-white text-sm font-mono break-all">{blockchainRequest.descriptionHash}</p>
                </div>
              </div>

              {blockchainRequest.workDetailsHash && (
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-white/70">Work Details Hash</p>
                    <p className="text-white text-sm font-mono break-all">{blockchainRequest.workDetailsHash}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-white/70">Initiator Address</p>
                  <a
                    href={getEtherscanLink('address', toChecksumAddress(blockchainRequest.initiator))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-sm font-mono hover:text-purple-300 transition-colors break-all"
                  >
                    {toChecksumAddress(blockchainRequest.initiator)}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <LinkIcon className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-white/70">Contract Address</p>
                  <a
                    href={getEtherscanLink('address', CONTRACT_ADDRESSES.REPAIR_REQUEST ?? '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-sm font-mono hover:text-purple-300 transition-colors break-all"
                  >
                    {CONTRACT_ADDRESSES.REPAIR_REQUEST}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/70">Created On Chain</p>
                    <p className="text-white">{formatTimestamp(blockchainRequest.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/70">Last Updated On Chain</p>
                    <p className="text-white">{formatTimestamp(blockchainRequest.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-purple-600/10">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-5 w-5 text-purple-400" />
                <h3 className="text-white font-semibold">Event History</h3>
              </div>
              <div className="space-y-2">
                {events.length > 0 ? (
                  events
                    .sort((a, b) => Number(b.timestamp - a.timestamp))
                    .map((event, index) => (
                      <div key={index} className="text-white/70 text-sm">
                        {formatTimestamp(event.timestamp)} -{' '}
                        {event.type === 'created' && 'Request created on chain'}
                        {event.type === 'updated' && `Status updated to ${RepairRequestStatusType[event.data.status!]}`}
                        {event.type === 'workDetailsUpdated' && 'Work details updated'}
                      </div>
                    ))
                ) : (
                  <p className="text-white/70 text-sm">No events recorded yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white/70">No blockchain data available</p>
        )}
      </div>
    </Card>
  );
}
