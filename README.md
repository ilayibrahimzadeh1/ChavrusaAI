# Torah Learning App 📚✡️

An AI-powered Torah learning partner that provides an interactive study experience with different rabbi personalities, integrated with the Sefaria API for authentic Torah texts and commentaries.

## 🌟 Features

### 🎓 Rabbi Personalities
Learn with historically accurate AI representations of great Jewish scholars:
- **Rashi** (11th century France) - Clear, concise commentary focused on peshat (literal meaning)
- **Rambam** (12th century Spain/Egypt) - Rational philosophical approach to Torah and Halakha
- **Rabbi Yosef Caro** (16th century Israel) - Halakhic authority and author of the Shulchan Aruch
- **The Baal Shem Tov** (18th century Poland) - Founder of Hasidism, emphasizing joy and spirituality
- **Rabbi Soloveitchik** (20th century America) - Modern Orthodox philosophy and Brisker method
- **The Arizal** (16th century Safed) - Kabbalistic master and mystic

### 📖 Torah Integration
- **Automatic Reference Detection**: Recognizes Torah references in your questions
- **Sefaria API Integration**: Fetches authentic Hebrew texts and translations
- **Contextual Learning**: References are highlighted and linked for deeper study
- **Commentary Access**: Direct links to view sources on Sefaria.org

### 💬 Interactive Learning
- **Conversational Interface**: Natural dialogue with your chosen rabbi
- **Session Memory**: Maintains context throughout your learning session
- **Reference History**: Tracks previously discussed texts and topics
- **Mobile Responsive**: Study on any device, anywhere

### 🔧 Technical Features
- **Real-time Chat**: Instant responses with typing indicators
- **Error Handling**: Graceful degradation when services are unavailable
- **Security**: Rate limiting, input validation, and secure headers
- **Performance**: Caching, compression, and optimized API calls

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/torah-learning-app.git
   cd torah-learning-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage Guide

### Getting Started
1. **Select a Rabbi**: Choose from the sidebar or welcome screen cards
2. **Ask Questions**: Type your Torah-related questions in the chat
3. **Explore References**: Click on highlighted Torah references to view on Sefaria
4. **Continue Learning**: Your conversation context is maintained throughout the session

### Example Questions
- "What does Genesis 1:1 mean?"
- "Explain the concept of Shabbat"
- "What is the significance of Exodus 20:1-2?"
- "How should we understand charity in Jewish law?"
- "Tell me about the Shema prayer"

### Rabbi Specialties
- **Rashi**: Best for understanding the literal meaning of Torah texts
- **Rambam**: Ideal for philosophical and rational explanations
- **Rabbi Yosef Caro**: Perfect for questions about Jewish law and practice
- **Baal Shem Tov**: Great for spiritual and inspirational guidance
- **Rabbi Soloveitchik**: Excellent for modern Orthodox perspectives
- **Arizal**: Wonderful for mystical and Kabbalistic insights

## 🏗️ Architecture

### Backend Structure
```
src/
├── config/          # Configuration management
├── controllers/     # Request handlers
├── services/        # Business logic
├── middleware/      # Express middleware
├── routes/          # API routes
└── utils/           # Helper functions
```

### Key Components
- **Express.js**: Web framework with security middleware
- **OpenAI API**: Powers the AI rabbi personalities
- **Sefaria API**: Provides authentic Torah texts
- **Session Management**: Maintains conversation context
- **Error Handling**: Comprehensive error recovery

### Frontend Structure
```
public/
├── css/            # Stylesheets
├── js/             # JavaScript modules
├── images/         # Rabbi portraits and assets
└── index.html      # Main application
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model | `gpt-4` |
| `MAX_TOKENS` | Max response tokens | `1000` |
| `LOG_LEVEL` | Logging level | `info` |

### Advanced Configuration
See `.env.example` for all available configuration options including:
- Rate limiting settings
- Session management
- Cache configuration
- Security headers

## 🧪 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run test suite
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run health     # Validate configuration
```

### API Endpoints
- `GET /api/health` - Health check
- `POST /api/chat/session` - Create new session
- `POST /api/chat/message` - Send message
- `GET /api/chat/rabbis` - Get available rabbis
- `GET /api/reference/:reference` - Get Torah text

### Adding New Features
1. **Backend**: Add services in `src/services/`, controllers in `src/controllers/`
2. **Frontend**: Extend modules in `public/js/`
3. **Tests**: Add tests in `tests/` directory
4. **Documentation**: Update this README and API docs

## 🔒 Security

### Built-in Security Features
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **Security Headers**: Helmet.js protection
- **CORS Configuration**: Controlled cross-origin requests
- **Error Handling**: No sensitive data leakage

### Best Practices
- Keep your OpenAI API key secure
- Use HTTPS in production
- Regularly update dependencies
- Monitor logs for suspicious activity

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper OpenAI API key
- [ ] Set up HTTPS/SSL
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Platform Deployment

#### Heroku
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your-key-here
git push heroku main
```

#### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### Railway/Render
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Submit a pull request

### Code Style
- Use ESLint and Prettier configurations
- Follow existing code patterns
- Add JSDoc comments for functions
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sefaria.org** for providing the comprehensive Torah database
- **OpenAI** for the powerful language models
- **The Jewish Community** for preserving and sharing these teachings
- **All Contributors** who help improve this learning tool

## 📞 Support

### Getting Help
- **Issues**: Report bugs on GitHub Issues
- **Questions**: Use GitHub Discussions
- **Email**: [your-email@example.com]

### Troubleshooting

#### Common Issues

**"Server not connected" error**
- Check if the server is running on the correct port
- Verify your OpenAI API key is set correctly
- Check the browser console for detailed error messages

**Rabbi not responding**
- Ensure OpenAI API key is valid and has credits
- Check network connectivity
- Try refreshing the page and starting a new session

**Torah references not loading**
- Verify internet connection to Sefaria.org
- Check if the reference format is correct (e.g., "Genesis 1:1")
- Try a different reference to test connectivity

**Performance issues**
- Clear browser cache and cookies
- Check if you're hitting rate limits
- Monitor server logs for errors

### FAQ

**Q: Which OpenAI model should I use?**
A: GPT-4 provides the best results for Torah learning, but GPT-3.5-turbo works as a cost-effective alternative.

**Q: Can I add my own rabbi personalities?**
A: Yes! Edit `src/config/rabbis.js` to add new personalities with their own system prompts.

**Q: Is my conversation data stored?**
A: Conversations are stored temporarily in memory for context but are not persisted to disk.

**Q: Can I use this offline?**
A: No, the app requires internet connectivity for OpenAI and Sefaria APIs.

## 🔮 Roadmap

### Upcoming Features
- [ ] User accounts and conversation history
- [ ] Additional rabbi personalities
- [ ] Hebrew text display options
- [ ] Audio pronunciation guides
- [ ] Study group features
- [ ] Mobile app versions
- [ ] Advanced search capabilities
- [ ] Bookmark and note-taking features

### Long-term Vision
- Integration with more Jewish text databases
- Multi-language support
- Advanced learning analytics
- Community features and discussions
- Educational institution partnerships

---

**Made with ❤️ for Torah learning and Jewish education**

*"Turn it over and over, for everything is in it." - Pirkei Avot 5:22*