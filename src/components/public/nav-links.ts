export type NavLink = {
  href: string;
  label: string;
  subLinks?: { href: string; label: string }[];
};

export const NAV_LINKS: NavLink[] = [
  { href: "/vans", label: "Our fleet" },
  { 
    href: "/van-hire", 
    label: "Van hire",
    subLinks: [
      { href: "/use-cases", label: "Use Cases" },
      { href: "/van-hire", label: "Van Hire Options" },
      { href: "/use-cases", label: "Industries We Serve" },
      { href: "/faq", label: "FAQs" }
    ]
  },
  { href: "/business-van-rental", label: "Business hire" },
  { href: "/service-area", label: "Service area" },
  {
    href: "/about-us",
    label: "About",
    subLinks: [
      { href: "/about-us", label: "About Us" },
      { href: "/about-us#our-mission", label: "Our Mission" },
      { href: "/about-us#why-choose-us", label: "Why Choose Us" },
      { href: "/faq", label: "FAQs" }
    ]
  },
  { href: "/blog", label: "Blog" },
  { href: "/contact-us", label: "Contact" },
];
