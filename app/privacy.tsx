import React from 'react';

const PRIVACY_MD = `Privacy Policy (July 2025)

This Privacy Policy describes how boltX (an AffinityX product, under EcommerceFusion LLC, 30 North Gould St, Sheridan, Wyoming, 82801, USA) collects, uses, and protects your information.

**1. Information We Collect**
- We collect only the information you provide directly (e.g., chat content, account info).
- No tracking, profiling, or selling of personal data.

**2. Use of Information**
- Data is used solely to provide and improve the boltX service.
- We do not share your data with third parties except as required by law.

**3. Data Security**
- We use industry-standard security to protect your data.
- No method of transmission is 100% secure, but we strive for best practices.

**4. Data Deletion**
- You may request deletion of your data at any time by contacting support@boltx.com.

**5. Open Source & Credits**
- boltX is open source. If you fork or use this project, you must comply with the license and retain all credits.

**6. Changes to This Policy**
- We may update this policy. Continued use means acceptance of the new policy.

**7. Contact**
For privacy questions, contact support@boltx.com.

© 2025 AffinityX, EcommerceFusion LLC. All rights reserved.`;

export const dynamic = 'force-static';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-[#232329] px-4 py-12 items-center justify-center">
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-8 text-center">
          Privacy Policy
        </h1>
        <div className="bg-zinc-900 text-zinc-100 rounded-xl px-6 py-5 shadow-md mb-4 w-full">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-center">
            {PRIVACY_MD}
          </pre>
        </div>
      </div>
    </div>
  );
}
