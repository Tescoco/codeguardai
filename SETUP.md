# CodeGuard AI Setup Guide

## Environment Configuration

Create a `.env.local` file in the root directory with the following configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/codeguardai

# OpenAI Configuration for AI Analysis
OPENAI_API_KEY=your_openai_api_key_here

# Alternative AI Services (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Development Configuration
NODE_ENV=development
```

## Getting OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

## AI Analysis Features

With OpenAI API configured, the platform will:

- **Enhanced Vulnerability Detection**: AI analysis finds complex vulnerabilities that static analysis might miss
- **Detailed Explanations**: Get AI-powered explanations for each vulnerability
- **Context-Aware Analysis**: Understanding of business logic and advanced attack vectors
- **Code Quality Insights**: Best practices and optimization recommendations

## Testing AI Analysis

1. Start the development server: `npm run dev`
2. Upload a contract from `sample-contracts/`
3. Watch for AI analysis step (shows 🤖 icon in results)
4. AI findings will be marked with purple indicators in the report

## Troubleshooting

- **No AI analysis**: Check if `OPENAI_API_KEY` is set correctly
- **API errors**: Ensure you have sufficient OpenAI credits
- **Slow analysis**: Large contracts are split into chunks, this is normal

## Cost Considerations

- AI analysis uses GPT-4 for better accuracy
- Typical cost: $0.01-0.05 per contract analysis
- Static analysis runs first and is free
- AI analysis can be disabled by not setting the API key
