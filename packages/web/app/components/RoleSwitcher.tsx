import { Form } from "@remix-run/react";
import { Button } from "./ui/Button";
import { UserCog } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: string;
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  return (
    <Form method="post" action="/api/dev-role-switch">
      <input type="hidden" name="role" value={currentRole === "LANDLORD" ? "TENANT" : "LANDLORD"} />
      <Button
        variant="ghost"
        size="icon"
        type="submit"
        className="hover:bg-white/[0.02] relative"
        title={`Switch to ${currentRole === "LANDLORD" ? "Tenant" : "Landlord"} Role`}
      >
        <UserCog className="h-5 w-5" />
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 text-[8px] font-bold flex items-center justify-center">
          {currentRole === "LANDLORD" ? "L" : "T"}
        </div>
      </Button>
    </Form>
  );
}
