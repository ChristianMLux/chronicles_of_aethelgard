import Link from "next/link";
import React, { useState } from "react";

const tabImageSets = {
  set1: {
    normal: "/assets/ui/tabs/set_1_tab_1.png",
    hover: "/assets/ui/tabs/set_1_tab_2.png",
    alternative: "/assets/ui/tabs/set_1_tab_3.png",
  },
  set2: {
    normal: "/assets/ui/tabs/set_2_tab_1.png",
    hover: "/assets/ui/tabs/set_2_tab_2.png",
    alternative: "/assets/ui/tabs/set_2_tab_3.png",
  },
};

interface TabButtonProps {
  label: string;
  href: string;
  isActive: boolean;
  imageSet: keyof typeof tabImageSets;
  variant?: "normal" | "alternative";
  className?: string;
}

/**
 * A reusable tab button with hover and active states.
 * - Normal: displays the base image
 * - Hover: switches to the hover image
 * - Active: remains on the hover image (as in the hover state)
 */
const TabButton: React.FC<TabButtonProps> = ({
  label,
  href,
  isActive,
  imageSet,
  variant = "normal",
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundImage = () => {
    const selectedSet = tabImageSets[imageSet];

    if (isActive || isHovered) {
      return selectedSet.hover;
    }

    return variant === "alternative"
      ? selectedSet.alternative
      : selectedSet.normal;
  };

  const backgroundImage = getBackgroundImage();

  return (
    <Link
      href={href}
      className={`
        flex items-center justify-center
        w-48 h-16 bg-cover bg-no-repeat bg-center
        text-white text-lg font-bold
        transition-all duration-200 ease-in-out
        ${isActive ? "scale-105" : ""}
        ${className}
      `}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "100% 100%",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
};

export default TabButton;
