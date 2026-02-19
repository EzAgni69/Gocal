'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { GooglePlaceResponse } from '../services/placesApi';

interface FavoriteButtonProps {
    place: GooglePlaceResponse;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
};

const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
};

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    place,
    size = 'md',
    className = '',
}) => {
    const { isFavorite, addToFavorites, removeFromFavorites, requireAuth } = useAppContext();
    const isFav = isFavorite(place.id);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!requireAuth('add to favorites')) {
            return;
        }

        if (isFav) {
            removeFromFavorites(place.id);
        } else {
            addToFavorites(place);
        }
    };

    return (
        <motion.button
            onClick={handleClick}
            className={`
                ${sizeClasses[size]}
                flex items-center justify-center
                rounded-full
                bg-white/90 backdrop-blur-sm
                shadow-lg
                border border-white/20
                hover:bg-white
                transition-colors duration-200
                ${className}
            `}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
            <motion.div
                initial={false}
                animate={{
                    scale: isFav ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
            >
                <Heart
                    className={`
                        ${iconSizes[size]}
                        ${isFav
                            ? 'text-red-500 fill-red-500'
                            : 'text-gray-600 hover:text-red-400'
                        }
                        transition-colors duration-200
                    `}
                />
            </motion.div>
        </motion.button>
    );
};

export default FavoriteButton;
