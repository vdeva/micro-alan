import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Route Handler for POST requests
export async function POST(request: NextRequest) {
  // Extract the request body
  const { subject } = await request.json();

  console.log(subject);

  if (!subject) {
    return NextResponse.json(
      { success: false, error: "Subject is required" },
      { status: 400 },
    );
  }

  const prompt = `You are calling Dr. William Peoc'h to make an appointment on behalf of John. Let the doctor know you are calling on behalf of John. You need to convey to this doctor the following information:\n\n\n`;

  // Headers for the Bland.ai API request
  const headers = {
    Authorization: process.env.BLAND,
  };

  // Data to send to Bland.ai API
  const data = {
    phone_number: "+33666189377",
    from: null,
    task: prompt + subject,
    model: "enhanced",
    language: "en",
    voice: "nat",
    voice_settings: {},
    pathway_id: null,
    local_dialing: false,
    max_duration: 12,
    answered_by_enabled: false,
    wait_for_greeting: false,
    record: false,
    amd: false,
    interruption_threshold: 100,
    voicemail_message: null,
    temperature: null,
    transfer_phone_number: null,
    transfer_list: {},
    metadata: {},
    pronunciation_guide: [],
    start_time: null,
    request_data: {},
    tools: [],
    dynamic_data: [],
    analysis_preset: null,
    analysis_schema: {},
    webhook: null,
    calendly: {},
  };

  const apiResponse = await axios.post(
    "https://us.api.bland.ai/v1/calls",
    data,
    { headers },
  );
  console.log("Bland.ai response:", apiResponse.data);

  // Return a successful response
  return NextResponse.json({
    success: true,
    message: "API request successful",
  });
}
