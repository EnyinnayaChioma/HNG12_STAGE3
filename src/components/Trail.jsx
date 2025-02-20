import { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png";
import user from "../assets/user.jpeg";

function Trail() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Define supported languages - make sure these match Chrome API's supported codes
  // const supportedLanguages = ["en", "es", "fr", "de", "pt", "ru", "tr"];

  // Function to handle sending a message
  const handleSend = async () => {
    if (input.trim() === "") return;

    // Create new message object
    const newMessage = {
      text: input.trim(),
      type: "sent",
      detectedLanguage: "detecting...",
      summary: "",
      translatedText: "",
      targetLanguage: "en",
    };

    // Add message to state and clear input
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");

    // Need to detect language after message is added to state
    // We use setTimeout to ensure the state update completes first
    setTimeout(() => {
      detectLanguage(messages.length);
    }, 0);
  };

  // Language detection function - fixed to correctly access Chrome AI API
  const detectLanguage = async (index) => {
    try {
      // Ensure window.ai is properly loaded
      if (window.ai && window.ai.languageDetector && typeof window.ai.languageDetector.create === "function") {
        // Get message text
        const messageText = messages[index].text;

        // Create language detector - proper Chrome API syntax
        const detector = await window.ai.languageDetector.create();

        // Detect language
        const result = await detector.detect(messageText);
        console.log(result[0]);

        // Check if we got a valid result
        if (result && result.detectedLanguage) {
          // Update message with detected language
          updateMessage(index, { detectedLanguage: result.detectedLanguage });
          console.log("Successfully detected language:", result.detectedLanguage);
        } else {
          console.error("No language detected in result:", result);
          updateMessage(index, { detectedLanguage: "Unknown" });
        }
      } else {
        console.error("Language Detector API not properly available");
        updateMessage(index, { detectedLanguage: "API unavailable" });
      }
    } catch (error) {
      console.error("Language detection error:", error);
      updateMessage(index, { detectedLanguage: "Detection failed" });
    }
  };

  // Summarize function - this one works correctly
  const handleSummarize = async (index) => {
    try {
      // Get message text
      const messageText = messages[index].text;

      // Show loading state
      updateMessage(index, { summaryStatus: "Summarizing..." });

      if (window.ai && window.ai.summarizer) {
        // Create summarizer
        const summarizer = await window.ai.summarizer.create();

        // Generate summary
        const summary = await summarizer.summarize(messageText);

        // Update message with summary
        updateMessage(index, { summary, summaryStatus: "" });
      } else {
        updateMessage(index, { summary: "Summarizer API not available", summaryStatus: "" });
      }
    } catch (error) {
      console.error("Summarization error:", error);
      updateMessage(index, { summary: "Failed to summarize", summaryStatus: "" });
    }
  };

  // Fixed translation function to handle all language pairs correctly
  const handleTranslate = async (index) => {
    try {
      // Get message and show loading state
      const message = messages[index];
      updateMessage(index, { translationStatus: "Translating..." });

      if (!window.ai || !window.ai.translator) {
        throw new Error("Translator API not available");
      }

      // Determine source language - handle "detecting..." and "Unknown" cases
      let sourceLanguage = "en"; // Default fallback

      if (
        message.detectedLanguage &&
        message.detectedLanguage !== "detecting..." &&
        message.detectedLanguage !== "Unknown" &&
        message.detectedLanguage !== "API unavailable" &&
        message.detectedLanguage !== "Detection failed"
      ) {
        sourceLanguage = message.detectedLanguage;
      }

      console.log(`Translating from ${sourceLanguage} to ${message.targetLanguage}`);

      // Create translator with explicit source and target languages
      const translator = await window.ai.translator.create({
        sourceLanguage: sourceLanguage,
        targetLanguage: message.targetLanguage,
      });

      // Execute translation
      const translatedText = await translator.translate(message.text);

      // Update message with translated text
      updateMessage(index, {
        translatedText: translatedText || "No translation returned",
        translationStatus: "",
      });
    } catch (error) {
      console.error("Translation error:", error);
      updateMessage(index, {
        translatedText: `Translation failed: ${error.message}`,
        translationStatus: "",
      });
    }
  };

  // Helper function to update message at specific index
  const updateMessage = (index, updates) => {
    setMessages((prevMessages) => {
      // Validate index
      if (index >= prevMessages.length) {
        console.error("Invalid message index:", index);
        return prevMessages;
      }

      // Create updated messages array
      const updatedMessages = [...prevMessages];
      updatedMessages[index] = { ...updatedMessages[index], ...updates };
      return updatedMessages;
    });
  };

  // Handle enter key for sending
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle target language change for translation
  const handleTargetLanguageChange = (index, newLanguage) => {
    updateMessage(index, {
      targetLanguage: newLanguage,
      translatedText: "", // Clear previous translation
    });
  };

  return (
    <div className="container flex m-auto bg-indigo-100 justify-center w-screen h-screen py-10 sm:py-20">
      <div className="holder bg-indigo-300 w-full h-full mx-4 sm:mx-11 my-4 sm:my-11 rounded-3xl">
        {/* Nav Bar */}
        <nav className="w-full sm:w-5/6 h-16 text-center m-auto my-5 flex flex-col sm:flex-row justify-between items-center px-4 sm:px-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14">
            <img src={logo} alt="Logo" className="w-full h-full" />
          </div>
          <div>
            <p className="text-center text-lg text-gray-700">
              AI-Powered Text Processor
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12">
            <img src={user} alt="User" className="object-contain rounded-3xl w-full h-full" />
          </div>
        </nav>

        {/* Main Content */}
        <div className="w-full h-[80%] sm:h-[86%] bg-white rounded-3xl p-4 sm:p-12 relative">
          <div className="absolute left-[50%] transform -translate-x-1/2 top-[-2%]">
            <p className="bg-indigo-300 rounded-3xl text-gray-700 px-4 py-1">Today</p>
          </div>

          {/* Messages Area */}
          <div className="h-[70%] sm:h-[80%] overflow-y-auto mb-16 px-4 rounded-ee rounded-bl">
            {messages.map((message, index) => (
              <div
                key={index}
                className="bg-indigo-300 rounded-3xl mb-6 p-4 sm:p-5 w-full"
              >
                {/* Message Text */}
                <p className="text-gray-800 mb-2">{message.text}</p>

                {/* Language Detection */}
                <div className="flex items-center mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Detected language:</span>
                    {message.detectedLanguage}
                  </p>
                  {message.detectedLanguage === "Unknown" && (
                    <button
                      onClick={() => detectLanguage(index)}
                      className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Try again
                    </button>
                  )}
                </div>

                {/* Summarize Button (for longer messages) */}
                {message.text.length > 150 && (
                  <div className="mb-3">
                    <button
                      onClick={() => handleSummarize(index)}
                      disabled={message.summaryStatus === "Summarizing..."}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                    >
                      {message.summaryStatus || "Summarize"}
                    </button>
                  </div>
                )}

                {/* Summary Result */}
                {message.summary && (
                  <div className="bg-blue-100 p-3 rounded-md mb-3 border-l-2 border-blue-500">
                    <p className="text-sm font-medium text-blue-800 mb-1">Summary:</p>
                    <p className="text-sm text-gray-700">{message.summary}</p>
                  </div>
                )}

                {/* Translation Controls */}
                <div className="flex flex-col sm:flex-row items-center mb-3 mt-2 gap-2">
                  <select
                    value={message.targetLanguage}
                    onChange={(e) => handleTargetLanguageChange(index, e.target.value)}
                    className="w-full sm:w-auto border border-gray-300 rounded-md px-2 py-1 text-sm"
                    disabled={message.translationStatus === "Translating..."}
                  >
                    <option value="en">English (en)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="ru">Russian (ru)</option>
                    <option value="tr">Turkish (tr)</option>
                  </select>

                  <button
                    onClick={() => handleTranslate(index)}
                    disabled={message.translationStatus === "Translating..."}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm w-full sm:w-auto"
                  >
                    {message.translationStatus || "Translate"}
                  </button>
                </div>

                {/* Translation Result */}
                {message.translatedText && (
                  <div className="bg-green-100 p-3 rounded-md border-l-2 border-green-500">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Translated to {message.targetLanguage}:
                    </p>
                    <p className="text-sm text-gray-700">{message.translatedText}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-2 absolute bottom-4 sm:bottom-10 left-0 right-0 px-4 sm:px-10">
            <textarea
              className="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none w-full sm:w-auto"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
            />
            <button
              onClick={handleSend}
              className="bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors w-full sm:w-auto"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trail;