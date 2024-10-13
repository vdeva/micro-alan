import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

// Route Handler for POST requests
export async function POST(request: NextRequest) {
  // Extract any incoming request body (if needed)
  const { imageUrl, prompt } = await request.json();

  // console.log(imageUrl)

  if (!imageUrl) {
    return NextResponse.json(
      { success: false, error: "Image URL is required" },
      { status: 400 },
    );
  }

  // Fallback to provided data if none is passed in the request
  const response = await client.chat.complete({
    model: "pixtral-12b",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            imageUrl: imageUrl,
          },
        ],
      },
    ],
  });

  console.log(
    response.choices ? response.choices[0].message.content : "empty content",
  );

  // Send the response back as JSON
  return NextResponse.json({
    success: true,
    response: response.choices
      ? response.choices[0].message.content
      : "empty content",
  });
}
