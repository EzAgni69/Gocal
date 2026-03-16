import { MyFavorites } from '@/components/MyFavorites';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Favourites | Gocal.co',
    description: 'Your curated collection of favorite stores and services in Vadodara',
};

export default function FavouritesPage() {
    return <MyFavorites />;
}
