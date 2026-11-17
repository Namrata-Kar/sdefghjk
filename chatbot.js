const express = require("express");

const router = express.Router();

router.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || message.trim() === "") {
            return res.status(400).json({
                success: false,
                reply: "Please send a valid message."
            });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            const cleanedMessage = message.trim().toLowerCase();

            if (cleanedMessage.includes("temp") || cleanedMessage.includes("temperature") || cleanedMessage.includes("water")) {
                return res.status(200).json({
                    success: true,
                    reply: "I am the local water monitoring assistant. Please check the sensor readings from the dashboard. If the temperature, pH, or TDS is out of range, the server will alert you automatically."
                });
            }

            return res.status(200).json({
                success: true,
                reply: "I’m ready to help with your water quality monitoring system. Add your OpenAI API key to enable AI responses."
            });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant for a water quality monitoring system. Keep answers short, practical, and focused on water quality, sensor status, pH, TDS, and temperature."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI error:", errorText);
            return res.status(502).json({
                success: false,
                reply: "The AI service is unavailable right now. Please try again later."
            });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return res.status(500).json({
                success: false,
                reply: "No AI response was returned."
            });
        }

        return res.status(200).json({
            success: true,
            reply
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return res.status(500).json({
            success: false,
            reply: "Something went wrong while processing your request."
        });
    }
});

module.exports = router;
