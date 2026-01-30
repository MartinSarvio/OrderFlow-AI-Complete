// api/analyze.js
// Vercel Serverless Function for Restaurant Analysis using Claude AI

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { place_id, name, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Restaurant name is required' });
  }

  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (ANTHROPIC_API_KEY) {
      // Call Claude API for real analysis
      const analysis = await analyzeWithClaude(ANTHROPIC_API_KEY, name, address);
      return res.status(200).json(analysis);
    }

    // Fallback: Generate demo report
    const demoReport = generateDemoReport(name, address);
    return res.status(200).json(demoReport);

  } catch (error) {
    console.error('Analysis error:', error);
    // Return demo report on error
    const demoReport = generateDemoReport(name, address);
    return res.status(200).json(demoReport);
  }
}

async function analyzeWithClaude(apiKey, restaurantName, address) {
  const prompt = `Du er en ekspert i restaurant marketing og digital tilstedeværelse. Analysér følgende restaurant og generer en detaljeret rapport.

Restaurant: ${restaurantName}
Adresse: ${address || 'Danmark'}

Generer en JSON rapport med følgende struktur (svar KUN med valid JSON, ingen anden tekst):

{
  "business_name": "${restaurantName}",
  "address": "${address || 'Danmark'}",
  "score": <tal mellem 45-92>,
  "score_description": "<2-3 sætninger om restaurantens overordnede digitale tilstedeværelse>",
  "listings": [
    {"text": "<observation om Google My Business>", "status": "success|warning|danger"},
    {"text": "<observation om åbningstider>", "status": "success|warning|danger"},
    {"text": "<observation om billeder>", "status": "success|warning|danger"},
    {"text": "<observation om kontaktinfo>", "status": "success|warning|danger"}
  ],
  "competitors": [
    {"text": "<observation om konkurrenter i området>", "status": "success|warning|danger"},
    {"text": "<sammenligning af ratings>", "status": "success|warning|danger"},
    {"text": "<observation om anmeldelser vs konkurrenter>", "status": "success|warning|danger"},
    {"text": "<observation om menu differentiering>", "status": "success|warning|danger"}
  ],
  "reviews": [
    {"text": "<gennemsnitlig rating observation>", "status": "success|warning|danger"},
    {"text": "<positiv feedback tema>", "status": "success|warning|danger"},
    {"text": "<negativ feedback tema>", "status": "success|warning|danger"},
    {"text": "<observation om svar på anmeldelser>", "status": "success|warning|danger"}
  ],
  "website": [
    {"text": "<observation om mobilvenlig>", "status": "success|warning|danger"},
    {"text": "<observation om online bestilling>", "status": "success|warning|danger"},
    {"text": "<observation om hastighed>", "status": "success|warning|danger"},
    {"text": "<observation om menu online>", "status": "success|warning|danger"}
  ],
  "recommendations": [
    {"title": "<anbefaling 1 titel>", "description": "<detaljeret beskrivelse>"},
    {"title": "<anbefaling 2 titel>", "description": "<detaljeret beskrivelse>"},
    {"title": "<anbefaling 3 titel>", "description": "<detaljeret beskrivelse>"},
    {"title": "<anbefaling 4 titel>", "description": "<detaljeret beskrivelse>"},
    {"title": "<anbefaling 5 titel>", "description": "<detaljeret beskrivelse>"}
  ]
}

Vær realistisk og specifik. Brug danske termer. Giv actionable anbefalinger relateret til OrderFlow's services (online bestilling, SMS marketing, automatisering).`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  const data = await response.json();

  if (data.content && data.content[0] && data.content[0].text) {
    try {
      // Extract JSON from response
      let jsonText = data.content[0].text;
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json
?/g, '').replace(/```
?/g, '').trim();
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return generateDemoReport(restaurantName, address);
    }
  }

  return generateDemoReport(restaurantName, address);
}

function generateDemoReport(name, address) {
  const score = Math.floor(Math.random() * 35) + 50; // 50-85

  return {
    business_name: name,
    address: address || 'Danmark',
    score: score,
    score_description: `${name} har et ${score >= 70 ? 'godt' : 'acceptabelt'} fundament for digital tilstedeværelse, men der er muligheder for forbedring inden for online bestilling og kundeengagement.`,
    listings: [
      { text: 'Google My Business profil fundet', status: 'success' },
      { text: 'Åbningstider mangler på nogle platforme', status: 'warning' },
      { text: 'Billeder kunne opdateres (ældre end 6 måneder)', status: 'warning' },
      { text: 'Kontaktinformation er konsistent', status: 'success' }
    ],
    competitors: [
      { text: '3-5 konkurrenter inden for 500m radius', status: 'warning' },
      { text: 'Din gennemsnitlige rating er tæt på områdets gennemsnit', status: 'warning' },
      { text: 'Konkurrenter har flere online anmeldelser', status: 'danger' },
      { text: 'Din menu har potentiale for bedre differentiering', status: 'warning' }
    ],
    reviews: [
      { text: `${(Math.random() * 1 + 3.5).toFixed(1)} gennemsnitlig rating på Google`, status: score >= 70 ? 'success' : 'warning' },
      { text: 'Positiv feedback på mad kvalitet', status: 'success' },
      { text: 'Nogle klager over ventetid', status: 'warning' },
      { text: 'Kun 25% af anmeldelser besvaret', status: 'danger' }
    ],
    website: [
      { text: 'Website er mobilvenlig', status: 'success' },
      { text: 'Mangler online bestillingssystem', status: 'danger' },
      { text: 'Langsom indlæsningstid (4.2s)', status: 'warning' },
      { text: 'Menu er tilgængelig online', status: 'success' }
    ],
    recommendations: [
      {
        title: 'Implementér online bestilling',
        description: 'Tilføj et online bestillingssystem for at øge omsætningen med op til 30%. OrderFlow kan hjælpe dig med dette uden kommission.'
      },
      {
        title: 'Besvar alle anmeldelser',
        description: 'Svar på alle Google anmeldelser inden for 24 timer. Dette øger kundeloyalitet og forbedrer din synlighed i søgeresultater.'
      },
      {
        title: 'Opdater billeder månedligt',
        description: 'Upload nye, professionelle billeder af dine retter hver måned for at holde din profil frisk og tiltalende for nye kunder.'
      },
      {
        title: 'Optimer website hastighed',
        description: 'Reducer indlæsningstiden til under 3 sekunder. Hurtigere websites konverterer bedre og rangerer højere på Google.'
      },
      {
        title: 'Start SMS marketing',
        description: 'Brug SMS til at sende tilbud og påmindelser. SMS har 98% åbningsrate sammenlignet med 20% for email. OrderFlow tilbyder dette.'
      }
    ]
  };
}
