import { Logo } from "~/components/Logo";

function ColorSection({ logoSrc, label }: { logoSrc: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <h3 className="text-lg font-medium text-white/70">{label}</h3>
      <div className="grid gap-8">
        <div className="flex items-center gap-4">
          <Logo logoSrc={logoSrc} color="#2563eb" />
          <span className="text-sm text-white/50">blue-600</span>
        </div>
        <div className="flex items-center gap-4">
          <Logo logoSrc={logoSrc} color="#059669" />
          <span className="text-sm text-white/50">emerald-600</span>
        </div>
        <div className="flex items-center gap-4">
          <Logo logoSrc={logoSrc} color="#dc2626" />
          <span className="text-sm text-white/50">red-600</span>
        </div>
        <div className="flex items-center gap-4">
          <Logo logoSrc={logoSrc} color="#7c3aed" />
          <span className="text-sm text-white/50">violet-600</span>
        </div>
        <div className="flex items-center gap-4">
          <Logo logoSrc={logoSrc} color="#ea580c" />
          <span className="text-sm text-white/50">orange-600</span>
        </div>
      </div>
    </div>
  );
}

function SizeSection({ logoSrc, label }: { logoSrc: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <h3 className="text-lg font-medium text-white/70">{label}</h3>
      <div className="grid gap-8">
        <div className="flex items-center gap-4">
          <Logo size="sm" logoSrc={logoSrc} />
          <span className="text-sm text-white/50">small</span>
        </div>
        <div className="flex items-center gap-4">
          <Logo logoSrc={logoSrc} />
          <span className="text-sm text-white/50">medium</span>
        </div>
        <div className="flex items-center gap-4">
          <Logo size="lg" logoSrc={logoSrc} />
          <span className="text-sm text-white/50">large</span>
        </div>
      </div>
    </div>
  );
}

export default function LogoTest() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-16 bg-gray-900 p-8">
      <h1 className="text-2xl font-bold text-white">Logo Options</h1>
      
      <section className="flex w-full max-w-6xl flex-col gap-12">
        <h2 className="text-xl font-semibold text-white/80">Color Variations</h2>
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <ColorSection logoSrc="/logo.svg" label="Option 1" />
          <ColorSection logoSrc="/logo2.svg" label="Option 2" />
          <ColorSection logoSrc="/logo3.png" label="Option 3" />
          <ColorSection logoSrc="/logo4.svg" label="Option 4" />
          <ColorSection logoSrc="/logo5.svg" label="Option 5" />
        </div>
      </section>
      
      <section className="flex w-full max-w-6xl flex-col gap-12">
        <h2 className="text-xl font-semibold text-white/80">Size Variations</h2>
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SizeSection logoSrc="/logo.svg" label="Option 1" />
          <SizeSection logoSrc="/logo2.svg" label="Option 2" />
          <SizeSection logoSrc="/logo3.png" label="Option 3" />
          <SizeSection logoSrc="/logo4.svg" label="Option 4" />
          <SizeSection logoSrc="/logo5.svg" label="Option 5" />
        </div>
      </section>
    </div>
  );
}
