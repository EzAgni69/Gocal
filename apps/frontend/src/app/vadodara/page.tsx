import { Suspense } from 'react';
import { VadodaraPlaces } from '@/components/VadodaraPlaces';

export default function VadodaraPage() {
    return (
        <main className="pt-20 sm:pt-24">
            <Suspense fallback={<div>Loading...</div>}>
                <VadodaraPlaces />
            </Suspense>
        </main>
    );
}
