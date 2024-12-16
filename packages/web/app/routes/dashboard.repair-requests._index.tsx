import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { Search, Plus, ClipboardList, ArrowRight } from 'lucide-react';
import { Input } from "~/components/ui/Input";
import { PageHeader } from "~/components/ui/PageHeader";
import { DataGrid } from "~/components/ui/DataGrid";
import { Card } from "~/components/ui/Card";
import { RepairStatus, RepairUrgency } from "~/components/ui/StatusBadge";
import { EmptyState } from "~/components/ui/EmptyState";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { LinkButton } from "~/components/ui/Button";
import { requireUser } from "~/utils/session.server";

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

  return json<LoaderData>({ 
    repairRequests,
    user
  });
}

export default function RepairRequests() {
  const { repairRequests, user } = useLoaderData<typeof loader>();
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
        {user.role === 'TENANT' && hasRepairRequests && (
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
            ? "You haven't submitted any repair requests yet"
            : "You don't have any repair requests to manage yet",
          action: user.role === 'TENANT' ? {
            label: "Submit New Request",
            href: createRequestPath,
            icon: <Plus className="h-5 w-5" />
          } : undefined
        }}
        renderItem={(request) => (
          <Card
            variant="interactive"
            accent="purple"
            header={{
              title: request.property.address,
              subtitle: user.role === 'LANDLORD' ? `Submitted by ${request.initiator.name}` : undefined,
              extra: <RepairStatus status={request.status} />
            }}
          >
            <div className="p-6">
              <p className="text-sm text-white/70 line-clamp-2 mb-4">
                {request.description}
              </p>
              <div className="flex justify-between items-center">
                <RepairUrgency urgency={request.urgency} />
                <LinkButton
                  to={`${request.id}`}
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View Details
                </LinkButton>
              </div>
            </div>
          </Card>
        )}
      />

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
