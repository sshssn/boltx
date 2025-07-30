# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3] - 2024-12-19

### Added
- Enhanced AI model temperature settings for more creative and varied responses
- Improved production security with comprehensive .gitignore patterns
- Better error handling and fallback mechanisms for AI providers

### Changed
- Increased AI model temperature from 0.1/0.7 to 0.8 across all providers (Groq, Gemini, OpenRouter)
- Updated bolt icon tooltip from "Enable reasoning mode - Use DeepSeek R1 for enhanced responses" to "Thinking Model"
- Improved aria-label for accessibility: "Enable thinking model"
- Enhanced topP setting from 0.8 to 0.9 for more diverse AI responses

### Removed
- All debug console.log statements from production code
- Test files and directories (tests/, test-results/, playwright-report/)
- Development-only test scripts (test-keys-simple.js, test-message-usage.js)
- Playwright configuration file (playwright.config.ts)
- Verbose logging that exposed sensitive API response data

### Security
- Enhanced .gitignore to exclude sensitive files and directories
- Added protection for API keys, secrets, and environment files
- Excluded test files, IDE configurations, and temporary files
- Added patterns for certificate files, private keys, and sensitive documentation

### Technical
- Streamlined AI provider error handling with cleaner logging
- Optimized production build by removing development artifacts
- Improved code maintainability by removing debug statements
- Enhanced security posture for production deployment

### Performance
- Reduced build size by removing test artifacts
- Improved runtime performance by eliminating debug logging
- Cleaner production logs for better monitoring

---

## [0.1.2] - Previous Version

[Previous changelog entries would go here] 