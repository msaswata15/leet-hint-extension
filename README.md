# LeetCode Hint Genie 🧞

![LeetCode Hint Genie Banner](https://img.shields.io/badge/LeetCode-Hint%20Genie-FFA116?style=for-the-badge&logo=leetcode&logoColor=white)

A sleek, AI-powered Chrome extension that provides instant hints and solutions for LeetCode problems. Designed with a modern UI and seamless integration, it helps you learn and solve coding challenges more effectively.

## ✨ Features

### 🎨 Modern & Intuitive UI
- **Beautiful Glassmorphism Design** - Clean, modern interface with smooth animations
- **Responsive Layout** - Works perfectly on all screen sizes
- **Dark Theme** - Easy on the eyes during long coding sessions

### 🎯 Smart Problem Detection
- Automatically detects the current LeetCode problem
- Extracts problem details with high accuracy
- Works with both free and premium LeetCode problems

### 🤖 AI-Powered Assistance
- **Smart Hints** - Get subtle nudges in the right direction
- **Complete Solutions** - Detailed, step-by-step explanations
- **Context-Aware** - Responses tailored to each problem

### 🚀 One-Click Access
- Instant access from your browser toolbar
- Non-intrusive interface that stays out of your way
- Keyboard shortcuts for power users

## 🚀 Quick Start

### Option 1: Local Installation (Development)

#### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/leet-hint-extension.git
   cd leet-hint-extension/backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file:
   ```env
   GOOGLE_GEMINI_API_KEY=your_api_key_here
   PORT=8000
   ```
5. Start the backend server:
   ```bash
   python -m uvicorn main:app --reload
   ```

#### Extension Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked" and select the `extension` folder
4. Pin the extension to your toolbar for easy access

### Option 2: Production Deployment

#### Backend Deployment (Render)
1. Push your code to a GitHub repository
2. Create a new Web Service on [Render](https://render.com/)
3. Connect your GitHub repository
4. Configure the service:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port=$PORT`
5. Add environment variables:
   - `GOOGLE_GEMINI_API_KEY`: Your Google Gemini API key
   - `PYTHON_VERSION`: 3.9.0

#### Update Extension Configuration
Update the API URL in `extension/popup.js`:
```javascript
const url = `https://your-render-url.onrender.com${endpoint}`;
```

## 🎨 UI Showcase

### Main Interface
![image](https://github.com/user-attachments/assets/49212aa4-528a-4efe-a0de-3f2c05c61900)
![image](https://github.com/user-attachments/assets/a8c1ee8d-5535-4b19-9b0b-20966feeac89)
![image](https://github.com/user-attachments/assets/0159c44f-b364-431a-88a2-d47ce32fe6f1)


- Clean, modern design with glassmorphism effect
- Clear separation between hints and solutions
- Loading states and error handling

## 🔧 Troubleshooting

### Common Issues
1. **Extension not loading**
   - Ensure you've loaded the unpacked extension correctly
   - Check the browser console for errors (right-click extension > Inspect)

2. **API connection issues**
   - Verify the backend server is running
   - Check CORS settings if accessing from a different domain
   - Ensure your API key is valid and has sufficient quota

3. **Problem detection not working**
   - Refresh the LeetCode page
   - Make sure you're on a problem page (e.g., https://leetcode.com/problems/two-sum/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using FastAPI and Gemini AI
- Inspired by the LeetCode community
- Icons by [Tabler Icons](https://tabler-icons.io/)
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
