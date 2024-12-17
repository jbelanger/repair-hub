import { Building2, User, Calendar, Clock } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { type Address } from "~/utils/blockchain/types";

interface Props {
  property: {
    address: string;
    landlord: {
      name: string;
      address: Address;
    };
  };
  initiator: {
    name: string;
    address: Address;
  };
  createdAt: string;
  updatedAt: string;
}

export function RepairRequestDetails({
  property,
  initiator,
  createdAt,
  updatedAt,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Property Details Card */}
      <Card
        accent="purple"
        header={{
          title: "Property Details",
          icon: <Building2 className="h-5 w-5" />,
          iconBackground: true
        }}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white/70">Address</p>
              <p className="text-white">{property.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white/70">Landlord</p>
              <p className="text-white">{property.landlord.name}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Request Details Card */}
      <Card
        accent="purple"
        header={{
          title: "Request Details",
          icon: <Clock className="h-5 w-5" />,
          iconBackground: true
        }}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white/70">Submitted by</p>
              <p className="text-white">{initiator.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white/70">Created</p>
              <p className="text-white">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white/70">Last Updated</p>
              <p className="text-white">
                {new Date(updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
