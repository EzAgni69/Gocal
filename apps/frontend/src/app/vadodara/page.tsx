import { VadodaraPlaces } from '@/components/VadodaraPlaces';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function VadodaraPage() {
    return (
        <>
            <Header />
            <main className="pt-16">
                <VadodaraPlaces />
            </main>
            <Footer />
        </>
    );
}
