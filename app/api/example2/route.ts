import { streamText } from 'ai';
import { mistral } from '@ai-sdk/mistral';

// Fonction qui traite les requêtes POST
export async function POST(req: Request) {
  try {
    // Afficher le contenu de la requête pour déboguer
    const body = await req.json();
    console.log('Requête reçue avec le corps suivant :', body);
    
    const { text, image } = body;

    if (!text && !image) {
      throw new Error('Aucun texte ni image fournis');
    }

    // Construction du message à envoyer à l'API
    const messages = [];
    if (text) {
      messages.push({ type: 'text', text });
    }
    if (image) {
      try {
        messages.push({ type: 'image', image: new URL(image) });
      } catch (error) {
        console.error('Erreur lors de la conversion de l\'URL de l\'image :', error);
        throw new Error('URL d\'image invalide');
      }
    }

    console.log('Messages envoyés au modèle :', messages);

    // Appel à l'API de streamText avec le modèle Mistral et les messages
    const response = await streamText({
      model: mistral('pixtral-12b-2409'),
      messages: [
        { role: 'user', content: messages },  // Envoi du texte et de l'image
      ],
    });

    // Conversion de la réponse en flux de texte
    const yes = await response.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });

    return yes;  // Renvoi de la réponse
  } catch (error) {
    // Journalisation de l'erreur pour déboguer
    console.error('Erreur lors de la génération de la réponse :', error);

    return new Response(JSON.stringify({ error: 'Erreur lors de la génération de la réponse' }), {
      status: 500,
    });
  }
}
