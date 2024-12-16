import { Link, useNavigate } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { Building2, CheckCircle2, Shield, Wrench } from "lucide-react";
import { useAccount } from 'wagmi';
import { ConnectWallet } from "~/components/ConnectWallet";
import '@rainbow-me/rainbowkit/styles.css';

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

  return (
    <div className="relative isolate">
      {/* Header login buttons */}
      <div className="fixed top-8 right-8 z-50 flex items-center gap-6">
        {isConnected ? (
          <>
            <button
              onClick={() => {
                // Let ConnectWallet handle the redirect to dashboard
                const connectButton = document.querySelector('[aria-label="Connect Wallet"]');
                if (connectButton instanceof HTMLElement) {
                  connectButton.click();
                }
              }}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Login
            </button>
            <Button onClick={() => navigate(`/register?address=${address}`)}>
              Sign Up
            </Button>
          </>
        ) : (
          <ConnectWallet variant="link" />
        )}
      </div>

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
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button 
                  size="lg" 
                  onClick={() => {
                    if (isConnected) {
                      navigate(`/register?address=${address}`);
                    } else {
                      const connectButton = document.querySelector('[aria-label="Connect Wallet"]');
                      if (connectButton instanceof HTMLElement) {
                        connectButton.click();
                      }
                    }
                  }}
                >
                  Sign Up
                </Button>
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
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <feature.icon className="h-5 w-5 flex-none text-purple-500" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
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
          </div>
          <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-4xl lg:grid-cols-2">
            {plans.map((plan, planIdx) => (
              <div
                key={plan.name}
                className="rounded-[32px] bg-[#0F0F0F] p-8 ring-1 ring-white/10"
              >
                <h3 className="text-xl font-semibold leading-8 text-white">
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm leading-6 text-white/70">{plan.description}</p>
                <div className="mt-8 flex items-baseline">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-sm font-semibold leading-6 text-white/70">
                    /{plan.interval}
                  </span>
                </div>
                {plan.yearlyPrice && (
                  <p className="mt-2 text-sm text-white/70">
                    or ${plan.yearlyPrice}/{plan.yearlyInterval} (save 17%)
                  </p>
                )}
                <ul className="mt-10 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-4">
                      <CheckCircle2 className="h-5 w-5 flex-none text-purple-500" aria-hidden="true" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (isConnected) {
                      navigate(`${plan.href}&address=${address}`);
                    } else {
                      const connectButton = document.querySelector('[aria-label="Connect Wallet"]');
                      if (connectButton instanceof HTMLElement) {
                        connectButton.click();
                      }
                    }
                  }}
                  className={`mt-10 block w-full rounded-full py-3 text-center text-sm font-semibold leading-6 ${
                    planIdx === 1
                      ? 'bg-purple-500 text-white hover:bg-purple-400'
                      : 'bg-[#1A1A1A] text-white hover:bg-[#242424]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
