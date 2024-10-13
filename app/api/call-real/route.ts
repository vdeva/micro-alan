import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Route Handler for POST requests
export async function POST(request: NextRequest) {
  // Extract the request body
  const { subject, phoneNumber } = await request.json();

  console.log(subject);
  console.log(phoneNumber);

  if (!subject || !phoneNumber) {
    return NextResponse.json(
      { success: false, error: "Subject & phone number is required" },
      { status: 400 },
    );
  }

  // Headers for the Bland.ai API request
  const headers = {
    Authorization: process.env.BLAND,
  };

  // Data to send to Bland.ai API
  const data = {
    phone_number: phoneNumber,
    from: null,
    task: subject,
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
