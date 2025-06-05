# CodeGuard AI - Smart Contract Security Audit Platform

![CodeGuard AI](https://img.shields.io/badge/CodeGuard-AI%20Powered-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

A comprehensive, AI-powered smart contract security audit platform that combines static analysis with artificial intelligence to identify vulnerabilities, suggest fixes, and provide actionable security recommendations.

## 🚀 Features

### 🔍 **Comprehensive Security Analysis**

- **Static Code Analysis**: Pattern-based detection of common vulnerabilities
- **AI-Powered Analysis**: Advanced vulnerability detection using OpenAI/Claude
- **Real-time Progress Tracking**: Live updates during analysis
- **Detailed Reports**: Comprehensive security audit reports

### 🛡️ **Vulnerability Detection**

- **Reentrancy Attacks**: Detects vulnerable external calls
- **Access Control Issues**: Identifies missing or weak access controls
- **Integer Overflow/Underflow**: Checks for arithmetic vulnerabilities
- **Unchecked External Calls**: Finds unhandled call failures
- **tx.origin Usage**: Detects authentication vulnerabilities
- **Timestamp Dependence**: Identifies time-based manipulation risks
- **Gas Optimization**: Suggests gas-saving improvements
- **Best Practices**: Comprehensive security best practices checklist

### 📊 **Security Scoring**

- **0-100 Security Score**: Algorithmic security rating
- **Risk Categorization**: Low, Medium, High, Critical risk levels
- **Confidence Ratings**: AI confidence scores for each finding
- **Trend Analysis**: Historical security improvements

### 🎯 **User Experience**

- **Drag & Drop Upload**: Easy file upload interface
- **Real-time Progress**: Live analysis progress tracking
- **Interactive Reports**: Detailed, interactive security reports
- **Export Options**: PDF and JSON report exports
- **Responsive Design**: Works on desktop and mobile

## 🏗️ **Architecture**

### **Backend Stack**

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **MongoDB** with Mongoose for data persistence
- **OpenAI/Anthropic APIs** for AI analysis

### **Frontend Stack**

- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **Real-time Updates** via polling
- **Responsive Design** for all devices

### **Analysis Engine**

- **Static Analysis Engine** with pattern matching
- **AI Integration Layer** for advanced detection
- **Security Scoring Algorithm** with bonus/penalty system
- **Report Generation** with actionable recommendations

## 📦 **Installation**

### **Prerequisites**

- Node.js 18+
- MongoDB (local or cloud)
- OpenAI API Key or Anthropic API Key (optional, for AI analysis)

### **Quick Start**

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/codeguardai.git
cd codeguardai
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/auditai

# AI Service Configuration (choose one or both)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

4. **Start MongoDB** (if running locally)

```bash
mongod
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 **Usage**

### **Basic Workflow**

1. **Upload Contract**: Drag and drop your `.sol` file or browse to upload
2. **Analysis Progress**: Watch real-time progress as your contract is analyzed
3. **View Report**: Get comprehensive security audit results
4. **Review Findings**: Examine vulnerabilities with detailed explanations
5. **Implement Fixes**: Follow AI-generated recommendations
6. **Re-analyze**: Upload updated contract to track improvements

### **API Usage**

The platform provides RESTful APIs for integration:

#### **Upload Contract**

```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "contract=@YourContract.sol"
```

#### **Check Progress**

```bash
curl http://localhost:3000/api/progress/{analysisId}
```

#### **Get Report**

```bash
curl http://localhost:3000/api/report/{analysisId}
```

## 📊 **Sample Results**

### **Vulnerable Contract Example**

```
Security Score: 45/100 (High Risk)
❌ Critical Issues: 1
❌ High Issues: 2
⚠️ Medium Issues: 3
ℹ️ Low Issues: 1
```

### **Secure Contract Example**

```
Security Score: 92/100 (Low Risk)
✅ Critical Issues: 0
✅ High Issues: 0
⚠️ Medium Issues: 0
ℹ️ Low Issues: 1
```

## 🛠️ **Development**

### **Project Structure**

```
codeguardai/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── analysis/       # Analysis progress pages
│   │   └── report/         # Report display pages
│   └── components/         # React components
├── lib/                    # Core libraries
│   ├── mongodb.ts         # Database connection
│   ├── analyzer.ts        # Static analysis engine
│   ├── aiAnalyzer.ts      # AI integration
│   └── scoring.ts         # Security scoring
├── models/                # MongoDB schemas
│   ├── Analysis.ts        # Analysis data model
│   ├── Vulnerability.ts   # Vulnerability model
│   └── Report.ts          # Report model
├── sample-contracts/      # Example contracts for testing
└── utils/                 # Utility functions
```

### **Adding New Vulnerability Patterns**

1. **Update Pattern Detection** in `lib/analyzer.ts`:

```typescript
export const VULNERABILITY_PATTERNS = {
  // ... existing patterns
  newVulnerability: [/pattern1/gi, /pattern2/gi],
};
```

2. **Add Detection Function**:

```typescript
function detectNewVulnerability(lines: string[]): VulnerabilityFinding[] {
  // Implementation here
}
```

3. **Update Analysis Pipeline**:

```typescript
// Add to runStaticAnalysis function
vulnerabilities.push(...detectNewVulnerability(lines));
```

### **Extending AI Analysis**

Add new AI prompts in `lib/aiAnalyzer.ts`:

```typescript
const ANALYSIS_PROMPTS = {
  // ... existing prompts
  newAnalysis: `Your custom AI prompt here...`,
};
```

## 🧪 **Testing**

### **Test with Sample Contracts**

1. **Vulnerable Contract**: Use `sample-contracts/VulnerableContract.sol`

   - Should detect 6+ vulnerabilities
   - Expected score: 30-50/100

2. **Secure Contract**: Use `sample-contracts/SecureContract.sol`
   - Should detect 0-1 minor issues
   - Expected score: 90+/100

### **Manual Testing Checklist**

- [ ] File upload validation (only .sol files)
- [ ] File size limits (10MB max)
- [ ] Real-time progress updates
- [ ] Vulnerability detection accuracy
- [ ] Report generation completeness
- [ ] Error handling for invalid contracts

## 🔧 **Configuration**

### **Security Scoring Weights**

Customize scoring in `lib/scoring.ts`:

```typescript
switch (vuln.severity) {
  case "critical":
    baseScore -= 40;
    break;
  case "high":
    baseScore -= 25;
    break;
  case "medium":
    baseScore -= 15;
    break;
  case "low":
    baseScore -= 5;
    break;
}
```

### **AI Model Configuration**

Configure AI models in `lib/aiAnalyzer.ts`:

- OpenAI: GPT-4 (recommended)
- Anthropic: Claude-3-Sonnet
- Custom prompts and temperature settings

## 📈 **Roadmap**

### **Version 2.0**

- [ ] WebSocket real-time updates
- [ ] Multi-file contract analysis
- [ ] Custom rule engine
- [ ] Integration with GitHub/GitLab
- [ ] CLI tool for CI/CD

### **Version 3.0**

- [ ] Advanced AI models (GPT-5, Claude-4)
- [ ] Formal verification integration
- [ ] Gas optimization analyzer
- [ ] Compliance checking (EIP standards)
- [ ] Team collaboration features

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Style**

- Use TypeScript for all new code
- Follow ESLint configuration
- Add JSDoc comments for functions
- Use meaningful variable names

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: [Wiki](https://github.com/yourusername/codeguardai/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/codeguardai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/codeguardai/discussions)
- **Email**: support@codeguardai.com

## 🏆 **Acknowledgments**

- **OpenZeppelin** for security best practices
- **Trail of Bits** for security research
- **ConsenSys** for Solidity security guidelines
- **Ethereum Community** for continuous security improvements

---

**⚠️ Important Notice**: This tool is for educational and development purposes. Always conduct professional security audits before deploying smart contracts to mainnet.

**🚀 Built with ❤️ by the CodeGuard AI Team**
