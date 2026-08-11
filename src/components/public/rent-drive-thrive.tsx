import { Key, TrendingUp } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";

function SteeringWheel(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 12 12 2" />
      <path d="M12 12 20.66 17" />
      <path d="M12 12 3.34 17" />
    </svg>
  );
}

export function RentDriveThrive() {
  return (
    <section className="bg-black py-16 sm:py-24 overflow-hidden relative z-10 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center w-full max-w-4xl mx-auto py-4">
              {/* Left bracket */}
              <div className="absolute left-0 sm:left-4 top-0 w-8 sm:w-12 h-full border-y-2 border-l-2 border-primary/80" />
              
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-primary tracking-tight text-center px-12 z-10 py-2">
                RENT. DRIVE. THRIVE.
              </h2>

              {/* Right bracket */}
              <div className="absolute right-0 sm:right-4 top-0 w-8 sm:w-12 h-full border-y-2 border-r-2 border-primary/80" />
            </div>

            <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 max-w-4xl mx-auto w-full px-4">
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <Key className="size-8 sm:size-10 text-primary" strokeWidth={1.5} />
                <span className="text-lg font-medium text-white">Get the van.</span>
              </div>
              <div className="flex items-center gap-4 justify-center">
                <SteeringWheel className="size-8 sm:size-10 text-primary" strokeWidth={1.5} />
                <span className="text-lg font-medium text-white">Get to work.</span>
              </div>
              <div className="flex items-center gap-4 justify-center sm:justify-end">
                <TrendingUp className="size-8 sm:size-10 text-primary" strokeWidth={1.5} />
                <span className="text-lg font-medium text-white">Grow your business.</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
