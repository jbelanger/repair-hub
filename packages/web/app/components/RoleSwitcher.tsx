import { Form, useLocation, useNavigate } from "@remix-run/react";
import { Button } from "./ui/Button";
import { UserCog } from "lucide-react";
import { useEffect } from "react";

interface RoleSwitcherProps {
  currentRole: string;
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're returning from a role switch
    const url = new URL(window.location.href);
    const justSwitched = url.searchParams.get("roleSwitched");
    if (justSwitched) {
      // Remove the query parameter
      url.searchParams.delete("roleSwitched");
      navigate(url.pathname + url.search, { replace: true });
      
      // Show toast notification
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded shadow-lg transform transition-all duration-500 ease-in-out z-50";
      toast.textContent = `Switched to ${currentRole.toLowerCase()} role`;
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
      }, 3000);
    }
  }, [location, currentRole, navigate]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Form method="post" action="/api/dev-role-switch">
      <input type="hidden" name="role" value={currentRole === "LANDLORD" ? "TENANT" : "LANDLORD"} />
      <Button
        variant="ghost"
        size="icon"
        type="submit"
        className="hover:bg-white/[0.02] relative"
        title={`Switch to ${currentRole === "LANDLORD" ? "Tenant" : "Landlord"} Role (Dev Only)`}
      >
        <UserCog className="h-5 w-5" />
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 text-[8px] font-bold flex items-center justify-center">
          D
        </div>
      </Button>
    </Form>
  );
}
