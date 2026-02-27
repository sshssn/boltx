<a href="https://github.com/sshssn/boltx">
  <img alt="Next.js 15 AI Bot with GPT-5 and DALL-E 3" src="app/(chat)/opengraph-image.png">
  <h1 align="center">BoltX AI</h1>
</a>

<p align="center">
    BoltX is an advanced, production-ready AI chatbot platform built with Next.js 15 and AI SDK 6.x. It features state-of-the-art model integration, image generation, and persistent streaming.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a>
</p>
<br/>

## Features

### 🚀 Cutting-Edge AI
- **Flagship Intelligence**: Powered by **GPT-5.1** as the default model for unparalleled reasoning and response quality.
- **Advanced Support**: Native integration for **GPT-5.2** and deep reasoning models.
- **Multimodal Generation**: Built-in **DALL-E 3** support for high-fidelity image generation directly within the chat interface.

### 🔄 Resumable Persistence
- **Session Continuity**: Powered by `resumable-stream` and Redis, ensuring chat sessions are persistent and robust against network interruptions.
- **Real-time Streaming**: Optimized AI SDK 6.x implementation for ultra-fast, smooth token delivery.

### 🎨 Premium Interface
- **Dynamic Artifacts**: Specialized handlers for code, text, sheets, and images to provide a rich, interactive user experience.
- **Modern Design**: A beautiful, responsive UI built with **Tailwind CSS v3** and **shadcn/ui** primitives.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, Server Actions)
- **AI Infrastructure**: [AI SDK 6.x](https://sdk.vercel.ai)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- **Database**: [Neon Postgres](https://neon.tech)
- **Caching & Persistence**: [Redis](https://redis.io) (Upstash)
- **Authentication**: [Auth.js](https://authjs.dev)

## Model Providers

BoltX is designed for flexibility. While it defaults to **OpenAI's GPT-5** series, it is fully compatible with any provider supported by the AI SDK, including Anthropic, Google, and xAI.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Redis instance (local or Upstash)
- OpenAI API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sshssn/boltx.git
   cd boltx
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

MIT
