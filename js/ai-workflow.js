/**
 * OrderFlow AI Workflow System
 * Håndterer AI-drevet kundeservice workflows
 */

const AIWorkflow = {
  // AI System Prompt Template
  systemPrompt: `Du er en professionel AI-assistent for {{restaurant_navn}}, en restaurant der tilbyder {{cuisine_type}}. Din rolle er at hjælpe kunder via SMS, Instagram, Facebook Messenger og telefon med en venlig, effektiv og salgsorienteret tilgang.

## DIN KERNEOPGAVE
Uanset hvilken besked du modtager, skal du:
1. Forstå kundens intention (også hvis den er uklar)
2. Guide kunden mod en handling (bestilling, booking, information)
3. Indsamle nødvendige oplysninger trin-for-trin
4. Bekræfte og afslutte interaktionen professionelt

## HÅNDTERING AF UKENDTE BESKEDER
Når du modtager en besked du ikke umiddelbart forstår:
- Antag altid positiv intention
- Gæt kvalificeret på kundens behov baseret på kontekst
- Stil ét afklarende spørgsmål ad gangen
- Tilbyd de mest sandsynlige muligheder

Eksempel på ukendt besked: "hej kan i noget i aften"
→ Svar: "Hej! 😊 Selvfølgelig kan vi hjælpe dig i aften! Ønsker du at:
1️⃣ Bestille mad til afhentning/levering
2️⃣ Reservere et bord
Bare skriv 1 eller 2, så guider jeg dig videre!"

## WORKFLOWS

### 📦 BESTILLING (Take-away/Levering)
Indsaml i denne rækkefølge:
1. Hvad vil kunden bestille? (tilbyd menukort-link hvis usikker)
2. Afhentning eller levering?
3. Hvis levering: Adresse + postnummer
4. Ønsket tidspunkt
5. Navn + telefonnummer
6. Betalingsmetode (MobilePay/kontant/kort ved afhentning)

Bekræft altid med komplet ordresammenfatning før afslutning.

### 🍽️ BORDRESERVATION
Indsaml i denne rækkefølge:
1. Dato og tidspunkt
2. Antal personer
3. Særlige ønsker (barnestol, allergier, anledning)
4. Navn + telefonnummer

Bekræft med alle detaljer og tilbyd at tilføje en forudbestilling.

### 💳 BETALING
- Forklar tilgængelige betalingsmuligheder
- Send betalingslink når relevant: {{payment_link}}
- Bekræft modtaget betaling
- Ved problemer: Tilbyd alternativ eller eskalér til personale

### ⭐ ANMELDELSER
Når en kunde udtrykker tilfredshed:
- Tak oprigtigt
- Bed om anmeldelse på Google/Trustpilot med direkte link
- Tilbyd evt. lille incitament (rabatkode til næste besøg)

Ved utilfredshed:
- Undskyld oprigtigt
- Spørg ind til hvad der gik galt
- Tilbyd løsning (refundering, ny levering, rabat)
- Eskalér til {{manager_kontakt}} hvis nødvendigt

### ⏰ ÅBNINGSTIDER & INFO
Åbningstider: {{åbningstider}}
Adresse: {{adresse}}
Leveringsområde: {{leveringsområde}}
Min. ordrebeløb for levering: {{min_ordre}}
Leveringsgebyr: {{leveringsgebyr}}

## KOMMUNIKATIONSSTIL
- Brug emojis sparsomt men venligt (1-2 per besked)
- Hold beskeder korte og scanbare
- Brug nummererede valg når der er flere muligheder
- Svar altid inden for samtalens kontekst
- Vær proaktiv med mersalg ("Vil du have tilbehør til?")

## ESKALERING
Eskalér til menneskeligt personale når:
- Kunden udtrykker frustration 2+ gange
- Kunden eksplicit beder om at tale med en person
- Komplekse klager eller refunderingskrav
- Spørgsmål uden for dit vidensområde

Eskaleringsbesked: "Jeg sætter dig i kontakt med vores personale, som kan hjælpe dig bedre. Du hører fra os inden for {{response_time}} 🙏"`,

  // Default variables
  defaultVariables: {
    restaurant_navn: 'Min Restaurant',
    cuisine_type: 'italiensk mad',
    payment_link: 'https://pay.orderflow.ai',
    menu_link: 'https://menu.orderflow.ai',
    åbningstider: 'Man-Søn: 11:00-22:00',
    adresse: 'Eksempelvej 1, 2100 København',
    leveringsområde: '2100, 2200, 2300',
    min_ordre: '150 kr',
    leveringsgebyr: '35 kr',
    manager_kontakt: 'kontakt@restaurant.dk',
    response_time: '30 minutter'
  },

  // Intent classification
  intents: {
    ORDER_FOOD: {
      keywords: ['bestille', 'bestilling', 'ordre', 'mad', 'menu', 'pizza', 'burger', 'take away', 'takeaway', 'levering', 'afhent'],
      confidence: 0.8
    },
    BOOK_TABLE: {
      keywords: ['bord', 'reservation', 'reserve', 'book', 'plads', 'sidde', 'spise'],
      confidence: 0.8
    },
    CHECK_HOURS: {
      keywords: ['åben', 'lukket', 'åbningstid', 'hvornår', 'tider', 'åbner', 'lukker'],
      confidence: 0.9
    },
    CHECK_MENU: {
      keywords: ['menu', 'menukort', 'ret', 'retter', 'tilbud', 'hvad har i'],
      confidence: 0.85
    },
    TRACK_ORDER: {
      keywords: ['hvor er', 'status', 'ordre', 'levering', 'når kommer', 'hvor længe'],
      confidence: 0.8
    },
    COMPLAINT: {
      keywords: ['klage', 'dårlig', 'utilfreds', 'problem', 'forkert', 'mangler', 'kold'],
      confidence: 0.9
    },
    PRAISE: {
      keywords: ['god', 'dejlig', 'fantastisk', 'super', 'lækker', 'tilfreds', 'tak'],
      confidence: 0.7
    },
    PAYMENT: {
      keywords: ['betale', 'betaling', 'mobilepay', 'kort', 'kontant', 'pris'],
      confidence: 0.85
    },
    GENERAL_QUESTION: {
      keywords: ['hvordan', 'hvad', 'hvor', 'kan jeg', 'er det muligt'],
      confidence: 0.5
    }
  },

  /**
   * Klassificer kundens intention fra besked
   */
  classifyIntent(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = { intent: 'UNCLEAR', confidence: 0.0, entities: {} };

    for (const [intentName, intentData] of Object.entries(this.intents)) {
      let matchCount = 0;
      const matchedKeywords = [];

      for (const keyword of intentData.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      }

      if (matchCount > 0) {
        const confidence = (matchCount / intentData.keywords.length) * intentData.confidence;
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: intentName,
            confidence: confidence,
            entities: { matchedKeywords }
          };
        }
      }
    }

    return bestMatch;
  },

  /**
   * Hent system prompt med udfyldte variabler
   */
  getSystemPrompt(variables = {}) {
    const mergedVars = { ...this.defaultVariables, ...variables };
    let prompt = this.systemPrompt;

    for (const [key, value] of Object.entries(mergedVars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(regex, value);
    }

    return prompt;
  },

  /**
   * Gem variabler til localStorage
   */
  saveVariables(variables) {
    localStorage.setItem('orderflow_ai_variables', JSON.stringify(variables));
    console.log('AI variables saved:', variables);
  },

  /**
   * Hent gemte variabler fra localStorage
   */
  loadVariables() {
    const saved = localStorage.getItem('orderflow_ai_variables');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load AI variables:', e);
        return this.defaultVariables;
      }
    }
    return this.defaultVariables;
  },

  /**
   * Pre-definerede workflow nodes
   */
  workflowTemplates: {
    orderFood: {
      id: 'order-food-template',
      module: 'restaurant',
      name: '📦 Bestilling Workflow',
      description: 'Håndter madbestillinger (take-away/levering)',
      nodes: [
        { type: 'trigger', label: 'Bestilling Start', data: { trigger: 'ORDER_FOOD' } },
        { type: 'message', label: 'Velkomst', data: { text: 'Hej! 😊 Hvad vil du gerne bestille? Se vores menu: {{menu_link}}' } },
        { type: 'collect', label: 'Indsaml Ordre', data: { field: 'order_items', prompt: 'Hvad vil du bestille?' } },
        { type: 'choice', label: 'Afhentning eller Levering?', data: { options: ['Afhentning', 'Levering'] } },
        { type: 'condition', label: 'Er det levering?', data: { field: 'delivery_type', equals: 'Levering' } },
        { type: 'collect', label: 'Indsaml Adresse', data: { field: 'address', prompt: 'Hvad er din adresse?' } },
        { type: 'collect', label: 'Tidspunkt', data: { field: 'time', prompt: 'Hvornår vil du have det?' } },
        { type: 'collect', label: 'Navn', data: { field: 'name', prompt: 'Hvad er dit navn?' } },
        { type: 'collect', label: 'Telefon', data: { field: 'phone', prompt: 'Hvad er dit telefonnummer?' } },
        { type: 'message', label: 'Bekræftelse', data: { text: '✅ Ordre bekræftet! Vi ser frem til at servere dig.' } }
      ]
    },
    bookTable: {
      id: 'book-table-template',
      module: 'restaurant',
      name: '🍽️ Bordreservation Workflow',
      description: 'Håndter bordreservationer',
      nodes: [
        { type: 'trigger', label: 'Reservation Start', data: { trigger: 'BOOK_TABLE' } },
        { type: 'message', label: 'Velkomst', data: { text: 'Hej! 😊 Lad os reservere et bord til dig.' } },
        { type: 'collect', label: 'Dato & Tid', data: { field: 'datetime', prompt: 'Hvilken dato og tidspunkt?' } },
        { type: 'collect', label: 'Antal Personer', data: { field: 'guests', prompt: 'Hvor mange personer?' } },
        { type: 'collect', label: 'Særlige Ønsker', data: { field: 'special', prompt: 'Nogle særlige ønsker? (allergier, barnestol, etc.)' } },
        { type: 'collect', label: 'Navn', data: { field: 'name', prompt: 'Hvad er dit navn?' } },
        { type: 'collect', label: 'Telefon', data: { field: 'phone', prompt: 'Hvad er dit telefonnummer?' } },
        { type: 'message', label: 'Bekræftelse', data: { text: '✅ Bord reserveret! Vi glæder os til at se dig.' } }
      ]
    },
    complaint: {
      id: 'complaint-template',
      module: 'restaurant',
      name: '😞 Klage Håndtering',
      description: 'Håndter kundeserviceklager',
      nodes: [
        { type: 'trigger', label: 'Klage Detekteret', data: { trigger: 'COMPLAINT' } },
        { type: 'message', label: 'Undskyldning', data: { text: 'Vi beklager meget! 😔 Fortæl os hvad der gik galt.' } },
        { type: 'collect', label: 'Problem Beskrivelse', data: { field: 'issue', prompt: 'Hvad er problemet?' } },
        { type: 'choice', label: 'Løsning', data: { options: ['Refundering', 'Ny Levering', 'Rabat på Næste'] } },
        { type: 'escalate', label: 'Eskalér til Manager', data: { contact: '{{manager_kontakt}}' } },
        { type: 'message', label: 'Afslutning', data: { text: 'Tak for din tålmodighed. Vi kontakter dig snarest!' } }
      ]
    },

    // =====================================================
    // HÅNDVÆRKER MODULE TEMPLATES
    // =====================================================
    'tilbud-request': {
      id: 'tilbud-request-template',
      module: 'haandvaerker',
      name: '📋 Tilbudsforespørgsel',
      description: 'Modtag og besvar tilbudsanmodninger automatisk',
      nodes: [
        { type: 'trigger', label: 'Ny Henvendelse', data: { trigger: 'QUOTE_REQUEST' } },
        { type: 'message', label: 'Velkomst', data: { text: 'Hej! 👋 Tak for din henvendelse til {{company_name}}. Hvad kan vi hjælpe med?' } },
        { type: 'collect', label: 'Opgavetype', data: { field: 'job_type', prompt: 'Hvilken type opgave drejer det sig om? (f.eks. VVS, el, tømrer, maler)' } },
        { type: 'collect', label: 'Beskrivelse', data: { field: 'description', prompt: 'Beskriv opgaven kort - hvad skal laves?' } },
        { type: 'collect', label: 'Adresse', data: { field: 'address', prompt: 'Hvad er adressen hvor arbejdet skal udføres?' } },
        { type: 'collect', label: 'Ønsket tidspunkt', data: { field: 'preferred_time', prompt: 'Hvornår ønsker du arbejdet udført? (f.eks. hurtigst muligt, inden for 2 uger)' } },
        { type: 'collect', label: 'Kontaktinfo', data: { field: 'contact', prompt: 'Hvad er dit navn og telefonnummer?' } },
        { type: 'message', label: 'Bekræftelse', data: { text: '✅ Tak for din forespørgsel! Vi vender tilbage med et tilbud inden for 24 timer. Du vil modtage en SMS når tilbuddet er klar.' } }
      ]
    },
    'haandvaerker-booking': {
      id: 'haandvaerker-booking-template',
      module: 'haandvaerker',
      name: '📅 Tidsbestilling',
      description: 'Book tid til opgaveudførelse',
      nodes: [
        { type: 'trigger', label: 'Booking Start', data: { trigger: 'BOOKING' } },
        { type: 'message', label: 'Velkomst', data: { text: 'Hej! 📅 Lad os finde en tid der passer til din opgave hos {{company_name}}.' } },
        { type: 'collect', label: 'Opgavetype', data: { field: 'job_type', prompt: 'Hvilken type arbejde skal udføres?' } },
        { type: 'collect', label: 'Foretrukken dato', data: { field: 'preferred_date', prompt: 'Hvilken dag passer bedst? (f.eks. mandag d. 15., i næste uge)' } },
        { type: 'collect', label: 'Tidsrum', data: { field: 'timeframe', prompt: 'Foretrækker du formiddag (8-12) eller eftermiddag (12-16)?' } },
        { type: 'collect', label: 'Adresse', data: { field: 'address', prompt: 'Hvad er adressen?' } },
        { type: 'collect', label: 'Kontaktinfo', data: { field: 'contact', prompt: 'Dit navn og telefonnummer?' } },
        { type: 'message', label: 'Bekræftelse', data: { text: '✅ Perfekt! Vi har noteret din ønskede tid. Du vil modtage en bekræftelse inden for få timer. Vi ses!' } }
      ]
    },
    'followup': {
      id: 'followup-template',
      module: 'haandvaerker',
      name: '🔄 Opfølgning',
      description: 'Automatisk opfølgning på afgivne tilbud',
      nodes: [
        { type: 'trigger', label: 'Opfølgning Trigger', data: { trigger: 'FOLLOWUP', delay: '3 days' } },
        { type: 'message', label: 'Opfølgning', data: { text: 'Hej {{customer_name}}! 👋 Vi sendte dig et tilbud for et par dage siden. Har du haft mulighed for at kigge på det? Vi står klar til at svare på eventuelle spørgsmål.' } },
        { type: 'wait', label: 'Vent på svar', data: { timeout: 24, unit: 'hours' } },
        { type: 'condition', label: 'Svar modtaget?', data: { field: 'response_received' }, branches: [
          { label: 'Ja - interesseret', next: 'book_meeting' },
          { label: 'Ja - ikke interesseret', next: 'close_politely' },
          { label: 'Intet svar', next: 'final_followup' }
        ]},
        { type: 'message', label: 'Book møde', id: 'book_meeting', data: { text: 'Fantastisk! Skal vi aftale et tidspunkt hvor vi kan komme forbi og se på opgaven?' } },
        { type: 'message', label: 'Afslut høfligt', id: 'close_politely', data: { text: 'Det forstår vi godt. Tak fordi du overvejede os - hav en god dag! 😊' } },
        { type: 'message', label: 'Sidste opfølgning', id: 'final_followup', data: { text: 'Bare en venlig påmindelse om vores tilbud. Skriv endelig hvis du har spørgsmål - vi er her for at hjælpe! 🔧' } }
      ]
    }
  }
};

// Eksporter til global scope
window.AIWorkflow = AIWorkflow;

console.log('✅ AI Workflow System loaded');
