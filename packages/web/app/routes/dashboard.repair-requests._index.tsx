import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { Search, Plus, ClipboardList, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { Input } from "~/components/ui/Input";
import { PageHeader } from "~/components/ui/PageHeader";
import { DataGrid } from "~/components/ui/DataGrid";
import { Card } from "~/components/ui/Card";
import { RepairStatus, RepairUrgency } from "~/components/ui/StatusBadge";
import { EmptyState } from "~/components/ui/EmptyState";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { LinkButton } from "~/components/ui/Button";
import { requireUser } from "~/utils/session.server";
import { useRepairRequestRead } from "~/utils/blockchain/hooks/useRepairRequest";
import { Badge } from "~/components/ui/Badge";
import { CONTRACT_ADDRESSES, RepairRequestStatusType } from "~/utils/blockchain/config";
import { statusMap } from "~/utils/repair-request";
import { useChainId } from 'wagmi';

type LoaderData = {
  repairRequests: Array<{
    id: string;
    description: string;
    urgency: string;
    status: string;
    propertyId: string;
    property: {
      address: string;
    };
    initiator: {
      name: string;
      address: string;
    };
  }>;
  user: {
    id: string;
    role: string;
    address: string;
    name: string;
  };
  hasProperties: boolean;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const repairRequests = await db.repairRequest.findMany({
    where: user.role === 'TENANT' 
      ? { initiatorId: user.id }
      : user.role === 'LANDLORD'
      ? { 
          property: {
            landlordId: user.id,
          },
        }
      : undefined,
    include: {
      property: {
        select: {
          address: true,
        },
      },
      initiator: {
        select: {
          name: true,
          address: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Check if tenant has any properties they can create requests for
  const hasProperties = user.role === 'TENANT' ? await db.property.count({
    where: {
      tenantLeases: {
        some: {
          tenantId: user.id,
          status: "ACTIVE"
        }
      }
    }
  }) > 0 : false;

  return json<LoaderData>({ 
    repairRequests,
    user,
    hasProperties
  });
}

function BlockchainStatus({ requestId }: { requestId: string }) {
  const { data, isLoading, isError } = useRepairRequestRead(BigInt(requestId));
  const chainId = useChainId();

  if (isLoading) {
    return (
      <Badge variant="default" className="text-white/50">
        <LinkIcon className="h-4 w-4 mr-1" />
        Syncing...
      </Badge>
    );
  }

  if (isError || !data) {
    return (
      <Badge variant="danger" className="text-red-400">
        <LinkIcon className="h-4 w-4 mr-1" />
        Not Found
      </Badge>
    );
  }

  // For Hardhat, we don't show an explorer link
  const isHardhat = chainId === 31337;
  const status = statusMap[data.status as RepairRequestStatusType];

  return (
    <div className="flex items-center gap-2">
      <RepairStatus status={status} />
      <Badge 
        variant="success" 
        className={`text-green-400 ${!isHardhat ? 'cursor-pointer' : ''}`}
        onClick={(e) => {
          if (!isHardhat) {
            e.preventDefault(); // Prevent the parent Link from navigating
            const etherscanUrl = chainId === 11155111 
              ? `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.REPAIR_REQUEST}`
              : `https://etherscan.io/address/${CONTRACT_ADDRESSES.REPAIR_REQUEST}`;
            window.open(etherscanUrl, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <LinkIcon className="h-4 w-4 mr-1" />
        On Chain
      </Badge>
    </div>
  );
}

export default function RepairRequests() {
  const { repairRequests, user, hasProperties } = useLoaderData<typeof loader>();
  const { toasts, addToast, removeToast } = useToast();
  const hasRepairRequests = repairRequests.length > 0;

  const createRequestPath = "/dashboard/repair-requests/create";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {user.role === 'TENANT' ? 'My Repair Requests' : 'Property Repairs'}
          </h2>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {user.role === 'TENANT' 
              ? 'Track and manage your maintenance requests'
              : 'Manage repair requests for your properties'
            }
          </p>
        </div>
        {user.role === 'TENANT' && hasProperties && (
          <LinkButton
            to={createRequestPath}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            New Request
          </LinkButton>
        )}
      </div>

      {hasRepairRequests && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search requests..."
            leftIcon={<Search className="h-5 w-5" />}
            className="sm:w-64"
          />
        </div>
      )}

      <DataGrid
        items={repairRequests}
        columns={3}
        emptyState={{
          icon: ClipboardList,
          title: "No Repair Requests Yet",
          description: user.role === 'TENANT'
            ? hasProperties 
              ? "You haven't submitted any repair requests yet"
              : "You are not currently an active tenant of any properties"
            : "You don't have any repair requests to manage yet",
          action: user.role === 'TENANT' && hasProperties ? {
            label: "Submit New Request",
            href: createRequestPath,
            icon: <Plus className="h-5 w-5" />
          } : undefined
        }}
        renderItem={(request) => (
          <Link to={`${request.id}`} className="block">
            <Card
              variant="interactive"
              accent="purple"
              header={{
                title: request.property.address
              }}
            >
              <div className="p-0 space-y-3">
                <div>
                  <div className="text-sm font-medium text-white/50 mb-1">Description</div>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {request.description}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-white/50 mb-1">Priority</div>
                    <RepairUrgency urgency={request.urgency} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/50 mb-1">Status</div>
                    <BlockchainStatus requestId={request.id} />
                  </div>
                </div>
                {user.role === 'LANDLORD' && (
                  <div>
                    <div className="text-sm font-medium text-white/50 mb-1">Submitted By</div>
                    <div className="text-sm text-white/70">{request.initiator.name}</div>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        )}
      />

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
