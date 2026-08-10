"use client";

interface IframeMapProps {
  address: string;
  className?: string;
  title?: string;
}

export function IframeMap({ address, className, title = "Location Map" }: IframeMapProps) {
  return (
    <div className={className ?? "w-full h-[500px] rounded-2xl overflow-hidden border border-border bg-muted relative"}>
      <iframe
        title={title}
        src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
