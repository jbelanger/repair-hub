import { Link, useNavigate } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { Building2, CheckCircle2, Shield, Wrench, Loader2 } from "lucide-react";
import { useAccount } from 'wagmi';
import { ConnectWallet } from "~/components/ConnectWallet";
import { WalletWrapper } from "~/components/WalletWrapper";
import { Card, CardContent, CardHeader, CardFooter } from "~/components/ui/Card";
import '@rainbow-me/rainbowkit/styles.css';
import { useEffect, useState } from "react";

const features = [
  {
    name: "Smart Contract Integration",
    description: "All repair requests and agreements are secured on the blockchain for transparency and trust.",
    icon: Shield,
  },
  {
    name: "Property Management",
    description: "Easily manage multiple properties, tenants, and maintenance requests in one place.",
    icon: Building2,
  },
  {
    name: "Repair Tracking",
    description: "Track repair requests from submission to completion with real-time updates.",
    icon: Wrench,
  },
];

const plans = [
  {
    name: "Free",
    price: "0",
    interval: "forever",
    description: "Perfect for landlords with a single property",
    features: [
      "1 property",
      "Unlimited tenants",
      "Repair request management",
      "Smart contract integration",
      "Basic analytics",
    ],
    cta: "Start Free",
    href: "/register?plan=free",
  },
  {
    name: "Standard",
    price: "10",
    interval: "month",
    yearlyPrice: "100",
    yearlyInterval: "year",
    description: "For professional landlords with multiple properties",
    features: [
      "Unlimited properties",
      "Unlimited tenants",
      "Repair request management",
      "Smart contract integration",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
    cta: "Get Started",
    href: "/register?plan=standard",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check if user is registered when connected
  useEffect(() => {
    async function checkUser() {
      if (!isConnected || !address) {
        setIsRegistered(null);
        return;
      }

      setIsChecking(true);
      try {
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });

        if (response.ok) {
          const { exists } = await response.json();
          setIsRegistered(exists);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkUser();
  }, [isConnected, address]);

  // Render appropriate action button based on user state
  const renderActionButton = () => {
    if (!isConnected) {
      return (
        <>
          <p className="text-lg text-white/90">
            Connect your wallet to get started with secure property management
          </p>
          <WalletWrapper>
            <ConnectWallet variant="primary" size="lg" />
          </WalletWrapper>
        </>
      );
    }

    if (isChecking) {
      return (
        <div className="h-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
        </div>
      );
    }

    if (isRegistered) {
      return (
        <>
          <p className="text-lg text-white/90">
            Welcome back! Access your dashboard to manage your properties.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </>
      );
    }

    return (
      <>
        <p className="text-lg text-white/90">
          Complete your registration to start managing properties.
        </p>
        <Button 
          size="lg"
          onClick={() => navigate(`/register?address=${address}`)}
        >
          Complete Registration
        </Button>
      </>
    );
  };

  return (
    <div className="relative isolate">
      {/* Hero section */}
      <div className="relative pt-14">
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                RepairHub
              </h1>
              <p className="mt-6 text-2xl text-white/90">
                Property Management on the Blockchain
              </p>
              <p className="mt-6 text-lg leading-8 text-white/70">
                Streamline your property management with smart contracts. Connect landlords and tenants with transparent, secure, and efficient solutions.
              </p>
              <div className="mt-10 flex flex-col items-center gap-6 min-h-[120px]">
                {renderActionButton()}
                <Link to="/about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-purple-500">
              Everything you need
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Manage your properties with confidence
            </p>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Our platform provides all the tools you need to manage your properties efficiently and securely.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.name}
                  variant="interactive"
                  header={{
                    title: feature.name,
                    icon: <feature.icon className="h-5 w-5" />,
                    iconBackground: true
                  }}
                >
                  <p className="text-white/70">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Choose the plan that best fits your needs. All plans include our core features.
            </p>
            {!isConnected && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-lg text-white/90">Ready to get started?</p>
                <WalletWrapper>
                  <ConnectWallet variant="primary" size="lg" />
                </WalletWrapper>
              </div>
            )}
          </div>
          <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-4xl lg:grid-cols-2">
            {plans.map((plan, planIdx) => (
              <Card
                key={plan.name}
                variant="interactive"
                accent={planIdx === 1 ? "purple" : "none"}
              >
                <CardHeader>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                    <p className="mt-2 text-sm text-white/70">{plan.description}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-sm font-semibold text-white/70">
                      /{plan.interval}
                    </span>
                  </div>
                  {plan.yearlyPrice && (
                    <p className="mt-2 text-sm text-white/70">
                      or ${plan.yearlyPrice}/{plan.yearlyInterval} (save 17%)
                    </p>
                  )}
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-4">
                        <CheckCircle2 className="h-5 w-5 flex-none text-purple-500" />
                        <span className="text-sm text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isConnected && !isRegistered && !isChecking ? (
                    <Button
                      onClick={() => navigate(`${plan.href}&address=${address}`)}
                      className="w-full rounded-full py-3"
                      variant={planIdx === 1 ? "primary" : "secondary"}
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <div className="h-12 w-full" /> // Placeholder to maintain card height
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
