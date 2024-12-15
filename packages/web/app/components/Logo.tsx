import { Link } from '@remix-run/react';

interface LogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  logoSrc?: string;
  color?: string;
}

const sizes = {
  sm: {
    container: 'h-8 w-8',
    text: 'text-base'
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-lg'
  },
  lg: {
    container: 'h-12 w-12',
    text: 'text-xl'
  },
  xl: {
    container: 'h-16 w-16',
    text: 'text-2xl'
  }
};

export function Logo({ 
  showText = true, 
  size = 'lg', // Changed default to lg
  className = '', 
  logoSrc = '/logo.svg',
  color = '#2563eb' // blue-600 default
}: LogoProps) {
  const sizeClasses = sizes[size];
  const isPng = logoSrc.endsWith('.png');
  
  return (
    <Link 
      to="/" 
      className={`group flex items-center gap-4 ${className}`} // Increased gap from 3 to 4
    >
      <div 
        className={`relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${sizeClasses.container}`} // Enhanced hover scale
      >
        {isPng ? (
          <img 
            src={logoSrc} 
            alt="RepairHub Logo" 
            className="h-full w-full"
          />
        ) : (
          <div 
            className="h-full w-full transition-colors duration-200"
            style={{
              WebkitMask: `url(${logoSrc}) center/contain no-repeat`,
              mask: `url(${logoSrc}) center/contain no-repeat`,
              backgroundColor: color,
            }}
          />
        )}
      </div>
      {showText && (
        <span className={`font-bold tracking-tight text-white/90 transition-colors duration-300 group-hover:text-white ${sizeClasses.text}`}> {/* Changed font-semibold to font-bold */}
          RepairHub
        </span>
      )}
    </Link>
  );
}
