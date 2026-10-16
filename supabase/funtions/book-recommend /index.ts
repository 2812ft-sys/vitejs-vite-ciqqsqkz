import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookRow {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  condition: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "กรุณาระบุคำค้นหาหรือความสนใจ" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all books to give Gemini context
    const { data: books, error: dbError } = await supabase
      .from("books")
      .select("id, title, author, category, description, price, condition")
      .order("created_at", { ascending: false })
      .limit(100);

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "ไม่สามารถดึงข้อมูลหนังสือได้" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bookList = (books as BookRow[]).map(
      (b) => `- id:${b.id} | "${b.title}" by ${b.author} | หมวด:${b.category} | ราคา:${b.price}บาท | สภาพ:${b.condition} | ${b.description}`,
    ).join("\n");

    const { data: secretData, error: secretError } = await supabase
      .from("app_secrets")
      .select("key_value")
      .eq("key_name", "gemini_api_key")
      .maybeSingle();

    const apiKey = secretData?.key_value;

    if (!apiKey || secretError) {
      return new Response(
        JSON.stringify({ error: "ยังไม่ได้ตั้งค่า Gemini API Key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = `คุณเป็นผู้ช่วยแนะนำหนังสือมือสองในร้านหนังสือออนไลน์

ผู้ใช้สนใจ: "${query}"

นี่คือรายการหนังสือที่มีอยู่ในร้าน:
${bookList}

กรุณาแนะนำหนังสือที่เหมาะกับความสนใจของผู้ใช้ พร้อมอธิบายเหตุผลว่าทำไมถึงแนะนำเล่มนั้น

ส่งคำตอบในรูปแบบ JSON เท่านั้น ตามโครงสร้างนี้:
{
  "recommendations": [
    {
      "book_id": "uuid ของหนังสือ",
      "reason": "เหตุผลที่แนะนำเป็นภาษาไทย 1-2 ประโยค"
    }
  ],
  "summary": "สรุปคำแนะนำโดยรวมเป็นภาษาไทย 2-3 ประโยค"
}

แนะนำได้ไม่เกิน 5 เล่ม เลือกเฉพาะที่มีอยู่จริงในรายการด้านบน ถ้าไม่มีหนังสือที่เกี่ยวข้องเลย ให้ recommendations เป็น array ว่าง และอธิบายใน summary ว่าไม่พบหนังสือที่ตรงกับความสนใจ`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "ไม่สามารถเชื่อมต่อกับ AI ได้" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "AI ไม่สามารถสร้างคำแนะนำได้" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { recommendations: [], summary: text };
    }

    // Enrich recommendations with full book data
    const enrichedRecs = (parsed.recommendations || []).map((rec: { book_id: string; reason: string }) => {
      const book = (books as BookRow[]).find((b) => b.id === rec.book_id);
      return book ? { ...book, reason: rec.reason } : null;
    }).filter(Boolean);

    return new Response(
      JSON.stringify({
        recommendations: enrichedRecs,
        summary: parsed.summary || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "เกิดข้อผิดพลาดในระบบ" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
