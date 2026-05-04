"use client";

import { SHARE_DRAWER_PLATFORM_URL } from "@/core/widgets/share-drawer/model/share-drawer-helpers";
import Link from "next/link";

function KreatiWordmark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="52"
      height="13"
      viewBox="0 0 52 13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 12.9472V8.77236H1.68934V7.00203H0V0H1.68934V7.00203L5.56954 3.48781H7.73401L3.00914 7.76829L8.84264 12.9472H6.38782L1.68934 8.77236V12.9472H0Z"
        fill="#242426"
      />
      <path
        d="M11.5614 12.9472H9.87208V3.61992H11.5614V5.31098C11.6881 3.81016 13.0132 3.61992 13.198 3.61992H15.0985V5.31098H16.867V6.92276H15.0985V5.31098H11.5614V12.9472Z"
        fill="#242426"
      />
      <path d="M52 0.0528455H50.1259V1.79675H52V0.0528455Z" fill="#242426" />
      <path d="M52 3.67276H50.1259V13H52V3.67276Z" fill="#242426" />
      <path
        d="M42.4183 0.713415H44.1076V3.64634H47.1959V5.25813H44.1076V11.1768H47.1959V12.9736H44.1076V11.1768H42.4183V5.25813H40.1482V3.54065H42.4183V0.713415Z"
        fill="#242426"
      />
      <path
        d="M36.0041 5.36382H30.4081V3.5935H36.0041V5.36382H37.7726V12.9736H36.0041V11.3536C35.9782 11.9614 35.5746 12.9736 34.0772 12.9736H31.8599C31.8599 12.9736 29.8274 12.9736 29.8274 11.2297H36.0041V8.93089H31.6487V7.16057H36.0041V5.36382Z"
        fill="#242426"
      />
      <path
        d="M29.8274 11.2561V8.93089H31.5695V11.2561H29.8274Z"
        fill="#242426"
      />
      <path
        d="M20.7736 12.9207V11.2033H19.0315V7.47764V5.25813C19.0315 4.13781 20.1929 3.68157 20.7736 3.5935C21.7942 3.58469 24.1206 3.57236 25.2609 3.5935C26.4012 3.61463 26.8623 4.71206 26.9503 5.25813V7.31911H25.2609V5.25813H20.7736V7.47764H26.9503V9.11585H20.7736V11.2033H26.9503V12.9207H20.7736Z"
        fill="#242426"
      />
      <path
        d="M26.9503 7.47764V7.31911H25.2609V7.47764H26.9503Z"
        fill="#242426"
      />
    </svg>
  );
}

export function ShareDrawerBrand() {
  return (
    <h3 className="flex flex-col items-center text-center text-sm text-[#8C8C8C] pb-5">
      разработано на платформе
      <br />
      <Link
        href={SHARE_DRAWER_PLATFORM_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <KreatiWordmark />
      </Link>
    </h3>
  );
}
