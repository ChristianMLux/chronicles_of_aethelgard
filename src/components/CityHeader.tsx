"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { City } from "@/types";
import { ResourceBar } from "./ResourceBar";

interface CityHeaderProps {
  city: City;
  contentAlignment?: "left" | "center" | "right";
  resourcePosition?: "inline" | "below" | "above";
  compactMode?: boolean;
}

const SEGMENT_WIDTH = 120;
const OVERLAP = 30;
const END_CAP_WIDTH = 165;

const imagePath = "/assets/ui/user_info_bar_images/";
const middleImages = [
  `${imagePath}expand.png`,
  `${imagePath}expand_variation.png`,
  `${imagePath}broad_middle.png`,
];

const CityHeader: React.FC<CityHeaderProps> = ({
  city,
  contentAlignment = "center",
  resourcePosition = "inline",
  compactMode = false,
}) => {
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const [middleSegments, setMiddleSegments] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 766);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const generateSegments = useCallback(() => {
    if (middleSectionRef.current) {
      const containerWidth = middleSectionRef.current.offsetWidth;
      if (containerWidth === 0) return;

      const effectiveSegmentWidth = SEGMENT_WIDTH - OVERLAP;
      const numSegments = Math.ceil(containerWidth / effectiveSegmentWidth) + 2;

      let lastIndex = -1;
      const newSegments = Array.from({ length: numSegments }).map(() => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * middleImages.length);
        } while (newIndex === lastIndex);
        lastIndex = newIndex;
        return middleImages[newIndex];
      });
      setMiddleSegments(newSegments);
    }
  }, []);

  useEffect(() => {
    const middleElement = middleSectionRef.current;
    if (!middleElement) return;

    generateSegments();
    const resizeObserver = new ResizeObserver(generateSegments);
    resizeObserver.observe(middleElement);

    return () => resizeObserver.disconnect();
  }, [generateSegments]);

  const getAlignmentClasses = () => {
    switch (contentAlignment) {
      case "left":
        return "justify-start text-left";
      case "right":
        return "justify-end text-right";
      default:
        return "justify-center text-center";
    }
  };

  const getMinHeight = () => {
    if (compactMode || isMobile) return "min-h-[80px]";
    return "min-h-[120px] md:min-h-[160px] lg:min-h-[200px] xl:min-h-[220px]";
  };

  return (
    <div
      className={`city-header-container relative rounded-lg shadow-lg text-white overflow-hidden ${getMinHeight()} flex items-center`}
    >
      {/* Hintergrund-Layer */}
      <div className="absolute inset-0 flex z-0">
        {/* Left End */}
        <div
          className="h-full flex-shrink-0"
          style={{
            width: isMobile ? `${END_CAP_WIDTH * 0.7}px` : `${END_CAP_WIDTH}px`,
            backgroundImage: `url(${imagePath}left_end.png)`,
            backgroundSize: "100% 225%",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Middle Sections */}
        <div
          ref={middleSectionRef}
          className="flex-grow h-full flex overflow-hidden"
        >
          {middleSegments.map((src, index) => (
            <div
              key={index}
              className="h-full flex-shrink-0"
              style={{
                width: `${SEGMENT_WIDTH}px`,
                backgroundImage: `url(${src})`,
                backgroundSize: `${SEGMENT_WIDTH}px 225%`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                marginLeft: index > 0 ? `-${OVERLAP}px` : "0px",
                maskImage: `linear-gradient(to right, black ${
                  100 - (OVERLAP / SEGMENT_WIDTH) * 100
                }%, transparent 100%)`,
                WebkitMaskImage: `linear-gradient(to right, black ${
                  100 - (OVERLAP / SEGMENT_WIDTH) * 100
                }%, transparent 100%)`,
              }}
            />
          ))}
        </div>

        {/* Right End */}
        <div
          className="h-full flex-shrink-0"
          style={{
            width: isMobile ? `${END_CAP_WIDTH * 0.7}px` : `${END_CAP_WIDTH}px`,
            backgroundImage: `url(${imagePath}right_end.png)`,
            backgroundSize: "100% 225%",
            backgroundPosition: "right center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* Content Layer */}
      <div
        className={`relative z-10 w-full px-4 md:px-8 lg:px-12 py-4 md:py-6 flex ${getAlignmentClasses()}`}
      >
        <div className="city-header-content flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full">
          {/* Stadt-Info Section */}
          <div
            className={`city-info flex-shrink-0 ${
              isMobile
                ? "flex items-baseline gap-2"
                : "ml-[5rem] pb-[1.5rem] md:ml-[6rem]"
            } ${resourcePosition === "inline" ? "" : "w-full"}`}
          >
            <h1
              className={`
                text-xl md:text-2xl lg:text-3xl font-bold mt-[2rem]
                ${isMobile ? "mb-1" : "mb-2"}
              `}
              style={{
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                letterSpacing: "0.5px",
              }}
            >
              {city.name}
            </h1>
            <p
              className="text-sm md:text-base lg:text-lg text-gray-300"
              style={{
                textShadow: "1px 1px 3px rgba(0, 0, 0, 0.7)",
              }}
            >
              {city.location?.region || "Unknown Region"},{" "}
              {city.location?.continent || "Unknown Continent"}
            </p>
          </div>

          {/* Resources flex */}
          {resourcePosition === "inline" && (
            <div
              className={`resource-container flex-grow flex justify-end ${
                isMobile ? "pb-[2.5rem]" : "mr-[5rem]"
              }`}
            >
              <ResourceBar />
            </div>
          )}
        </div>

        {/* Resources below */}
        {resourcePosition === "below" && (
          <div className="w-full mt-4 border-t border-white/20 pt-4">
            <ResourceBar />
          </div>
        )}
      </div>

      {/* Resources above */}
      {resourcePosition === "above" && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm border-b border-white/20">
          <ResourceBar />
        </div>
      )}
    </div>
  );
};

export default CityHeader;
