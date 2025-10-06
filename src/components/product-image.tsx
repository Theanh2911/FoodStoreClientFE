"use client";

import * as React from "react";
import { getPlaceholderImage } from "@/lib/api";

// Backend base URL for image processing
const BACKEND_BASE_URL = 'http://192.168.1.13:8080';

interface ProductImageProps {
  imageUrl: string | null;
  productName: string;
  categoryName: string;
  className?: string;
}

export function ProductImage({ imageUrl, productName, categoryName, className = "" }: ProductImageProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);

  // Process image URL and reset states when imageUrl changes
  React.useEffect(() => {
    console.log(`🖼️ Processing image for ${productName}:`, { imageUrl, categoryName });
    
    // Reset states
    setImageError(false);
    setImageLoading(false);
    setImageSrc(null);

    if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'null') {
      console.log(`❌ No valid image URL for ${productName}, using placeholder`);
      return;
    }

    // Validate and clean the URL
    let processedUrl = imageUrl.trim();
    
    // Add protocol if missing
    if (processedUrl.startsWith('//')) {
      processedUrl = 'https:' + processedUrl;
    } else if (processedUrl.startsWith('/')) {
      // Relative URL - add your backend base URL
      processedUrl = BACKEND_BASE_URL + processedUrl;
    } else if (!processedUrl.startsWith('http')) {
      // No protocol specified
      processedUrl = 'https://' + processedUrl;
    }

    console.log(`🔗 Processed URL for ${productName}:`, processedUrl);
    setImageSrc(processedUrl);
    setImageLoading(true);
  }, [imageUrl, productName]);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`❌ Image failed to load for ${productName}:`, {
      originalUrl: imageUrl,
      processedUrl: imageSrc,
      error: event.nativeEvent
    });
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully for ${productName}:`, imageSrc);
    setImageLoading(false);
  };

  // Get placeholder
  const placeholder = getPlaceholderImage(categoryName);

  // Show placeholder if no valid image URL or if image failed to load
  if (!imageSrc || imageError) {
    return (
      <div className={`flex items-center justify-center text-3xl ${className}`}>
        <span 
          title={`${productName} - ${categoryName} ${imageError ? '(Image failed to load)' : '(No image)'}`}
          className="select-none"
        >
          {placeholder}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden`}>
      {/* Loading spinner */}
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Fallback placeholder behind image */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl bg-gray-50 rounded-lg">
        <span className="opacity-30">{placeholder}</span>
      </div>

      {/* Actual image */}
      <img
        src={imageSrc}
        alt={productName}
        className="relative z-20 w-12 h-12 object-cover rounded-lg transition-opacity duration-300"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ 
          opacity: imageLoading ? 0 : 1,
          display: 'block'
        }}
        crossOrigin="anonymous"
        loading="lazy"
      />
    </div>
  );
}
