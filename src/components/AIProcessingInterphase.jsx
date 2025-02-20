import { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png";
import user from "../assets/user.jpeg";

function Trail() {
  // Each message now is an object with additional fields.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Function to handle sending a message and performing language detection.
 const handleSend = async () => {
  if (input.trim() !== "") {
    const newMessage = {
      text: input.trim(),
      type: "sent",
      detectedLanguage: "",
      summary: "",
      translatedText: "",
      targetLanguage: "en",
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");

    // Use the Language Detector API to detect the message language.
    if ("ai" in self && "languageDetector" in self.ai) {
      const detector = await self.ai.languageDetector.create();
      const langData = await detector.detect(newMessage.text);
      const detectedLang = langData.detectedLanguage; // extract the language string
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1].detectedLanguage = detectedLang;
        return updatedMessages;
      });
    }
  }
};

  // Allow sending a message by pressing Enter.
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll to the bottom whenever a new message is added.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to handle summarization using the Summarizer API.
  const handleSummarize = async (index) => {
    const message = messages[index];
    if ("ai" in self && "summarizer" in self.ai) {
      const summarizer = await self.ai.summarizer.create();
      const summary = await summarizer.summarize(message.text);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index].summary = summary;
        return updatedMessages;
      });
    }
  };

  // Function to handle translation using the Translator API.
  const handleTranslate = async (index) => {
    const message = messages[index];
    if ("ai" in self && "translator" in self.ai) {
      // Create a translator using the detected language (or default to English)
      // as the source and the selected language as the target.
      const translator = await self.ai.translator.create({
        sourceLanguage: message.detectedLanguage || "en",
        targetLanguage: message.targetLanguage,
      });
      const translatedText = await translator.translate(message.text);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index].translatedText = translatedText;
        return updatedMessages;
      });
    }
  };

  return (
    <>
      <div className="container flex m-auto bg-indigo-100 justify-center w-screen h-screen py-20">
        <div className="holder bg-indigo-300 w-full h-full mx-11 my-11 rounded-3xl">
          <nav className="w-5/6 h-16 text-center bg-blck m-auto my-5 flex justify-between items-center">
            {/* Logo */}
            <div className="w-14 h-14">
              <img src={logo} alt="Logo" />
            </div>
            {/* Nav title */}
            <div>
              <p className="text-center text-lg text-gray-700">
                AI-Powered Text Processor
              </p>
            </div>
            {/* User */}
            <div className="w-12 h-12 ">
              <img src={user} alt="User" className="object-contain rounded-3xl" />
            </div>
          </nav>

          {/* Main content area */}
          <div className="w-full h-[86%] bg-white rounded-3xl p-12 relative px-10">
            <div className="absolute left-[45%] top-[-2%]">
              <p className="bg-indigo-300 rounded-3xl text-gray-700">Today</p>
            </div>

            {/* Message list */}
            <div className="h-[80%] overflow-y-auto mb-16">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`${
                    message.type === "sent"
                      ? "bg-indigo-300 rounded-ee"
                      : "bg-indigo-400 rounded-bl"
                  } w-[100%] p-5 justify-start items-end rounded-3xl mb-6`}
                >
                  {/* Original text */}
                  <p className="w-[80%]">{message.text}</p>

                  {/* Detected language */}
                  <p className="text-sm text-gray-500">
                    Detected language:{" "}
                    {message.detectedLanguage ? message.detectedLanguage : "detecting..."}
                  </p>

                  {/* Render Summarize button if text exceeds 150 characters */}
                  {message.text.length > 150 && (
                    <button
                      onClick={() => handleSummarize(index)}
                      className="bg-blue-500 text-white px-2 py-1 rounded mt-2"
                    >
                      Summarize
                    </button>
                  )}

                  {/* Show summary result if available */}
                  {message.summary && (
                    <p className="text-sm text-gray-600 mt-2">
                      Summary: {message.summary}
                    </p>
                  )}

                  {/* Translation section */}
                  <div className="mt-2">
                    <select
                      value={message.targetLanguage}
                      onChange={(e) => {
                        const newTarget = e.target.value;
                        setMessages((prevMessages) => {
                          const updatedMessages = [...prevMessages];
                          updatedMessages[index].targetLanguage = newTarget;
                          return updatedMessages;
                        });
                      }}
                      className="border rounded p-1 mr-2"
                    >
                      <option value="en">English (en)</option>
                      <option value="pt">Portuguese (pt)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="ru">Russian (ru)</option>
                      <option value="tr">Turkish (tr)</option>
                      <option value="fr">French (fr)</option>
                    </select>
                    <button
                      onClick={() => handleTranslate(index)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Translate
                    </button>
                  </div>

                  {/* Display translated text if available */}
                  {message.translatedText && (
                    <p className="text-sm text-gray-600 mt-2">
                      Translated: {message.translatedText}
                    </p>
                  )}
                </div>
              ))}
              {/* Dummy element to ensure scrolling to bottom */}
              <div ref={chatEndRef} />
            </div>

            {/* Input and send button */}
            <div className="flex items-center w-[100%] gap-10 p-2 absolute bottom-10">
              <textarea
                type="text"
                className="w-[65%] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                onClick={handleSend}
                className="bg-indigo-400 text-white px-4 py-2 rounded-md hover:bg-indigo-600"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Trail;
