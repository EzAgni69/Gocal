'use client';
import React from 'react';
import { Star, User } from 'lucide-react';
import { Review } from '../types';
import Image from 'next/image';

interface ReviewsListProps {
    reviews: Review[];
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ reviews }) => {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <Star className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to review this vendor!</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    };

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gold-200 transition-colors"
                >
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {review.user?.avatarUrl ? (
                                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                                    <Image
                                        src={review.user.avatarUrl}
                                        alt={review.user.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-gold-600" />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-luxury-black">
                                    {review.user?.name || 'Anonymous'}
                                </h4>
                                <span className="text-xs text-gray-400">
                                    {formatDate(review.createdAt)}
                                </span>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                            star <= review.rating
                                                ? 'fill-gold-500 text-gold-500'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
