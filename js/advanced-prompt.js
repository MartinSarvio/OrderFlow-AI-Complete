/**
 * =====================================================
 * ORDERFLOW ADVANCED AI SYSTEM
 * =====================================================
 *
 * Omfattende AI-system til SMS-bestilling med:
 * - Komplet konteksthukommelse
 * - Robust dansk validering (adresse, navn, telefon)
 * - Tilbehør & ændringshåndtering
 * - Intelligent fejl-recovery
 *
 * @version 2.0.0
 * @author OrderFlow System
 */

// =====================================================
// CONVERSATION STATE MANAGER
// =====================================================

const ConversationStateManager = {
  conversations: new Map(),

  /**
   * Hent eller opret en conversation
   */
  getConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, this.createNewConversation(conversationId));
    }
    return this.conversations.get(conversationId);
  },

  /**
   * Opret ny conversation state
   */
  createNewConversation(conversationId) {
    return {
      id: conversationId,
      startTime: Date.now(),
      messages: [],
      customerData: {
        name: null,
        phone: null,
        address: {
          street: null,
          number: null,
          postal: null,
          city: null,
          fullAddress: null
        },
        orderItems: [],
        orderType: null, // 'DELIVERY' eller 'PICKUP'
        modifications: [],
        extras: []
      },
      currentPhase: 'FASE_0_HILSEN',
      validationAttempts: {
        address: 0,
        name: 0,
        phone: 0,
        order: 0
      },
      flags: {
        addressConfirmed: false,
        nameConfirmed: false,
        phoneConfirmed: false,
        orderConfirmed: false,
        deliveryTypeChosen: false
      },
      lastIntent: null,
      lastQuestionAsked: null
    };
  },

  /**
   * Tilføj besked til conversation history
   */
  addMessage(conversationId, role, content) {
    const conv = this.getConversation(conversationId);
    conv.messages.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Behold kun sidste 20 beskeder (memory optimization)
    if (conv.messages.length > 20) {
      conv.messages = conv.messages.slice(-20);
    }
  },

  /**
   * Opdater customer data
   */
  updateCustomerData(conversationId, field, value) {
    const conv = this.getConversation(conversationId);

    // Håndter nested fields (f.eks. "address.street")
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!conv.customerData[parent]) {
        conv.customerData[parent] = {};
      }
      conv.customerData[parent][child] = value;
    } else {
      conv.customerData[field] = value;
    }
  },

  /**
   * Opdater current phase
   */
  updatePhase(conversationId, newPhase) {
    const conv = this.getConversation(conversationId);
    conv.currentPhase = newPhase;
  },

  /**
   * Opdater flag
   */
  setFlag(conversationId, flagName, value) {
    const conv = this.getConversation(conversationId);
    conv.flags[flagName] = value;
  },

  /**
   * Get messages for OpenAI (formatted)
   */
  getMessagesForAI(conversationId, maxMessages = 10) {
    const conv = this.getConversation(conversationId);
    return conv.messages.slice(-maxMessages);
  },

  /**
   * Ryd conversation (efter ordre completion)
   */
  clearConversation(conversationId) {
    this.conversations.delete(conversationId);
  }
};

// =====================================================
// DANISH VALIDATION FUNCTIONS
// =====================================================

const DanishValidation = {
  /**
   * Validér dansk adresse
   * Kræver: vejnavn + husnummer + postnummer
   */
  validateAddress(addressString) {
    if (!addressString || addressString.trim().length < 3) {
      return {
        valid: false,
        complete: false,
        missing: ['vejnavn', 'husnummer', 'postnummer'],
        prompt: 'Jeg har brug for din fulde adresse med vejnavn, husnummer og postnummer.'
      };
    }

    const cleaned = addressString.trim();

    // Regex patterns
    const hasStreetName = /([a-zæøå]+(?:vej|gade|allé|stræde|torv|vænge|have|parken|plads|boulevard|parkering))/i.test(cleaned);
    const hasNumber = /\b\d+[a-z]?\b/i.test(cleaned);
    const hasPostal = /\b\d{4}\b/.test(cleaned);

    // Extract components
    let street = null, number = null, postal = null, city = null;

    if (hasStreetName) {
      const streetMatch = cleaned.match(/([a-zæøå]+(?:vej|gade|allé|stræde|torv|vænge|have|parken|plads|boulevard|parkering))/i);
      if (streetMatch) street = streetMatch[1];
    }

    if (hasNumber) {
      const numberMatch = cleaned.match(/\b(\d+[a-z]?)\b/i);
      if (numberMatch) number = numberMatch[1];
    }

    if (hasPostal) {
      const postalMatch = cleaned.match(/\b(\d{4})\b/);
      if (postalMatch) postal = postalMatch[1];
    }

    // Find city name (efter postnummer)
    if (postal) {
      const cityMatch = cleaned.match(/\d{4}\s+([a-zæøå\s]+)/i);
      if (cityMatch) city = cityMatch[1].trim();
    }

    // Validation levels
    const missing = [];
    if (!street) missing.push('vejnavn');
    if (!number) missing.push('husnummer');
    if (!postal) missing.push('postnummer');

    // Komplet adresse
    if (street && number && postal) {
      const fullAddress = city
        ? `${street} ${number}, ${postal} ${city}`
        : `${street} ${number}, ${postal}`;

      return {
        valid: true,
        complete: true,
        parsed: { street, number, postal, city },
        address: fullAddress,
        prompt: `Perfekt! Levering til ${fullAddress} ✓`
      };
    }

    // Delvis adresse - generer specifik prompt
    if (street && number && !postal) {
      return {
        valid: true,
        complete: false,
        missing: ['postnummer'],
        parsed: { street, number },
        prompt: `Hvad er postnummeret til ${street} ${number}?`
      };
    }

    if (street && !number) {
      return {
        valid: true,
        complete: false,
        missing: ['husnummer', 'postnummer'],
        parsed: { street },
        prompt: `Hvad er husnummeret på ${street}?`
      };
    }

    if (postal && !street) {
      return {
        valid: false,
        complete: false,
        missing: ['vejnavn', 'husnummer'],
        prompt: `Jeg har postnummeret (${postal}), men mangler vejnavn og husnummer.`
      };
    }

    // Ugyldig
    return {
      valid: false,
      complete: false,
      missing,
      prompt: 'Jeg kunne ikke læse adressen. Skriv venligst vejnavn, husnummer og postnummer (f.eks. "Hovedgaden 15, 2100 København").'
    };
  },

  /**
   * Validér dansk navn
   * Min 2 tegn, skal indeholde vokal
   */
  validateName(name) {
    if (!name || name.trim().length < 2) {
      return {
        valid: false,
        reason: 'TOO_SHORT',
        prompt: 'Kan jeg få dit fulde navn til bestillingen?'
      };
    }

    const cleaned = name.trim();

    // Skal indeholde vokal
    const vowels = /[aeiouyæøå]/i;
    if (!vowels.test(cleaned)) {
      return {
        valid: false,
        reason: 'NO_VOWEL',
        needsConfirmation: true,
        confirm: `Er navnet stavet ${cleaned.split('').join('-').toUpperCase()}?`
      };
    }

    // Check for suspici ous patterns
    const isSuspicious = /^[a-z]{1,3}$/i.test(cleaned) || /^\d/.test(cleaned);
    if (isSuspicious) {
      return {
        valid: true,
        needsConfirmation: true,
        name: this.capitalizeName(cleaned),
        prompt: `Jeg har noteret navnet som "${this.capitalizeName(cleaned)}". Er det korrekt?`
      };
    }

    // Gyldigt navn
    return {
      valid: true,
      name: this.capitalizeName(cleaned),
      prompt: `Tak ${this.capitalizeName(cleaned)}!`
    };
  },

  /**
   * Validér dansk telefonnummer
   * 8 cifre, accepter +45 prefix
   */
  validatePhone(phoneString) {
    if (!phoneString) {
      return {
        valid: false,
        reason: 'MISSING',
        prompt: 'Hvad er dit telefonnummer?'
      };
    }

    // Fjern mellemrum, +45 prefix, bindestreger
    const cleaned = phoneString.replace(/[\s\-]/g, '').replace(/^\+?45/, '');

    // Skal være 8 cifre
    if (/^\d{8}$/.test(cleaned)) {
      // Format: 22 33 44 55
      const formatted = cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      return {
        valid: true,
        phone: cleaned,
        formatted: formatted,
        prompt: `Tak! Telefon: ${formatted} ✓`
      };
    }

    // Indeholder bogstaver
    if (/[a-z]/i.test(phoneString)) {
      return {
        valid: false,
        reason: 'HAS_LETTERS',
        prompt: 'Telefonnummer må kun indeholde tal. Hvad er dit 8-cifrede mobilnummer?'
      };
    }

    // Forkert længde
    if (cleaned.length < 8) {
      return {
        valid: false,
        reason: 'TOO_SHORT',
        prompt: 'Det ser ud til at mangle nogle cifre. Dansk mobilnummer er 8 tal.'
      };
    }

    if (cleaned.length > 8) {
      return {
        valid: false,
        reason: 'TOO_LONG',
        prompt: `Det er lidt for langt - er det ${cleaned.substring(0, 8)}?`
      };
    }

    return {
      valid: false,
      reason: 'INVALID',
      prompt: 'Jeg kunne ikke læse telefonnummeret. Skriv venligst 8 cifre (f.eks. 22334455).'
    };
  },

  /**
   * Kapitalisér navn korrekt
   */
  capitalizeName(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
};

// =====================================================
// EXTRAS & MODIFICATIONS RECOGNIZER
// =====================================================

const ExtrasRecognizer = {
  /**
   * Genkend tilbehør og ændringer i besked
   */
  recognizeExtras(message, orderContext) {
    const msg = message.toLowerCase().trim();

    const patterns = {
      extraCheese: /ekstra ost|mere ost|dobbelt ost|extra cheese|ost ost/i,
      removeOnions: /uden løg|ingen løg|fjern løg|ikke løg/i,
      removeIngredient: /uden|ingen|fjern|ikke/i,
      addItem: /også|og|plus|tilføj|samt/i,
      changeItem: /skift|i stedet|ændre|bytter?/i,
      showExtrasMenu: /tilbehør|ekstra|menu/i
    };

    const result = {
      intent: null,
      modifications: [],
      updatedOrder: null,
      prompt: null,
      requiresClarification: false
    };

    // Ekstra ost
    if (patterns.extraCheese.test(msg)) {
      // Check hvis flere pizzas i ordre
      if (orderContext && orderContext.items && orderContext.items.length > 1) {
        result.intent = 'CLARIFY_WHICH_ITEM';
        result.requiresClarification = true;
        result.prompt = `Ekstra ost på hvilken pizza?\n${orderContext.items.map((item, i) => `${i + 1}️⃣ ${item.name}`).join('\n')}`;
        return result;
      } else if (orderContext && orderContext.items && orderContext.items.length === 1) {
        result.intent = 'ADD_EXTRA';
        result.modifications.push({
          type: 'extra',
          item: 'ost',
          price: 10,
          target: orderContext.items[0]
        });
        result.prompt = `Selvfølgelig! Ekstra ost (+10 kr) tilføjet til din ${orderContext.items[0].name}. 🧀`;
        return result;
      } else {
        result.intent = 'ADD_EXTRA';
        result.prompt = 'Ekstra ost noteret! (+10 kr) 🧀';
        return result;
      }
    }

    // Fjern løg
    if (patterns.removeOnions.test(msg)) {
      result.intent = 'REMOVE_INGREDIENT';
      result.modifications.push({
        type: 'remove',
        item: 'løg'
      });
      result.prompt = 'Noteret - ingen løg på din pizza ✓';
      return result;
    }

    // Vis tilbehør menu
    if (patterns.showExtrasMenu.test(msg) && !patterns.extraCheese.test(msg)) {
      result.intent = 'SHOW_EXTRAS_MENU';
      result.prompt = `Her er vores tilbehør 🍟\n\nEKSTRA TIL PIZZA:\n• Ekstra ost +10 kr\n• Ekstra topping +15 kr\n• Glutenfri bund +20 kr\n\nSIDES:\n• Pomfritter +25 kr\n• Hvidløgsbrød +20 kr\n• Salat +30 kr\n\nDRIKKEVARER:\n• Sodavand (0,5L) +20 kr\n• Øl +25 kr\n• Vand +15 kr\n\nHvad vil du tilføje?`;
      return result;
    }

    // Tilføj item
    if (patterns.addItem.test(msg)) {
      result.intent = 'ADD_ITEM';
      result.prompt = 'Hvad vil du tilføje til ordren?';
      return result;
    }

    // Skift item
    if (patterns.changeItem.test(msg)) {
      result.intent = 'CHANGE_ITEM';
      result.prompt = 'Hvad vil du ændre?';
      return result;
    }

    return result;
  },

  /**
   * Beregn opdateret pris efter modifications
   */
  calculateUpdatedPrice(orderItems, modifications) {
    let total = 0;

    orderItems.forEach(item => {
      total += item.price * (item.quantity || 1);
    });

    modifications.forEach(mod => {
      if (mod.type === 'extra' && mod.price) {
        total += mod.price;
      }
    });

    return total;
  }
};

// =====================================================
// ERROR RECOVERY MODULE
// =====================================================

const ErrorRecovery = {
  /**
   * Detect hvis kunde ikke svarer på spørgsmål
   */
  isNonAnswer(message, expectedType) {
    const nonAnswers = ['okay', 'ok', 'ja', 'nej', '.', 'xxx', 'hej', 'hmm', 'øh', 'uhh'];
    const msg = message.toLowerCase().trim();

    // For kort og meningsløst
    if (msg.length < 2 || nonAnswers.includes(msg)) {
      return true;
    }

    // Matcher ikke forventet type
    if (expectedType === 'address' && !(/\d/.test(message) || /vej|gade|allé/i.test(message))) {
      return true;
    }

    if (expectedType === 'name' && /^\d+$/.test(message)) {
      return true;
    }

    if (expectedType === 'phone' && !/\d{8}/.test(message.replace(/[\s\-\+]/g, ''))) {
      return true;
    }

    return false;
  },

  /**
   * Generer kontekstuel re-prompt
   */
  generateRePrompt(conversationState, expectedType, customerMessage) {
    const msg = customerMessage.toLowerCase().trim();
    const lastQuestion = conversationState.lastQuestionAsked || '';

    let response = '';

    // Delivery type
    if (expectedType === 'delivery_type') {
      if (msg.includes('pizza') || msg.includes('mad')) {
        response = `Noteret: ${customerMessage}! 🍕 Skal den leveres eller afhentes?`;
      } else if (msg === 'okay' || msg === 'ja') {
        response = `Jeg skal bruge at vide om du vil have levering eller afhentning 🚗`;
      } else {
        response = `Skal det leveres til dig, eller vil du hente det selv?`;
      }
      return response;
    }

    // Adresse
    if (expectedType === 'address') {
      const partialAddress = conversationState.customerData.address.street || 'adressen';

      if (msg === 'okay' || msg === 'ja') {
        response = `Jeg mangler stadig postnummeret til ${partialAddress} for at kunne levere 📍`;
      } else {
        response = `Jeg kunne ikke læse adressen. Skriv venligst:\n- Vejnavn\n- Husnummer\n- Postnummer`;
      }
      return response;
    }

    // Navn
    if (expectedType === 'name') {
      if (msg.length < 2) {
        response = `Jeg har brug for dit fulde navn til bestillingen 👤`;
      } else {
        response = `Kan jeg få dit navn til ordren?`;
      }
      return response;
    }

    // Telefon
    if (expectedType === 'phone') {
      response = `Hvad er dit telefonnummer (8 cifre)? 📱`;
      return response;
    }

    // Default
    return `Jeg forstod ikke helt. ${lastQuestion}`;
  },

  /**
   * Håndter edge cases (cancel, usikker, spam)
   */
  handleEdgeCase(message, conversationState) {
    const msg = message.toLowerCase().trim();

    // Cancel/stop
    if (/annuller|stop|glem det|vil ikke|drop|afbryd/i.test(msg)) {
      return {
        action: 'CANCEL',
        response: 'Ingen problem! Kontakt os igen når det passer dig bedre 👋'
      };
    }

    // Indecisive/unsure
    if (/ved ikke|usikker|måske|tænker|hmm/i.test(msg)) {
      return {
        action: 'HELP',
        response: 'Tag al den tid du har brug for! Vil du se vores menu eller skal jeg foreslå noget populært? 😊'
      };
    }

    // Spam/inappropriate
    if (msg.length > 500 || /(.)\1{10,}/.test(msg)) {
      return {
        action: 'SPAM',
        response: 'Jeg forstår ikke helt. Skriv gerne din besked igen, så hjælper jeg dig gerne!'
      };
    }

    // Emojis only
    if (/^[\u{1F300}-\u{1F9FF}\s]+$/u.test(msg) && msg.length < 10) {
      return {
        action: 'EMOJI_ONLY',
        response: 'Haha! 😄 Hvad kan jeg hjælpe dig med i dag?'
      };
    }

    return null;
  }
};

// =====================================================
// ADVANCED AI MAIN MODULE
// =====================================================

const AdvancedAI = {
  // Export sub-modules
  ConversationStateManager,
  validation: DanishValidation,
  extrasRecognizer: ExtrasRecognizer,
  errorRecovery: ErrorRecovery,

  /**
   * Komplet dansk system prompt
   * Implementerer ALLE scenarier fra brugerens specifikation
   */
  systemPrompt: `Du er en venlig og effektiv bestillingsassistent for {{restaurant_navn}}. Du håndterer ordrer via SMS med fokus på præcision og god kundeservice.

## GRUNDLÆGGENDE REGLER
1. Indsaml ALLE påkrævede oplysninger før du går videre
2. Validér HVER information inden næste trin
3. Gentag ALDRIG det samme spørgsmål uden at anerkende kundens svar
4. Forstå naturligt sprog og variationer
5. Bekræft ændringer eksplicit

## FASE 0: FØRSTE KONTAKT

Når kunde starter samtalen:
- "Hej" → "Hej! 😊 Velkommen til {{restaurant_navn}}. Vil du bestille mad i dag?"
- "Menu" → Send menu-link
- "Jeg vil bestille" → Start FASE 1 direkte
- Produktnavn direkte (f.eks. "2 margherita") → Acceptér ordre, spring velkomst over

## FASE 1: ORDREMODTAGELSE

Indsaml ordren:
- Accepter produktnavne, menu-numre, mængder
- "nummer 4" → Produkt #4 fra menu
- "3x4" → 3 styk af produkt #4
- "2 Pizza Margherita" → 2x Pizza Margherita

Genkend tilbehør/extra:
- "ekstra ost" → +10 kr per pizza
- "uden løg" → Fjern løg
- "tilbehør" → Vis tilbehør-menu

Tillad ændringer:
- "fjern den ene pizza" → Fjern fra ordre
- "skift til pepperoni" → Erstat item
- "jeg vil også have en cola" → Tilføj til ordre

Vis opdateret total efter hver ændring.

## FASE 2: LEVERINGSTYPE

Spørg: "Skal det leveres eller afhentes?"

Variationer:
- "Levering", "lever", "levere til mig" → DELIVERY
- "Afhentning", "hente", "kommer og henter" → PICKUP

Hvis kunde svarer noget andet (f.eks. "Pizza Margherita"):
→ "Noteret: Pizza Margherita! 🍕 Skal den leveres eller afhentes?"

## FASE 3: ADRESSE (KUN VED LEVERING)

Kræv KOMPLET adresse:
- Vejnavn (f.eks. "Stenstrupvej")
- Husnummer (f.eks. "10")
- Postnummer (f.eks. "8900")

Hvis MANGLER postnummer:
→ "Hvad er postnummeret til Stenstrupvej 10?"

Hvis MANGLER husnummer:
→ "Hvad er husnummeret på [vejnavn]?"

ALDRIG accepter ukomplet adresse.

Eksempler:
- "Stenstrupvej 10, 8900" → Valid, komplet ✓
- "Stenstrupvej 10" → Valid men mangler postnummer
- "8900" → Invalid, mangler vejnavn og nummer

## FASE 4: NAVN

Kræv navn:
- Minimum 2 karakterer
- Skal indeholde vokal (a,e,i,o,u,y,æ,ø,å)

Hvis mærkeligt navn (f.eks. "Ssfref"):
→ "Er navnet stavet S-S-F-R-E-F?"

Eksempler:
- "Martin" → Valid ✓
- "M" → "Kan jeg få dit fulde navn?"
- "123" → "Jeg skal bruge dit navn - ikke et tal 😊"

## FASE 5: TELEFON

Kræv 8 cifre:
- Accepter +45 prefix
- Ingen bogstaver
- Format: 22334455 eller 22 33 44 55

Eksempler:
- "22334455" → Valid ✓
- "12345" → "Det ser ud til at mangle nogle cifre..."
- "+45 22334455" → Valid ✓

## FASE 6: BEKRÆFTELSE

Vis komplet ordre med priser:
"
📋 DIN ORDRE:
━━━━━━━━━━━━━━━━━
2x Pizza Margherita (2 × 89 kr = 178 kr)
  + Ekstra ost (10 kr)
1x Cola (20 kr)
━━━━━━━━━━━━━━━━━
Total: 208 kr

[Levering/Afhentning]
[Adresse hvis levering]
[Navn]: [navn]

Er det korrekt? Svar JA for at bekræfte.
"

## FASE 7: AFSLUTNING

Efter JA:
→ "Tak! Din ordre er modtaget og sendt til køkkenet 👨‍🍳🍕"

## FEJLHÅNDTERING

### Uklar Respons
Hvis kunde svarer noget irrelevant:
1. ANERKEND hvad de sagde
2. GENTAG spørgsmålet med kontekst

Eksempel:
[AI spurgte: "Skal det leveres eller afhentes?"]
Kunde: "Pizza Margherita"
→ AI: "Noteret: Pizza Margherita! 🍕 Skal den leveres eller afhentes?"

### Ikke-Svar
Hvis kunde ikke svarer direkte:
[AI spurgte: "Hvad er postnummeret?"]
Kunde: "Okay"
→ AI: "Jeg mangler stadig postnummeret til Stenstrupvej 10 for at kunne levere 📍"

### Ændringer Efter Bekræftelse
Tillad ALTID ændringer:
- "Jeg vil gerne tilføje en cola" → Tilføj til ordre, vis ny total
- "Fjern den ene pizza" → Fjern, vis ny total
- "Skift til pepperoni i stedet" → Erstat item, vis ny total

Vis OPDATERET total efter hver ændring.

## SÆRLIGE SCENARIER

### Tilbehør-Menu
Hvis kunde siger "tilbehør" eller "ekstra":
→ Vis menu med tilbehør og priser

### Flere Pizzas
Hvis kunde siger "ekstra ost" og har 2+ pizzas:
→ "Ekstra ost på hvilken pizza?"

### Annullering
Hvis kunde vil annullere:
→ "Ingen problem! Kontakt os igen når det passer dig 👋"

### Ubeslutsomhed
Hvis kunde er usikker:
→ Foreslå populære retter, vis menu-link

### Store Ordrer
Ved 10+ items:
→ "Wow, stor ordre! 🎉 Ved bestillinger over 10 pizzaer anbefaler vi at ringe til {{telefon}} for at sikre kapacitet."

## HUSK
- Aldrig spørg det samme to gange
- Byg på tidligere svar
- Vær tålmodig og hjælpsom
- Opdater total ved ændringer
- Bekræft alt før indsendelse`,

  /**
   * Hovedfunktion: Klassificér besked med fuld kontekst
   */
  async classifyAdvanced(message, conversationId, context = '') {
    // Hent conversation state
    const conv = this.ConversationStateManager.getConversation(conversationId);

    // Tilføj bruger besked til history
    this.ConversationStateManager.addMessage(conversationId, 'user', message);

    // Check for edge cases først
    const edgeCase = this.errorRecovery.handleEdgeCase(message, conv);
    if (edgeCase) {
      this.ConversationStateManager.addMessage(conversationId, 'assistant', edgeCase.response);
      return {
        category: edgeCase.action,
        confidence: 1.0,
        response: edgeCase.response,
        extracted: null
      };
    }

    // Check current phase og expected input
    const expectedType = this.getExpectedInputType(conv);

    // Check for non-answer
    if (this.errorRecovery.isNonAnswer(message, expectedType)) {
      const rePrompt = this.errorRecovery.generateRePrompt(conv, expectedType, message);
      this.ConversationStateManager.addMessage(conversationId, 'assistant', rePrompt);
      return {
        category: 'RE_PROMPT',
        confidence: 1.0,
        response: rePrompt,
        extracted: null
      };
    }

    // Validér baseret på phase
    return await this.validateAndClassify(message, conv, expectedType, context);
  },

  /**
   * Bestem hvad AI forventer baseret på current phase
   */
  getExpectedInputType(conv) {
    switch (conv.currentPhase) {
      case 'FASE_0_HILSEN':
        return 'intent';
      case 'FASE_1_BESTILLING':
        return 'order';
      case 'FASE_2_LEVERINGSTYPE':
        return 'delivery_type';
      case 'FASE_3_ADRESSE':
        return 'address';
      case 'FASE_4_NAVN':
        return 'name';
      case 'FASE_5_TELEFON':
        return 'phone';
      case 'FASE_6_BEKRÆFTELSE':
        return 'confirmation';
      default:
        return 'general';
    }
  },

  /**
   * Validér og klassificér baseret på expected type
   */
  async validateAndClassify(message, conv, expectedType, context) {
    // Address validation
    if (expectedType === 'address') {
      const validation = this.validation.validateAddress(message);

      if (validation.complete) {
        // Opdater conversation state
        this.ConversationStateManager.updateCustomerData(conv.id, 'address.street', validation.parsed.street);
        this.ConversationStateManager.updateCustomerData(conv.id, 'address.number', validation.parsed.number);
        this.ConversationStateManager.updateCustomerData(conv.id, 'address.postal', validation.parsed.postal);
        this.ConversationStateManager.updateCustomerData(conv.id, 'address.city', validation.parsed.city || '');
        this.ConversationStateManager.updateCustomerData(conv.id, 'address.fullAddress', validation.address);
        this.ConversationStateManager.setFlag(conv.id, 'addressConfirmed', true);
        this.ConversationStateManager.updatePhase(conv.id, 'FASE_4_NAVN');

        return {
          category: 'ADDRESS_VALID',
          confidence: 1.0,
          response: validation.prompt,
          extracted: validation.parsed
        };
      } else {
        return {
          category: validation.valid ? 'ADDRESS_INCOMPLETE' : 'ADDRESS_INVALID',
          confidence: 1.0,
          response: validation.prompt,
          extracted: validation.parsed || null
        };
      }
    }

    // Name validation
    if (expectedType === 'name') {
      const validation = this.validation.validateName(message);

      if (validation.valid && !validation.needsConfirmation) {
        this.ConversationStateManager.updateCustomerData(conv.id, 'name', validation.name);
        this.ConversationStateManager.setFlag(conv.id, 'nameConfirmed', true);
        this.ConversationStateManager.updatePhase(conv.id, 'FASE_5_TELEFON');

        return {
          category: 'NAME_VALID',
          confidence: 1.0,
          response: validation.prompt,
          extracted: { name: validation.name }
        };
      } else {
        return {
          category: 'NAME_NEEDS_CONFIRMATION',
          confidence: 0.7,
          response: validation.confirm || validation.prompt,
          extracted: null
        };
      }
    }

    // Phone validation
    if (expectedType === 'phone') {
      const validation = this.validation.validatePhone(message);

      if (validation.valid) {
        this.ConversationStateManager.updateCustomerData(conv.id, 'phone', validation.phone);
        this.ConversationStateManager.setFlag(conv.id, 'phoneConfirmed', true);
        this.ConversationStateManager.updatePhase(conv.id, 'FASE_6_BEKRÆFTELSE');

        return {
          category: 'PHONE_VALID',
          confidence: 1.0,
          response: validation.prompt,
          extracted: { phone: validation.phone, formatted: validation.formatted }
        };
      } else {
        return {
          category: 'PHONE_INVALID',
          confidence: 1.0,
          response: validation.prompt,
          extracted: null
        };
      }
    }

    // Delivery type
    if (expectedType === 'delivery_type') {
      const msg = message.toLowerCase();

      if (/levering|lever|levere|delivery/i.test(msg)) {
        this.ConversationStateManager.updateCustomerData(conv.id, 'orderType', 'DELIVERY');
        this.ConversationStateManager.setFlag(conv.id, 'deliveryTypeChosen', true);
        this.ConversationStateManager.updatePhase(conv.id, 'FASE_3_ADRESSE');

        return {
          category: 'DELIVERY',
          confidence: 1.0,
          response: 'Perfekt! Hvad er din fulde adresse med postnummer?',
          extracted: { orderType: 'DELIVERY' }
        };
      } else if (/afhent|hent|pickup|afhentning/i.test(msg)) {
        this.ConversationStateManager.updateCustomerData(conv.id, 'orderType', 'PICKUP');
        this.ConversationStateManager.setFlag(conv.id, 'deliveryTypeChosen', true);
        this.ConversationStateManager.updatePhase(conv.id, 'FASE_4_NAVN');

        return {
          category: 'PICKUP',
          confidence: 1.0,
          response: 'Godt valgt! Du kan hente din ordre på {{adresse}}.\n\nHvad er dit navn?',
          extracted: { orderType: 'PICKUP' }
        };
      } else {
        return {
          category: 'UNCLEAR',
          confidence: 0.3,
          response: 'Skal det leveres til dig, eller vil du hente det selv?',
          extracted: null
        };
      }
    }

    // Confirmation
    if (expectedType === 'confirmation') {
      const msg = message.toLowerCase();

      if (/^(ja|yes|jep|correct|korrekt|rigtigt|det passer|👍)$/i.test(msg.trim())) {
        this.ConversationStateManager.setFlag(conv.id, 'orderConfirmed', true);
        this.ConversationStateManager.updatePhase(conv.id, 'FASE_7_AFSLUTNING');

        return {
          category: 'CONFIRMED',
          confidence: 1.0,
          response: 'Tak! Din ordre er modtaget og sendt til køkkenet 👨‍🍳🍕',
          extracted: { confirmed: true }
        };
      } else if (/^(nej|no|forkert|ikke|wrong)$/i.test(msg.trim())) {
        return {
          category: 'REJECTED',
          confidence: 1.0,
          response: 'Hvad skal jeg ændre i ordren?',
          extracted: { confirmed: false }
        };
      } else {
        // Måske en ændring?
        const extrasResult = this.extrasRecognizer.recognizeExtras(message, conv.customerData);
        if (extrasResult.intent) {
          return {
            category: extrasResult.intent,
            confidence: 0.9,
            response: extrasResult.prompt,
            extracted: extrasResult
          };
        }

        return {
          category: 'UNCLEAR',
          confidence: 0.3,
          response: 'Er ordren korrekt? Svar JA for at bekræfte, eller fortæl hvad du vil ændre.',
          extracted: null
        };
      }
    }

    // Order recognition (FASE_1)
    if (expectedType === 'order') {
      // Check for extras/modifications
      const extrasResult = this.extrasRecognizer.recognizeExtras(message, conv.customerData);
      if (extrasResult.intent && extrasResult.intent !== 'ADD_ITEM') {
        return {
          category: extrasResult.intent,
          confidence: 0.9,
          response: extrasResult.prompt,
          extracted: extrasResult
        };
      }

      // Standard ordre parsing - delegér til legacy system eller OpenAI
      return {
        category: 'ORDER',
        confidence: 0.8,
        response: null,
        extracted: { orderText: message }
      };
    }

    // Default - return for videre processing
    return {
      category: 'GENERAL',
      confidence: 0.5,
      response: null,
      extracted: { message }
    };
  }
};

// Export til global scope
window.AdvancedAI = AdvancedAI;

console.log('✅ AdvancedAI System loaded successfully');
