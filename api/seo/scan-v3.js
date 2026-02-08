const DEFAULT_LOCALE = 'da-DK';
const DEFAULT_COUNTRY = 'dk';

const MODULES = {
  gbp: { id: 'gbp', name: 'Google Business Profile' },
  reviews: { id: 'reviews', name: 'Reviews & Momentum' },
  competitors: { id: 'competitors', name: 'Competitor Gap' },
  website: { id: 'website', name: 'Website & Schema' },
  socialNap: { id: 'socialNap', name: 'Social & NAP' }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload || '{}');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const businessInput = payload && payload.business ? payload.business : {};
  const business = normalizeBusinessInput(businessInput);

  if (!business.name) {
    return res.status(400).json({ error: 'business.name is required' });
  }

  const locale = typeof payload.locale === 'string' && payload.locale.trim() ? payload.locale.trim() : DEFAULT_LOCALE;
  const country = typeof payload.country === 'string' && payload.country.trim() ? payload.country.trim().toLowerCase() : DEFAULT_COUNTRY;
  const language = (locale.split('-')[0] || 'da').toLowerCase();

  const env = {
    serper: {
      reviews: process.env.SERPER_REVIEWS_KEY || process.env.SERPER_API_KEY || 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62',
      images: process.env.SERPER_IMAGES_KEY || process.env.SERPER_API_KEY || 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62',
      maps: process.env.SERPER_MAPS_KEY || process.env.SERPER_API_KEY || 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62',
      places: process.env.SERPER_PLACES_KEY || process.env.SERPER_API_KEY || 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62'
    },
    googleApiKey: process.env.GOOGLE_API_KEY || 'AIzaSyBKipBk7jFnAH-3kQUqqoSu5pDZTQRlOPo',
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY || ''
  };

  const context = {
    locale,
    country,
    language,
    env,
    now: Date.now()
  };

  const moduleStatuses = [];
  const findings = [];
  const rawData = {};

  const gbpModule = await runModule(moduleStatuses, MODULES.gbp, async () => {
    const result = await analyzeGoogleBusiness(business, context);
    return result;
  });
  rawData.gbp = gbpModule.data;
  findings.push(...gbpModule.findings);

  const reviewsModule = await runModule(moduleStatuses, MODULES.reviews, async () => {
    const result = await analyzeReviews(business, gbpModule.data, context);
    return result;
  });
  rawData.reviews = reviewsModule.data;
  findings.push(...reviewsModule.findings);

  const competitorsModule = await runModule(moduleStatuses, MODULES.competitors, async () => {
    const result = await analyzeCompetitors(business, gbpModule.data, context);
    return result;
  });
  rawData.competitors = competitorsModule.data;
  findings.push(...competitorsModule.findings);

  const websiteModule = await runModule(moduleStatuses, MODULES.website, async () => {
    const result = await analyzeWebsite(business, gbpModule.data, context);
    return result;
  });
  rawData.website = websiteModule.data;
  findings.push(...websiteModule.findings);

  const socialNapModule = await runModule(moduleStatuses, MODULES.socialNap, async () => {
    const result = await analyzeSocialAndNap(business, gbpModule.data, websiteModule.data, context);
    return result;
  });
  rawData.socialNap = socialNapModule.data;
  findings.push(...socialNapModule.findings);

  const score = calculateWeightedScore({
    gbp: gbpModule.score,
    reviews: reviewsModule.score,
    competitors: competitorsModule.score,
    website: websiteModule.score,
    socialNap: socialNapModule.score
  });

  const actionPlan = buildActionPlan(findings, score.breakdown);

  const response = {
    version: '3.0',
    business: {
      name: gbpModule.data.name || business.name,
      place_id: gbpModule.data.place_id || business.place_id || '',
      address: gbpModule.data.address || business.address || '',
      website: gbpModule.data.website || business.website || ''
    },
    score,
    findings: sortFindings(findings),
    actionPlan,
    moduleStatuses,
    rawData
  };

  return res.status(200).json(response);
}

async function runModule(moduleStatuses, moduleConfig, executor) {
  const startedAt = Date.now();
  const fallback = {
    score: 30,
    status: 'error',
    summary: 'Module failed to run',
    data: {},
    findings: []
  };

  try {
    const result = await executor();
    const output = {
      score: clamp(Math.round(result.score || 0), 0, 100),
      status: result.status || 'completed',
      summary: result.summary || 'OK',
      data: result.data || {},
      findings: Array.isArray(result.findings) ? result.findings : []
    };

    moduleStatuses.push({
      id: moduleConfig.id,
      name: moduleConfig.name,
      status: output.status,
      summary: output.summary,
      durationMs: Date.now() - startedAt
    });

    return output;
  } catch (error) {
    moduleStatuses.push({
      id: moduleConfig.id,
      name: moduleConfig.name,
      status: 'error',
      summary: 'Kunne ikke gennemføre modul',
      durationMs: Date.now() - startedAt
    });

    return {
      ...fallback,
      findings: [
        makeFinding('critical', moduleConfig.id, moduleConfig.name + ' fejlede', 'Modulet kunne ikke gennemføres. Analysen fortsætter med fallback-data.', 'confirmed')
      ]
    };
  }
}

function normalizeBusinessInput(input) {
  const business = input || {};
  return {
    name: typeof business.name === 'string' ? business.name.trim() : '',
    place_id: typeof business.place_id === 'string' ? business.place_id.trim() : '',
    address: typeof business.address === 'string' ? business.address.trim() : '',
    website: typeof business.website === 'string' ? business.website.trim() : ''
  };
}

async function analyzeGoogleBusiness(business, context) {
  const findings = [];
  let status = 'completed';

  let googleResult = null;
  let placeId = business.place_id || '';
  let candidate = null;

  if (!placeId && context.env.serper.places) {
    const places = await fetchSerper('places', business.name + ' ' + (business.address || ''), context, { num: 5 });
    const placesList = places && Array.isArray(places.places) ? places.places : [];
    candidate = pickBestSerperPlace(placesList, business.name);
    if (candidate && (candidate.cid || candidate.placeId)) {
      placeId = candidate.placeId || candidate.cid;
    }
  }

  if (placeId && context.env.googleApiKey) {
    googleResult = await fetchGooglePlaceDetails(placeId, context.env.googleApiKey, context.language);
  }

  if (!googleResult && candidate) {
    status = 'warning';
    findings.push(makeFinding('warning', 'gbp', 'Google Places detaljer mangler', 'Bruger Serper fallback-data for virksomhedsprofil.', 'indicator'));
  }

  if (!googleResult && !candidate) {
    status = 'warning';
    findings.push(makeFinding('critical', 'gbp', 'Ingen verificeret virksomhedsprofil', 'Kunne ikke hente Google Business Profile data. Kontrollér place_id eller API-opsætning.', 'confirmed'));
  }

  const name = (googleResult && googleResult.name) || (candidate && (candidate.title || candidate.name)) || business.name;
  const address =
    (googleResult && googleResult.formatted_address) ||
    (candidate && candidate.address) ||
    business.address ||
    '';
  const city = parseCity(address);
  const website =
    (googleResult && googleResult.website) ||
    (candidate && (candidate.website || candidate.link)) ||
    business.website ||
    '';

  const rating = toNumber((googleResult && googleResult.rating) || (candidate && candidate.rating));
  const totalReviews =
    toInteger((googleResult && googleResult.user_ratings_total) || (candidate && (candidate.ratingCount || candidate.reviewsCount))) ||
    0;
  const phone =
    (googleResult && googleResult.formatted_phone_number) ||
    (candidate && candidate.phoneNumber) ||
    '';
  const category =
    (googleResult && Array.isArray(googleResult.types) && googleResult.types[0]) ||
    (candidate && candidate.category) ||
    'restaurant';

  const profileCompleteness = calculateCompleteness({ name, address, website, phone, rating, totalReviews });

  if (rating >= 4.3) {
    findings.push(makeFinding('positive', 'gbp', 'Stærk Google rating', 'Virksomheden har en rating på ' + rating.toFixed(1) + '.', 'confirmed'));
  } else if (rating > 0) {
    findings.push(makeFinding('warning', 'gbp', 'Google rating kan forbedres', 'Rating er ' + rating.toFixed(1) + '. Mål: 4.5+.', 'confirmed'));
  }

  if (totalReviews < 50) {
    findings.push(makeFinding('warning', 'gbp', 'Lav volumen af anmeldelser', 'Kun ' + totalReviews + ' anmeldelser fundet. Øg review-volumen for bedre lokal synlighed.', 'indicator'));
  }

  return {
    status,
    summary: profileCompleteness.score >= 75 ? 'Profildata hentet' : 'Profildata delvist hentet',
    score: profileCompleteness.score,
    findings,
    data: {
      name,
      place_id: placeId,
      address,
      city,
      website,
      phone,
      rating,
      totalReviews,
      category,
      profileCompleteness
    }
  };
}

async function analyzeReviews(business, gbpData, context) {
  const findings = [];
  const query = [business.name, gbpData.city || '', 'anmeldelser'].filter(Boolean).join(' ');

  if (!context.env.serper.reviews) {
    return {
      status: 'warning',
      summary: 'SERPER_REVIEWS_KEY mangler',
      score: 35,
      findings: [makeFinding('warning', 'reviews', 'Reviews-modul i fallback', 'Ingen Serper Reviews API key fundet. Returnerer estimeret score.', 'confirmed')],
      data: {
        totalReviews: gbpData.totalReviews || 0,
        averageRating: gbpData.rating || 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        momentum: { score: 40, trend: 'stabil', last30Days: 0 }
      }
    };
  }

  const reviewsResponse = await fetchSerper('reviews', query, context, { num: 20 });
  const reviews = (reviewsResponse && Array.isArray(reviewsResponse.reviews)) ? reviewsResponse.reviews : [];

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  reviews.forEach((review) => {
    const rating = toNumber(review.rating);
    if (rating >= 4) {
      positive += 1;
    } else if (rating >= 3) {
      neutral += 1;
    } else {
      negative += 1;
    }
  });

  const avgRating = reviews.length > 0
    ? roundTo(reviews.reduce((sum, review) => sum + toNumber(review.rating), 0) / reviews.length, 1)
    : (gbpData.rating || 0);

  const sentimentTotal = Math.max(1, positive + neutral + negative);
  const sentiment = {
    positive: Math.round((positive / sentimentTotal) * 100),
    neutral: Math.round((neutral / sentimentTotal) * 100),
    negative: Math.round((negative / sentimentTotal) * 100)
  };

  const momentum = calculateReviewMomentum(reviews, context.now);

  let score = 0;
  score += Math.min(80, (avgRating / 5) * 80);
  score += Math.min(20, momentum.score * 0.2);
  score = clamp(Math.round(score), 0, 100);

  if (sentiment.negative > 20) {
    findings.push(makeFinding('critical', 'reviews', 'Høj andel negative anmeldelser', sentiment.negative + '% af anmeldelserne er negative.', 'confirmed'));
  } else if (sentiment.positive >= 65) {
    findings.push(makeFinding('positive', 'reviews', 'Positiv sentiment', sentiment.positive + '% positive anmeldelser.', 'confirmed'));
  }

  findings.push(makeFinding(
    momentum.score >= 60 ? 'positive' : 'warning',
    'reviews',
    'Review momentum: ' + momentum.trend,
    'Seneste 30 dage: ' + momentum.last30Days + ' anmeldelser. Momentum score: ' + momentum.score + '/100.',
    'indicator'
  ));

  return {
    status: reviews.length > 0 ? 'completed' : 'warning',
    summary: reviews.length > 0 ? 'Review-data hentet' : 'Ingen review-data fundet',
    score,
    findings,
    data: {
      totalReviews: reviews.length > 0 ? reviews.length : (gbpData.totalReviews || 0),
      averageRating: avgRating,
      sentiment,
      momentum,
      topReviews: reviews.slice(0, 5).map((review) => ({
        rating: toNumber(review.rating),
        text: review.snippet || review.text || '',
        date: review.date || null
      }))
    }
  };
}

async function analyzeCompetitors(business, gbpData, context) {
  const findings = [];

  if (!context.env.serper.maps) {
    return {
      status: 'warning',
      summary: 'SERPER_MAPS_KEY mangler',
      score: 40,
      findings: [makeFinding('warning', 'competitors', 'Konkurrentmodul i fallback', 'Ingen Serper Maps API key fundet.', 'confirmed')],
      data: {
        yourRank: 8,
        competitors: [],
        gap: []
      }
    };
  }

  const locationQuery = gbpData.city || gbpData.address || context.country;
  const category = normalizeCategory(gbpData.category);
  const query = [category, locationQuery].filter(Boolean).join(' ');

  const mapsData = await fetchSerper('maps', query, context, { num: 8 });
  const places = mapsData && Array.isArray(mapsData.places) ? mapsData.places : [];

  let yourRank = 99;
  const competitors = [];
  const targetName = business.name.toLowerCase();

  places.forEach((place, index) => {
    const placeName = String(place.title || place.name || '').toLowerCase();
    if (placeName && (placeName.includes(targetName) || targetName.includes(placeName))) {
      yourRank = index + 1;
      return;
    }
    if (competitors.length < 5) {
      competitors.push({
        name: place.title || place.name || 'Ukendt',
        rating: toNumber(place.rating),
        reviews: toInteger(place.ratingCount || place.reviewsCount || 0),
        address: place.address || '',
        position: index + 1
      });
    }
  });

  if (yourRank === 99) {
    yourRank = places.length > 0 ? places.length + 1 : 8;
  }

  let score = clamp(100 - ((yourRank - 1) * 15), 20, 95);

  if (yourRank <= 3) {
    findings.push(makeFinding('positive', 'competitors', 'Stærk lokal placering', 'Virksomheden ligger i top ' + yourRank + ' for "' + query + '".', 'confirmed'));
  } else {
    findings.push(makeFinding('warning', 'competitors', 'Lokal placering kan forbedres', 'Virksomheden ligger som nr. ' + yourRank + ' for "' + query + '".', 'confirmed'));
  }

  const topCompetitor = competitors[0];
  if (topCompetitor && topCompetitor.rating > (gbpData.rating || 0)) {
    findings.push(makeFinding('warning', 'competitors', 'Konkurrent har stærkere rating', topCompetitor.name + ' har rating ' + topCompetitor.rating.toFixed(1) + '.', 'indicator'));
  }

  return {
    status: places.length > 0 ? 'completed' : 'warning',
    summary: places.length > 0 ? 'Konkurrentdata hentet' : 'Ingen konkurrentdata fundet',
    score,
    findings,
    data: {
      query,
      yourRank,
      competitors,
      gap: buildCompetitorGap(competitors, gbpData)
    }
  };
}

async function analyzeWebsite(business, gbpData, context) {
  const findings = [];
  const websiteUrl = sanitizeUrl(gbpData.website || business.website || '');

  if (!websiteUrl) {
    return {
      status: 'warning',
      summary: 'Ingen website fundet',
      score: 20,
      findings: [makeFinding('critical', 'website', 'Ingen hjemmeside fundet', 'Tilføj en aktiv hjemmeside for bedre SEO.', 'confirmed')],
      data: {
        url: '',
        hasWebsite: false,
        seoScore: 0,
        menuIndexation: 0,
        schemaScore: 0,
        socialLinks: []
      }
    };
  }

  if (!context.env.firecrawlApiKey) {
    return {
      status: 'warning',
      summary: 'FIRECRAWL_API_KEY mangler',
      score: 45,
      findings: [makeFinding('warning', 'website', 'Website-modul i fallback', 'Ingen Firecrawl API key fundet.', 'confirmed')],
      data: {
        url: websiteUrl,
        hasWebsite: true,
        seoScore: 45,
        menuIndexation: 40,
        schemaScore: 0,
        socialLinks: []
      }
    };
  }

  const crawlData = await fetchFirecrawlScrape(websiteUrl, context.env.firecrawlApiKey);
  const html = (crawlData && crawlData.html) || '';
  const markdown = (crawlData && crawlData.markdown) || '';
  const metadata = (crawlData && crawlData.metadata) || {};
  const links = (crawlData && Array.isArray(crawlData.links) ? crawlData.links : []).filter(Boolean);

  let seoScore = 0;
  if (metadata.title && metadata.title.length >= 20) seoScore += 20;
  if (metadata.description && metadata.description.length >= 80) seoScore += 20;
  if (websiteUrl.startsWith('https://')) seoScore += 10;
  if (html.toLowerCase().includes('viewport')) seoScore += 10;

  const schema = detectSchema(html);
  seoScore += schema.score;

  const menuIndexation = calculateMenuIndexation(markdown, links);
  const score = clamp(Math.round((seoScore * 0.6) + (menuIndexation.score * 0.4)), 0, 100);

  if (schema.score > 0) {
    findings.push(makeFinding('positive', 'website', 'Schema markup fundet', schema.label, 'confirmed'));
  } else {
    findings.push(makeFinding('warning', 'website', 'Schema markup mangler', 'Tilføj LocalBusiness/Restaurant schema.', 'confirmed'));
  }

  findings.push(...menuIndexation.findings.map((finding) => makeFinding(finding.type, 'website', finding.title, finding.description, 'confirmed')));

  const socialLinks = extractSocialLinks(links);

  return {
    status: 'completed',
    summary: 'Website analyseret',
    score,
    findings,
    data: {
      url: websiteUrl,
      hasWebsite: true,
      metadata: {
        title: metadata.title || '',
        description: metadata.description || ''
      },
      seoScore: clamp(Math.round(seoScore), 0, 100),
      menuIndexation: menuIndexation.score,
      schemaScore: schema.score,
      schemaLabel: schema.label,
      socialLinks,
      linksCount: links.length,
      scraped: true
    }
  };
}

async function analyzeSocialAndNap(business, gbpData, websiteData) {
  const findings = [];

  const napSignals = {
    hasName: !!(gbpData.name || business.name),
    hasAddress: !!gbpData.address,
    hasPhone: !!gbpData.phone,
    hasWebsite: !!websiteData.url
  };

  const napScore = Math.round((Object.values(napSignals).filter(Boolean).length / 4) * 100);
  const socialLinks = Array.isArray(websiteData.socialLinks) ? websiteData.socialLinks : [];
  const socialScore = clamp(20 + (socialLinks.length * 20), 20, 100);

  const score = Math.round((napScore * 0.7) + (socialScore * 0.3));

  if (napScore < 75) {
    findings.push(makeFinding('warning', 'socialNap', 'NAP-data er ufuldstændig', 'Sikr at navn, adresse, telefon og website er konsistente på tværs af platforme.', 'confirmed'));
  } else {
    findings.push(makeFinding('positive', 'socialNap', 'NAP-data ser konsistent ud', 'Kerneoplysninger er til stede i profilen.', 'confirmed'));
  }

  if (socialLinks.length === 0) {
    findings.push(makeFinding('warning', 'socialNap', 'Ingen sociale links fundet', 'Tilføj Facebook/Instagram links på websitet for bedre trust-signaler.', 'indicator'));
  } else {
    findings.push(makeFinding('positive', 'socialNap', 'Sociale signaler fundet', socialLinks.length + ' sociale profiler fundet via website-links.', 'indicator'));
  }

  return {
    status: 'completed',
    summary: 'Social & NAP analyseret',
    score,
    findings,
    data: {
      napScore,
      socialScore,
      socialLinks,
      signals: napSignals
    }
  };
}

function calculateWeightedScore(modules) {
  const breakdown = {
    gbp: clamp(toNumber(modules.gbp), 0, 100),
    reviews: clamp(toNumber(modules.reviews), 0, 100),
    website: clamp(toNumber(modules.website), 0, 100),
    competitors: clamp(toNumber(modules.competitors), 0, 100),
    socialNap: clamp(toNumber(modules.socialNap), 0, 100)
  };

  const overall = Math.round(
    (breakdown.gbp * 0.30) +
    (breakdown.reviews * 0.25) +
    (breakdown.website * 0.25) +
    (breakdown.competitors * 0.15) +
    (breakdown.socialNap * 0.05)
  );

  let label = 'Kritisk';
  let color = '#dc2626';
  if (overall >= 85) {
    label = 'Stærk';
    color = '#059669';
  } else if (overall >= 70) {
    label = 'God';
    color = '#2563eb';
  } else if (overall >= 50) {
    label = 'Middel';
    color = '#d97706';
  }

  return {
    overall,
    label,
    color,
    breakdown
  };
}

function buildActionPlan(findings, breakdown) {
  const week1 = [];
  const days30 = [];
  const days90 = [];

  sortFindings(findings).forEach((finding) => {
    if (finding.type === 'critical') {
      week1.push(actionFromFinding(finding, 'Høj', 'Ret inden 7 dage'));
      return;
    }
    if (finding.type === 'warning') {
      days30.push(actionFromFinding(finding, 'Mellem', 'Forbedr inden 30 dage'));
      return;
    }
  });

  if (breakdown.reviews < 65) {
    days30.push({
      task: 'Forbedr review-flow',
      detail: 'Indfør aktiv review-indsamling efter køb og svar på alle nye anmeldelser.',
      module: 'reviews',
      priority: 'Mellem',
      kpi: 'Svarrate > 80%'
    });
  }

  if (breakdown.website < 65) {
    days90.push({
      task: 'SEO teknisk optimering',
      detail: 'Forbedr metadata, schema og crawlbar menu med priser som tekst.',
      module: 'website',
      priority: 'Mellem',
      kpi: 'Website score > 75'
    });
  }

  if (breakdown.competitors < 60) {
    days90.push({
      task: 'Lokal konkurrenceløft',
      detail: 'Byg lokale citations og optimér Google Business indhold for top-3 placering.',
      module: 'competitors',
      priority: 'Mellem',
      kpi: 'Top 3 local pack'
    });
  }

  if (week1.length === 0) {
    week1.push({
      task: 'Valider tracking og baseline',
      detail: 'Gennemgå baseline metrics og fastsæt KPI targets før næste scan.',
      module: 'score',
      priority: 'Lav',
      kpi: 'Mål sat for 30/90 dage'
    });
  }

  return {
    week1,
    days30,
    days90
  };
}

function actionFromFinding(finding, priority, kpi) {
  return {
    task: finding.title,
    detail: finding.description,
    module: finding.module,
    priority,
    kpi
  };
}

async function fetchSerper(endpoint, query, context, extra = {}) {
  const key = context.env.serper[endpoint] || context.env.serper.places || context.env.serper.maps || context.env.serper.reviews;
  if (!key) {
    throw new Error('Missing Serper key for endpoint: ' + endpoint);
  }

  const response = await fetch('https://google.serper.dev/' + endpoint, {
    method: 'POST',
    headers: {
      'X-API-KEY': key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: query,
      gl: context.country,
      hl: context.language,
      location: 'Denmark',
      num: 10,
      ...extra
    })
  });

  if (!response.ok) {
    throw new Error('Serper ' + endpoint + ' error: ' + response.status);
  }

  return response.json();
}

async function fetchGooglePlaceDetails(placeId, apiKey, language) {
  const fields = [
    'name',
    'rating',
    'user_ratings_total',
    'formatted_address',
    'formatted_phone_number',
    'website',
    'opening_hours',
    'types',
    'business_status'
  ].join(',');

  const url =
    'https://maps.googleapis.com/maps/api/place/details/json?place_id=' +
    encodeURIComponent(placeId) +
    '&key=' +
    encodeURIComponent(apiKey) +
    '&fields=' +
    encodeURIComponent(fields) +
    '&language=' +
    encodeURIComponent(language || 'da');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Google Places error: ' + response.status);
  }

  const data = await response.json();
  if (data.status !== 'OK') {
    throw new Error('Google Places status: ' + data.status);
  }

  return data.result || null;
}

async function fetchFirecrawlScrape(url, apiKey) {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html', 'links', 'metadata']
    })
  });

  if (!response.ok) {
    throw new Error('Firecrawl error: ' + response.status);
  }

  const data = await response.json();
  if (!data || data.success !== true || !data.data) {
    throw new Error('Firecrawl returned no data');
  }

  return data.data;
}

function pickBestSerperPlace(places, businessName) {
  if (!Array.isArray(places) || places.length === 0) {
    return null;
  }

  const target = String(businessName || '').toLowerCase();
  const exact = places.find((place) => {
    const name = String(place.title || place.name || '').toLowerCase();
    return name === target;
  });

  if (exact) return exact;

  const close = places.find((place) => {
    const name = String(place.title || place.name || '').toLowerCase();
    return name.includes(target) || target.includes(name);
  });

  return close || places[0];
}

function calculateCompleteness(profile) {
  let score = 0;
  const missing = [];

  if (profile.name) score += 20; else missing.push('Navn');
  if (profile.address) score += 20; else missing.push('Adresse');
  if (profile.website) score += 20; else missing.push('Website');
  if (profile.phone) score += 20; else missing.push('Telefon');
  if (profile.rating > 0 && profile.totalReviews > 0) score += 20; else missing.push('Rating/anmeldelser');

  return {
    score,
    missing
  };
}

function calculateReviewMomentum(reviews, now) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { score: 40, trend: 'stabil', last30Days: 0 };
  }

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;

  const last30 = [];
  const prev30 = [];

  reviews.forEach((review) => {
    const parsed = Date.parse(review.date || review.datePublished || review.time || '');
    if (!Number.isFinite(parsed)) return;
    const age = now - parsed;
    if (age >= 0 && age <= THIRTY_DAYS) {
      last30.push(review);
    } else if (age > THIRTY_DAYS && age <= SIXTY_DAYS) {
      prev30.push(review);
    }
  });

  const delta = last30.length - prev30.length;
  const base = prev30.length === 0 ? (last30.length > 0 ? 20 : 0) : Math.round((delta / prev30.length) * 100);
  const score = clamp(50 + (base * 0.8), 20, 100);
  const trend = score >= 65 ? 'stigende' : score <= 45 ? 'faldende' : 'stabil';

  return {
    score: Math.round(score),
    trend,
    last30Days: last30.length,
    previous30Days: prev30.length
  };
}

function detectSchema(html) {
  const lower = String(html || '').toLowerCase();

  if (lower.includes('localbusiness') || lower.includes('restaurant')) {
    return { score: 25, label: 'LocalBusiness/Restaurant schema registreret' };
  }

  if (lower.includes('application/ld+json')) {
    return { score: 10, label: 'Structured data fundet, men uden tydelig local schema' };
  }

  return { score: 0, label: 'Ingen structured data fundet' };
}

function calculateMenuIndexation(markdown, links) {
  const text = String(markdown || '').toLowerCase();
  const findings = [];

  const keywords = ['menu', 'menukort', 'pizza', 'burger', 'ret', 'pris', 'kr'];
  const keywordHits = keywords.filter((keyword) => text.includes(keyword)).length;

  const priceMatches = String(markdown || '').match(/\d+[\.,]?\d*\s*(kr|dkk|,-)/gi);
  const hasMenuLink = (Array.isArray(links) ? links : []).some((link) => /\/menu|\/menukort|\/bestil/i.test(String(link)));

  let score = 0;

  if (keywordHits >= 4) {
    score += 40;
    findings.push({ type: 'positive', title: 'Menu-indhold kan crawles', description: 'Flere menu-relevante termer er fundet i sideindholdet.' });
  } else {
    score += 15;
    findings.push({ type: 'warning', title: 'Menu-indhold er begrænset', description: 'Tilføj flere menutekster som HTML for bedre indexering.' });
  }

  if (priceMatches && priceMatches.length >= 3) {
    score += 30;
    findings.push({ type: 'positive', title: 'Priser er synlige i tekst', description: 'Der er fundet mindst 3 prisfelter i indholdet.' });
  } else {
    score += 10;
    findings.push({ type: 'warning', title: 'Priser er ikke tydelige', description: 'Gør priser synlige i tekst i stedet for billeder/PDF.' });
  }

  if (hasMenuLink) {
    score += 30;
    findings.push({ type: 'positive', title: 'Tydeligt menu-link fundet', description: 'Website har et direkte menu-/bestillingslink.' });
  } else {
    score += 10;
    findings.push({ type: 'warning', title: 'Intet tydeligt menu-link', description: 'Tilføj menu/bestil-link i topnavigation.' });
  }

  return { score: clamp(Math.round(score), 0, 100), findings };
}

function extractSocialLinks(links) {
  const socialHosts = ['facebook.com', 'instagram.com', 'tiktok.com', 'linkedin.com', 'youtube.com'];
  const unique = new Set();

  (Array.isArray(links) ? links : []).forEach((link) => {
    const value = String(link || '');
    if (!value) return;
    if (socialHosts.some((host) => value.includes(host))) {
      unique.add(value);
    }
  });

  return Array.from(unique).slice(0, 8);
}

function buildCompetitorGap(competitors, gbpData) {
  if (!Array.isArray(competitors) || competitors.length === 0) {
    return [];
  }

  const topRating = Math.max(...competitors.map((entry) => toNumber(entry.rating)));
  const topReviews = Math.max(...competitors.map((entry) => toInteger(entry.reviews)));

  return [
    {
      metric: 'Rating',
      yourValue: toNumber(gbpData.rating),
      topValue: topRating,
      delta: roundTo(topRating - toNumber(gbpData.rating), 1)
    },
    {
      metric: 'Anmeldelser',
      yourValue: toInteger(gbpData.totalReviews),
      topValue: topReviews,
      delta: Math.max(0, topReviews - toInteger(gbpData.totalReviews))
    }
  ];
}

function normalizeCategory(category) {
  const value = String(category || '').toLowerCase();
  if (!value) return 'restaurant';
  if (value.includes('pizza')) return 'pizza restaurant';
  if (value.includes('cafe')) return 'cafe';
  return 'restaurant';
}

function parseCity(address) {
  const value = String(address || '');
  if (!value) return '';

  const byComma = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (byComma.length >= 2) {
    return byComma[byComma.length - 2] || byComma[0] || '';
  }

  return byComma[0] || '';
}

function sanitizeUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return 'https://' + value;
}

function makeFinding(type, module, title, description, confidence) {
  return {
    id: module + '-' + slugify(title) + '-' + Math.random().toString(36).slice(2, 8),
    type,
    module,
    title,
    description,
    confidence: confidence || 'indicator'
  };
}

function sortFindings(findings) {
  const priority = { critical: 0, warning: 1, positive: 2, info: 3 };
  return (Array.isArray(findings) ? findings.slice() : []).sort((a, b) => {
    const pa = priority[a.type] !== undefined ? priority[a.type] : 4;
    const pb = priority[b.type] !== undefined ? priority[b.type] : 4;
    return pa - pb;
  });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toInteger(value) {
  const num = parseInt(value, 10);
  return Number.isFinite(num) ? num : 0;
}

function roundTo(value, decimals) {
  const factor = Math.pow(10, decimals || 0);
  return Math.round(toNumber(value) * factor) / factor;
}
