import { streamText } from "ai";
import { mistral } from "@ai-sdk/mistral";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Requête reçue avec le corps suivant :", body);

    const { text, image, history } = body;

    if (!text && !image && (!history || history.length === 0)) {
      throw new Error("Aucun texte, image, ou historique fourni");
    }

    // Construction des messages à envoyer à l'API
    const messages = [
      {
        role: "system",
        content:
          "Act as a general practicioner. You need to help the person in front of you. The person in front of you is named John. If the patient have a problem that can be visualized ask him to take a picture to show you. Be concise, send a message sentence by sentence, dont send a paragraph. Everytime you have an image you have to react about it, if you see nothing that correlates to health describe the picture. If the person seems to be in really poor condition or in need of more urgent help, MAKE SURE TO WRITE 'increased risk' and then include the reasons why you think the person is at risk in bullet points.",
      },
    ];

    // Ajouter l'historique des messages
    history.forEach((msg: { text: string; from: string }) => {
      messages.push({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text,
      });
    });

    // Ajouter le nouveau message de l'utilisateur
    if (text) {
      messages.push({ role: "user", content: text });
    }
    if (image) {
      try {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: "Here is an image:" },
            { type: "image", image: "data:image/webp;base64" + image },
          ],
        });
      } catch (error) {
        console.error(
          "Erreur lors de la conversion de l'URL de l'image :",
          error,
        );
        throw new Error("URL d'image invalide");
      }
    }

    console.log("Messages envoyés au modèle :", messages);

    // Appel à l'API de streamText avec le modèle Mistral et les messages
    const response = await streamText({
      model: mistral("pixtral-12b-2409"),
      messages,
    });

    // Conversion de la réponse en flux de texte
    const streamResponse = await response.toTextStreamResponse({
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

    return streamResponse;
  } catch (error) {
    console.error("Erreur lors de la génération de la réponse :", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération de la réponse" }),
      {
        status: 500,
      },
    );
  }
}
