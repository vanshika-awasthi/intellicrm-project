import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, prompt } = body;

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId parameter" }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // 1. Fetch relevant CRM context data
    // Fetch a manageable chunk of data to avoid context limit issues
    const contacts = await prisma.contact.findMany({
      where: { companyId },
      select: { name: true, type: true, email: true, leadScore: true },
      take: 50,
      orderBy: { updatedAt: 'desc' }
    });

    const activeOpportunities = await prisma.opportunity.findMany({
      where: { companyId, stage: { not: 'closed_lost' } },
      select: { title: true, stage: true, value: true, expectedClose: true },
      take: 50,
      orderBy: { value: 'desc' }
    });

    const openTickets = await prisma.ticket.findMany({
      where: { companyId, status: { in: ['open', 'in_progress'] } },
      select: { title: true, priority: true, status: true },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    const totalPipelineValue = activeOpportunities.reduce((sum, op) => sum + op.value, 0);

    const crmContextData = {
      summary: {
        totalContactsRecalculated: contacts.length,
        totalPipelineValue,
        activeDealsCount: activeOpportunities.length,
        openTicketsCount: openTickets.length,
      },
      contacts: contacts,
      deals: activeOpportunities,
      supportTickets: openTickets
    };

    // 2. Initialize Gemini API
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API Key is missing in server environment." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Construct the prompt
    const systemPrompt = `You are IntelliCRM's AI Database Analyst. Your goal is to analyze the provided CRM data and answer the user's question clearly and concisely.
Provide your response in Markdown. Use bullet points and bold text for easy reading. 

CRM Context Data:
${JSON.stringify(crmContextData, null, 2)}

User's Question:
${prompt}
`;

    // 4. Call Gemini
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    return NextResponse.json({ result: text });

  } catch (error: any) {
    console.error("[POST /api/ai-review]", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error or AI generation failed." },
      { status: 500 }
    );
  }
}
