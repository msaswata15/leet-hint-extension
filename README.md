# LeetCode Hint Extension

A Chrome extension that provides AI-powered hints and solutions for LeetCode problems directly in your browser. This extension helps you learn and solve coding challenges more effectively by providing contextual assistance when you need it most.

## 🌟 Features

### 🎯 Smart Problem Detection
- Automatically detects the current LeetCode problem you're viewing
- Extracts problem title and description with high accuracy
- Works with dynamic content loading on LeetCode pages

### 🤖 AI-Powered Assistance
- **Hints**: Get subtle nudges in the right direction without spoiling the solution
- **Solutions**: Access detailed explanations when you're truly stuck
- **Context-Aware**: Responses are tailored to the specific problem you're solving

### 🚀 Seamless Integration
- One-click access from your browser toolbar
- Clean, non-intrusive interface
- Works with both free and premium LeetCode problems

### 🛠️ Developer Friendly
- Detailed debug logging for troubleshooting
- CORS pre-configured for local development
- Easy-to-extend architecture

## 🛠️ Installation

### Prerequisites
- Google Chrome or any Chromium-based browser
- Python 3.7+ for the backend server
- Node.js and npm (for development)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your Google Gemini API key in `main.py`
4. Start the backend server:
   ```bash
   python -m uvicorn main:app --reload
   ```

### Extension Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" and select the `extension` directory
4. Pin the extension to your toolbar for easy access

## 🚀 Usage
1. Navigate to any LeetCode problem (e.g., `https://leetcode.com/problems/two-sum/`)
2. Click the extension icon in your toolbar
3. Choose "Get Hint" for a nudge in the right direction
4. If needed, click "Get Solution" for a detailed explanation

## 🏗️ Architecture

### Frontend (Extension)
- **Content Script**: Injects into LeetCode pages to extract problem details
- **Background Script**: Handles extension lifecycle and message passing
- **Popup UI**: Provides the user interface for requesting hints/solutions

### Backend (FastAPI)
- RESTful API endpoints for hint and solution generation
- Integration with Google's Gemini AI
- CORS configured for secure cross-origin requests

## 🔧 Troubleshooting

### Common Issues
- **Backend not running**: Ensure the Python server is running on port 8000
- **CORS errors**: Verify the backend CORS configuration matches your setup
- **Content not detected**: Try refreshing the page and ensure you're on a valid LeetCode problem page

### Debugging
1. Open Chrome Developer Tools (F12)
2. Go to the Console tab
3. Look for messages prefixed with `[CONTENT]`, `[POPUP]`, or `[BACKGROUND]`
4. Check the Network tab for API request/response details

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- Built with ❤️ for the LeetCode community
- Powered by Google's Gemini AI
- Inspired by countless hours of coding challenges

---

Happy Coding! 🚀
