import FAQ from "../models/FAQ.js";
import { createEmbedding, cosineSimilarity, getOpenAI } from "../utils/openai.js";

function extractJson(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function generateFAQs(req, res, next) {
  try {
    const { topic, count = 5 } = req.body;
    const safeCount = Math.min(Math.max(Number(count) || 5, 1), 10);

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ success: false, message: "topic is required." });
    }

    const openai = getOpenAI();
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions:
        "You generate concise factual FAQ content. Return only valid JSON. " +
        'Format: {"faqs":[{"question":"...","answer":"...","category":"...","tags":["..."]}]}',
      input: `Generate ${safeCount} useful FAQs about: ${topic}`
    });

    const parsed = extractJson(response.output_text);

    if (!Array.isArray(parsed.faqs)) {
      return res.status(502).json({ success: false, message: "AI returned an unexpected format." });
    }

    res.json({ success: true, data: parsed.faqs.slice(0, safeCount) });
  } catch (err) {
    next(err);
  }
}

export async function askAssistant(req, res, next) {
  try {
    const { question } = req.body;
    if (!question || !String(question).trim()) {
      return res.status(400).json({ success: false, message: "question is required." });
    }

    const queryEmbedding = await createEmbedding(question);
    if (!queryEmbedding.length) {
      return res.status(503).json({
        success: false,
        message: "OPENAI_API_KEY is required for AI answers."
      });
    }

    const faqs = await FAQ.find().select("+embedding").limit(500);

    const contextFAQs = faqs
      .filter((faq) => faq.embedding?.length)
      .map((faq) => ({
        faq,
        similarity: cosineSimilarity(queryEmbedding, faq.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(({ faq }) => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join("\n\n");

    if (!contextFAQs) {
      return res.status(404).json({
        success: false,
        message: "No FAQ knowledge is available yet."
      });
    }

    const openai = getOpenAI();
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions:
        "Answer using only the supplied FAQ context. If the answer is not supported by the context, " +
        'say: "I could not find that information in the FAQ knowledge base." Keep the answer concise.',
      input: `FAQ CONTEXT:\n${contextFAQs}\n\nUSER QUESTION:\n${question}`
    });

    res.json({
      success: true,
      question,
      answer: response.output_text
    });
  } catch (err) {
    next(err);
  }
}
