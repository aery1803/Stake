const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Groq API Configuration
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Store logs (optional)
let logs = [];

// Route to handle console logs from browser
app.post("/log", async (req, res) => {
  const { message, level = "log" } = req.body;
  if (message[0] === "Start") {
    logs = [];
    console.log("Starting new log session:", message);
  }
  // Save log (optional)
  logs.push({ message, level, timestamp: new Date() });
  // console.log(`[Browser ${level.toUpperCase()}]`, message);
  // console.log("Logs:0000000");
  try {
    console.log(message[0], "----");
    let groqResponse;
    if (message[0] === "end") {
      console.log("Sending to Groq API:", message[0]);
      groqResponse = await axios.post(
        GROQ_API_URL,
        {
          model: "deepseek-r1-distill-llama-70b",
          messages: [
            {
              role: "user",
              content: `Analyze this browser console this data is from a betting game u need to analyse this data and give a summarized statistics with values for next bets thaat will fetch me least loss and maximum profit ${level}: ${JSON.stringify(
                logs
              )}`,
            },
          ],
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        "Groq Response:",
        groqResponse.data.choices[0].message.content
      );
      res.status(200).json({
        status: "Log processed by Groq!",
        groqResponse: groqResponse.data,
      });
    }
  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to call Groq API" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
