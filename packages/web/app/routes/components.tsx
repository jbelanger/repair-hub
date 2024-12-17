import { useState } from "react";
import { Building2, FileText, AlertTriangle, Search, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { TextArea } from "~/components/ui/TextArea";
import { Badge } from "~/components/ui/Badge";
import { EmptyState } from "~/components/ui/EmptyState";
import { Skeleton } from "~/components/ui/LoadingState";
import { Modal } from "~/components/ui/Modal";
import { PageHeader } from "~/components/ui/PageHeader";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { useToast, ToastManager } from "~/components/ui/Toast";

export default function Components() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const showToast = (type: "success" | "error" | "warning" | "info") => {
    addToast(`This is a ${type} message`, type);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Component Library"
        subtitle="A showcase of all UI components used in the application"
      />

      {/* Buttons */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Variants</h3>
          <div className="flex flex-wrap gap-4 mb-8">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="dark">Dark Button</Button>
            <Button variant="blue">Blue Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
          </div>

          <h3 className="text-lg font-medium mb-4">States</h3>
          <div className="flex flex-wrap gap-4">
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button leftIcon={<Search className="h-4 w-4" />}>With Icon</Button>
          </div>
        </Card>
      </section>

      {/* Cards */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-2 gap-6">
          <Card
            accent="purple"
            header={{
              title: "Card Title",
              subtitle: "Card subtitle text",
              icon: <FileText className="h-5 w-5" />,
              iconBackground: true
            }}
          >
            <p className="text-sm text-white/70">Card content goes here</p>
          </Card>
          <Card>
            <p className="text-sm text-white/70">Simple card without header</p>
          </Card>
        </div>
      </section>

      {/* Form Elements */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                placeholder="Text input"
                leftIcon={<Search className="h-5 w-5" />}
              />
              <Select
                defaultValue=""
                leftIcon={<Building2 className="h-5 w-5" />}
              >
                <option value="">Select an option</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
              </Select>
              <TextArea
                placeholder="Text area input"
                leftIcon={<FileText className="h-5 w-5" />}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Badges */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Badges</h2>
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Status Badges</h3>
          <div className="flex flex-wrap gap-4 mb-8">
            <StatusBadge status="pending" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="completed" />
            <StatusBadge status="cancelled" />
            <StatusBadge status="active" />
          </div>

          <h3 className="text-lg font-medium mb-4">Urgency Badges</h3>
          <div className="flex flex-wrap gap-4">
            <StatusBadge status="high" type="urgency" />
            <StatusBadge status="medium" type="urgency" />
            <StatusBadge status="low" type="urgency" />
          </div>
        </Card>
      </section>

      {/* States */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">States</h2>
        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <EmptyState
              icon={Building2}
              title="Empty State"
              description="This is how empty states look"
            />
          </Card>
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          </Card>
        </div>
      </section>

      {/* Modal */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Modal</h2>
        <Card className="p-6">
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Modal Title"
          >
            <p className="text-sm text-white/70 mb-4">
              This is the modal content. You can put anything here.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </Modal>
        </Card>
      </section>

      {/* Toast Notifications */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Toast Notifications</h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => showToast("success")}>Show Success Toast</Button>
            <Button onClick={() => showToast("error")}>Show Error Toast</Button>
            <Button onClick={() => showToast("warning")}>Show Warning Toast</Button>
            <Button onClick={() => showToast("info")}>Show Info Toast</Button>
          </div>
        </Card>
      </section>

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
