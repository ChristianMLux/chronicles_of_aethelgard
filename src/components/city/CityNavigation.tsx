"use client";

import { useParams, usePathname } from "next/navigation";
import React from "react";
import TabButton from "../ui/TabButton";

const CityNavigation: React.FC = () => {
  const pathname = usePathname();
  const params = useParams();
  const cityId = params.id;

  const navItems = [
    {
      label: "Buildings",
      href: `/city/${cityId}/buildings`,
      imageSet: "set1" as const,
    },
    {
      label: "Army",
      href: `/city/${cityId}/army`,
      imageSet: "set2" as const,
    },
    {
      label: "Research",
      href: `/city/${cityId}/research`,
      imageSet: "set1" as const,
    },
  ];

  return (
    <nav className="flex justify-center items-center gap-x-6 sm:gap-x-20  z-10 relative">
      {navItems.map((item) => (
        <TabButton
          key={item.href}
          label={item.label}
          href={item.href}
          imageSet={item.imageSet}
          isActive={pathname === item.href}
        />
      ))}
    </nav>
  );
};

export default CityNavigation;
