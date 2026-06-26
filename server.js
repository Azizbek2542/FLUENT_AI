require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*", methods: ["POST", "GET"] }));
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.post("/chat", async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: "Пустое сообщение" });

        const contents = [];
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === "assistant" ? "model" : "user",
                    parts: [{ text: msg.text }]
                });
            });
        }
        contents.push({ role: "user", parts: [{ text: message }] });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ 
                            text: "Ты Aria — AI-преподаватель английского на платформе FLUENT. Отвечай на русском языке, если студент пишет по-русски. Исправляй грамматические ошибки мягко и объясняй правила простым языком. Веди живой диалог, задавай вопросы, поощряй прогресс." 
                        }]
                    },
                    contents: contents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                })
            }
        );

        // CHANGED: если Gemini вернул 429 — проксируем его клиенту
        if (!response.ok) {
            const errBody = await response.text();
            console.error("❌ Gemini ошибка:", response.status, errBody);

            if (response.status === 429) {
                return res.status(429).json({ 
                    error: "rate_limit", 
                    message: "Лимит запросов исчерпан." 
                });
            }

            return res.status(500).json({ 
                error: "api_error", 
                message: "Ошибка Gemini API" 
            });
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text 
            || "AI не смог сгенерировать ответ";

        res.json({ reply });

    } catch (err) {
        console.error("❌ Ошибка:", err);
        res.status(500).json({ error: "server_error", message: err.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`✅ Gemini сервер: http://localhost:${process.env.PORT}`);
});
