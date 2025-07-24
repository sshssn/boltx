import React from 'react';

const TERMS_MD = `Terms of Service (July 2025)

Welcome to boltX, an AffinityX product. By accessing or using this application, you agree to the following legally binding terms. Please read them carefully.

**1. Acceptance of Terms**
By using boltX, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the service.

**2. Ownership & Credits**
boltX is developed by AffinityX, under EcommerceFusion LLC, registered at 30 North Gould St, Sheridan, Wyoming, 82801, USA. The project is open source and available at [github.com/sshssn](https://github.com/sshssn). Proper credit must be maintained in all uses and forks.

**3. User Responsibilities**
- You are responsible for your content and activity on boltX.
- No unlawful, abusive, or harmful use is permitted.
- Automated scraping, reverse engineering, or abuse of the service is strictly prohibited.

**4. Privacy**
Your privacy is governed by our Privacy Policy. We do not sell or share your data.

**5. Modifications & Updates**
We may update these terms at any time. Continued use constitutes acceptance of the new terms.

**6. Disclaimer & Limitation of Liability**
boltX is provided "as is" without warranties. AffinityX, EcommerceFusion LLC, and contributors are not liable for any damages arising from use.

**7. Open Source License**
boltX is open source. You may use, modify, and distribute it under the terms of the included license. You must retain all credits and comply with license terms.

**8. Contact**
For legal or support inquiries, contact support@boltx.com.

© 2025 AffinityX, EcommerceFusion LLC. All rights reserved.`;

export const dynamic = 'force-static';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-[#232329] px-4 py-12 items-center justify-center">
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-8 text-center">
          Terms of Service
        </h1>
        <div className="bg-zinc-900 text-zinc-100 rounded-xl px-6 py-5 shadow-md mb-4 w-full">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-center">
            {TERMS_MD}
          </pre>
        </div>
      </div>
    </div>
  );
}
