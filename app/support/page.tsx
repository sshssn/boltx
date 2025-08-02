import { TicketForm } from '@/components/ticket-form';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c2a] via-[#232329] to-[#181c2a] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Support Center</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Need help? Submit a ticket and our team will get back to you as soon
            as possible. We&apos;re here to help you get the most out of BoltX.
          </p>
        </div>

        <TicketForm />

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 border border-white/20">
            <div className="text-2xl mb-3">🐛</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Bug Reports
            </h3>
            <p className="text-gray-300 text-sm">
              Found a bug? Let us know so we can fix it quickly.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 border border-white/20">
            <div className="text-2xl mb-3">✨</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Feature Requests
            </h3>
            <p className="text-gray-300 text-sm">
              Have an idea? We&apos;d love to hear your suggestions.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 border border-white/20">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Support Questions
            </h3>
            <p className="text-gray-300 text-sm">
              Need help using BoltX? We&apos;re here to assist you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
