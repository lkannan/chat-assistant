class GenAIChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apiKey = "";
    this._chatHistory = [];
    this._systemPrompt = "You are a helpful assistant for SAP Analytics Cloud.";
    this._isWaitingForResponse = false;
    this.render();
  }

  // Getters and setters for properties
  get apiKey() {
    return this._apiKey;
  }

  set apiKey(value) {
    this._apiKey = value;
  }

  get chatHistory() {
    return JSON.stringify(this._chatHistory);
  }

  set chatHistory(value) {
    try {
      this._chatHistory = JSON.parse(value);
      this.updateChatDisplay();
    } catch (e) {
      console.error("Invalid chat history format:", e);
    }
  }

  get systemPrompt() {
    return this._systemPrompt;
  }

  set systemPrompt(value) {
    this._systemPrompt = value;
  }

  // Render the widget UI
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
          height: 100%;
          width: 100%;
        }
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: 8px;
          overflow: hidden;
          background-color: #f5f5f5;
        }
        .chat-header {
          background: linear-gradient(135deg, #0076d6, #005699);
          color: white;
          padding: 12px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .message {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 18px;
          margin-bottom: 4px;
          word-wrap: break-word;
        }
        .user-message {
          align-self: flex-end;
          background-color: #0076d6;
          color: white;
          border-bottom-right-radius: 4px;
        }
        .ai-message {
          align-self: flex-start;
          background-color: white;
          color: #333;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .chat-input {
          display: flex;
          padding: 10px;
          background-color: white;
          border-top: 1px solid #ddd;
        }
        .message-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }
        .send-button {
          background-color: #0076d6;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin-left: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .send-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .clear-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .clear-button:hover {
          background-color: rgba(255,255,255,0.2);
        }
        .typing-indicator {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          background-color: white;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          align-self: flex-start;
          margin-bottom: 4px;
        }
        .typing-dot {
          width: 8px;
          height: 8px;
          background-color: #888;
          border-radius: 50%;
          margin: 0 2px;
          animation: typing-animation 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-animation {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      </style>
      <div class="chat-container">
        <div class="chat-header">
          <span>AI Assistant</span>
          <button class="clear-button" id="clearButton">Clear Chat</button>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input">
          <input type="text" class="message-input" id="messageInput" placeholder="Type your message...">
          <button class="send-button" id="sendButton">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const messageInput = this.shadowRoot.getElementById("messageInput");
    const sendButton = this.shadowRoot.getElementById("sendButton");
    const clearButton = this.shadowRoot.getElementById("clearButton");

    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !this._isWaitingForResponse) {
        this.handleSendMessage();
      }
    });

    sendButton.addEventListener("click", () => {
      if (!this._isWaitingForResponse) {
        this.handleSendMessage();
      }
    });

    clearButton.addEventListener("click", () => {
      this.clearChat();
    });

    // Initialize chat display
    this.updateChatDisplay();
  }

  // Update the chat display with messages
  updateChatDisplay() {
    const chatMessages = this.shadowRoot.getElementById("chatMessages");
    chatMessages.innerHTML = "";

    this._chatHistory.forEach(message => {
      const messageElement = document.createElement("div");
      messageElement.className = `message ${message.role === "user" ? "user-message" : "ai-message"}`;
      messageElement.textContent = message.content;
      chatMessages.appendChild(messageElement);
    });

    // Add typing indicator if waiting for response
    if (this._isWaitingForResponse) {
      const typingIndicator = document.createElement("div");
      typingIndicator.className = "typing-indicator";
      typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      chatMessages.appendChild(typingIndicator);
    }

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Handle sending a message
  handleSendMessage() {
    const messageInput = this.shadowRoot.getElementById("messageInput");
    const message = messageInput.value.trim();
    
    if (message) {
      this.sendMessage(message);
      messageInput.value = "";
    }
  }

  // Public method: Send a message to the AI
  async sendMessage(message) {
    if (!message || this._isWaitingForResponse) return;

    // Add user message to chat history
    this._chatHistory.push({
      role: "user",
      content: message
    });

    // Update UI to show waiting state
    this._isWaitingForResponse = true;
    this.updateChatDisplay();
    this.dispatchEvent(new CustomEvent("onMessageSent"));

    // Toggle send button state
    const sendButton = this.shadowRoot.getElementById("sendButton");
    sendButton.disabled = true;

    try {
      // Prepare messages for API
      const messages = [
        { role: "system", text: this._systemPrompt }
      ];

      // Add conversation history (limited to last 10 messages to avoid token limits)
      const recentHistory = this._chatHistory.slice(-10);
      recentHistory.forEach(item => {
        messages.push({
          role: item.role === "user" ? "user" : "model",
          text: item.content
        });
      });

      // Call Google Gemini API
      const response = await this.callGeminiAPI(messages);
      
      // Add AI response to chat history
      this._chatHistory.push({
        role: "assistant",
        content: response
      });

      // Dispatch event for response received
      this.dispatchEvent(new CustomEvent("onResponseReceived"));
    } catch (error) {
      console.error("Error calling AI API:", error);
      
      // Add error message to chat
      this._chatHistory.push({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again later."
      });
    } finally {
      // Update UI
      this._isWaitingForResponse = false;
      sendButton.disabled = false;
      this.updateChatDisplay();
    }

    return this.getLastResponse();
  }

  // Call Google Gemini API
  async callGeminiAPI(messages) {
    if (!this._apiKey) {
      return "Please set your Google API key in the widget properties.";
    }
  
    // Fix the URL path - use v1beta instead of vibeta
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this._apiKey}`;
    
    try {
      // Format messages for Gemini API
      const formattedContents = [];
      
      // For a conversation, we need to format messages correctly
      // Each message should have a role (user or model) and parts with text
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        // Skip system messages or handle them differently
        if (msg.role === "system") {
          continue;
        }
        
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
  
      // If we have no messages after filtering, add a default user message
      if (formattedContents.length === 0) {
        formattedContents.push({
          role: "user",
          parts: [{ text: "Hello" }]
        });
      }
  
      console.log("Sending request to Gemini API with payload:", 
        JSON.stringify({
          contents: formattedContents
        }, null, 2)
      );
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: formattedContents
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      console.log("API response received:", data);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 
             "Sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  }

  // Public method: Clear chat history
  clearChat() {
    this._chatHistory = [];
    this.updateChatDisplay();
  }

  // Public method: Get the last AI response
  getLastResponse() {
    const assistantMessages = this._chatHistory.filter(msg => msg.role === "assistant");
    return assistantMessages.length > 0 ? 
      assistantMessages[assistantMessages.length - 1].content : "";
  }

  // Public method: Set system prompt
  setSystemPrompt(prompt) {
    this._systemPrompt = prompt;
  }

  // Public method: Get chat history
  getChatHistory() {
    return this.chatHistory;
  }
}

customElements.define("com-example-genaichatwidget", GenAIChatWidget);
