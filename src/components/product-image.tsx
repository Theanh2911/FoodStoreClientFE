"use client";

import * as React from "react";
import Image from "next/image";
import { getPlaceholderImage } from "@/lib/api";

const BACKEND_BASE_URL = "http://192.168.1.13:8080";

interface ProductImageProps {
  imageUrl: string | null;
  productName: string;
  categoryName: string;
  className?: string;
}

export function ProductImage({
                               imageUrl,
                               productName,
                               categoryName,
                               className = "",
                             }: ProductImageProps) {
  const [imageError, setImageError] = React.useState(false);
  const [processedUrl, setProcessedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!imageUrl || imageUrl.trim() === "" || imageUrl === "null") {
      setProcessedUrl(null);
      return;
    }

    let url = imageUrl.trim();
    if (url.startsWith("//")) url = "https:" + url;
    else if (url.startsWith("/")) url = BACKEND_BASE_URL + url;
    else if (!url.startsWith("http")) url = "https://" + url;

    setProcessedUrl(url);
  }, [imageUrl]);

  const placeholder = getPlaceholderImage(categoryName);

  // 🧱 Fallback khi lỗi hoặc không có ảnh
  if (!processedUrl || imageError) {
    return (
        <div
            className={`flex items-center justify-center text-3xl bg-gray-100 rounded-lg ${className}`}
            title={`${productName} - ${categoryName} ${
                imageError ? "(Image failed to load)" : "(No image)"
            }`}
        >
          <span className="select-none opacity-70">{placeholder}</span>
        </div>
    );
  }

  // Lấy kích thước từ className
  const getImageSize = (className: string) => {
    if (className.includes('w-16')) return 64;
    if (className.includes('w-12')) return 48;
    if (className.includes('w-10')) return 40;
    return 48; // default
  };

  const size = getImageSize(className);

  return (
      <div className={`${className} rounded-lg overflow-hidden flex-shrink-0 bg-gray-100`}>
        <img
            src={processedUrl}
            alt={productName}
            className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
            onError={() => setImageError(true)}
            loading="eager"
            style={{ display: 'block' }}
        />
      </div>
  );
}
