# FLOW Data Strategi & Arkitektur

**Version:** 1.0
**Dato:** 2026-02-05
**Forfatter:** Analytics Arkitekt

---

## Indholdsfortegnelse

1. [Datakatalog](#1-datakatalog)
2. [Supabase Skema](#2-supabase-skema)
3. [Event Tracking](#3-event-tracking)
4. [Analytics & Dashboards](#4-analytics--dashboards)
5. [Webhooks & Integrationer](#5-webhooks--integrationer)
6. [Databrug](#6-databrug)
7. [Datamonetisering](#7-datamonetisering)
8. [Compliance](#8-compliance)
9. [Implementeringsplan](#9-implementeringsplan)

---

## 1. Datakatalog

### 1.1 Hovedkategorier

| Kategori | Beskrivelse | Primær Placering |
|----------|-------------|------------------|
| **Bruger & Konto** | Brugerdata, roller, samtykker, 2FA | `users`, `user_roles`, `user_2fa_settings` |
| **Ordre & Salg** | Ordrer, transaktioner, betalinger | `orders`, `order_items`, `payments` |
| **Produkter** | Menu, kategorier, priser, performance | `products`, `product_analytics` |
| **Adfærd & Tracking** | Klik, sessions, heatmaps | `events`, `sessions`, `page_views` |
| **Marketing & Kanaler** | Kampagner, SMS, social | `marketing_campaigns`, `campaign_sends`, `channel_attribution` |
| **AI Agent Data** | Samtaler, intents, succes/fejl | `ai_conversations`, `ai_intents`, `ai_feedback` |
| **System & Fejl** | Logs, performance, sikkerhed | `system_logs`, `error_logs`, `audit_logs` |
| **Integrationer** | Webhooks, gateways, eksterne API | `webhook_logs`, `integration_configs`, `api_logs` |

### 1.2 Komplet Datakatalog

| Datatype | Formål | Placering | Retention | Følsomhed | Adgang |
|----------|--------|-----------|-----------|-----------|--------|
| **Bruger login** | Autentificering | `auth.users` | Permanent | Høj | System |
| **Bruger profil** | Kontaktinfo, præferencer | `users` | Til sletning | Høj | Bruger+Admin |
| **Samtykker** | GDPR compliance | `user_consents` | 5 år efter ophør | Kritisk | Compliance |
| **Restaurant data** | Virksomhedsinfo | `restaurants` | 5 år efter ophør | Mellem | Ejer+Admin |
| **Ordrer** | Salgshistorik | `orders` | 5 år (bogføring) | Mellem | Ejer+System |
| **Ordre detaljer** | Produkter i ordre | `order_items` | 5 år (bogføring) | Lav | Ejer+System |
| **Betalinger** | Transaktioner | `payments` | 5 år (bogføring) | Høj | Ejer+Finance |
| **Produkter** | Menu items | `products` | Aktiv periode | Lav | Ejer+Public |
| **Klik events** | Brugeradfærd | `events` | 2 år | Lav | Analytics |
| **Sessions** | Bruger sessions | `sessions` | 90 dage | Mellem | Analytics |
| **Heatmap data** | UI interaktioner | `heatmap_events` | 90 dage | Lav | Analytics |
| **AI samtaler** | Chatbot historik | `ai_conversations` | 1 år | Mellem | AI+Support |
| **AI intents** | Genkendelse træning | `ai_intents` | Permanent | Lav | AI Team |
| **SMS beskeder** | Kommunikation | `messages` | 2 år | Høj | Ejer+Support |
| **Kampagner** | Marketing data | `marketing_campaigns` | 2 år | Mellem | Marketing |
| **System logs** | Debugging | `system_logs` | 90 dage | Lav | DevOps |
| **Error logs** | Fejlsporing | `error_logs` | 1 år | Mellem | DevOps |
| **Audit logs** | Compliance trail | `gdpr_audit_log` | 7 år | Kritisk | Compliance |
| **Webhook logs** | Integration debug | `webhook_logs` | 30 dage | Lav | DevOps |
| **API logs** | Performance | `api_logs` | 30 dage | Lav | DevOps |
| **Loyalty points** | Kundeloyalitet | `loyalty_points` | Aktiv periode | Mellem | Ejer+Kunde |
| **Benchmark data** | Anonymiseret aggregat | `benchmark_aggregates` | Permanent | Ingen (anon) | Alle |

### 1.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATAKILDER                                      │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│  Web App    │  Mobil App  │  AI Agent   │  Webhooks   │  Sociale Platforme  │
│  (Browser)  │  (Native)   │  (Chat)     │  (Externe)  │  (IG/FB/SMS)        │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────────┬──────────┘
       │             │             │             │                 │
       ▼             ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EVENT COLLECTOR                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Page Views  │  │ Click Events│  │ AI Events   │  │ Webhook Events      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (PostgreSQL)                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Transactional DB │  │ Event Store      │  │ Analytics Tables         │   │
│  │ - restaurants    │  │ - events         │  │ - daily_metrics          │   │
│  │ - orders         │  │ - sessions       │  │ - product_analytics      │   │
│  │ - products       │  │ - ai_conversations│ │ - channel_attribution    │   │
│  │ - users          │  │ - webhook_logs   │  │ - benchmark_aggregates   │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘   │
└───────────┼─────────────────────┼─────────────────────────┼─────────────────┘
            │                     │                         │
            ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANALYTICS LAYER                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Real-time Dash   │  │ BI Reports       │  │ AI Training Pipeline     │   │
│  │ (Live metrics)   │  │ (Scheduled)      │  │ (Intent improvement)     │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Supabase Skema

### 2.1 Eksisterende Tabeller (Allerede Implementeret)

Disse tabeller eksisterer allerede i produktionsmiljøet:

| Tabel | Status | Formål |
|-------|--------|--------|
| `restaurants` | ✅ Aktiv | Virksomheder/konti |
| `orders` | ✅ Aktiv | Ordrer |
| `products` | ✅ Aktiv | Produkter/menu |
| `activities` | ✅ Aktiv | Brugeraktivitetslog |
| `notifications` | ✅ Aktiv | Notifikationer |
| `messages` | ✅ Aktiv | SMS beskeder |
| `user_2fa_settings` | ✅ Aktiv | 2FA konfiguration |
| `user_roles` | ✅ Aktiv | Brugerroller |
| `loyalty_points` | ✅ Aktiv | Loyalitetspoint |
| `loyalty_transactions` | ✅ Aktiv | Point historik |
| `marketing_campaigns` | ✅ Aktiv | Kampagner |
| `campaign_sends` | ✅ Aktiv | Kampagne udsendelser |
| `gdpr_audit_log` | ✅ Aktiv | GDPR audit trail |
| `builder_configs` | ✅ Aktiv | App/Web builder |

### 2.2 Nye Tabeller (Skal Oprettes)

#### 2.2.1 Analytics Tabeller

```sql
-- =====================================================
-- SESSIONS: Bruger sessions tracking
-- =====================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,           -- Anonymt browser fingerprint
    session_id TEXT NOT NULL UNIQUE,    -- Session identifier

    -- Session metadata
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Device info
    device_type TEXT,                   -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,

    -- Traffic source
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,
    landing_page TEXT,

    -- Session metrics
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    orders_created INTEGER DEFAULT 0,

    -- Geolocation (anonymiseret)
    country_code CHAR(2),
    region TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_restaurant ON sessions(restaurant_id);
CREATE INDEX idx_sessions_started ON sessions(started_at);
CREATE INDEX idx_sessions_visitor ON sessions(visitor_id);

-- =====================================================
-- EVENTS: Alle bruger events
-- =====================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(session_id),

    -- Event identification
    event_name TEXT NOT NULL,           -- 'page_view', 'click', 'checkout_start', etc.
    event_category TEXT NOT NULL,       -- 'navigation', 'ecommerce', 'engagement'

    -- Event data
    event_data JSONB DEFAULT '{}',      -- Flexible event properties

    -- Page context
    page_url TEXT,
    page_title TEXT,

    -- Element context (for clicks)
    element_id TEXT,
    element_class TEXT,
    element_text TEXT,

    -- Position (for heatmaps)
    viewport_x INTEGER,
    viewport_y INTEGER,
    page_x INTEGER,
    page_y INTEGER,

    -- Timing
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_on_page_ms INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_restaurant ON events(restaurant_id);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_category ON events(event_category);

-- =====================================================
-- PAGE_VIEWS: Detaljeret sidevisningsdata
-- =====================================================
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(session_id),

    -- Page info
    page_url TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,

    -- Timing
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exited_at TIMESTAMPTZ,
    time_on_page_ms INTEGER,

    -- Scroll depth
    max_scroll_depth_percent INTEGER,   -- 0-100

    -- Engagement
    clicks_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pageviews_restaurant ON page_views(restaurant_id);
CREATE INDEX idx_pageviews_session ON page_views(session_id);
CREATE INDEX idx_pageviews_path ON page_views(page_path);

-- =====================================================
-- HEATMAP_EVENTS: Click/scroll heatmap data
-- =====================================================
CREATE TABLE heatmap_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Page identification
    page_path TEXT NOT NULL,
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,

    -- Event type
    event_type TEXT NOT NULL,           -- 'click', 'move', 'scroll'

    -- Position (normalized 0-1 for responsive)
    x_percent DECIMAL(5,4),             -- 0.0000 to 1.0000
    y_percent DECIMAL(5,4),

    -- Absolute position
    x_px INTEGER,
    y_px INTEGER,

    -- Element clicked
    element_selector TEXT,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heatmap_restaurant ON heatmap_events(restaurant_id);
CREATE INDEX idx_heatmap_page ON heatmap_events(page_path);
CREATE INDEX idx_heatmap_type ON heatmap_events(event_type);

-- Partition by month for performance
-- (Implementeres via pg_partman eller manuel partitionering)
```

#### 2.2.2 Order Items Tabel

```sql
-- =====================================================
-- ORDER_ITEMS: Detaljerede ordre linjer
-- =====================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Product snapshot (ved ordre tidspunkt)
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_category TEXT,

    -- Pricing (stored as øre/cents)
    unit_price INTEGER NOT NULL,        -- Pris per enhed i øre
    quantity INTEGER NOT NULL DEFAULT 1,
    line_total INTEGER NOT NULL,        -- unit_price * quantity

    -- Discounts
    discount_amount INTEGER DEFAULT 0,
    discount_reason TEXT,

    -- Options/variants
    options JSONB DEFAULT '[]',         -- [{name: "Size", value: "Large", price_mod: 1500}]
    notes TEXT,                         -- Kundenoter til item

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orderitems_order ON order_items(order_id);
CREATE INDEX idx_orderitems_product ON order_items(product_id);
```

#### 2.2.3 Payments Tabel

```sql
-- =====================================================
-- PAYMENTS: Betalingstransaktioner
-- =====================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Payment details
    amount INTEGER NOT NULL,            -- Beløb i øre
    currency CHAR(3) DEFAULT 'DKK',

    -- Status
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed', 'refunded'

    -- Provider info
    provider TEXT NOT NULL,             -- 'stripe', 'mobilepay', 'cash', 'invoice'
    provider_transaction_id TEXT,
    provider_response JSONB,

    -- Card info (masked)
    card_last_four CHAR(4),
    card_brand TEXT,                    -- 'visa', 'mastercard', etc.

    -- Refund tracking
    refunded_amount INTEGER DEFAULT 0,
    refund_reason TEXT,

    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_restaurant ON payments(restaurant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider);
```

#### 2.2.4 AI Agent Tabeller

```sql
-- =====================================================
-- AI_CONVERSATIONS: AI chatbot samtaler
-- =====================================================
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Conversation identification
    conversation_id TEXT NOT NULL UNIQUE,

    -- Channel
    channel TEXT NOT NULL,              -- 'web_chat', 'instagram_dm', 'facebook_messenger', 'sms'
    channel_user_id TEXT,               -- Platform-specifik bruger ID

    -- Customer info (if identified)
    customer_phone TEXT,
    customer_name TEXT,

    -- Conversation metadata
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    -- State tracking
    current_state TEXT,                 -- 'GREETING', 'ITEM_SELECTION', etc.
    language TEXT DEFAULT 'da',         -- 'da', 'en'

    -- Outcome
    outcome TEXT,                       -- 'order_completed', 'abandoned', 'escalated', 'info_provided'
    order_id UUID REFERENCES orders(id),

    -- Metrics
    message_count INTEGER DEFAULT 0,
    clarification_count INTEGER DEFAULT 0,
    frustration_score DECIMAL(3,2),     -- 0.00 - 1.00

    -- Feedback
    customer_rating INTEGER,            -- 1-5
    customer_feedback TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aiconv_restaurant ON ai_conversations(restaurant_id);
CREATE INDEX idx_aiconv_channel ON ai_conversations(channel);
CREATE INDEX idx_aiconv_outcome ON ai_conversations(outcome);
CREATE INDEX idx_aiconv_started ON ai_conversations(started_at);

-- =====================================================
-- AI_MESSAGES: Individuelle beskeder i samtale
-- =====================================================
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,

    -- Message content
    role TEXT NOT NULL,                 -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,

    -- Intent detection (for user messages)
    detected_intent TEXT,               -- 'order_food', 'check_hours', 'complaint', etc.
    intent_confidence DECIMAL(3,2),     -- 0.00 - 1.00
    entities JSONB,                     -- Extracted entities [{type: 'product', value: 'Pizza', id: '...'}]

    -- Response metadata (for assistant messages)
    response_time_ms INTEGER,
    tokens_used INTEGER,

    -- State at message time
    conversation_state TEXT,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aimsg_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_aimsg_intent ON ai_messages(detected_intent);
CREATE INDEX idx_aimsg_timestamp ON ai_messages(timestamp);

-- =====================================================
-- AI_INTENTS: Intent definitions og performance
-- =====================================================
CREATE TABLE ai_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Intent definition
    intent_name TEXT NOT NULL UNIQUE,
    intent_category TEXT NOT NULL,      -- 'ordering', 'support', 'info', 'social'
    description TEXT,

    -- Training examples
    example_phrases JSONB,              -- ["Jeg vil gerne bestille", "Kan jeg få en pizza"]

    -- Performance metrics
    total_detections INTEGER DEFAULT 0,
    correct_detections INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,4),

    -- Last updated
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI_FEEDBACK: Feedback til AI forbedring
-- =====================================================
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,

    -- Feedback type
    feedback_type TEXT NOT NULL,        -- 'intent_correction', 'response_quality', 'escalation_reason'

    -- Feedback data
    original_value TEXT,                -- Hvad AI'en troede
    correct_value TEXT,                 -- Hvad det faktisk var
    feedback_notes TEXT,

    -- Source
    feedback_source TEXT,               -- 'customer', 'staff', 'automatic'
    feedback_by UUID,                   -- User ID hvis staff

    -- Status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aifeedback_type ON ai_feedback(feedback_type);
CREATE INDEX idx_aifeedback_processed ON ai_feedback(processed);
```

#### 2.2.5 Channel Attribution

```sql
-- =====================================================
-- CHANNEL_ATTRIBUTION: Marketing attribution
-- =====================================================
CREATE TABLE channel_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- First touch attribution
    first_touch_channel TEXT,           -- 'organic', 'paid_search', 'social', 'direct', 'email', 'sms'
    first_touch_source TEXT,            -- 'google', 'facebook', 'instagram', etc.
    first_touch_campaign TEXT,
    first_touch_at TIMESTAMPTZ,

    -- Last touch attribution
    last_touch_channel TEXT,
    last_touch_source TEXT,
    last_touch_campaign TEXT,
    last_touch_at TIMESTAMPTZ,

    -- Multi-touch path
    touchpoint_path JSONB,              -- [{channel, source, timestamp}, ...]
    touchpoint_count INTEGER,

    -- Time to conversion
    days_to_conversion INTEGER,
    sessions_to_conversion INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attribution_order ON channel_attribution(order_id);
CREATE INDEX idx_attribution_restaurant ON channel_attribution(restaurant_id);
CREATE INDEX idx_attribution_first ON channel_attribution(first_touch_channel);
CREATE INDEX idx_attribution_last ON channel_attribution(last_touch_channel);
```

#### 2.2.6 Product Analytics

```sql
-- =====================================================
-- PRODUCT_ANALYTICS: Produkt performance metrics
-- =====================================================
CREATE TABLE product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Time period
    date DATE NOT NULL,

    -- Sales metrics
    units_sold INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0,          -- I øre
    orders_containing INTEGER DEFAULT 0,

    -- Calculated metrics
    avg_order_quantity DECIMAL(5,2),

    -- Comparison to previous period
    units_sold_prev INTEGER,
    revenue_prev INTEGER,

    -- Visibility metrics
    menu_views INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    removed_from_cart INTEGER DEFAULT 0,

    -- Conversion
    view_to_cart_rate DECIMAL(5,4),
    cart_to_purchase_rate DECIMAL(5,4),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(product_id, date)
);

CREATE INDEX idx_prodanalytics_product ON product_analytics(product_id);
CREATE INDEX idx_prodanalytics_restaurant ON product_analytics(restaurant_id);
CREATE INDEX idx_prodanalytics_date ON product_analytics(date);
```

#### 2.2.7 Daily Metrics (Aggregeret)

```sql
-- =====================================================
-- DAILY_METRICS: Daglige aggregerede metrics
-- =====================================================
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Revenue metrics (i øre)
    total_revenue INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    avg_order_value INTEGER DEFAULT 0,

    -- Order breakdown
    orders_delivery INTEGER DEFAULT 0,
    orders_pickup INTEGER DEFAULT 0,
    orders_dine_in INTEGER DEFAULT 0,

    -- Channel breakdown
    orders_web INTEGER DEFAULT 0,
    orders_app INTEGER DEFAULT 0,
    orders_instagram INTEGER DEFAULT 0,
    orders_facebook INTEGER DEFAULT 0,
    orders_sms INTEGER DEFAULT 0,
    orders_phone INTEGER DEFAULT 0,

    -- Traffic metrics
    unique_visitors INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,

    -- Engagement
    avg_session_duration_sec INTEGER,
    bounce_rate DECIMAL(5,4),

    -- AI metrics
    ai_conversations INTEGER DEFAULT 0,
    ai_orders_created INTEGER DEFAULT 0,
    ai_conversion_rate DECIMAL(5,4),

    -- Marketing
    sms_sent INTEGER DEFAULT 0,
    sms_clicks INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,

    -- Loyalty
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    new_loyalty_members INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(restaurant_id, date)
);

CREATE INDEX idx_dailymetrics_restaurant ON daily_metrics(restaurant_id);
CREATE INDEX idx_dailymetrics_date ON daily_metrics(date);
```

#### 2.2.8 Webhook & Integration Logs

```sql
-- =====================================================
-- WEBHOOK_LOGS: Alle webhook requests/responses
-- =====================================================
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,

    -- Webhook identification
    webhook_type TEXT NOT NULL,         -- 'incoming', 'outgoing'
    webhook_name TEXT NOT NULL,         -- 'stripe_payment', 'sms_inbound', etc.

    -- Request details
    method TEXT,                        -- 'POST', 'GET', etc.
    url TEXT,
    headers JSONB,
    request_body JSONB,

    -- Response details
    response_status INTEGER,
    response_body JSONB,
    response_time_ms INTEGER,

    -- Status
    status TEXT NOT NULL,               -- 'success', 'failed', 'timeout', 'retrying'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooklogs_restaurant ON webhook_logs(restaurant_id);
CREATE INDEX idx_webhooklogs_type ON webhook_logs(webhook_type);
CREATE INDEX idx_webhooklogs_name ON webhook_logs(webhook_name);
CREATE INDEX idx_webhooklogs_status ON webhook_logs(status);
CREATE INDEX idx_webhooklogs_received ON webhook_logs(received_at);

-- Automatisk cleanup efter 30 dage
-- (Implementeres via pg_cron eller scheduled function)

-- =====================================================
-- INTEGRATION_CONFIGS: Integration konfigurationer
-- =====================================================
CREATE TABLE integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Integration identification
    integration_type TEXT NOT NULL,     -- 'payment', 'accounting', 'sms', 'social', 'delivery'
    integration_name TEXT NOT NULL,     -- 'stripe', 'economic', 'inmobile', 'instagram', 'wolt'

    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted JSONB,        -- Encrypted API keys etc.

    -- Status
    status TEXT DEFAULT 'inactive',     -- 'active', 'inactive', 'error', 'pending_setup'
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(restaurant_id, integration_type, integration_name)
);

CREATE INDEX idx_integrationconfigs_restaurant ON integration_configs(restaurant_id);
CREATE INDEX idx_integrationconfigs_type ON integration_configs(integration_type);

-- =====================================================
-- API_LOGS: Udgående API kald
-- =====================================================
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,

    -- API identification
    api_name TEXT NOT NULL,             -- 'stripe', 'economic', 'inmobile', etc.
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,

    -- Request
    request_params JSONB,
    request_body_hash TEXT,             -- Hash af body for debugging uden at gemme sensitiv data

    -- Response
    response_status INTEGER,
    response_time_ms INTEGER,

    -- Status
    success BOOLEAN,
    error_code TEXT,
    error_message TEXT,

    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apilogs_restaurant ON api_logs(restaurant_id);
CREATE INDEX idx_apilogs_api ON api_logs(api_name);
CREATE INDEX idx_apilogs_timestamp ON api_logs(timestamp);
CREATE INDEX idx_apilogs_success ON api_logs(success);
```

#### 2.2.9 System Logs

```sql
-- =====================================================
-- SYSTEM_LOGS: System events og performance
-- =====================================================
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Log identification
    log_level TEXT NOT NULL,            -- 'debug', 'info', 'warn', 'error', 'critical'
    log_category TEXT NOT NULL,         -- 'performance', 'security', 'business', 'integration'

    -- Context
    service TEXT,                       -- 'web', 'api', 'edge_function', 'cron'
    function_name TEXT,
    restaurant_id UUID,
    user_id UUID,

    -- Log content
    message TEXT NOT NULL,
    details JSONB,
    stack_trace TEXT,

    -- Request context
    request_id TEXT,
    ip_address INET,
    user_agent TEXT,

    -- Performance (if applicable)
    duration_ms INTEGER,
    memory_mb INTEGER,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syslogs_level ON system_logs(log_level);
CREATE INDEX idx_syslogs_category ON system_logs(log_category);
CREATE INDEX idx_syslogs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_syslogs_restaurant ON system_logs(restaurant_id);

-- =====================================================
-- ERROR_LOGS: Detaljerede fejl logs
-- =====================================================
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Error identification
    error_type TEXT NOT NULL,           -- 'javascript', 'api', 'database', 'integration'
    error_code TEXT,
    error_message TEXT NOT NULL,

    -- Context
    service TEXT,
    restaurant_id UUID,
    user_id UUID,

    -- Stack trace
    stack_trace TEXT,

    -- Request context
    request_url TEXT,
    request_method TEXT,
    request_body_hash TEXT,

    -- Browser context (for JS errors)
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,

    -- Occurrence tracking
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,

    -- Resolution
    status TEXT DEFAULT 'new',          -- 'new', 'investigating', 'resolved', 'ignored'
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_errorlogs_type ON error_logs(error_type);
CREATE INDEX idx_errorlogs_status ON error_logs(status);
CREATE INDEX idx_errorlogs_restaurant ON error_logs(restaurant_id);
CREATE INDEX idx_errorlogs_lastseen ON error_logs(last_seen_at);
```

#### 2.2.10 User Consents

```sql
-- =====================================================
-- USER_CONSENTS: GDPR samtykke tracking
-- =====================================================
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Consent type
    consent_type TEXT NOT NULL,         -- 'marketing_email', 'marketing_sms', 'analytics', 'cookies', 'terms', 'privacy'

    -- Consent status
    granted BOOLEAN NOT NULL,

    -- Consent details
    consent_version TEXT,               -- Version af vilkår/politik
    consent_text TEXT,                  -- Teksten der blev vist

    -- Collection context
    collection_method TEXT,             -- 'signup_form', 'cookie_banner', 'settings_page', 'checkout'
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_restaurant ON user_consents(restaurant_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);
CREATE INDEX idx_consents_granted ON user_consents(granted);
```

#### 2.2.11 Benchmark Aggregates

```sql
-- =====================================================
-- BENCHMARK_AGGREGATES: Anonymiseret industri benchmark
-- =====================================================
CREATE TABLE benchmark_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Aggregation period
    period_type TEXT NOT NULL,          -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Segment
    industry_segment TEXT,              -- 'restaurant', 'cafe', 'takeaway', etc.
    size_segment TEXT,                  -- 'small', 'medium', 'large'
    region TEXT,                        -- 'copenhagen', 'aarhus', 'odense', etc.

    -- Sample size
    restaurant_count INTEGER NOT NULL,

    -- Revenue benchmarks (anonymiseret, i øre)
    avg_daily_revenue INTEGER,
    median_daily_revenue INTEGER,
    p25_daily_revenue INTEGER,
    p75_daily_revenue INTEGER,

    -- Order benchmarks
    avg_order_value INTEGER,
    avg_orders_per_day DECIMAL(6,2),

    -- Channel distribution (percentages)
    pct_orders_web DECIMAL(5,2),
    pct_orders_app DECIMAL(5,2),
    pct_orders_social DECIMAL(5,2),

    -- Engagement benchmarks
    avg_conversion_rate DECIMAL(5,4),
    avg_return_customer_rate DECIMAL(5,4),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_period ON benchmark_aggregates(period_type, period_start);
CREATE INDEX idx_benchmark_segment ON benchmark_aggregates(industry_segment, size_segment);
```

---

## 3. Event Tracking

### 3.1 Event Naming Konvention

```
{kategori}_{handling}_{objekt}

Eksempler:
- checkout_started
- checkout_item_added
- checkout_payment_initiated
- checkout_completed
- ai_intent_detected
- ai_order_created
- social_instagram_order_received
```

### 3.2 Checkout Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `checkout_started` | Bruger åbner kurv/checkout | `session_id`, `cart_value`, `item_count` |
| `checkout_item_added` | Produkt tilføjes til kurv | `product_id`, `product_name`, `quantity`, `price`, `cart_total` |
| `checkout_item_removed` | Produkt fjernes fra kurv | `product_id`, `product_name`, `quantity`, `price`, `cart_total` |
| `checkout_item_quantity_changed` | Antal ændres | `product_id`, `old_quantity`, `new_quantity`, `cart_total` |
| `checkout_delivery_selected` | Leveringsmetode valgt | `fulfillment_type`, `delivery_fee`, `estimated_time` |
| `checkout_address_entered` | Adresse indtastet | `postal_code`, `city`, `valid` |
| `checkout_payment_initiated` | Betaling startet | `payment_method`, `amount` |
| `checkout_payment_completed` | Betaling gennemført | `payment_method`, `amount`, `transaction_id` |
| `checkout_payment_failed` | Betaling fejlet | `payment_method`, `error_code`, `error_message` |
| `checkout_completed` | Ordre gennemført | `order_id`, `total`, `item_count`, `fulfillment_type`, `payment_method` |
| `checkout_abandoned` | Checkout forladt | `step`, `cart_value`, `time_spent_sec` |

### 3.3 Social Channel Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `social_instagram_dm_received` | DM modtaget fra Instagram | `ig_user_id`, `message_type` |
| `social_instagram_order_started` | Ordre påbegyndt via IG | `ig_user_id`, `conversation_id` |
| `social_instagram_order_completed` | Ordre gennemført via IG | `order_id`, `ig_user_id`, `total` |
| `social_facebook_message_received` | Messenger besked modtaget | `fb_user_id`, `page_id` |
| `social_facebook_order_started` | Ordre påbegyndt via FB | `fb_user_id`, `conversation_id` |
| `social_facebook_order_completed` | Ordre gennemført via FB | `order_id`, `fb_user_id`, `total` |
| `social_sms_received` | SMS modtaget | `phone_hash`, `keyword` |
| `social_sms_link_clicked` | Link i SMS klikket | `campaign_id`, `link_id` |
| `social_sms_order_completed` | Ordre via SMS flow | `order_id`, `campaign_id`, `total` |

### 3.4 AI Agent Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `ai_conversation_started` | Ny samtale startet | `conversation_id`, `channel`, `language` |
| `ai_intent_detected` | Intent genkendt | `conversation_id`, `intent`, `confidence`, `entities` |
| `ai_clarification_needed` | AI beder om præcisering | `conversation_id`, `clarification_type`, `attempt_count` |
| `ai_item_added` | AI tilføjer produkt til ordre | `conversation_id`, `product_id`, `quantity` |
| `ai_order_created` | AI opretter ordre | `conversation_id`, `order_id`, `total`, `item_count` |
| `ai_escalation_triggered` | Samtale eskaleres | `conversation_id`, `reason`, `frustration_score` |
| `ai_conversation_ended` | Samtale afsluttet | `conversation_id`, `outcome`, `message_count`, `duration_sec` |
| `ai_feedback_received` | Kunde giver feedback | `conversation_id`, `rating`, `feedback_type` |

### 3.5 System Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `system_api_request` | API request | `endpoint`, `method`, `duration_ms`, `status_code` |
| `system_api_error` | API fejl | `endpoint`, `error_code`, `error_message` |
| `system_api_latency_high` | Latency over threshold | `endpoint`, `duration_ms`, `threshold_ms` |
| `system_database_query_slow` | Langsom query | `query_hash`, `duration_ms`, `rows_affected` |
| `system_webhook_received` | Webhook modtaget | `webhook_name`, `source` |
| `system_webhook_failed` | Webhook fejlede | `webhook_name`, `error`, `retry_count` |
| `system_job_started` | Background job startet | `job_name`, `job_id` |
| `system_job_completed` | Background job færdig | `job_name`, `job_id`, `duration_ms`, `success` |
| `system_auth_login` | Bruger logger ind | `user_id`, `method`, `device_type` |
| `system_auth_logout` | Bruger logger ud | `user_id`, `reason` |
| `system_auth_failed` | Login fejlet | `email_hash`, `reason`, `attempt_count` |

### 3.6 Navigation & Engagement Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `page_view` | Side indlæst | `page_path`, `page_title`, `referrer` |
| `page_scroll` | Bruger scroller | `page_path`, `scroll_depth_pct`, `direction` |
| `page_exit` | Bruger forlader side | `page_path`, `time_on_page_ms`, `exit_type` |
| `element_click` | Element klikket | `element_id`, `element_text`, `page_path` |
| `element_hover` | Element hover (>2 sek) | `element_id`, `hover_duration_ms` |
| `form_started` | Formular påbegyndt | `form_id`, `form_name` |
| `form_field_focus` | Felt får fokus | `form_id`, `field_name` |
| `form_field_error` | Felt validering fejler | `form_id`, `field_name`, `error_type` |
| `form_submitted` | Formular indsendt | `form_id`, `form_name`, `success` |
| `form_abandoned` | Formular forladt | `form_id`, `last_field`, `time_spent_sec` |

### 3.7 Event Tracking Implementation

```javascript
// js/analytics-tracker.js

class AnalyticsTracker {
    constructor(restaurantId) {
        this.restaurantId = restaurantId;
        this.sessionId = this.getOrCreateSession();
        this.visitorId = this.getOrCreateVisitor();
        this.eventQueue = [];
        this.flushInterval = 5000; // 5 sekunder

        this.startFlushTimer();
        this.trackPageView();
        this.setupScrollTracking();
        this.setupClickTracking();
    }

    // Generate anonymous visitor ID
    getOrCreateVisitor() {
        let visitorId = localStorage.getItem('flow_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + crypto.randomUUID();
            localStorage.setItem('flow_visitor_id', visitorId);
        }
        return visitorId;
    }

    // Session management
    getOrCreateSession() {
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min
        let session = JSON.parse(sessionStorage.getItem('flow_session') || 'null');

        if (!session || Date.now() - session.lastActivity > SESSION_TIMEOUT) {
            session = {
                id: 's_' + crypto.randomUUID(),
                startedAt: Date.now(),
                lastActivity: Date.now()
            };
            this.trackEvent('session_started', {});
        }

        session.lastActivity = Date.now();
        sessionStorage.setItem('flow_session', JSON.stringify(session));
        return session.id;
    }

    // Core tracking method
    trackEvent(eventName, properties = {}) {
        const event = {
            event_name: eventName,
            event_category: this.categorizeEvent(eventName),
            restaurant_id: this.restaurantId,
            session_id: this.sessionId,
            visitor_id: this.visitorId,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            page_title: document.title,
            event_data: properties
        };

        this.eventQueue.push(event);

        // Flush immediately for critical events
        if (this.isCriticalEvent(eventName)) {
            this.flush();
        }
    }

    categorizeEvent(eventName) {
        if (eventName.startsWith('checkout_')) return 'ecommerce';
        if (eventName.startsWith('ai_')) return 'ai';
        if (eventName.startsWith('social_')) return 'social';
        if (eventName.startsWith('system_')) return 'system';
        if (eventName.startsWith('page_') || eventName.startsWith('element_')) return 'engagement';
        return 'other';
    }

    isCriticalEvent(eventName) {
        const critical = [
            'checkout_completed',
            'checkout_payment_failed',
            'ai_order_created',
            'system_api_error'
        ];
        return critical.includes(eventName);
    }

    // Flush events to server
    async flush() {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            await fetch('/api/events/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events }),
                keepalive: true // Ensure delivery on page unload
            });
        } catch (error) {
            // Re-queue failed events
            this.eventQueue = [...events, ...this.eventQueue];
            console.error('Failed to flush events:', error);
        }
    }

    startFlushTimer() {
        setInterval(() => this.flush(), this.flushInterval);

        // Flush on page unload
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flush();
            }
        });
    }

    // Automatic page view tracking
    trackPageView() {
        this.trackEvent('page_view', {
            referrer: document.referrer,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
        });
    }

    // Scroll depth tracking
    setupScrollTracking() {
        let maxScroll = 0;
        const throttle = (fn, wait) => {
            let last = 0;
            return (...args) => {
                const now = Date.now();
                if (now - last >= wait) {
                    last = now;
                    fn(...args);
                }
            };
        };

        window.addEventListener('scroll', throttle(() => {
            const scrollPct = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );

            if (scrollPct > maxScroll) {
                maxScroll = scrollPct;

                // Track milestones
                [25, 50, 75, 100].forEach(milestone => {
                    if (scrollPct >= milestone && maxScroll < milestone) {
                        this.trackEvent('page_scroll', {
                            scroll_depth_pct: milestone
                        });
                    }
                });
            }
        }, 500));
    }

    // Click tracking
    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-track-click]') || e.target;

            this.trackEvent('element_click', {
                element_id: target.id || null,
                element_class: target.className || null,
                element_text: target.innerText?.substring(0, 100) || null,
                element_tag: target.tagName,
                viewport_x: e.clientX,
                viewport_y: e.clientY,
                page_x: e.pageX,
                page_y: e.pageY
            });
        });
    }

    // Checkout tracking helpers
    trackCheckoutStarted(cartValue, itemCount) {
        this.trackEvent('checkout_started', { cart_value: cartValue, item_count: itemCount });
    }

    trackItemAdded(product, quantity, cartTotal) {
        this.trackEvent('checkout_item_added', {
            product_id: product.id,
            product_name: product.name,
            product_category: product.category,
            quantity,
            price: product.price,
            cart_total: cartTotal
        });
    }

    trackOrderCompleted(order) {
        this.trackEvent('checkout_completed', {
            order_id: order.id,
            total: order.total,
            subtotal: order.subtotal,
            tax: order.tax,
            delivery_fee: order.delivery_fee,
            item_count: order.items.length,
            fulfillment_type: order.fulfillment_type,
            payment_method: order.payment_method
        });
    }

    // AI tracking helpers
    trackAIConversationStarted(conversationId, channel) {
        this.trackEvent('ai_conversation_started', {
            conversation_id: conversationId,
            channel
        });
    }

    trackAIIntentDetected(conversationId, intent, confidence, entities) {
        this.trackEvent('ai_intent_detected', {
            conversation_id: conversationId,
            intent,
            confidence,
            entities
        });
    }

    trackAIOrderCreated(conversationId, orderId, total) {
        this.trackEvent('ai_order_created', {
            conversation_id: conversationId,
            order_id: orderId,
            total
        });
    }
}

// Global instance
window.flowAnalytics = null;

function initAnalytics(restaurantId) {
    window.flowAnalytics = new AnalyticsTracker(restaurantId);
    return window.flowAnalytics;
}

export { AnalyticsTracker, initAnalytics };
```

---

## 4. Analytics & Dashboards

### 4.1 KPI Hierarki

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NORTH STAR METRICS                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ Månedlig Omsætning  │  │ Aktive Kunder       │  │ Ordre Volumen       │  │
│  │ (GMV)               │  │ (MAU)               │  │ (Orders/Month)      │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   ACQUISITION       │    │   ACTIVATION        │    │   RETENTION         │
│ • Nye besøgende     │    │ • Signup rate       │    │ • Churn rate        │
│ • Traffic kilder    │    │ • First order rate  │    │ • Repeat order rate │
│ • CAC               │    │ • Time to first ord │    │ • Customer LTV      │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   ENGAGEMENT        │    │   REVENUE           │    │   AI PERFORMANCE    │
│ • Sessions/user     │    │ • AOV               │    │ • Intent accuracy   │
│ • Pages/session     │    │ • Revenue/customer  │    │ • Order completion  │
│ • Time on site      │    │ • Channel mix       │    │ • Escalation rate   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### 4.2 Dashboard Specifikationer

#### 4.2.1 Executive Dashboard (Restaurant Ejer)

**Formål:** Hurtig oversigt over forretningens sundhed

| Widget | Metric | Beregning | Visualisering |
|--------|--------|-----------|---------------|
| **Dagens Omsætning** | `revenue_today` | SUM(orders.total) WHERE date = TODAY | Stort tal + sparkline |
| **Ordrer i dag** | `orders_today` | COUNT(orders) WHERE date = TODAY | Stort tal + vs. forrige uge |
| **Gns. Ordreværdi** | `aov_today` | revenue_today / orders_today | Tal + trend arrow |
| **Aktive ordrer** | `active_orders` | COUNT(orders) WHERE status IN ('pending', 'preparing', 'delivering') | Live counter |
| **Omsætning (7 dage)** | `revenue_7d` | SUM pr. dag, sidste 7 dage | Bar chart |
| **Top produkter** | `top_products` | ORDER BY units_sold DESC LIMIT 5 | Horisontal bar |
| **Kanal fordeling** | `channel_mix` | GROUP BY channel | Donut chart |
| **AI Performance** | `ai_metrics` | Ordrer via AI / Total AI samtaler | Gauge + tal |

**SQL for Executive Dashboard:**

```sql
-- Dagens metrics
SELECT
    COALESCE(SUM(total), 0) / 100.0 as revenue_dkk,
    COUNT(*) as order_count,
    COALESCE(AVG(total), 0) / 100.0 as avg_order_value,
    COUNT(*) FILTER (WHERE status IN ('pending', 'preparing', 'delivering')) as active_orders
FROM orders
WHERE restaurant_id = $1
AND created_at >= CURRENT_DATE
AND created_at < CURRENT_DATE + INTERVAL '1 day';

-- 7-dages trend
SELECT
    DATE(created_at) as date,
    SUM(total) / 100.0 as revenue,
    COUNT(*) as orders
FROM orders
WHERE restaurant_id = $1
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Top produkter
SELECT
    p.name,
    SUM(oi.quantity) as units_sold,
    SUM(oi.line_total) / 100.0 as revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.restaurant_id = $1
AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.name
ORDER BY units_sold DESC
LIMIT 5;

-- Kanal fordeling
SELECT
    COALESCE(ca.last_touch_channel, 'direct') as channel,
    COUNT(*) as orders,
    SUM(o.total) / 100.0 as revenue
FROM orders o
LEFT JOIN channel_attribution ca ON o.id = ca.order_id
WHERE o.restaurant_id = $1
AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ca.last_touch_channel;
```

#### 4.2.2 AI Performance Dashboard

**Formål:** Monitor og optimering af AI agent

| Widget | Metric | Beregning |
|--------|--------|-----------|
| **Samtaler i dag** | `conversations_today` | COUNT(ai_conversations) WHERE date = TODAY |
| **Completion Rate** | `completion_rate` | orders_created / total_conversations |
| **Gns. Beskeder** | `avg_messages` | AVG(message_count) |
| **Intent Accuracy** | `intent_accuracy` | correct_detections / total_detections |
| **Eskalering Rate** | `escalation_rate` | escalated / total_conversations |
| **Frustration Score** | `avg_frustration` | AVG(frustration_score) |
| **Top Intents** | `top_intents` | GROUP BY intent ORDER BY count |
| **Fejlede Intents** | `failed_intents` | WHERE outcome != 'order_completed' |

**SQL for AI Dashboard:**

```sql
-- AI Metrics Overview
SELECT
    COUNT(*) as total_conversations,
    COUNT(*) FILTER (WHERE outcome = 'order_completed') as orders_created,
    COUNT(*) FILTER (WHERE outcome = 'escalated') as escalations,
    AVG(message_count) as avg_messages,
    AVG(frustration_score) as avg_frustration,
    AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration_sec
FROM ai_conversations
WHERE restaurant_id = $1
AND started_at >= CURRENT_DATE - INTERVAL '7 days';

-- Intent Performance
SELECT
    am.detected_intent as intent,
    COUNT(*) as detection_count,
    AVG(am.intent_confidence) as avg_confidence,
    COUNT(*) FILTER (WHERE ac.outcome = 'order_completed') as successful_orders
FROM ai_messages am
JOIN ai_conversations ac ON am.conversation_id = ac.conversation_id
WHERE ac.restaurant_id = $1
AND am.detected_intent IS NOT NULL
AND ac.started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY am.detected_intent
ORDER BY detection_count DESC;
```

#### 4.2.3 Marketing Attribution Dashboard

**Formål:** Forstå hvilke kanaler driver salg

| Widget | Metric | Beregning |
|--------|--------|-----------|
| **Kanal Performance** | Per kanal | Revenue, Orders, AOV, Conversion |
| **Attribution Model** | First vs Last touch | Sammenligning af modeller |
| **Campaign ROI** | Per kampagne | Revenue / Cost |
| **Customer Journey** | Touchpoint path | Visualisering af stier |
| **Time to Convert** | Days/Sessions | Distribution af konverteringstid |

#### 4.2.4 Product Analytics Dashboard

**Formål:** Optimér menu og produkter

| Widget | Metric | Beregning |
|--------|--------|-----------|
| **Best Sellers** | Units sold | Top 10 produkter |
| **Revenue Leaders** | Revenue | Top 10 efter omsætning |
| **Conversion Funnel** | View → Cart → Purchase | Per produkt |
| **Category Mix** | Revenue per kategori | Pie chart |
| **Price Sensitivity** | Salg vs. pris ændringer | Correlation |
| **Frequently Together** | Cross-sell | Association rules |

**SQL for Product Insights:**

```sql
-- Produkt Performance Matrix
SELECT
    p.id,
    p.name,
    p.category,
    p.price / 100.0 as price_dkk,

    -- Sales metrics
    COALESCE(SUM(oi.quantity), 0) as units_sold,
    COALESCE(SUM(oi.line_total), 0) / 100.0 as revenue,
    COUNT(DISTINCT oi.order_id) as orders_containing,

    -- Visibility metrics
    COALESCE(pa.menu_views, 0) as menu_views,
    COALESCE(pa.add_to_cart, 0) as add_to_cart,

    -- Conversion rates
    CASE WHEN pa.menu_views > 0
         THEN pa.add_to_cart::DECIMAL / pa.menu_views
         ELSE 0 END as view_to_cart_rate,
    CASE WHEN pa.add_to_cart > 0
         THEN COUNT(DISTINCT oi.order_id)::DECIMAL / pa.add_to_cart
         ELSE 0 END as cart_to_purchase_rate

FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN (
    SELECT product_id, SUM(menu_views) as menu_views, SUM(add_to_cart) as add_to_cart
    FROM product_analytics
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY product_id
) pa ON p.id = pa.product_id
WHERE p.restaurant_id = $1
GROUP BY p.id, p.name, p.category, p.price, pa.menu_views, pa.add_to_cart
ORDER BY revenue DESC;

-- Frequently Bought Together
SELECT
    p1.name as product_1,
    p2.name as product_2,
    COUNT(*) as co_occurrence,
    COUNT(*)::DECIMAL / (
        SELECT COUNT(DISTINCT order_id) FROM order_items WHERE product_id = p1.id
    ) as lift
FROM order_items oi1
JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
JOIN products p1 ON oi1.product_id = p1.id
JOIN products p2 ON oi2.product_id = p2.id
JOIN orders o ON oi1.order_id = o.id
WHERE o.restaurant_id = $1
AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p1.id, p1.name, p2.id, p2.name
HAVING COUNT(*) >= 5
ORDER BY co_occurrence DESC
LIMIT 20;
```

#### 4.2.5 Operations Dashboard

**Formål:** Real-time drift monitoring

| Widget | Metric | Beregning |
|--------|--------|-----------|
| **System Status** | Health check | API, DB, Integrations status |
| **API Latency** | P50, P95, P99 | Percentiler af response time |
| **Error Rate** | Errors / Total | Per endpoint |
| **Active Sessions** | Live users | Real-time count |
| **Webhook Success** | Success rate | Per integration |
| **Database Performance** | Query times | Slow query log |

### 4.3 Report Specifikationer

#### 4.3.1 Daglig Rapport (Automatisk email)

```
FLOW Daglig Rapport - [Restaurant Navn]
Dato: [Dato]

═══════════════════════════════════════════════════════

📊 DAGENS RESULTATER
────────────────────────────────────────────────────────
Omsætning:          [X.XXX] DKK    ([+/-X%] vs. forrige uge)
Ordrer:             [XX]           ([+/-X%] vs. forrige uge)
Gns. Ordreværdi:    [XXX] DKK      ([+/-X%] vs. forrige uge)

🏆 TOP 3 PRODUKTER
────────────────────────────────────────────────────────
1. [Produkt navn]   [XX] solgt     [X.XXX] DKK
2. [Produkt navn]   [XX] solgt     [X.XXX] DKK
3. [Produkt navn]   [XX] solgt     [X.XXX] DKK

📱 KANAL FORDELING
────────────────────────────────────────────────────────
Web:        [XX%]  │████████████░░░░░░░░│
App:        [XX%]  │██████░░░░░░░░░░░░░░│
Instagram:  [XX%]  │████░░░░░░░░░░░░░░░░│
Facebook:   [XX%]  │██░░░░░░░░░░░░░░░░░░│
SMS:        [XX%]  │█░░░░░░░░░░░░░░░░░░░│

🤖 AI AGENT
────────────────────────────────────────────────────────
Samtaler:       [XX]
Ordrer skabt:   [XX]    ([XX%] completion rate)
Eskaleringer:   [X]

═══════════════════════════════════════════════════════
```

#### 4.3.2 Ugentlig Business Review

| Sektion | Indhold |
|---------|---------|
| **Executive Summary** | Key metrics + insights |
| **Revenue Analysis** | Daily breakdown, trends, forecast |
| **Product Performance** | Winners, losers, opportunities |
| **Channel Analysis** | Attribution, ROI per channel |
| **Customer Insights** | New vs. returning, segments |
| **AI Performance** | Accuracy, improvements, issues |
| **Recommendations** | Data-driven suggestions |

#### 4.3.3 Månedlig Benchmark Report

Sammenligning med anonymiseret industri benchmark:

| Metric | Din Restaurant | Industri Gns. | Percentil |
|--------|----------------|---------------|-----------|
| Gns. Ordreværdi | XXX DKK | XXX DKK | Top XX% |
| Ordrer/dag | XX | XX | Top XX% |
| Repeat Rate | XX% | XX% | Top XX% |
| AI Completion | XX% | XX% | Top XX% |

---

## 5. Webhooks & Integrationer

### 5.1 Webhook Arkitektur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INCOMING WEBHOOKS                                  │
├───────────────┬───────────────┬───────────────┬───────────────┬─────────────┤
│    Stripe     │   MobilePay   │   InMobile    │   Instagram   │   Wolt      │
│  (Payments)   │  (Payments)   │    (SMS)      │    (DMs)      │ (Delivery)  │
└───────┬───────┴───────┬───────┴───────┬───────┴───────┬───────┴──────┬──────┘
        │               │               │               │              │
        ▼               ▼               ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEBHOOK PROCESSOR                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 1. Signature Verification                                           │    │
│  │ 2. Rate Limiting                                                    │    │
│  │ 3. Payload Validation                                               │    │
│  │ 4. Idempotency Check (webhook_id)                                   │    │
│  │ 5. Log to webhook_logs                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EVENT HANDLERS                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Payment     │  │ Message     │  │ Social      │  │ Delivery            │ │
│  │ Handler     │  │ Handler     │  │ Handler     │  │ Handler             │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE UPDATES                                    │
│         orders, payments, messages, ai_conversations, etc.                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Incoming Webhook Endpoints

| Endpoint | Provider | Events |
|----------|----------|--------|
| `/api/webhooks/stripe` | Stripe | `payment_intent.succeeded`, `payment_intent.failed`, `charge.refunded` |
| `/api/webhooks/mobilepay` | MobilePay | `payment.captured`, `payment.cancelled` |
| `/api/webhooks/inmobile` | InMobile | `sms.received`, `sms.delivered`, `sms.failed` |
| `/api/webhooks/instagram` | Meta | `messaging`, `message_reactions` |
| `/api/webhooks/facebook` | Meta | `messages`, `messaging_postbacks` |
| `/api/webhooks/wolt` | Wolt | `order.created`, `order.status_changed`, `delivery.completed` |
| `/api/webhooks/economic` | e-conomic | `invoice.created`, `payment.registered` |

### 5.3 Outgoing Webhooks (til kundens systemer)

| Event | Payload | Retry Policy |
|-------|---------|--------------|
| `order.created` | Full order object | 3 retries, exponential backoff |
| `order.status_changed` | Order ID, new status, timestamp | 3 retries |
| `order.completed` | Full order + payment info | 5 retries |
| `payment.received` | Payment object | 5 retries |
| `customer.created` | Customer object (anonymized) | 3 retries |

### 5.4 Payment Gateway Integration

#### 5.4.1 Stripe Integration

```javascript
// Stripe webhook handler
async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        await logWebhook('stripe', 'incoming', req.body, { error: err.message }, 'failed');
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Idempotency check
    const existing = await supabase
        .from('webhook_logs')
        .select('id')
        .eq('webhook_name', 'stripe')
        .eq('request_body->id', event.id)
        .single();

    if (existing.data) {
        return res.status(200).json({ received: true, duplicate: true });
    }

    // Process event
    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;
        case 'charge.refunded':
            await handleRefund(event.data.object);
            break;
    }

    await logWebhook('stripe', 'incoming', event, { processed: true }, 'success');
    res.status(200).json({ received: true });
}

async function handlePaymentSuccess(paymentIntent) {
    const { order_id, restaurant_id } = paymentIntent.metadata;

    // Update payment record
    await supabase.from('payments').update({
        status: 'completed',
        provider_transaction_id: paymentIntent.id,
        provider_response: paymentIntent,
        completed_at: new Date().toISOString()
    }).eq('order_id', order_id);

    // Update order status
    await supabase.from('orders').update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
    }).eq('id', order_id);

    // Update restaurant revenue
    await supabase.rpc('increment_revenue', {
        p_restaurant_id: restaurant_id,
        p_amount: paymentIntent.amount
    });

    // Log activity
    await logActivity(null, 'payment_received', `Betaling modtaget: ${paymentIntent.amount / 100} DKK`, {
        category: 'order',
        subCategory: 'payment',
        order_id,
        amount: paymentIntent.amount
    });

    // Send confirmation
    await triggerOrderConfirmation(order_id);
}
```

#### 5.4.2 MobilePay Integration

```javascript
// MobilePay webhook handler
async function handleMobilePayWebhook(req, res) {
    const { event, data } = req.body;

    await logWebhook('mobilepay', 'incoming', req.body, null, 'processing');

    switch (event) {
        case 'payment.captured':
            await handleMobilePayCapture(data);
            break;
        case 'payment.cancelled':
            await handleMobilePayCancel(data);
            break;
    }

    res.status(200).json({ received: true });
}
```

### 5.5 Social Platform Integrations

#### 5.5.1 Instagram DM Webhook

```javascript
// Instagram webhook handler
async function handleInstagramWebhook(req, res) {
    const { object, entry } = req.body;

    if (object !== 'instagram') {
        return res.status(400).json({ error: 'Invalid object' });
    }

    for (const e of entry) {
        for (const messaging of e.messaging || []) {
            await processInstagramMessage(messaging);
        }
    }

    res.status(200).send('EVENT_RECEIVED');
}

async function processInstagramMessage(messaging) {
    const { sender, recipient, message, timestamp } = messaging;

    // Log incoming message
    await supabase.from('messages').insert({
        phone: sender.id,  // IG user ID
        direction: 'inbound',
        content: message.text,
        provider: 'instagram',
        raw_payload: messaging
    });

    // Find or create AI conversation
    const conversationId = `ig_${sender.id}_${Date.now()}`;

    // Route to AI agent
    const aiResponse = await processAIMessage({
        conversationId,
        channel: 'instagram_dm',
        userId: sender.id,
        message: message.text,
        restaurantId: await getRestaurantByIgAccount(recipient.id)
    });

    // Send response via Instagram API
    await sendInstagramMessage(recipient.id, sender.id, aiResponse.text);
}
```

### 5.6 SMS Integration (InMobile)

```javascript
// SMS webhook handler
async function handleSMSWebhook(req, res) {
    const { msisdn, message, shortcode, receivedTimestamp } = req.body;

    // Normalize phone number
    const phone = normalizePhoneNumber(msisdn);

    // Log incoming SMS
    await supabase.from('messages').insert({
        phone,
        direction: 'inbound',
        content: message,
        provider: 'inmobile',
        raw_payload: req.body
    });

    // Track event
    await trackEvent('social_sms_received', {
        phone_hash: hashPhone(phone),
        keyword: message.split(' ')[0]?.toUpperCase()
    });

    // Find restaurant by shortcode
    const restaurant = await getRestaurantByShortcode(shortcode);
    if (!restaurant) {
        return res.status(200).json({ received: true });
    }

    // Check for campaign keyword
    const campaign = await findCampaignByKeyword(restaurant.id, message);
    if (campaign) {
        await handleCampaignResponse(campaign, phone, message);
    } else {
        // Route to AI agent for natural conversation
        await routeToAIAgent(restaurant.id, phone, message, 'sms');
    }

    res.status(200).json({ received: true });
}
```

### 5.7 Accounting System Integrations

#### 5.7.1 e-conomic Integration

```javascript
// Sync order to e-conomic
async function syncOrderToEconomic(orderId) {
    const order = await getOrderWithItems(orderId);
    const config = await getIntegrationConfig(order.restaurant_id, 'accounting', 'economic');

    if (!config || config.status !== 'active') return;

    // Map to e-conomic invoice format
    const invoice = {
        date: order.created_at.split('T')[0],
        currency: 'DKK',
        customer: {
            customerNumber: await getOrCreateEconomicCustomer(order.customer, config)
        },
        layout: { layoutNumber: config.config.invoiceLayoutId },
        lines: order.items.map(item => ({
            description: item.product_name,
            quantity: item.quantity,
            unitNetPrice: item.unit_price / 100,
            product: { productNumber: item.product_sku || 'FLOW-PRODUCT' }
        }))
    };

    // Add delivery fee if applicable
    if (order.delivery_fee > 0) {
        invoice.lines.push({
            description: 'Levering',
            quantity: 1,
            unitNetPrice: order.delivery_fee / 100,
            product: { productNumber: 'DELIVERY' }
        });
    }

    // Create invoice in e-conomic
    const response = await economicAPI.post('/invoices/drafts', invoice, {
        headers: {
            'X-AppSecretToken': config.credentials_encrypted.appToken,
            'X-AgreementGrantToken': config.credentials_encrypted.agreementToken
        }
    });

    // Log sync
    await supabase.from('api_logs').insert({
        restaurant_id: order.restaurant_id,
        api_name: 'economic',
        endpoint: '/invoices/drafts',
        method: 'POST',
        response_status: response.status,
        success: true
    });

    // Update integration last sync
    await supabase.from('integration_configs').update({
        last_sync_at: new Date().toISOString()
    }).match({
        restaurant_id: order.restaurant_id,
        integration_name: 'economic'
    });
}
```

### 5.8 Delivery Platform Integrations

```javascript
// Wolt integration
async function handleWoltWebhook(req, res) {
    const { event_type, data } = req.body;

    switch (event_type) {
        case 'order.created':
            // Import order from Wolt
            await importWoltOrder(data);
            break;

        case 'order.status_changed':
            // Sync status back
            await syncWoltOrderStatus(data.order_id, data.status);
            break;

        case 'delivery.completed':
            // Mark order as delivered
            await completeWoltDelivery(data);
            break;
    }

    res.status(200).json({ received: true });
}

async function importWoltOrder(woltOrder) {
    const restaurant = await getRestaurantByWoltVenueId(woltOrder.venue.id);

    // Create order in FLOW
    const { data: order } = await supabase.from('orders').insert({
        restaurant_id: restaurant.id,
        status: 'confirmed',
        subtotal: woltOrder.price.amount,
        delivery_fee: woltOrder.delivery_fee.amount,
        total: woltOrder.total_price.amount,
        metadata: {
            source: 'wolt',
            wolt_order_id: woltOrder.id
        }
    }).select().single();

    // Import items
    for (const item of woltOrder.items) {
        const product = await findProductByName(restaurant.id, item.name);

        await supabase.from('order_items').insert({
            order_id: order.id,
            product_id: product?.id,
            product_name: item.name,
            quantity: item.count,
            unit_price: item.unit_price.amount,
            line_total: item.total_price.amount
        });
    }

    // Track channel attribution
    await supabase.from('channel_attribution').insert({
        order_id: order.id,
        restaurant_id: restaurant.id,
        first_touch_channel: 'delivery_platform',
        first_touch_source: 'wolt',
        last_touch_channel: 'delivery_platform',
        last_touch_source: 'wolt'
    });
}
```

---

## 6. Databrug

### 6.1 Personalisering

#### 6.1.1 Bruger Personalisering

| Datakilde | Personalisering | Implementation |
|-----------|-----------------|----------------|
| **Ordrehistorik** | "Dine favoritter" sektion | Viser top 5 mest bestilte produkter |
| **Bestillingstidspunkt** | Tidsbaserede anbefalinger | Morgenmad før kl. 11, frokost 11-14, etc. |
| **Tidligere valg** | Forudfyldt checkout | Husker levering/afhentning, adresse, betalingsmetode |
| **Sæson/vejr** | Kontekstuelle forslag | Varme retter når det er koldt, is når det er varmt |
| **Segment** | Tilpassede tilbud | VIP får eksklusive deals, nye får velkomsttilbud |

**Implementation:**

```sql
-- Personalized recommendations function
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
    p_customer_phone TEXT,
    p_restaurant_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    recommendation_type TEXT,
    score DECIMAL
) AS $$
BEGIN
    RETURN QUERY

    -- Combine multiple signals
    WITH customer_favorites AS (
        SELECT
            oi.product_id,
            COUNT(*) as order_count,
            MAX(o.created_at) as last_ordered
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.restaurant_id = p_restaurant_id
        AND o.customer_phone = p_customer_phone
        GROUP BY oi.product_id
    ),
    trending_products AS (
        SELECT
            oi.product_id,
            COUNT(*) as recent_orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.restaurant_id = p_restaurant_id
        AND o.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY oi.product_id
    ),
    time_based AS (
        SELECT
            p.id as product_id,
            CASE
                WHEN EXTRACT(HOUR FROM NOW()) < 11 AND p.category = 'breakfast' THEN 1.5
                WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 11 AND 14 AND p.category = 'lunch' THEN 1.5
                WHEN EXTRACT(HOUR FROM NOW()) >= 17 AND p.category = 'dinner' THEN 1.5
                ELSE 1.0
            END as time_multiplier
        FROM products p
        WHERE p.restaurant_id = p_restaurant_id
    )
    SELECT
        p.id as product_id,
        p.name as product_name,
        CASE
            WHEN cf.order_count > 0 THEN 'favorite'
            WHEN tp.recent_orders > 10 THEN 'trending'
            ELSE 'suggested'
        END as recommendation_type,
        (
            COALESCE(cf.order_count, 0) * 10 +
            COALESCE(tp.recent_orders, 0) * 2 +
            tb.time_multiplier * 5
        ) as score
    FROM products p
    LEFT JOIN customer_favorites cf ON p.id = cf.product_id
    LEFT JOIN trending_products tp ON p.id = tp.product_id
    LEFT JOIN time_based tb ON p.id = tb.product_id
    WHERE p.restaurant_id = p_restaurant_id
    AND p.is_active = true
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

#### 6.1.2 AI Agent Personalisering

| Signal | Brug i AI | Eksempel |
|--------|-----------|----------|
| **Tidligere ordrer** | Genkender vaner | "Vil du have det sædvanlige - en Margherita?" |
| **Navnegenkendelse** | Personlig hilsen | "Hej Martin, hvad kan jeg hjælpe med?" |
| **Præferencer** | Undgår allergener | Foreslår aldrig produkter med ingredienser kunden har frasagt |
| **Kommunikationsstil** | Tilpasser tone | Kort og kontant til B2B, venlig til familier |
| **Sprog** | Auto-detection | Skifter til engelsk hvis kunden skriver på engelsk |

### 6.2 Forudsigelser (Predictive Analytics)

#### 6.2.1 Demand Forecasting

```sql
-- Predict tomorrow's orders based on historical patterns
CREATE OR REPLACE FUNCTION predict_daily_orders(
    p_restaurant_id UUID,
    p_date DATE
)
RETURNS TABLE (
    predicted_orders INTEGER,
    confidence_interval_low INTEGER,
    confidence_interval_high INTEGER,
    factors JSONB
) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_avg_orders DECIMAL;
    v_std_dev DECIMAL;
    v_trend_factor DECIMAL;
    v_seasonal_factor DECIMAL;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- Calculate average for same weekday
    SELECT
        AVG(order_count),
        STDDEV(order_count)
    INTO v_avg_orders, v_std_dev
    FROM (
        SELECT DATE(created_at) as order_date, COUNT(*) as order_count
        FROM orders
        WHERE restaurant_id = p_restaurant_id
        AND EXTRACT(DOW FROM created_at) = v_day_of_week
        AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE(created_at)
    ) daily_orders;

    -- Calculate trend (growth/decline)
    SELECT
        CASE
            WHEN last_month_avg > 0 THEN this_month_avg / last_month_avg
            ELSE 1.0
        END
    INTO v_trend_factor
    FROM (
        SELECT
            AVG(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE NULL END) as this_month_avg,
            AVG(CASE WHEN created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN 1 ELSE NULL END) as last_month_avg
        FROM orders
        WHERE restaurant_id = p_restaurant_id
    ) trends;

    -- Seasonal factor (simplified - could use more sophisticated model)
    v_seasonal_factor := 1.0;

    RETURN QUERY
    SELECT
        ROUND(v_avg_orders * v_trend_factor * v_seasonal_factor)::INTEGER as predicted_orders,
        GREATEST(0, ROUND(v_avg_orders - 2 * COALESCE(v_std_dev, 0)))::INTEGER as confidence_interval_low,
        ROUND(v_avg_orders + 2 * COALESCE(v_std_dev, 0))::INTEGER as confidence_interval_high,
        jsonb_build_object(
            'day_of_week', v_day_of_week,
            'historical_avg', v_avg_orders,
            'trend_factor', v_trend_factor,
            'seasonal_factor', v_seasonal_factor
        ) as factors;
END;
$$ LANGUAGE plpgsql;
```

#### 6.2.2 Churn Prediction

```sql
-- Identify customers at risk of churning
CREATE OR REPLACE FUNCTION get_churn_risk_customers(
    p_restaurant_id UUID
)
RETURNS TABLE (
    customer_phone TEXT,
    customer_name TEXT,
    days_since_last_order INTEGER,
    total_orders INTEGER,
    avg_order_frequency_days DECIMAL,
    churn_risk_score DECIMAL,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH customer_stats AS (
        SELECT
            customer_phone,
            MAX(customer_name) as customer_name,
            MAX(created_at) as last_order,
            COUNT(*) as order_count,
            CASE
                WHEN COUNT(*) > 1 THEN
                    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / (COUNT(*) - 1) / 86400
                ELSE NULL
            END as avg_days_between
        FROM orders
        WHERE restaurant_id = p_restaurant_id
        AND customer_phone IS NOT NULL
        GROUP BY customer_phone
        HAVING COUNT(*) >= 2
    )
    SELECT
        cs.customer_phone,
        cs.customer_name,
        EXTRACT(DAY FROM NOW() - cs.last_order)::INTEGER as days_since_last,
        cs.order_count::INTEGER as total_orders,
        cs.avg_days_between,
        CASE
            WHEN cs.avg_days_between IS NULL THEN 0.5
            WHEN EXTRACT(DAY FROM NOW() - cs.last_order) > cs.avg_days_between * 3 THEN 0.9
            WHEN EXTRACT(DAY FROM NOW() - cs.last_order) > cs.avg_days_between * 2 THEN 0.7
            WHEN EXTRACT(DAY FROM NOW() - cs.last_order) > cs.avg_days_between * 1.5 THEN 0.5
            ELSE 0.2
        END as churn_risk_score,
        CASE
            WHEN EXTRACT(DAY FROM NOW() - cs.last_order) > cs.avg_days_between * 3 THEN 'Urgent: Send win-back offer'
            WHEN EXTRACT(DAY FROM NOW() - cs.last_order) > cs.avg_days_between * 2 THEN 'Send reminder SMS'
            WHEN EXTRACT(DAY FROM NOW() - cs.last_order) > cs.avg_days_between * 1.5 THEN 'Schedule follow-up'
            ELSE 'No action needed'
        END as recommended_action
    FROM customer_stats cs
    WHERE EXTRACT(DAY FROM NOW() - cs.last_order) > cs.avg_days_between * 1.5
    ORDER BY churn_risk_score DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
```

### 6.3 AI Forbedring

#### 6.3.1 Intent Training Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI IMPROVEMENT PIPELINE                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Raw Data   │────▶│  Analysis   │────▶│  Training   │────▶│  Deploy     │
│  Collection │     │  & Labeling │     │  & Testing  │     │  & Monitor  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ • Samtaler  │     │ • Mislykket │     │ • Fine-tune │     │ • A/B test  │
│ • Intents   │     │   intents   │     │   prompts   │     │ • Metrics   │
│ • Feedback  │     │ • Edge cases│     │ • Validate  │     │ • Alerts    │
│ • Errors    │     │ • Patterns  │     │   accuracy  │     │ • Rollback  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Data til AI forbedring:**

```sql
-- Get failed intent detections for training
SELECT
    am.content as user_message,
    am.detected_intent,
    am.intent_confidence,
    ac.outcome,
    af.correct_value as actual_intent,
    af.feedback_notes
FROM ai_messages am
JOIN ai_conversations ac ON am.conversation_id = ac.conversation_id
LEFT JOIN ai_feedback af ON am.id = af.message_id AND af.feedback_type = 'intent_correction'
WHERE am.role = 'user'
AND (
    am.intent_confidence < 0.7
    OR ac.outcome IN ('abandoned', 'escalated')
    OR af.id IS NOT NULL
)
ORDER BY am.timestamp DESC
LIMIT 1000;

-- Get successful patterns for reinforcement
SELECT
    am.detected_intent,
    array_agg(DISTINCT am.content) as example_messages,
    COUNT(*) as occurrence_count,
    AVG(am.intent_confidence) as avg_confidence
FROM ai_messages am
JOIN ai_conversations ac ON am.conversation_id = ac.conversation_id
WHERE am.role = 'user'
AND am.detected_intent IS NOT NULL
AND ac.outcome = 'order_completed'
AND am.intent_confidence > 0.85
GROUP BY am.detected_intent
ORDER BY occurrence_count DESC;
```

#### 6.3.2 Response Quality Improvement

```sql
-- Analyze response patterns that lead to escalation
WITH escalated_convos AS (
    SELECT conversation_id
    FROM ai_conversations
    WHERE outcome = 'escalated'
    AND started_at >= NOW() - INTERVAL '30 days'
),
successful_convos AS (
    SELECT conversation_id
    FROM ai_conversations
    WHERE outcome = 'order_completed'
    AND started_at >= NOW() - INTERVAL '30 days'
)
SELECT
    am.conversation_state,
    am.detected_intent,
    COUNT(*) FILTER (WHERE ec.conversation_id IS NOT NULL) as escalation_count,
    COUNT(*) FILTER (WHERE sc.conversation_id IS NOT NULL) as success_count,
    COUNT(*) FILTER (WHERE ec.conversation_id IS NOT NULL)::DECIMAL /
        NULLIF(COUNT(*), 0) as escalation_rate
FROM ai_messages am
LEFT JOIN escalated_convos ec ON am.conversation_id = ec.conversation_id
LEFT JOIN successful_convos sc ON am.conversation_id = sc.conversation_id
WHERE am.role = 'assistant'
GROUP BY am.conversation_state, am.detected_intent
HAVING COUNT(*) >= 10
ORDER BY escalation_rate DESC;
```

### 6.4 Marketing Automation

#### 6.4.1 Automated Campaigns

| Trigger | Segment | Besked | Timing |
|---------|---------|--------|--------|
| **Første ordre** | Nye kunder | "Tak for din første ordre! Her er 10% rabat på næste" | 24 timer efter |
| **Inaktivitet** | 14+ dage siden ordre | "Vi savner dig! Bestil i dag og få gratis levering" | Dag 14 |
| **Fødselsdag** | Kunder med birthday | "Tillykke med fødselsdagen! Her er en gratis dessert" | På dagen |
| **Loyalitet milestone** | Når tier ændres | "Tillykke! Du er nu Gold medlem med 50% ekstra points" | Ved ændring |
| **Vognafbrydelse** | Afbrudt checkout | "Glemte du noget? Din ordre venter stadig" | 1 time efter |
| **Vejr-baseret** | Alle i område | "Regnvejr? Bestil varme retter med levering" | Ved regn |

**Automation Engine:**

```javascript
// Marketing automation scheduler
async function runAutomationEngine() {
    const automations = [
        { name: 'welcome_series', handler: runWelcomeSeries },
        { name: 'churn_prevention', handler: runChurnPrevention },
        { name: 'birthday_campaign', handler: runBirthdayCampaign },
        { name: 'loyalty_milestone', handler: runLoyaltyMilestone },
        { name: 'cart_abandonment', handler: runCartAbandonment }
    ];

    for (const automation of automations) {
        try {
            const results = await automation.handler();
            await logAutomationRun(automation.name, results);
        } catch (error) {
            await logAutomationError(automation.name, error);
        }
    }
}

async function runChurnPrevention() {
    // Get at-risk customers
    const { data: atRisk } = await supabase.rpc('get_churn_risk_customers');

    const results = { sent: 0, skipped: 0 };

    for (const customer of atRisk) {
        // Check if already contacted recently
        const recentContact = await checkRecentCampaignSend(
            customer.customer_phone,
            'churn_prevention',
            7 // days
        );

        if (recentContact) {
            results.skipped++;
            continue;
        }

        // Select message based on risk score
        const message = customer.churn_risk_score > 0.8
            ? `Vi savner dig, ${customer.customer_name}! Bestil i dag og få 20% rabat med kode COMEBACK20`
            : `Hej ${customer.customer_name}! Det er et stykke tid siden sidst. Se vores nye menu her: [link]`;

        // Send SMS
        await sendSMS(customer.customer_phone, message);

        // Log send
        await logCampaignSend('churn_prevention', customer.customer_phone, message);

        results.sent++;
    }

    return results;
}
```

### 6.5 Produktstrategi

#### 6.5.1 Menu Optimering

```sql
-- Product performance analysis for menu optimization
WITH product_metrics AS (
    SELECT
        p.id,
        p.name,
        p.category,
        p.price / 100.0 as price_dkk,
        p.cost / 100.0 as cost_dkk,
        COUNT(DISTINCT oi.order_id) as orders_containing,
        SUM(oi.quantity) as units_sold,
        SUM(oi.line_total) / 100.0 as revenue,
        SUM(oi.quantity * (p.price - COALESCE(p.cost, 0))) / 100.0 as gross_profit
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= NOW() - INTERVAL '30 days'
    WHERE p.restaurant_id = $1
    GROUP BY p.id, p.name, p.category, p.price, p.cost
),
rankings AS (
    SELECT
        *,
        PERCENT_RANK() OVER (ORDER BY units_sold) as popularity_rank,
        PERCENT_RANK() OVER (ORDER BY gross_profit / NULLIF(units_sold, 0)) as profitability_rank
    FROM product_metrics
)
SELECT
    id,
    name,
    category,
    price_dkk,
    units_sold,
    revenue,
    gross_profit,
    CASE
        WHEN popularity_rank >= 0.75 AND profitability_rank >= 0.75 THEN 'STAR'      -- High popularity, high profit
        WHEN popularity_rank >= 0.75 AND profitability_rank < 0.25 THEN 'WORKHORSE'  -- High popularity, low profit
        WHEN popularity_rank < 0.25 AND profitability_rank >= 0.75 THEN 'PUZZLE'     -- Low popularity, high profit
        ELSE 'DOG'                                                                     -- Low both
    END as bcg_classification,
    CASE
        WHEN popularity_rank >= 0.75 AND profitability_rank >= 0.75 THEN 'Promote heavily, premium positioning'
        WHEN popularity_rank >= 0.75 AND profitability_rank < 0.25 THEN 'Consider price increase or cost reduction'
        WHEN popularity_rank < 0.25 AND profitability_rank >= 0.75 THEN 'Increase visibility, bundle with popular items'
        ELSE 'Consider removing from menu or repositioning'
    END as recommendation
FROM rankings
ORDER BY
    CASE
        WHEN popularity_rank >= 0.75 AND profitability_rank >= 0.75 THEN 1
        WHEN popularity_rank >= 0.75 AND profitability_rank < 0.25 THEN 2
        WHEN popularity_rank < 0.25 AND profitability_rank >= 0.75 THEN 3
        ELSE 4
    END,
    gross_profit DESC;
```

---

## 7. Datamonetisering

### 7.1 Anonymiseret Industri Benchmark

#### 7.1.1 Benchmark Service

FLOW kan tilbyde anonymiserede benchmarks til restauranter som premium feature:

| Benchmark Kategori | Metrics | Værdi for Kunder |
|-------------------|---------|------------------|
| **Omsætning** | Gns. daglig/ugentlig/månedlig per segment | Sammenlign performance |
| **Produktmix** | Kategorifordeling, bestseller patterns | Optimér menu |
| **Kanal** | Web vs. app vs. social fordeling | Investeringsbeslutninger |
| **Peak Hours** | Travleste timer per segment | Bemanding |
| **Konvertering** | Checkout completion rate | UX benchmark |
| **AI Adoption** | AI ordre andel i branchen | Feature værdi |

**Aggregeringslogik:**

```sql
-- Generate weekly benchmark aggregates
CREATE OR REPLACE FUNCTION generate_benchmark_aggregates()
RETURNS void AS $$
BEGIN
    INSERT INTO benchmark_aggregates (
        period_type,
        period_start,
        period_end,
        industry_segment,
        size_segment,
        region,
        restaurant_count,
        avg_daily_revenue,
        median_daily_revenue,
        p25_daily_revenue,
        p75_daily_revenue,
        avg_order_value,
        avg_orders_per_day,
        pct_orders_web,
        pct_orders_app,
        pct_orders_social,
        avg_conversion_rate,
        avg_return_customer_rate
    )
    SELECT
        'weekly' as period_type,
        DATE_TRUNC('week', NOW() - INTERVAL '1 week') as period_start,
        DATE_TRUNC('week', NOW()) - INTERVAL '1 day' as period_end,
        r.industry_segment,
        CASE
            WHEN dm.avg_daily_orders < 20 THEN 'small'
            WHEN dm.avg_daily_orders < 50 THEN 'medium'
            ELSE 'large'
        END as size_segment,
        r.region,
        COUNT(DISTINCT r.id) as restaurant_count,
        AVG(dm.total_revenue) as avg_daily_revenue,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dm.total_revenue) as median_daily_revenue,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY dm.total_revenue) as p25_daily_revenue,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY dm.total_revenue) as p75_daily_revenue,
        AVG(dm.avg_order_value) as avg_order_value,
        AVG(dm.total_orders) as avg_orders_per_day,
        AVG(dm.orders_web::DECIMAL / NULLIF(dm.total_orders, 0) * 100) as pct_orders_web,
        AVG(dm.orders_app::DECIMAL / NULLIF(dm.total_orders, 0) * 100) as pct_orders_app,
        AVG((dm.orders_instagram + dm.orders_facebook + dm.orders_sms)::DECIMAL / NULLIF(dm.total_orders, 0) * 100) as pct_orders_social,
        AVG(dm.unique_visitors::DECIMAL / NULLIF(dm.total_sessions, 0)) as avg_conversion_rate,
        0 as avg_return_customer_rate  -- Calculated separately
    FROM restaurants r
    JOIN daily_metrics dm ON r.id = dm.restaurant_id
    WHERE dm.date >= DATE_TRUNC('week', NOW() - INTERVAL '1 week')
    AND dm.date < DATE_TRUNC('week', NOW())
    AND r.status = 'active'
    GROUP BY
        r.industry_segment,
        CASE
            WHEN dm.avg_daily_orders < 20 THEN 'small'
            WHEN dm.avg_daily_orders < 50 THEN 'medium'
            ELSE 'large'
        END,
        r.region
    HAVING COUNT(DISTINCT r.id) >= 5;  -- Minimum 5 restaurants for anonymity
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Partner API (B2B)

#### 7.2.1 Aggregeret Data API

For godkendte partnere (efter samtykke og kontrakt):

| Endpoint | Data | Anvendelse |
|----------|------|------------|
| `/api/partner/trends` | Aggregerede trends | Markedsanalyse |
| `/api/partner/segments` | Segmentperformance | Investorrapporter |
| `/api/partner/seasonal` | Sæsonmønstre | Planlægning |

**Alle data er:**
- Aggregeret på minimum 10 restauranter
- Anonymiseret (ingen PII)
- Forsinket minimum 48 timer
- Rate limited
- Logget for audit

### 7.3 Premium Insights Feature

| Feature | Beskrivelse | Pris |
|---------|-------------|------|
| **Basic** | Egne metrics + industri gns. | Inkluderet |
| **Pro** | + Segmentbenchmark + trends | +99 DKK/md |
| **Enterprise** | + Custom rapporter + API adgang | +299 DKK/md |

---

## 8. Compliance

### 8.1 GDPR Krav

#### 8.1.1 Databehandleroversigt

| Datakategori | Lovhjemmel | Behandlingsgrundlag |
|--------------|------------|---------------------|
| **Ordredata** | Kontraktopfyldelse | Art. 6(1)(b) |
| **Bogføringsdata** | Juridisk forpligtelse | Art. 6(1)(c) |
| **Marketing (SMS/Email)** | Samtykke | Art. 6(1)(a) |
| **Analytics** | Legitim interesse | Art. 6(1)(f) |
| **AI træning** | Legitim interesse + anonymisering | Art. 6(1)(f) |

#### 8.1.2 Samtykke Management

```sql
-- Check valid consent before any marketing action
CREATE OR REPLACE FUNCTION check_marketing_consent(
    p_user_id UUID,
    p_consent_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_consents
        WHERE user_id = p_user_id
        AND consent_type = p_consent_type
        AND granted = true
        AND withdrawn_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Record consent with full context
CREATE OR REPLACE FUNCTION record_consent(
    p_user_id UUID,
    p_consent_type TEXT,
    p_granted BOOLEAN,
    p_consent_version TEXT,
    p_consent_text TEXT,
    p_collection_method TEXT,
    p_ip_address INET,
    p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
    v_consent_id UUID;
BEGIN
    -- If withdrawing, update existing
    IF NOT p_granted THEN
        UPDATE user_consents
        SET
            granted = false,
            withdrawn_at = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id
        AND consent_type = p_consent_type
        AND granted = true
        RETURNING id INTO v_consent_id;

        IF v_consent_id IS NOT NULL THEN
            RETURN v_consent_id;
        END IF;
    END IF;

    -- Insert new consent record
    INSERT INTO user_consents (
        user_id,
        consent_type,
        granted,
        consent_version,
        consent_text,
        collection_method,
        ip_address,
        user_agent,
        granted_at
    ) VALUES (
        p_user_id,
        p_consent_type,
        p_granted,
        p_consent_version,
        p_consent_text,
        p_collection_method,
        p_ip_address,
        p_user_agent,
        CASE WHEN p_granted THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_consent_id;

    RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql;
```

### 8.2 Data Retention Policies

| Datakategori | Retention | Handling efter udløb |
|--------------|-----------|----------------------|
| **Aktive brugerdata** | Aktiv periode + 30 dage | Slettes på anmodning |
| **Bogføringsdata** | 5 år (Bogføringsloven) | Anonymiseres, arkiveres |
| **Ordrehistorik** | 5 år | Anonymiseres |
| **Marketing samtykker** | 5 år efter tilbagetrækning | Audit log bevares |
| **AI samtaler** | 1 år | Anonymiseres for træning |
| **Analytics events** | 2 år | Aggregeres, slettes |
| **System logs** | 90 dage | Slettes |
| **Error logs** | 1 år | Slettes |
| **Webhook logs** | 30 dage | Slettes |

**Automated cleanup job:**

```sql
-- Run daily at 02:00
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete old system logs
    DELETE FROM system_logs WHERE timestamp < NOW() - INTERVAL '90 days';

    -- Delete old webhook logs
    DELETE FROM webhook_logs WHERE received_at < NOW() - INTERVAL '30 days';

    -- Delete old API logs
    DELETE FROM api_logs WHERE timestamp < NOW() - INTERVAL '30 days';

    -- Anonymize old analytics events
    UPDATE events
    SET
        event_data = event_data - 'user_id' - 'ip_address',
        session_id = NULL
    WHERE timestamp < NOW() - INTERVAL '2 years'
    AND session_id IS NOT NULL;

    -- Aggregate and delete old page views
    INSERT INTO page_view_aggregates (page_path, date, view_count)
    SELECT page_path, DATE(entered_at), COUNT(*)
    FROM page_views
    WHERE entered_at < NOW() - INTERVAL '90 days'
    GROUP BY page_path, DATE(entered_at)
    ON CONFLICT (page_path, date) DO UPDATE SET view_count = page_view_aggregates.view_count + EXCLUDED.view_count;

    DELETE FROM page_views WHERE entered_at < NOW() - INTERVAL '90 days';

    -- Log cleanup
    INSERT INTO system_logs (log_level, log_category, service, message)
    VALUES ('info', 'maintenance', 'cleanup_job', 'Data cleanup completed');
END;
$$ LANGUAGE plpgsql;
```

### 8.3 Anonymisering

```sql
-- Anonymize customer data (GDPR deletion request)
CREATE OR REPLACE FUNCTION anonymize_customer_data(
    p_restaurant_id UUID,
    p_performed_by UUID
)
RETURNS void AS $$
DECLARE
    v_archived_data JSONB;
BEGIN
    -- Archive financial data for legal requirements
    SELECT jsonb_build_object(
        'total_revenue', revenue_total,
        'order_count', (SELECT COUNT(*) FROM orders WHERE restaurant_id = p_restaurant_id),
        'date_range', jsonb_build_object(
            'first_order', (SELECT MIN(created_at) FROM orders WHERE restaurant_id = p_restaurant_id),
            'last_order', (SELECT MAX(created_at) FROM orders WHERE restaurant_id = p_restaurant_id)
        ),
        'anonymized_at', NOW()
    )
    INTO v_archived_data
    FROM restaurants
    WHERE id = p_restaurant_id;

    -- Anonymize restaurant
    UPDATE restaurants SET
        name = '[GDPR ANONYMISERET]',
        cvr = '00000000',
        contact_name = '[SLETTET]',
        contact_email = NULL,
        contact_phone = NULL,
        address = NULL,
        city = NULL,
        postal_code = NULL,
        settings = '{}',
        metadata = '{}',
        archived_data = v_archived_data,
        gdpr_deleted_at = NOW(),
        status = 'gdpr_deleted'
    WHERE id = p_restaurant_id;

    -- Anonymize orders (keep for accounting)
    UPDATE orders SET
        customer_name = '[SLETTET]',
        customer_phone = NULL,
        customer_email = NULL,
        delivery_address = NULL,
        notes = NULL
    WHERE restaurant_id = p_restaurant_id;

    -- Delete AI conversations
    DELETE FROM ai_conversations WHERE restaurant_id = p_restaurant_id;

    -- Delete messages
    DELETE FROM messages WHERE restaurant_id = p_restaurant_id;

    -- Delete events
    DELETE FROM events WHERE restaurant_id = p_restaurant_id;

    -- Delete sessions
    DELETE FROM sessions WHERE restaurant_id = p_restaurant_id;

    -- Log audit
    INSERT INTO gdpr_audit_log (
        restaurant_id,
        action,
        description,
        performed_by
    ) VALUES (
        p_restaurant_id,
        'gdpr_anonymization',
        'Customer data anonymized per GDPR request',
        p_performed_by
    );
END;
$$ LANGUAGE plpgsql;
```

### 8.4 Adgangskontrol

#### 8.4.1 Role-Based Access Control (RBAC)

| Rolle | Data Access |
|-------|-------------|
| **Super Admin** | Alle data, alle restauranter |
| **Admin** | Egne restaurant data + team management |
| **Manager** | Ordrer, produkter, rapporter (egen restaurant) |
| **Employee** | Kun aktive ordrer (egen restaurant) |
| **Customer** | Egne ordrer, profil |
| **Analytics** | Kun aggregeret, anonymiseret data |
| **Support** | Læse-adgang til ordrer/samtaler (med audit) |

#### 8.4.2 Row Level Security

```sql
-- RLS Policy for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_policy ON orders
FOR SELECT
USING (
    -- Super admin sees all
    auth.jwt() ->> 'role' = 'super_admin'
    OR
    -- Restaurant staff sees own
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_access
        WHERE user_id = auth.uid()
    )
    OR
    -- Customer sees own orders
    user_id = auth.uid()
);

CREATE POLICY orders_insert_policy ON orders
FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_access
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager', 'employee')
    )
    OR user_id = auth.uid()  -- Customers can create own orders
);

-- Audit log is append-only
ALTER TABLE gdpr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only ON gdpr_audit_log
FOR INSERT
WITH CHECK (true);

CREATE POLICY audit_select_compliance ON gdpr_audit_log
FOR SELECT
USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'compliance')
);
```

---

## 9. Implementeringsplan

### 9.1 Faser

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 1: FUNDAMENT (Uge 1-2)                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  □ Opret nye database tabeller                                              │
│  □ Implementer RLS policies                                                 │
│  □ Setup migrations                                                         │
│  □ Consent management system                                                │
│  □ Basis audit logging                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 2: EVENT TRACKING (Uge 3-4)                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  □ Analytics tracker library                                                │
│  □ Page view tracking                                                       │
│  □ Click/scroll tracking                                                    │
│  □ Checkout funnel events                                                   │
│  □ Session management                                                       │
│  □ Event batch API endpoint                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 3: BASIC BI (Uge 5-6)                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  □ Daily metrics aggregation job                                            │
│  □ Executive dashboard                                                      │
│  □ Product analytics dashboard                                              │
│  □ Basic reports (daglig email)                                             │
│  □ Export funktionalitet                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 4: AI OPTIMERING (Uge 7-8)                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  □ AI conversation logging                                                  │
│  □ Intent tracking                                                          │
│  □ Feedback collection                                                      │
│  □ AI performance dashboard                                                 │
│  □ Training data pipeline                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 5: AVANCERET ANALYSE (Uge 9-12)                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  □ Channel attribution                                                      │
│  □ Heatmap tracking                                                         │
│  □ Predictive analytics                                                     │
│  □ Churn prediction                                                         │
│  □ Marketing automation                                                     │
│  □ Benchmark aggregates                                                     │
│  □ A/B testing framework                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Prioriteret Backlog

#### 9.2.1 Fase 1: Fundament (KRITISK)

| # | Task | Kompleksitet | Afhængigheder | Beskrivelse |
|---|------|--------------|---------------|-------------|
| 1.1 | Create `order_items` table | Lav | Ingen | Detaljerede ordre linjer |
| 1.2 | Create `payments` table | Lav | orders | Betalingstransaktioner |
| 1.3 | Create `user_consents` table | Lav | Ingen | GDPR samtykke |
| 1.4 | Create `sessions` table | Mellem | Ingen | Bruger sessions |
| 1.5 | Create `events` table | Mellem | sessions | Event storage |
| 1.6 | Implement RLS policies | Mellem | Alle tabeller | Sikkerhed |
| 1.7 | Setup scheduled cleanup job | Lav | Alle tabeller | Data retention |

#### 9.2.2 Fase 2: Event Tracking (HØJ)

| # | Task | Kompleksitet | Afhængigheder | Beskrivelse |
|---|------|--------------|---------------|-------------|
| 2.1 | Build AnalyticsTracker class | Mellem | events table | Frontend library |
| 2.2 | Create batch event API | Lav | events table | `/api/events/batch` |
| 2.3 | Implement page view tracking | Lav | 2.1 | Auto track page views |
| 2.4 | Implement click tracking | Lav | 2.1 | Click positions |
| 2.5 | Implement checkout events | Mellem | 2.1 | Funnel tracking |
| 2.6 | Add scroll depth tracking | Lav | 2.1 | Engagement |

#### 9.2.3 Fase 3: Basic BI (HØJ)

| # | Task | Kompleksitet | Afhængigheder | Beskrivelse |
|---|------|--------------|---------------|-------------|
| 3.1 | Create `daily_metrics` table | Lav | Ingen | Aggregat storage |
| 3.2 | Build aggregation function | Mellem | 3.1 | Daglig aggregering |
| 3.3 | Schedule aggregation job | Lav | 3.2 | Cron job |
| 3.4 | Build Executive Dashboard UI | Høj | 3.1 | Dashboard side |
| 3.5 | Build Product Analytics UI | Høj | product_analytics | Dashboard side |
| 3.6 | Create daily email report | Mellem | 3.1 | Automatisk rapport |

#### 9.2.4 Fase 4: AI Optimering (MELLEM)

| # | Task | Kompleksitet | Afhængigheder | Beskrivelse |
|---|------|--------------|---------------|-------------|
| 4.1 | Create `ai_conversations` table | Lav | Ingen | Samtale storage |
| 4.2 | Create `ai_messages` table | Lav | 4.1 | Besked storage |
| 4.3 | Create `ai_feedback` table | Lav | 4.2 | Feedback storage |
| 4.4 | Integrate logging in ordering-agent | Mellem | 4.1, 4.2 | Log samtaler |
| 4.5 | Build AI Dashboard UI | Høj | 4.1-4.3 | Dashboard side |
| 4.6 | Create training data export | Mellem | 4.1-4.3 | AI pipeline |

#### 9.2.5 Fase 5: Avanceret (LAV PRIORITET)

| # | Task | Kompleksitet | Afhængigheder | Beskrivelse |
|---|------|--------------|---------------|-------------|
| 5.1 | Create `channel_attribution` table | Lav | Ingen | Attribution data |
| 5.2 | Build attribution logic | Høj | 5.1, sessions | Multi-touch attribution |
| 5.3 | Create `heatmap_events` table | Lav | Ingen | Heatmap storage |
| 5.4 | Build heatmap tracking | Mellem | 5.3 | Click/move tracking |
| 5.5 | Build heatmap visualization | Høj | 5.3, 5.4 | UI component |
| 5.6 | Implement predictive models | Høj | daily_metrics | Forecasting |
| 5.7 | Build marketing automation | Høj | campaigns, events | Trigger system |
| 5.8 | Create benchmark aggregation | Mellem | daily_metrics | Anonymiseret data |

### 9.3 Migration Script (Fase 1)

```sql
-- migrations/20260206_data_strategy_phase1.sql

-- =====================================================
-- PHASE 1: FOUNDATION TABLES
-- =====================================================

BEGIN;

-- 1. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_category TEXT,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    line_total INTEGER NOT NULL,
    discount_amount INTEGER DEFAULT 0,
    discount_reason TEXT,
    options JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orderitems_order ON order_items(order_id);
CREATE INDEX idx_orderitems_product ON order_items(product_id);

-- 2. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency CHAR(3) DEFAULT 'DKK',
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT NOT NULL,
    provider_transaction_id TEXT,
    provider_response JSONB,
    card_last_four CHAR(4),
    card_brand TEXT,
    refunded_amount INTEGER DEFAULT 0,
    refund_reason TEXT,
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_restaurant ON payments(restaurant_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 3. User Consents
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL,
    consent_version TEXT,
    consent_text TEXT,
    collection_method TEXT,
    ip_address INET,
    user_agent TEXT,
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);

-- 4. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,
    landing_page TEXT,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    orders_created INTEGER DEFAULT 0,
    country_code CHAR(2),
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_restaurant ON sessions(restaurant_id);
CREATE INDEX idx_sessions_started ON sessions(started_at);
CREATE INDEX idx_sessions_visitor ON sessions(visitor_id);

-- 5. Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(session_id),
    event_name TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    page_title TEXT,
    element_id TEXT,
    element_class TEXT,
    element_text TEXT,
    viewport_x INTEGER,
    viewport_y INTEGER,
    page_x INTEGER,
    page_y INTEGER,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_on_page_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_restaurant ON events(restaurant_id);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_timestamp ON events(timestamp);

-- 6. Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY order_items_access ON order_items
FOR ALL USING (
    order_id IN (
        SELECT id FROM orders WHERE restaurant_id IN (
            SELECT restaurant_id FROM user_restaurant_access WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY payments_access ON payments
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_access WHERE user_id = auth.uid()
    )
);

CREATE POLICY user_consents_access ON user_consents
FOR ALL USING (user_id = auth.uid());

CREATE POLICY sessions_access ON sessions
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_access WHERE user_id = auth.uid()
    )
);

CREATE POLICY events_insert ON events
FOR INSERT WITH CHECK (true);  -- Allow event ingestion

CREATE POLICY events_select ON events
FOR SELECT USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_access WHERE user_id = auth.uid()
    )
);

COMMIT;
```

### 9.4 Success Metrics

| Fase | Success Criteria | Måling |
|------|------------------|--------|
| **Fase 1** | Alle tabeller oprettet, RLS aktiv | Migration success |
| **Fase 2** | >95% event capture rate | Events logged vs. page views |
| **Fase 3** | Dashboard load <2 sek | Performance metrics |
| **Fase 4** | AI accuracy >85% | Intent detection rate |
| **Fase 5** | Attribution coverage >80% | Orders with attribution |

---

## Appendix A: Ordliste

| Term | Beskrivelse |
|------|-------------|
| **AOV** | Average Order Value - gennemsnitlig ordreværdi |
| **CAC** | Customer Acquisition Cost - kundeanskaffelsesomkostning |
| **GMV** | Gross Merchandise Value - bruttoomsætning |
| **LTV** | Lifetime Value - kundens livstidsværdi |
| **MAU** | Monthly Active Users - månedlige aktive brugere |
| **RLS** | Row Level Security - række-niveau sikkerhed |
| **UTM** | Urchin Tracking Module - tracking parametre |

---

## Appendix B: Teknisk Stack

| Komponent | Teknologi |
|-----------|-----------|
| **Database** | Supabase PostgreSQL |
| **Real-time** | Supabase Realtime (WebSockets) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Edge Functions** | Supabase Edge Functions (Deno) |
| **API** | Vercel Serverless Functions |
| **Frontend** | Vanilla JS + Custom Framework |
| **Hosting** | Vercel |

---

*Dokument version: 1.0*
*Sidst opdateret: 2026-02-05*
