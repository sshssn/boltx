import React from 'react';

const FAQ_MD = `Frequently Asked Questions (July 2025)

**Q: What is boltX?**
A: boltX is an AI-powered chat platform for learning, creating, and exploring. It is an AffinityX product, developed under EcommerceFusion LLC.

**Q: Is my data private?**
A: Yes. We do not sell or share your data. See our Privacy Policy for details.

**Q: How do I start a new chat?**
A: Click the New Chat button in the sidebar.

**Q: Who can I contact for support?**
A: Email support@boltx.com.

**Q: Is boltX open source?**
A: Yes! boltX is open source. You can find the code at [github.com/sshssn](https://github.com/sshssn). Please retain all credits and comply with the license if you use or fork the project.

**Q: Who owns boltX?**
A: boltX is owned and maintained by AffinityX, under EcommerceFusion LLC, registered in Sheridan, Wyoming, USA.

**Q: What are the top tech trends in 2025?**
A: AI copilots, quantum cloud, and privacy-first apps are trending in 2025.
`;

export const dynamic = 'force-static';

export default function FAQPage() {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-[#232329] px-4 py-12 items-center justify-center">
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-8 text-center">
          Frequently Asked Questions
        </h1>
        <div className="bg-zinc-900 text-zinc-100 rounded-xl px-6 py-5 shadow-md mb-4 w-full">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-center">
            {FAQ_MD}
          </pre>
        </div>
      </div>
    </div>
  );
}
