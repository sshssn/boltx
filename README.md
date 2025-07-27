<div align="center">
  <img src="public/images/dark.svg" alt="boltX logo" width="220" />
</div>

# boltX

A modern AI chat application built with Next.js, featuring real-time streaming, file uploads, and intelligent conversation management.

## Features

- 🤖 **AI Chat**: Powered by Google Gemini with real-time streaming
- 📁 **File Uploads**: Support for images, documents, and code files
- 🔄 **Conversation History**: Persistent chat history with smart organization
- 🎨 **Modern UI**: Beautiful, responsive interface with dark/light themes
- 🔐 **Authentication**: Guest and registered user support
- 📱 **Mobile Optimized**: Works on all devices* ( Mobile is in beta testing use at own risk.) 

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd boltX
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Add your configuration:
   ```env
   # Database
   POSTGRES_URL=your_postgres_connection_string
   
   # Authentication
   AUTH_SECRET=your_auth_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # AI Provider (Gemini)
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Multiple API Keys Setup (Recommended for Production)

To handle rate limiting and ensure high availability, you can set up multiple Gemini API keys:

1. **Create multiple API keys** in the [Google AI Studio](https://aistudio.google.com/app/apikey)

2. **Add them to your environment variables**:
   ```env
   GEMINI_API_KEY=your_primary_api_key
   GEMINI_API_KEY_2=your_secondary_api_key
   GEMINI_API_KEY_3=your_tertiary_api_key
   ```

3. **The application will automatically**:
   - Use the primary key by default
   - Switch to the next available key when rate limited
   - Retry failed requests with different keys
   - Provide fallback mechanisms for better reliability

## Rate Limiting Solutions

If you're experiencing rate limiting issues:

### For Development
- Use multiple API keys as described above
- Consider upgrading to a paid Gemini plan for higher limits

### For Production
- Set up multiple API keys for redundancy
- Monitor usage and implement proper rate limiting
- Consider using a queue system for high-traffic scenarios

## Database Schema

The application uses PostgreSQL with the following main tables:
- `User`: User accounts and authentication
- `Chat`: Conversation metadata and titles
- `Message`: Individual messages with parts and attachments
- `Memory`: User context and preferences
- `Document`: Uploaded files and artifacts

## API Endpoints

- `POST /api/chat`: Send messages and get AI responses
- `GET /api/history`: Retrieve chat history
- `POST /api/files/upload`: Upload files for processing
- `GET /api/profile/tokens`: Get user message limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/boltX/issues) page
2. Review the logs for error details
3. Ensure your environment variables are correctly set
4. Verify your database connection and migrations

For production deployments, consider:
- Setting up proper monitoring and logging
- Implementing backup strategies
- Using a CDN for static assets
- Setting up SSL certificates
