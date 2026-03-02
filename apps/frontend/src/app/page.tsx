'use client';
import { Directory } from "@/components/Directory";
import { MOCK_VENDORS } from "@/constants";

export default function Home() {
  const homescreenVendors = MOCK_VENDORS.filter(
    vendor => vendor.id === 'v-elec-1' || vendor.id === 'v-plumb-1'
  );

  return (
    <Directory vendors={homescreenVendors} />
  );
}
