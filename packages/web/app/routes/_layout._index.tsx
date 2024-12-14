import { Button } from "~/components/ui/Button";
import { ArrowRight, Shield, Bell, Zap, Sparkles, ChevronRight } from 'lucide-react';

export default function Index() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-purple-300 via-accent-purple to-accent-pink bg-clip-text text-transparent animate-gradient">
            RepairHub
          </span>
        </h1>
        <p className="text-xl text-white/70 max-w-2xl">
          A decentralized platform for managing property repairs and maintenance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="h-5 w-5" />}
            onClick={() => window.location.href = '/repair-requests'}
          >
            View Repair Requests
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.location.href = '/register'}
          >
            Register as User
          </Button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Feature 1 */}
        <div className="group relative rounded-2xl border border-white/[0.04] bg-gradient-to-br from-purple-500/5 to-transparent p-8 hover:bg-white/[0.02] transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-white ring-1 ring-white/[0.1]">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Decentralized Management
            </h3>
            <p className="text-white/70">
              Securely manage repair requests using blockchain technology.
            </p>
            <Button variant="ghost" rightIcon={<ChevronRight className="h-4 w-4" />}>
              Learn more
            </Button>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="group relative rounded-2xl border border-white/[0.04] bg-gradient-to-br from-blue-500/5 to-transparent p-8 hover:bg-white/[0.02] transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-white ring-1 ring-white/[0.1]">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Real-time Updates
            </h3>
            <p className="text-white/70">
              Track repair status and receive instant notifications.
            </p>
            <Button variant="blue" rightIcon={<ChevronRight className="h-4 w-4" />}>
              Subscribe
            </Button>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="group relative rounded-2xl border border-white/[0.04] bg-gradient-to-br from-pink-500/5 to-transparent p-8 hover:bg-white/[0.02] transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-white ring-1 ring-white/[0.1]">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Smart Contracts
            </h3>
            <p className="text-white/70">
              Automated payments and agreements through smart contracts.
            </p>
            <Button variant="dark" rightIcon={<ChevronRight className="h-4 w-4" />}>
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="relative rounded-2xl border border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-500/10 to-pink-500/10" />
        <div className="relative p-8 sm:p-10 lg:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-semibold text-white">Premium Features</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="primary">Subscribe</Button>
            <Button variant="secondary">Subscribe</Button>
            <Button variant="dark">Subscribe</Button>
            <Button variant="blue">Subscribe</Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative rounded-2xl border border-white/[0.04] bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 p-8 sm:p-10 lg:p-12">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 hover:opacity-100 transition-opacity blur-2xl" />
        <div className="relative">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ready to get started?</h2>
          <p className="mt-3 max-w-2xl text-lg text-white/70">
            Create your first repair request and experience seamless property maintenance.
          </p>
          <div className="mt-8 flex gap-4">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
              onClick={() => window.location.href = '/repair-requests/create'}
            >
              Create Your First Request
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = '/repair-requests'}
            >
              Browse Requests
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
