import Link from "next/link";
import React, { useState } from "react";

const tabImageSets = {
  set1: {
    normal: "/assets/ui/tabs/set_1_tab_1.png",
    hover: "/assets/ui/tabs/set_1_tab_2.png",
    alternative: "/assets/ui/tabs/set_1_tab_3.png", // Falls du eine alternative Variante brauchst
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
  variant?: "normal" | "alternative"; // Für unterschiedliche Button-Styles
  className?: string;
}

/**
 * Ein wiederverwendbarer Tab-Button mit Hover- und Active-States.
 * - Normal: zeigt das Basis-Bild
 * - Hover: wechselt zum Hover-Bild
 * - Active: bleibt beim Hover-Bild (wie im Hover-Zustand)
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

    // Wenn aktiv oder gehovert, zeige das Hover-Bild
    if (isActive || isHovered) {
      return selectedSet.hover;
    }

    // Ansonsten zeige das normale oder alternative Bild
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
