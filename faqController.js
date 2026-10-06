import FAQ from "../models/FAQ.js";
import { createEmbedding, cosineSimilarity } from "../utils/openai.js";

export async function createFAQ(req, res, next) {
  try {
    const { question, answer, category = "General", tags = [] } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "question and answer are required."
      });
    }

    const embedding = await createEmbedding(`${question}\n${answer}`);

    const faq = await FAQ.create({
      question,
      answer,
      category,
      tags,
      embedding,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: faq });
  } catch (err) {
    next(err);
  }
}

export async function getFAQs(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const [items, total] = await Promise.all([
      FAQ.find(filter)
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FAQ.countDocuments(filter)
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: items
    });
  } catch (err) {
    next(err);
  }
}

export async function getFAQ(req, res, next) {
  try {
    const faq = await FAQ.findById(req.params.id).populate("createdBy", "name");
    if (!faq) return res.status(404).json({ success: false, message: "FAQ not found." });

    res.json({ success: true, data: faq });
  } catch (err) {
    next(err);
  }
}

export async function updateFAQ(req, res, next) {
  try {
    const faq = await FAQ.findById(req.params.id).select("+embedding");
    if (!faq) return res.status(404).json({ success: false, message: "FAQ not found." });

    if (faq.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed." });
    }

    const allowed = ["question", "answer", "category", "tags"];
    for (const field of allowed) {
      if (req.body[field] !== undefined) faq[field] = req.body[field];
    }

    if (req.body.question !== undefined || req.body.answer !== undefined) {
      faq.embedding = await createEmbedding(`${faq.question}\n${faq.answer}`);
    }

    await faq.save();

    const result = faq.toObject();
    delete result.embedding;

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function deleteFAQ(req, res, next) {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ success: false, message: "FAQ not found." });

    if (faq.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed." });
    }

    await faq.deleteOne();
    res.json({ success: true, message: "FAQ deleted." });
  } catch (err) {
    next(err);
  }
}

export async function textSearch(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter q is required." });
    }

    const data = await FAQ.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function semanticSearch(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter q is required." });
    }

    const queryEmbedding = await createEmbedding(q);
    if (!queryEmbedding.length) {
      return res.status(503).json({
        success: false,
        message: "OPENAI_API_KEY is required for semantic search."
      });
    }

    const faqs = await FAQ.find().select("+embedding").limit(500);

    const ranked = faqs
      .filter((faq) => faq.embedding?.length)
      .map((faq) => ({
        faq,
        similarity: cosineSimilarity(queryEmbedding, faq.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(({ faq, similarity }) => ({
        id: faq._id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags,
        similarity: Number(similarity.toFixed(4))
      }));

    res.json({ success: true, query: q, data: ranked });
  } catch (err) {
    next(err);
  }
}
