import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({
  className = '',
  variant = 'default',
  lines = 1,
  width = 'w-full',
  height = 'h-4',
  animate = true
}) => {
  const baseClasses = `bg-gray-200 rounded-md ${width} ${height}`;
  const animationClasses = animate ? 'animate-pulse' : '';

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut'
      }
    }
  };

  const Shimmer = () => (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
    />
  );

  // Single skeleton item
  const SkeletonItem = ({ className: itemClassName = '' }) => (
    <div className={`relative overflow-hidden ${baseClasses} ${animationClasses} ${itemClassName}`}>
      {animate && <Shimmer />}
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'text':
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, index) => (
            <SkeletonItem
              key={index}
              className={index === lines - 1 ? 'w-3/4' : 'w-full'}
            />
          ))}
        </div>
      );

    case 'avatar':
      return (
        <SkeletonItem className={`${className} rounded-full`} />
      );

    case 'card':
      return (
        <div className={`bg-white rounded-xl p-4 border border-gray-100 ${className}`}>
          <div className="flex items-start gap-3">
            <SkeletonItem className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonItem className="h-4 w-3/4" />
              <SkeletonItem className="h-3 w-1/2" />
              <SkeletonItem className="h-3 w-full" />
            </div>
          </div>
        </div>
      );

    case 'message':
      return (
        <div className={`flex gap-3 ${className}`}>
          <SkeletonItem className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="bg-gray-100 rounded-2xl p-4">
              <div className="space-y-2">
                <SkeletonItem className="h-4 w-full" />
                <SkeletonItem className="h-4 w-5/6" />
                <SkeletonItem className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      );

    case 'rabbi-card':
      return (
        <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 ${className}`}>
          <div className="flex items-start gap-4">
            <SkeletonItem className="w-14 h-14 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <SkeletonItem className="h-5 w-2/3" />
              <SkeletonItem className="h-3 w-1/2" />
              <SkeletonItem className="h-4 w-full" />
            </div>
          </div>
        </div>
      );

    case 'session-item':
      return (
        <div className={`bg-white rounded-xl p-3 border-2 border-gray-200 ${className}`}>
          <div className="flex items-center gap-3">
            <SkeletonItem className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonItem className="h-4 w-3/4" />
              <SkeletonItem className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      );

    case 'loading-screen':
      return (
        <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
          <div className="text-center p-8">
            {/* App Logo Skeleton */}
            <SkeletonItem className="w-20 h-20 rounded-full mx-auto mb-6" />

            {/* Loading Text Skeleton */}
            <div className="flex items-center justify-center mb-4">
              <SkeletonItem className="w-8 h-8 rounded-full mr-3" />
              <SkeletonItem className="h-6 w-48" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2 max-w-sm mx-auto">
              <SkeletonItem className="h-4 w-full" />
              <SkeletonItem className="h-4 w-3/4 mx-auto" />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <SkeletonItem className={className} />
      );
  }
};

// Specialized skeleton components for common use cases
export const MessageSkeleton = ({ className = '' }) => (
  <SkeletonLoader variant="message" className={className} />
);

export const RabbiCardSkeleton = ({ className = '' }) => (
  <SkeletonLoader variant="rabbi-card" className={className} />
);

export const SessionItemSkeleton = ({ className = '' }) => (
  <SkeletonLoader variant="session-item" className={className} />
);

export const LoadingScreenSkeleton = ({ className = '' }) => (
  <SkeletonLoader variant="loading-screen" className={className} />
);

export default SkeletonLoader;