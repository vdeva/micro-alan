import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { query } = await request.json();

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Response("Server Error", { status: 500 });
  }

  const placesRes = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "en",
      }),
    },
  );

  if (!placesRes.ok) {
    throw new Response("Server Error", { status: 500 });
  }

  const data = await placesRes.json();

  const filteredData = {
    ...data,
    places: data.places.filter((place: any) => place.internationalPhoneNumber),
  };

  return Response.json(filteredData);
}
