import { Link } from "@remix-run/react";
import { Button, type ButtonProps } from "./Button";
import { forwardRef } from "react";

interface LinkButtonProps extends Omit<ButtonProps, "onClick"> {
  to: string;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ to, children, ...props }, ref) => {
    return (
      <Link to={to} ref={ref}>
        <Button {...props}>{children}</Button>
      </Link>
    );
  }
);

LinkButton.displayName = "LinkButton";
