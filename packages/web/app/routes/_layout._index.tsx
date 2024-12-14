import { Button } from "~/components/ui/Button";
import { ArrowRight, Shield, Bell, Zap } from 'lucide-react';

export default function Index() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="space-y-6">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-300 via-accent-purple to-accent-pink bg-clip-text text-transparent animate-gradient">
          Welcome to RepairHub
        </h1>
        <p className="text-xl text-purple-300/70 max-w-2xl">
          A decentralized platform for managing property repairs and maintenance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="h-5 w-5" />}
            onClick={() => window.location.href = '/repair-requests'}
            className="bg-gradient-to-r from-[#7B5CFF] to-[#FF75D8] hover:from-[#8C75FF] hover:to-[#FF8AE2]"
          >
            View Repair Requests
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.location.href = '/register'}
            className="bg-white/[0.03] hover:bg-white/[0.06]"
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
          <div className="relative">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-purple-300">
              Decentralized Management
            </h3>
            <p className="text-purple-300/70">
              Securely manage repair requests using blockchain technology.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="group relative rounded-2xl border border-white/[0.04] bg-gradient-to-br from-blue-500/5 to-transparent p-8 hover:bg-white/[0.02] transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-purple-300">
              Real-time Updates
            </h3>
            <p className="text-purple-300/70">
              Track repair status and receive instant notifications.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="group relative rounded-2xl border border-white/[0.04] bg-gradient-to-br from-pink-500/5 to-transparent p-8 hover:bg-white/[0.02] transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-purple-300">
              Smart Contracts
            </h3>
            <p className="text-purple-300/70">
              Automated payments and agreements through smart contracts.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative rounded-2xl border border-white/[0.04] bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 p-8 sm:p-10 lg:p-12">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 hover:opacity-100 transition-opacity blur-2xl" />
        <div className="relative">
          <h2 className="text-2xl font-semibold text-purple-300 sm:text-3xl">Ready to get started?</h2>
          <p className="mt-3 max-w-2xl text-lg text-purple-300/70">
            Create your first repair request and experience seamless property maintenance.
          </p>
          <div className="mt-8">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
              onClick={() => window.location.href = '/repair-requests/create'}
              className="bg-gradient-to-r from-[#7B5CFF] to-[#FF75D8] hover:from-[#8C75FF] hover:to-[#FF8AE2]"
            >
              Create Your First Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
