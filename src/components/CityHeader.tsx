"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RawCityData } from "@/types";
import ResourceBar from "./ResourceBar";

interface CityHeaderProps {
  city: RawCityData;
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

const CityHeader: React.FC<CityHeaderProps> = ({ city }) => {
  const middleSectionRef = useRef<HTMLDivElement>(null);
  const [middleSegments, setMiddleSegments] = useState<string[]>([]);

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

  return (
    <div className="relative rounded-lg shadow-lg text-white overflow-hidden min-h-[100px] md:min-h-[12rem] lg:min-h-[220px] flex items-center justify-center">
      <div className="absolute inset-0 flex z-0">
        <div
          className="h-full flex-shrink-0 mt-10"
          style={{
            width: `${END_CAP_WIDTH}px`,
            backgroundImage: `url(${imagePath}left_end.png)`,
            backgroundSize: "100% 225%",
            backgroundPosition: "left center",
          }}
        />

        <div
          ref={middleSectionRef}
          className="flex-grow h-full flex overflow-hidden  mt-10"
        >
          {middleSegments.map((src, index) => (
            <div
              key={index}
              className="h-full flex-shrink-0"
              style={{
                width: `${SEGMENT_WIDTH}px`,
                backgroundImage: `url(${src})`,
                backgroundSize: "auto 225%",
                backgroundPosition: "center",
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

        <div
          className="h-full flex-shrink-0  mt-10"
          style={{
            width: `${END_CAP_WIDTH}px`,
            backgroundImage: `url(${imagePath}right_end.png)`,
            backgroundSize: "100% 225%",
            backgroundPosition: "center",
          }}
        />
      </div>

      <div className="  mt-18 relative z-10 bg-transparent p-6 rounded-md flex items-center text-center">
        <div className="">
          <h1
            className="text-2xl font-bold mx-2"
            style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
          >
            {city.name}
          </h1>
          <p
            className="text-xl text-gray-300"
            style={{ textShadow: "1px 1px 3px rgba(0, 0, 0, 0.7)" }}
          >
            {city.location?.region || "Unknown Region"},{" "}
            {city.location?.continent || "Unknown Continent"}
          </p>
        </div>

        <ResourceBar />
      </div>
    </div>
  );
};

export default CityHeader;
