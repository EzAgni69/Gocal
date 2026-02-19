'use client';
import { Directory } from "@/components/Directory";
import { MOCK_VENDORS } from "@/constants";

export default function Home() {
  return (
    <Directory vendors={MOCK_VENDORS} />
  );
}
