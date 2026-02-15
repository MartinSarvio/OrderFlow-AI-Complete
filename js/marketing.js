// FLOW Marketing Module — campaigns, loyalty, segments, udsendelser

async function getLoyaltySettings(restaurantId) {
  if (!restaurantId) return null;

  try {
    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_settings?restaurant_id=eq.${restaurantId}&limit=1`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    loyaltySettings = data[0] || null;
    return loyaltySettings;
  } catch (err) {
    console.error('getLoyaltySettings error:', err);
    return null;
  }
}

// Create default loyalty settings
async function createLoyaltySettings(restaurantId) {
  try {
    const defaultSettings = {
      restaurant_id: restaurantId,
      enabled: true,
      points_per_kr: 1,
      min_order_for_points: 50,
      welcome_bonus: 50,
      birthday_bonus: 100,
      tier_bronze_min: 0,
      tier_silver_min: 500,
      tier_gold_min: 1500,
      tier_platinum_min: 5000,
      silver_multiplier: 1.25,
      gold_multiplier: 1.5,
      platinum_multiplier: 2.0
    };

    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/loyalty_settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(defaultSettings)
    });

    if (!response.ok) throw new Error('Failed to create settings');
    const data = await response.json();
    loyaltySettings = data[0];
    return loyaltySettings;
  } catch (err) {
    console.error('createLoyaltySettings error:', err);
    return null;
  }
}

// Get customer loyalty info
async function getCustomerLoyalty(phone, restaurantId) {
  if (!phone || !restaurantId) return null;

  const normalizedPhone = normalizePhoneNumber(phone).e164;

  try {
    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_points?customer_phone=eq.${encodeURIComponent(normalizedPhone)}&restaurant_id=eq.${restaurantId}&limit=1`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data[0] || null;
  } catch (err) {
    console.error('getCustomerLoyalty error:', err);
    return null;
  }
}

// Create new loyalty member
async function createLoyaltyMember(phone, restaurantId, name = null) {
  const normalizedPhone = normalizePhoneNumber(phone).e164;

  // Get settings for welcome bonus
  const settings = await getLoyaltySettings(restaurantId);
  const welcomeBonus = settings?.welcome_bonus || 50;

  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/loyalty_points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        customer_phone: normalizedPhone,
        customer_name: name,
        points: welcomeBonus,
        lifetime_points: welcomeBonus,
        tier: 'bronze'
      })
    });

    if (!response.ok) throw new Error('Failed to create member');
    const data = await response.json();

    // Log welcome bonus transaction
    if (welcomeBonus > 0) {
      await addLoyaltyTransaction(data[0].id, restaurantId, 'bonus', welcomeBonus, 'Velkomstbonus');
    }

    return data[0];
  } catch (err) {
    console.error('createLoyaltyMember error:', err);
    return null;
  }
}

// Add points to customer
async function addLoyaltyPoints(phone, restaurantId, orderAmount, orderId = null) {
  const normalizedPhone = normalizePhoneNumber(phone).e164;

  // Get or create loyalty member
  let member = await getCustomerLoyalty(normalizedPhone, restaurantId);
  if (!member) {
    member = await createLoyaltyMember(normalizedPhone, restaurantId);
    if (!member) return null;
  }

  // Get settings
  const settings = await getLoyaltySettings(restaurantId);
  if (!settings?.enabled) return member;

  // Check minimum order
  if (orderAmount < (settings.min_order_for_points || 0)) {
    return member;
  }

  // Calculate points with tier multiplier
  let multiplier = 1;
  if (member.tier === 'silver') multiplier = settings.silver_multiplier || 1.25;
  else if (member.tier === 'gold') multiplier = settings.gold_multiplier || 1.5;
  else if (member.tier === 'platinum') multiplier = settings.platinum_multiplier || 2.0;

  const basePoints = Math.floor(orderAmount * (settings.points_per_kr || 1));
  const earnedPoints = Math.floor(basePoints * multiplier);

  // Update member points
  const newPoints = member.points + earnedPoints;
  const newLifetime = member.lifetime_points + earnedPoints;
  const newTier = calculateTier(newLifetime, settings);

  try {
    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_points?id=eq.${member.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          points: newPoints,
          lifetime_points: newLifetime,
          tier: newTier,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) throw new Error('Failed to update points');
    const data = await response.json();

    // Log transaction
    await addLoyaltyTransaction(
      member.id,
      restaurantId,
      'earn',
      earnedPoints,
      `Ordre: ${orderAmount} kr (${multiplier}x bonus)`,
      orderId
    );

    // Check for tier upgrade
    if (newTier !== member.tier) {
      await addLoyaltyTransaction(
        member.id,
        restaurantId,
        'bonus',
        0,
        `Opgraderet til ${LOYALTY_TIERS[newTier].name}!`
      );
    }

    return data[0];
  } catch (err) {
    console.error('addLoyaltyPoints error:', err);
    return null;
  }
}

// Calculate tier based on lifetime points
function calculateTier(lifetimePoints, settings) {
  if (lifetimePoints >= (settings?.tier_platinum_min || 5000)) return 'platinum';
  if (lifetimePoints >= (settings?.tier_gold_min || 1500)) return 'gold';
  if (lifetimePoints >= (settings?.tier_silver_min || 500)) return 'silver';
  return 'bronze';
}

// Add loyalty transaction
async function addLoyaltyTransaction(loyaltyId, restaurantId, type, points, description, orderId = null) {
  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/loyalty_transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        loyalty_id: loyaltyId,
        restaurant_id: restaurantId,
        type,
        points,
        description,
        order_id: orderId
      })
    });
  } catch (err) {
    console.error('addLoyaltyTransaction error:', err);
  }
}

// Get loyalty rewards
async function getLoyaltyRewards(restaurantId) {
  try {
    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_rewards?restaurant_id=eq.${restaurantId}&active=eq.true&order=points_required.asc`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) return [];
    loyaltyRewards = await response.json();
    return loyaltyRewards;
  } catch (err) {
    console.error('getLoyaltyRewards error:', err);
    return [];
  }
}

// Redeem loyalty reward
async function redeemLoyaltyReward(phone, restaurantId, rewardId) {
  const member = await getCustomerLoyalty(phone, restaurantId);
  if (!member) return { success: false, error: 'Kunde ikke fundet' };

  const rewards = await getLoyaltyRewards(restaurantId);
  const reward = rewards.find(r => r.id === rewardId);
  if (!reward) return { success: false, error: 'Belønning ikke fundet' };

  if (member.points < reward.points_required) {
    return { success: false, error: `Du mangler ${reward.points_required - member.points} points` };
  }

  // Deduct points
  const newPoints = member.points - reward.points_required;

  try {
    await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_points?id=eq.${member.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          points: newPoints,
          updated_at: new Date().toISOString()
        })
      }
    );

    // Update reward redemption count
    await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_rewards?id=eq.${rewardId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          current_redemptions: (reward.current_redemptions || 0) + 1
        })
      }
    );

    // Log transaction
    await addLoyaltyTransaction(
      member.id,
      restaurantId,
      'redeem',
      -reward.points_required,
      `Indløst: ${reward.name}`
    );

    return {
      success: true,
      reward: reward,
      newPoints: newPoints,
      message: `Du har indløst "${reward.name}"!`
    };
  } catch (err) {
    console.error('redeemLoyaltyReward error:', err);
    return { success: false, error: 'Fejl ved indløsning' };
  }
}

// Get available rewards for customer
async function getAvailableRewards(phone, restaurantId) {
  const member = await getCustomerLoyalty(phone, restaurantId);
  if (!member) return [];

  const rewards = await getLoyaltyRewards(restaurantId);
  return rewards.map(r => ({
    ...r,
    canRedeem: member.points >= r.points_required,
    pointsNeeded: Math.max(0, r.points_required - member.points)
  }));
}

// Format loyalty message for SMS
function formatLoyaltyMessage(member, earnedPoints = 0) {
  const tier = LOYALTY_TIERS[member.tier] || LOYALTY_TIERS.bronze;
  let msg = `${tier.icon} `;

  if (earnedPoints > 0) {
    msg += `Du har optjent ${earnedPoints} points! `;
  }

  msg += `Total: ${member.points} points (${tier.name})`;
  return msg;
}

// Render loyalty demo page (when no restaurant is selected)
function saveDemoLoyaltySettings() {
  const settings = {
    points_per_kr: parseFloat(document.getElementById('demo-loyalty-points-per-kr')?.value || 1),
    min_order_for_points: parseInt(document.getElementById('demo-loyalty-min-order')?.value || 50),
    welcome_bonus: parseInt(document.getElementById('demo-loyalty-welcome-bonus')?.value || 50),
    birthday_bonus: parseInt(document.getElementById('demo-loyalty-birthday-bonus')?.value || 100),
    tier_silver_min: parseInt(document.getElementById('demo-loyalty-tier-silver')?.value || 500),
    tier_gold_min: parseInt(document.getElementById('demo-loyalty-tier-gold')?.value || 1500),
    tier_platinum_min: parseInt(document.getElementById('demo-loyalty-tier-platinum')?.value || 5000)
  };
  localStorage.setItem('demo_loyalty_settings', JSON.stringify(settings));
  toast('Loyalty indstillinger gemt', 'success');
}

function getDemoLoyaltySettings() {
  try {
    return JSON.parse(localStorage.getItem('demo_loyalty_settings')) || {};
  } catch { return {}; }
}

function renderLoyaltyDemoPage() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const ds = getDemoLoyaltySettings();

  container.innerHTML = `
    <h1 class="page-title">Loyalty Program</h1>
    <div class="support-banner" style="margin-bottom:24px">
      <div class="support-banner-content">
        <h1 class="support-banner-title">Loyalty <span>Program</span></h1>
        <p class="support-banner-desc">Administrer dit kundeloyalitetsprogram, belønninger og tiers.</p>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-bottom:24px">
      <div class="setting-card" style="text-align:center;padding:20px">
        <div style="font-size:28px;font-weight:700;margin-bottom:4px">342</div>
        <div style="font-size:13px;color:var(--muted)">Medlemmer</div>
      </div>
      <div class="setting-card" style="text-align:center;padding:20px">
        <div style="font-size:28px;font-weight:700;margin-bottom:4px">12.450</div>
        <div style="font-size:13px;color:var(--muted)">Aktive points</div>
      </div>
      <div class="setting-card" style="text-align:center;padding:20px">
        <div style="font-size:28px;font-weight:700;margin-bottom:4px">45</div>
        <div style="font-size:13px;color:var(--muted)">VIP medlemmer</div>
      </div>
      <div class="setting-card" style="text-align:center;padding:20px">
        <div style="font-size:28px;font-weight:700;margin-bottom:4px">5</div>
        <div style="font-size:13px;color:var(--muted)">Aktive belønninger</div>
      </div>
    </div>

    <!-- Settings -->
    <div class="setting-card" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div class="setting-title">Indstillinger</div>
        <label class="toggle">
          <input type="checkbox" disabled checked>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
        <div class="form-group">
          <label class="form-label">Points pr. krone</label>
          <input type="number" class="input" id="demo-loyalty-points-per-kr" value="${ds.points_per_kr || 1}" step="0.1" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Min. ordre for points</label>
          <input type="number" class="input" id="demo-loyalty-min-order" value="${ds.min_order_for_points || 50}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Velkomstbonus</label>
          <input type="number" class="input" id="demo-loyalty-welcome-bonus" value="${ds.welcome_bonus || 50}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Fødselsdagsbonus</label>
          <input type="number" class="input" id="demo-loyalty-birthday-bonus" value="${ds.birthday_bonus || 100}" min="0">
        </div>
      </div>

      <div class="setting-title" style="margin-top:24px">Tier-grænser</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-top:12px">
        <div class="form-group">
          <label class="form-label">Sølv fra</label>
          <input type="number" class="input" id="demo-loyalty-tier-silver" value="${ds.tier_silver_min || 500}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Guld fra</label>
          <input type="number" class="input" id="demo-loyalty-tier-gold" value="${ds.tier_gold_min || 1500}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Platin fra</label>
          <input type="number" class="input" id="demo-loyalty-tier-platinum" value="${ds.tier_platinum_min || 5000}" min="0">
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:24px;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-primary" onclick="saveDemoLoyaltySettings()">Gem indstillinger</button>
      </div>
    </div>

    <!-- Demo Rewards -->
    <div class="setting-card" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div class="setting-title">Belønninger</div>
        <button class="btn btn-primary btn-sm" onclick="showAddRewardModal()">+ Tilføj belønning</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px">
        <div style="background:var(--bg2);border-radius:var(--radius-sm);padding:16px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
            <span style="font-weight:600">Gratis drink</span>
            <span class="badge" style="background:var(--color-primary, #6366F1);color:white;padding:4px 10px;border-radius:var(--radius-full);font-size:12px">250 pts</span>
          </div>
          <p style="font-size:13px;color:var(--muted);margin:0">Valgfri sodavand eller juice</p>
        </div>
        <div style="background:var(--bg2);border-radius:var(--radius-sm);padding:16px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
            <span style="font-weight:600">Gratis dessert</span>
            <span class="badge" style="background:var(--color-primary, #6366F1);color:white;padding:4px 10px;border-radius:var(--radius-full);font-size:12px">500 pts</span>
          </div>
          <p style="font-size:13px;color:var(--muted);margin:0">Valgfri dessert fra menuen</p>
        </div>
        <div style="background:var(--bg2);border-radius:var(--radius-sm);padding:16px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
            <span style="font-weight:600">50 kr rabat</span>
            <span class="badge" style="background:var(--color-primary, #6366F1);color:white;padding:4px 10px;border-radius:var(--radius-full);font-size:12px">1000 pts</span>
          </div>
          <p style="font-size:13px;color:var(--muted);margin:0">Rabat på næste ordre over 200 kr</p>
        </div>
      </div>
    </div>

    <!-- Members section removed -->
  `;
}

// Render loyalty admin page
async function renderLoyaltyPage() {
  let restaurantId = document.getElementById('test-restaurant')?.value;

  // Auto-select first restaurant if none selected
  if (!restaurantId) {
    const dropdown = document.getElementById('test-restaurant');
    if (dropdown && dropdown.options.length > 1) {
      dropdown.selectedIndex = 1;
      restaurantId = dropdown.value;
    }
  }

  if (!restaurantId) {
    renderLoyaltyDemoPage();
    return;
  }

  try {
    // Get settings or create defaults
    let settings = await getLoyaltySettings(restaurantId);
    if (!settings) {
      settings = await createLoyaltySettings(restaurantId);
    }

    // Get rewards and members
    const rewards = await getLoyaltyRewards(restaurantId);
    const membersResponse = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_points?restaurant_id=eq.${restaurantId}&order=lifetime_points.desc&limit=100`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      }
    );
    const members = membersResponse.ok ? await membersResponse.json() : [];

    // Calculate stats
    const totalMembers = members.length;
    const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
    const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    members.forEach(m => { if (tierCounts[m.tier] !== undefined) tierCounts[m.tier]++; });

    const html = `
      <h1 class="page-title">Loyalty Program</h1>
      <div class="support-banner" style="margin-bottom:24px">
        <div class="support-banner-content">
          <h1 class="support-banner-title">Loyalty <span>Program</span></h1>
          <p class="support-banner-desc">Administrer dit kundeloyalitetsprogram, belønninger og tiers.</p>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-bottom:24px">
        <div class="setting-card" style="text-align:center;padding:20px">
          <div style="font-size:28px;font-weight:700;margin-bottom:4px">${totalMembers}</div>
          <div style="font-size:13px;color:var(--muted)">Medlemmer</div>
        </div>
        <div class="setting-card" style="text-align:center;padding:20px">
          <div style="font-size:28px;font-weight:700;margin-bottom:4px">${totalPoints.toLocaleString('da-DK')}</div>
          <div style="font-size:13px;color:var(--muted)">Aktive points</div>
        </div>
        <div class="setting-card" style="text-align:center;padding:20px">
          <div style="font-size:28px;font-weight:700;margin-bottom:4px">${tierCounts.gold + tierCounts.platinum}</div>
          <div style="font-size:13px;color:var(--muted)">VIP medlemmer</div>
        </div>
        <div class="setting-card" style="text-align:center;padding:20px">
          <div style="font-size:28px;font-weight:700;margin-bottom:4px">${rewards.length}</div>
          <div style="font-size:13px;color:var(--muted)">Aktive belønninger</div>
        </div>
      </div>

      <!-- Settings -->
      <div class="setting-card" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="setting-title">Indstillinger</div>
          <label class="toggle">
            <input type="checkbox" id="loyalty-enabled" ${settings?.enabled ? 'checked' : ''} onchange="toggleLoyaltyEnabled()">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
          <div class="form-group">
            <label class="form-label">Points pr. krone</label>
            <input type="number" class="input" id="loyalty-points-per-kr" value="${settings?.points_per_kr || 1}" step="0.1" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Min. ordre for points</label>
            <input type="number" class="input" id="loyalty-min-order" value="${settings?.min_order_for_points || 50}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Velkomstbonus</label>
            <input type="number" class="input" id="loyalty-welcome-bonus" value="${settings?.welcome_bonus || 50}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Fødselsdagsbonus</label>
            <input type="number" class="input" id="loyalty-birthday-bonus" value="${settings?.birthday_bonus || 100}" min="0">
          </div>
        </div>

        <div class="setting-title" style="margin-top:24px">Tier-grænser</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-top:12px">
          <div class="form-group">
            <label class="form-label">Sølv fra</label>
            <input type="number" class="input" id="loyalty-tier-silver" value="${settings?.tier_silver_min || 500}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Guld fra</label>
            <input type="number" class="input" id="loyalty-tier-gold" value="${settings?.tier_gold_min || 1500}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Platin fra</label>
            <input type="number" class="input" id="loyalty-tier-platinum" value="${settings?.tier_platinum_min || 5000}" min="0">
          </div>
        </div>

        <div class="setting-title" style="margin-top:24px">Tier-bonusser</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-top:12px">
          <div class="form-group">
            <label class="form-label">Sølv multiplier</label>
            <input type="number" class="input" id="loyalty-mult-silver" value="${settings?.silver_multiplier || 1.25}" step="0.05" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Guld multiplier</label>
            <input type="number" class="input" id="loyalty-mult-gold" value="${settings?.gold_multiplier || 1.5}" step="0.05" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Platin multiplier</label>
            <input type="number" class="input" id="loyalty-mult-platinum" value="${settings?.platinum_multiplier || 2.0}" step="0.05" min="1">
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:16px;border-top:1px solid var(--border)">
          <span id="settings-save-status" style="color:var(--success);display:none">Ændringer gemt</span>
          <button class="btn btn-primary" onclick="saveLoyaltySettings()">Gem indstillinger</button>
        </div>
      </div>

      <!-- Loyalty Tiers for Website & App -->
      <div class="setting-card" style="margin-bottom:24px">
        <div style="margin-bottom:16px">
          <div class="setting-title">Loyalty Tiers</div>
          <p style="font-size:13px;color:var(--muted);margin-top:4px">Konfigurer tiers for website og app</p>
        </div>
        <div id="loyalty-tiers-container">
          ${renderLoyaltyTiersHTML(settings)}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <span id="tiers-save-status" style="color:var(--success);display:none">Ændringer gemt</span>
          <button class="btn btn-primary" onclick="saveLoyaltyTiers()">Gem tiers</button>
        </div>
      </div>

      <!-- Rewards -->
      <div class="setting-card" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="setting-title">Belønninger</div>
          <button class="btn btn-primary btn-sm" onclick="showAddRewardModal()">+ Tilføj belønning</button>
        </div>
        ${rewards.length === 0 ? '<p style="color:var(--muted);font-size:14px">Ingen belønninger oprettet endnu</p>' : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px">
            ${rewards.map(r => `
              <div style="background:var(--bg2);border-radius:var(--radius-sm);padding:16px;border:1px solid var(--border)">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
                  <span style="font-weight:600">${r.name}</span>
                  <span class="badge" style="background:var(--color-primary, #6366F1);color:white;padding:4px 10px;border-radius:var(--radius-full);font-size:12px">${r.points_required} pts</span>
                </div>
                <p style="font-size:13px;color:var(--muted);margin-bottom:12px">${r.description || ''}</p>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:12px;color:var(--muted)">${r.current_redemptions || 0} indløst</span>
                  <div>
                    <button class="btn btn-sm btn-secondary" onclick="editReward('${r.id}')">Rediger</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReward('${r.id}')">Slet</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Members section removed -->
    `;

    document.getElementById('main-content').innerHTML = html;
  } catch (err) {
    console.error('renderLoyaltyPage error:', err);
    renderLoyaltyDemoPage();
  }
}

// Render members page (separate from loyalty)
async function renderMembersPage() {
  const container = document.getElementById('medlemmer-content');
  if (!container) return;

  // For admin: show restaurant selector, for customer: use their restaurant
  const isAdmin = currentUser?.role === ROLES.ADMIN;
  let restaurantId = null;

  if (isAdmin) {
    restaurantId = document.getElementById('test-restaurant')?.value;
    if (!restaurantId) {
      const dropdown = document.getElementById('test-restaurant');
      if (dropdown && dropdown.options.length > 1) {
        dropdown.selectedIndex = 1;
        restaurantId = dropdown.value;
      }
    }
  } else {
    // For customer/demo, get their restaurant
    restaurantId = currentUser?.restaurantId || localStorage.getItem('customer_restaurant_id');
  }

  if (!restaurantId) {
    container.innerHTML = '<div class="page-header"><h1>Medlemmer</h1><p class="text-secondary">Administrer dine loyalitetsmedlemmer</p></div><div class="card"><div class="card-body" style="text-align:center;padding:48px"><p class="text-secondary">Vælg en restaurant for at se medlemmer</p></div></div>';
    return;
  }

  // Get members
  const membersResponse = await fetch(
    CONFIG.SUPABASE_URL + '/rest/v1/loyalty_points?restaurant_id=eq.' + restaurantId + '&order=lifetime_points.desc&limit=100',
    {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY
      }
    }
  );
  const members = await membersResponse.json();

  // Calculate stats
  const totalMembers = members.length;
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
  const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  members.forEach(m => tierCounts[m.tier]++);

  let html = '<div class="page-header"><h1>Medlemmer</h1><p class="text-secondary">Administrer dine loyalitetsmedlemmer</p></div>';

  // Stats
  html += '<div class="stats-grid" style="margin-bottom:24px">';
  html += '<div class="stat-card"><div class="stat-value">' + totalMembers + '</div><div class="stat-label">Medlemmer</div></div>';
  html += '<div class="stat-card"><div class="stat-value">' + totalPoints.toLocaleString('da-DK') + '</div><div class="stat-label">Aktive points</div></div>';
  html += '<div class="stat-card"><div class="stat-value">' + (tierCounts.gold + tierCounts.platinum) + '</div><div class="stat-label">VIP medlemmer</div></div>';
  html += '<div class="stat-card"><div class="stat-value">' + tierCounts.silver + '</div><div class="stat-label">Sølv medlemmer</div></div>';
  html += '</div>';

  // Members Table
  html += '<div class="card"><div class="card-header"><h3>Alle medlemmer</h3>';
  html += '<input type="text" class="input" placeholder="Søg på telefon eller navn..." style="width:250px" oninput="filterMembersTable(this.value)"></div>';
  html += '<div class="card-body"><div class="table-container"><table class="data-table" id="members-table">';
  html += '<thead><tr><th>Kunde</th><th>Telefon</th><th>Tier</th><th>Points</th><th>Lifetime</th><th>Handlinger</th></tr></thead>';
  html += '<tbody>';

  if (members.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Ingen medlemmer endnu</td></tr>';
  } else {
    members.forEach(function(m) {
      var tierInfo = LOYALTY_TIERS[m.tier] || { icon: '', name: 'Bronze' };
      html += '<tr data-phone="' + m.customer_phone + '" data-name="' + (m.customer_name || '') + '">';
      html += '<td>' + (m.customer_name || '<span class="text-secondary">Ukendt</span>') + '</td>';
      html += '<td>' + m.customer_phone + '</td>';
      html += '<td><span class="tier-badge tier-' + m.tier + '">' + tierInfo.icon + ' ' + tierInfo.name + '</span></td>';
      html += '<td><strong>' + m.points.toLocaleString('da-DK') + '</strong></td>';
      html += '<td>' + m.lifetime_points.toLocaleString('da-DK') + '</td>';
      html += '<td><button class="btn btn-sm" onclick="showMemberDetails(\'' + m.id + '\')">Detaljer</button> ';
      html += '<button class="btn btn-sm" onclick="adjustMemberPoints(\'' + m.id + '\')">+/- Points</button></td>';
      html += '</tr>';
    });
  }

  html += '</tbody></table></div></div></div>';

  container.innerHTML = html;
}

// Filter members table
function filterMembersTable(query) {
  const table = document.getElementById('members-table');
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  const lowerQuery = query.toLowerCase();

  rows.forEach(row => {
    const phone = row.dataset.phone?.toLowerCase() || '';
    const name = row.dataset.name?.toLowerCase() || '';
    row.style.display = phone.includes(lowerQuery) || name.includes(lowerQuery) ? '' : 'none';
  });
}

// Save loyalty settings
async function saveLoyaltySettings() {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) return;

  const settings = {
    enabled: document.getElementById('loyalty-enabled')?.checked ?? true,
    points_per_kr: parseFloat(document.getElementById('loyalty-points-per-kr')?.value) || 1,
    min_order_for_points: parseFloat(document.getElementById('loyalty-min-order')?.value) || 50,
    welcome_bonus: parseInt(document.getElementById('loyalty-welcome-bonus')?.value) || 50,
    birthday_bonus: parseInt(document.getElementById('loyalty-birthday-bonus')?.value) || 100,
    tier_silver_min: parseInt(document.getElementById('loyalty-tier-silver')?.value) || 500,
    tier_gold_min: parseInt(document.getElementById('loyalty-tier-gold')?.value) || 1500,
    tier_platinum_min: parseInt(document.getElementById('loyalty-tier-platinum')?.value) || 5000,
    silver_multiplier: parseFloat(document.getElementById('loyalty-mult-silver')?.value) || 1.25,
    gold_multiplier: parseFloat(document.getElementById('loyalty-mult-gold')?.value) || 1.5,
    platinum_multiplier: parseFloat(document.getElementById('loyalty-mult-platinum')?.value) || 2.0,
    updated_at: new Date().toISOString()
  };

  try {
    await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_settings?restaurant_id=eq.${restaurantId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(settings)
      }
    );

    loyaltySettings = { ...loyaltySettings, ...settings };
    const statusEl = document.getElementById('settings-save-status');
    if (statusEl) {
      statusEl.style.display = 'inline';
      setTimeout(() => statusEl.style.display = 'none', 3000);
    }
    toast('Indstillinger gemt', 'success');
  } catch (err) {
    console.error('saveLoyaltySettings error:', err);
    toast('Fejl ved gem', 'error');
  }
}

// Render Loyalty Tiers HTML for website and app
function renderLoyaltyTiersHTML(settings) {
  const tiers = settings?.loyalty_tiers || [
    { name: 'Bronze', min_points: 0, max_points: 500, benefit: '5% rabat på ordrer' },
    { name: 'Sølv', min_points: 501, max_points: 2000, benefit: '10% rabat på ordrer' },
    { name: 'Guld', min_points: 2001, max_points: null, benefit: '15% rabat + gratis levering' }
  ];

  return `
    <div id="loyalty-tiers-list">
      ${tiers.map((tier, index) => `
        <div class="tier-row" data-tier-index="${index}" style="display:grid; grid-template-columns:1fr 100px 100px 2fr 40px; gap:12px; align-items:center; padding:12px; background:var(--card2); border:1px solid var(--border); border-radius:8px; margin-bottom:12px;">
          <input type="text" class="input tier-name" value="${tier.name}" placeholder="Tier navn">
          <input type="number" class="input tier-min" value="${tier.min_points}" placeholder="Fra" min="0">
          <input type="number" class="input tier-max" value="${tier.max_points || ''}" placeholder="Til">
          <input type="text" class="input tier-benefit" value="${tier.benefit}" placeholder="Fordele (fx 5% rabat)">
          <button class="btn btn-sm btn-icon" onclick="removeLoyaltyTier(${index})" title="Fjern tier" style="padding:8px;color:var(--danger)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-secondary" onclick="addLoyaltyTier()" style="margin-top:8px">+ Tilføj tier</button>
  `;
}

// Add a new loyalty tier
function addLoyaltyTier() {
  const container = document.getElementById('loyalty-tiers-list');
  if (!container) return;

  const tierRows = container.querySelectorAll('.tier-row');
  const newIndex = tierRows.length;

  const newTierHTML = `
    <div class="tier-row" data-tier-index="${newIndex}" style="display:grid; grid-template-columns:1fr 100px 100px 2fr 40px; gap:12px; align-items:center; padding:12px; background:var(--card2); border:1px solid var(--border); border-radius:8px; margin-bottom:12px;">
      <input type="text" class="input tier-name" value="" placeholder="Tier navn">
      <input type="number" class="input tier-min" value="" placeholder="Fra" min="0">
      <input type="number" class="input tier-max" value="" placeholder="Til">
      <input type="text" class="input tier-benefit" value="" placeholder="Fordele (fx 5% rabat)">
      <button class="btn btn-sm btn-icon" onclick="removeLoyaltyTier(${newIndex})" title="Fjern tier" style="padding:8px;color:var(--danger)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', newTierHTML);
}

// Remove a loyalty tier
function removeLoyaltyTier(index) {
  const container = document.getElementById('loyalty-tiers-list');
  if (!container) return;

  const tierRow = container.querySelector(`.tier-row[data-tier-index="${index}"]`);
  if (tierRow) {
    tierRow.remove();
    // Re-index remaining tiers
    const rows = container.querySelectorAll('.tier-row');
    rows.forEach((row, i) => {
      row.dataset.tierIndex = i;
      const removeBtn = row.querySelector('button');
      if (removeBtn) {
        removeBtn.setAttribute('onclick', `removeLoyaltyTier(${i})`);
      }
    });
  }
}

// Save loyalty tiers
async function saveLoyaltyTiers() {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) return;

  const container = document.getElementById('loyalty-tiers-list');
  if (!container) return;

  const tierRows = container.querySelectorAll('.tier-row');
  const tiers = [];

  tierRows.forEach(row => {
    const name = row.querySelector('.tier-name')?.value?.trim();
    const minPoints = parseInt(row.querySelector('.tier-min')?.value) || 0;
    const maxPoints = row.querySelector('.tier-max')?.value ? parseInt(row.querySelector('.tier-max')?.value) : null;
    const benefit = row.querySelector('.tier-benefit')?.value?.trim();

    if (name) {
      tiers.push({
        name,
        min_points: minPoints,
        max_points: maxPoints,
        benefit: benefit || ''
      });
    }
  });

  try {
    await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_settings?restaurant_id=eq.${restaurantId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          loyalty_tiers: tiers,
          updated_at: new Date().toISOString()
        })
      }
    );

    const statusEl = document.getElementById('tiers-save-status');
    if (statusEl) {
      statusEl.style.display = 'inline';
      setTimeout(() => statusEl.style.display = 'none', 3000);
    }
    toast('Loyalty tiers gemt', 'success');
  } catch (err) {
    console.error('saveLoyaltyTiers error:', err);
    toast('Fejl ved gem af tiers', 'error');
  }
}

// Toggle loyalty enabled
async function toggleLoyaltyEnabled() {
  const enabled = document.getElementById('loyalty-enabled')?.checked;
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) return;

  try {
    await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/loyalty_settings?restaurant_id=eq.${restaurantId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ enabled, updated_at: new Date().toISOString() })
      }
    );

    toast(enabled ? 'Loyalty aktiveret' : 'Loyalty deaktiveret', 'success');
  } catch (err) {
    toast('Fejl', 'error');
  }
}

// Filter loyalty members
function filterLoyaltyMembers(query) {
  const rows = document.querySelectorAll('#loyalty-members-table tbody tr');
  const q = query.toLowerCase();

  rows.forEach(row => {
    const phone = row.dataset.phone?.toLowerCase() || '';
    const name = row.dataset.name?.toLowerCase() || '';
    row.style.display = (phone.includes(q) || name.includes(q)) ? '' : 'none';
  });
}

// Show add reward modal
function showAddRewardModal(reward = null) {
  const isEdit = !!reward;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'reward-modal';
  modal.innerHTML = `
    <div class="modal" style="max-width:500px">
      <div class="modal-header">
        <h3>${isEdit ? 'Rediger' : 'Tilføj'} belønning</h3>
        <button class="modal-close" onclick="closeRewardModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Navn *</label>
          <input type="text" class="input" id="reward-name" value="${reward?.name || ''}" placeholder="F.eks. Gratis dessert">
        </div>
        <div class="form-group">
          <label class="form-label">Beskrivelse</label>
          <textarea class="input" id="reward-description" rows="2" placeholder="Valgfri beskrivelse">${reward?.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Points krævet *</label>
          <input type="number" class="input" id="reward-points" value="${reward?.points_required || 100}" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Belønningstype</label>
          <select class="input" id="reward-type">
            <option value="discount_percent" ${reward?.reward_type === 'discount_percent' ? 'selected' : ''}>Rabat i procent</option>
            <option value="discount_amount" ${reward?.reward_type === 'discount_amount' ? 'selected' : ''}>Rabat i kroner</option>
            <option value="free_item" ${reward?.reward_type === 'free_item' ? 'selected' : ''}>Gratis produkt</option>
            <option value="free_delivery" ${reward?.reward_type === 'free_delivery' ? 'selected' : ''}>Gratis levering</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Værdi (procent eller kroner)</label>
          <input type="number" class="input" id="reward-value" value="${reward?.reward_value || ''}" placeholder="F.eks. 10 for 10% eller 50 kr">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeRewardModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveReward('${reward?.id || ''}')">${isEdit ? 'Gem' : 'Opret'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// Close reward modal
function closeRewardModal() {
  document.getElementById('reward-modal')?.remove();
}

// Save reward
async function saveReward(rewardId = null) {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) return;

  const name = document.getElementById('reward-name')?.value?.trim();
  const description = document.getElementById('reward-description')?.value?.trim();
  const points_required = parseInt(document.getElementById('reward-points')?.value) || 100;
  const reward_type = document.getElementById('reward-type')?.value || 'discount_percent';
  const reward_value = parseFloat(document.getElementById('reward-value')?.value) || null;

  if (!name) {
    toast('Indtast et navn', 'error');
    return;
  }

  const data = {
    restaurant_id: restaurantId,
    name,
    description,
    points_required,
    reward_type,
    reward_value,
    active: true
  };

  try {
    if (rewardId) {
      await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/loyalty_rewards?id=eq.${rewardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(data)
      });
    } else {
      await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/loyalty_rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(data)
      });
    }

    toast(rewardId ? 'Belønning opdateret' : 'Belønning oprettet', 'success');
    closeRewardModal();
    renderLoyaltyPage();
  } catch (err) {
    console.error('saveReward error:', err);
    toast('Fejl ved gem', 'error');
  }
}

// Edit reward
async function editReward(rewardId) {
  const rewards = await getLoyaltyRewards(document.getElementById('test-restaurant')?.value);
  const reward = rewards.find(r => r.id === rewardId);
  if (reward) {
    showAddRewardModal(reward);
  }
}

// Delete reward
async function deleteReward(rewardId) {
  if (!confirm('Er du sikker på du vil slette denne belønning?')) return;

  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/loyalty_rewards?id=eq.${rewardId}`, {
      method: 'DELETE',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });

    toast('Belønning slettet', 'success');
    renderLoyaltyPage();
  } catch (err) {
    toast('Fejl ved sletning', 'error');
  }
}

// Adjust member points
async function adjustMemberPoints(memberId) {
  const adjustment = prompt('Indtast antal points (negativt tal trækker fra):');
  if (!adjustment) return;

  const points = parseInt(adjustment);
  if (isNaN(points)) { toast('Ugyldigt tal', 'error'); return; }

  try {
    const { data: member } = await window.supabaseClient
      .from('loyalty_members')
      .select('points')
      .eq('id', memberId)
      .single();

    if (!member) { toast('Medlem ikke fundet', 'error'); return; }

    const newPoints = Math.max(0, (member.points || 0) + points);
    await window.supabaseClient
      .from('loyalty_members')
      .update({ points: newPoints })
      .eq('id', memberId);

    toast(`Points ${points > 0 ? 'tilføjet' : 'trukket'}: ${Math.abs(points)} (ny saldo: ${newPoints})`, 'success');
    renderLoyaltyPage();
  } catch (err) {
    toast('Fejl: ' + err.message, 'error');
  }
}

// Show member details
async function showMemberDetails(memberId) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'member-details-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:550px;max-height:80vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3>Medlemsdetaljer</h3>
        <button class="modal-close" onclick="document.getElementById('member-details-modal').remove()">×</button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1">
        <div id="member-details-content" style="text-align:center;padding:20px;color:var(--muted)">Henter...</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('member-details-modal').remove()">Luk</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  try {
    const { data: member } = await window.supabaseClient
      .from('loyalty_members')
      .select('*, customers(name, phone, email)')
      .eq('id', memberId)
      .single();

    const content = document.getElementById('member-details-content');
    if (!member) { content.innerHTML = '<p>Medlem ikke fundet</p>'; return; }

    const c = member.customers || {};
    content.innerHTML = `
      <div style="text-align:left">
        <div style="padding:16px;background:var(--bg3);border-radius:var(--radius-md);margin-bottom:16px">
          <h4 style="margin:0 0 8px">${c.name || 'Ukendt'}</h4>
          <div style="font-size:var(--font-size-sm);color:var(--muted)">${c.phone || ''} ${c.email ? '· ' + c.email : ''}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="text-align:center;padding:12px;background:var(--bg3);border-radius:var(--radius-sm)">
            <div style="font-size:24px;font-weight:600">${member.points || 0}</div>
            <div style="font-size:var(--font-size-xs);color:var(--muted)">Points</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg3);border-radius:var(--radius-sm)">
            <div style="font-size:24px;font-weight:600">${member.tier || 'Bronze'}</div>
            <div style="font-size:var(--font-size-xs);color:var(--muted)">Tier</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg3);border-radius:var(--radius-sm)">
            <div style="font-size:24px;font-weight:600">${member.total_spent || 0}</div>
            <div style="font-size:var(--font-size-xs);color:var(--muted)">Forbrug (kr)</div>
          </div>
        </div>
        <p style="font-size:var(--font-size-sm);color:var(--muted)">Medlem siden: ${new Date(member.created_at).toLocaleDateString('da-DK')}</p>
      </div>`;
  } catch (err) {
    document.getElementById('member-details-content').innerHTML = '<p style="color:var(--danger)">Fejl ved hentning</p>';
  }
}

// Export loyalty functions
window.renderLoyaltyPage = renderLoyaltyPage;
window.saveLoyaltySettings = saveLoyaltySettings;
window.saveLoyaltyTiers = saveLoyaltyTiers;
window.addLoyaltyTier = addLoyaltyTier;
window.removeLoyaltyTier = removeLoyaltyTier;
window.toggleLoyaltyEnabled = toggleLoyaltyEnabled;
window.filterLoyaltyMembers = filterLoyaltyMembers;
window.showAddRewardModal = showAddRewardModal;
window.closeRewardModal = closeRewardModal;
window.saveReward = saveReward;
window.editReward = editReward;
window.deleteReward = deleteReward;
window.adjustMemberPoints = adjustMemberPoints;
window.showMemberDetails = showMemberDetails;
window.getCustomerLoyalty = getCustomerLoyalty;
window.addLoyaltyPoints = addLoyaltyPoints;
window.redeemLoyaltyReward = redeemLoyaltyReward;
window.getAvailableRewards = getAvailableRewards;
window.formatLoyaltyMessage = formatLoyaltyMessage;


// ===== MARKETING CAMPAIGNS =====

// Campaign data cache
let campaigns = [];
let campaignSends = [];

// Campaign trigger types
const CAMPAIGN_TRIGGERS = {
  manual: { name: 'Manuel', icon: '', description: 'Send manuelt når du vil' },
  birthday: { name: 'Fødselsdag', icon: '', description: 'Automatisk på kundens fødselsdag' },
  inactive: { name: 'Inaktiv', icon: '', description: 'Når kunden ikke har bestilt i X dage' },
  loyalty_tier: { name: 'Loyalty Tier', icon: '', description: 'Når kunden opnår et nyt tier' },
  first_order: { name: 'Første ordre', icon: '', description: 'Efter kundens første ordre' },
  scheduled: { name: 'Planlagt', icon: '', description: 'På et bestemt tidspunkt' }
};

// Get campaigns for restaurant
async function getCampaigns(restaurantId) {
  try {
    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/marketing_campaigns?restaurant_id=eq.${restaurantId}&order=created_at.desc`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) return [];
    campaigns = await response.json();
    return campaigns;
  } catch (err) {
    console.error('getCampaigns error:', err);
    return [];
  }
}

// Render campaigns page
async function renderCampaignsPage() {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  const content = document.getElementById('campaigns-content') || document.getElementById('main-content');

  if (!restaurantId) {
    content.innerHTML = '<div class="empty-state"><p>Vælg en restaurant først</p></div>';
    return;
  }

  const campaignList = await getCampaigns(restaurantId);

  // Calculate stats
  const activeCampaigns = campaignList.filter(c => c.active).length;
  const totalSent = campaignList.reduce((sum, c) => sum + (c.total_sent || 0), 0);

  const html = `
    <div class="page-header">
      <h1>Marketing Kampagner</h1>
      <p class="text-secondary">Automatisér din kundekommunikation</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-value">${campaignList.length}</div>
        <div class="stat-label">Kampagner</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${activeCampaigns}</div>
        <div class="stat-label">Aktive</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalSent.toLocaleString('da-DK')}</div>
        <div class="stat-label">Beskeder sendt</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <h3>⚡ Hurtige kampagner</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
          <button class="btn btn-secondary" onclick="createQuickCampaign('inactive')" style="display:flex;flex-direction:column;align-items:center;padding:24px;height:auto">
            <span style="font-weight:600">Inaktive kunder</span>
            <span class="text-secondary" style="font-size:12px">Genaktiver kunder</span>
          </button>
          <button class="btn btn-secondary" onclick="createQuickCampaign('birthday')" style="display:flex;flex-direction:column;align-items:center;padding:24px;height:auto">
            <span style="font-weight:600">Fødselsdagshilsen</span>
            <span class="text-secondary" style="font-size:12px">Automatisk hilsen</span>
          </button>
          <button class="btn btn-secondary" onclick="createQuickCampaign('first_order')" style="display:flex;flex-direction:column;align-items:center;padding:24px;height:auto">
            <span style="font-weight:600">Velkomstbesked</span>
            <span class="text-secondary" style="font-size:12px">Efter første ordre</span>
          </button>
          <button class="btn btn-primary" onclick="showCreateCampaignModal()" style="display:flex;flex-direction:column;align-items:center;padding:24px;height:auto">
            <span style="font-weight:600">Opret kampagne</span>
            <span style="font-size:12px;opacity:0.8">Tilpasset kampagne</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Campaigns List -->
    <div class="card">
      <div class="card-header">
        <h3>📋 Dine kampagner</h3>
      </div>
      <div class="card-body">
        ${campaignList.length === 0 ? '<p class="text-secondary">Ingen kampagner oprettet endnu. Brug knapperne ovenfor for at komme i gang.</p>' : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kampagne</th>
                  <th>Type</th>
                  <th>Trigger</th>
                  <th>Sendt</th>
                  <th>Status</th>
                  <th>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                ${campaignList.map(c => `
                  <tr>
                    <td>
                      <strong>${c.name}</strong>
                      ${c.description ? `<br><span class="text-secondary" style="font-size:12px">${c.description}</span>` : ''}
                    </td>
                    <td><span class="badge">${c.type === 'sms' ? 'SMS' : 'Email'}</span></td>
                    <td>
                      <span>${CAMPAIGN_TRIGGERS[c.trigger_type]?.icon || ''}</span>
                      ${CAMPAIGN_TRIGGERS[c.trigger_type]?.name || c.trigger_type}
                      ${c.trigger_days ? `<br><span class="text-secondary" style="font-size:11px">${c.trigger_days} dage</span>` : ''}
                    </td>
                    <td>${(c.total_sent || 0).toLocaleString('da-DK')}</td>
                    <td>
                      <label class="switch switch-sm">
                        <input type="checkbox" ${c.active ? 'checked' : ''} onchange="toggleCampaign('${c.id}', this.checked)">
                        <span class="slider"></span>
                      </label>
                    </td>
                    <td>
                      <button class="btn btn-sm" onclick="editCampaign('${c.id}')">Rediger</button>
                      ${c.trigger_type === 'manual' ? `<button class="btn btn-sm btn-primary" onclick="sendCampaign('${c.id}')">Send nu</button>` : ''}
                      <button class="btn btn-sm btn-danger" onclick="deleteCampaign('${c.id}')">Slet</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;

  content.innerHTML = html;
}

// Create quick campaign with preset
async function createQuickCampaign(type) {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) return;

  const presets = {
    inactive: {
      name: 'Genaktivér inaktive kunder',
      description: 'Automatisk SMS til kunder der ikke har bestilt i 30 dage',
      trigger_type: 'inactive',
      trigger_days: 30,
      message_template: 'Hej {navn}! Vi savner dig hos {restaurant}. Bestil i dag og få 10% rabat med koden SAVNER10 🍕'
    },
    birthday: {
      name: 'Fødselsdagshilsen',
      description: 'Automatisk fødselsdagshilsen med tilbud',
      trigger_type: 'birthday',
      message_template: 'Tillykke med fødselsdagen {navn}! Som gave fra {restaurant} får du 15% rabat på din næste ordre. Brug koden FØDSELSDAG15'
    },
    first_order: {
      name: 'Velkomstbesked',
      description: 'Tak for første ordre',
      trigger_type: 'first_order',
      message_template: 'Tak for din første ordre hos {restaurant}, {navn}! Vi håber du nød maden. Næste gang får du 10% rabat med koden VELKOMMEN10'
    }
  };

  const preset = presets[type];
  if (!preset) return;

  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/marketing_campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        name: preset.name,
        description: preset.description,
        type: 'sms',
        trigger_type: preset.trigger_type,
        trigger_days: preset.trigger_days || null,
        message_template: preset.message_template,
        active: true
      })
    });

    toast('Kampagne oprettet!', 'success');
    renderCampaignsPage();
  } catch (err) {
    console.error('createQuickCampaign error:', err);
    toast('Fejl ved oprettelse', 'error');
  }
}

// Show create campaign modal
function showCreateCampaignModal(campaign = null) {
  const isEdit = !!campaign;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'campaign-modal';
  modal.innerHTML = `
    <div class="modal" style="max-width:600px">
      <div class="modal-header">
        <h3>${isEdit ? 'Rediger' : 'Opret'} kampagne</h3>
        <button class="modal-close" onclick="closeCampaignModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Navn *</label>
          <input type="text" class="input" id="campaign-name" value="${campaign?.name || ''}" placeholder="F.eks. Sommerrabat">
        </div>
        <div class="form-group">
          <label class="form-label">Beskrivelse</label>
          <input type="text" class="input" id="campaign-description" value="${campaign?.description || ''}" placeholder="Kort beskrivelse">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="input" id="campaign-type">
              <option value="sms" ${campaign?.type === 'sms' ? 'selected' : ''}>SMS</option>
              <option value="email" ${campaign?.type === 'email' ? 'selected' : ''}>Email</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Trigger</label>
            <select class="input" id="campaign-trigger" onchange="toggleTriggerOptions()">
              ${Object.entries(CAMPAIGN_TRIGGERS).map(([key, val]) => `
                <option value="${key}" ${campaign?.trigger_type === key ? 'selected' : ''}>${val.icon} ${val.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group" id="trigger-days-group" style="${campaign?.trigger_type === 'inactive' ? '' : 'display:none'}">
          <label class="form-label">Dage uden ordre</label>
          <input type="number" class="input" id="campaign-trigger-days" value="${campaign?.trigger_days || 30}" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Besked *</label>
          <textarea class="input" id="campaign-message" rows="4" placeholder="Brug {navn} for kundens navn, {restaurant} for restaurantnavn">${campaign?.message_template || ''}</textarea>
          <p class="text-secondary" style="font-size:12px;margin-top:4px">Variabler: {navn}, {restaurant}, {points}, {tier}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeCampaignModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveCampaign('${campaign?.id || ''}')">${isEdit ? 'Gem' : 'Opret'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// Toggle trigger options visibility
function toggleTriggerOptions() {
  const trigger = document.getElementById('campaign-trigger')?.value;
  const daysGroup = document.getElementById('trigger-days-group');
  if (daysGroup) {
    daysGroup.style.display = trigger === 'inactive' ? '' : 'none';
  }
}

// Close campaign modal
function closeCampaignModal() {
  document.getElementById('campaign-modal')?.remove();
}

// Save campaign
async function saveCampaign(campaignId = null) {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) return;

  const name = document.getElementById('campaign-name')?.value?.trim();
  const description = document.getElementById('campaign-description')?.value?.trim();
  const type = document.getElementById('campaign-type')?.value || 'sms';
  const trigger_type = document.getElementById('campaign-trigger')?.value || 'manual';
  const trigger_days = parseInt(document.getElementById('campaign-trigger-days')?.value) || null;
  const message_template = document.getElementById('campaign-message')?.value?.trim();

  if (!name || !message_template) {
    toast('Udfyld navn og besked', 'error');
    return;
  }

  const data = {
    restaurant_id: restaurantId,
    name,
    description,
    type,
    trigger_type,
    trigger_days: trigger_type === 'inactive' ? trigger_days : null,
    message_template,
    active: true
  };

  try {
    if (campaignId) {
      await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/marketing_campaigns?id=eq.${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(data)
      });
    } else {
      await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/marketing_campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(data)
      });
    }

    toast(campaignId ? 'Kampagne opdateret' : 'Kampagne oprettet', 'success');
    closeCampaignModal();
    renderCampaignsPage();
  } catch (err) {
    console.error('saveCampaign error:', err);
    toast('Fejl ved gem', 'error');
  }
}

// Edit campaign
async function editCampaign(campaignId) {
  const campaign = campaigns.find(c => c.id === campaignId);
  if (campaign) {
    showCreateCampaignModal(campaign);
  }
}

// Toggle campaign active status
async function toggleCampaign(campaignId, active) {
  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/marketing_campaigns?id=eq.${campaignId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ active, updated_at: new Date().toISOString() })
    });

    toast(active ? 'Kampagne aktiveret' : 'Kampagne deaktiveret', 'success');
  } catch (err) {
    toast('Fejl', 'error');
  }
}

// Delete campaign
async function deleteCampaign(campaignId) {
  if (!confirm('Er du sikker på du vil slette denne kampagne?')) return;

  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/marketing_campaigns?id=eq.${campaignId}`, {
      method: 'DELETE',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });

    toast('Kampagne slettet', 'success');
    renderCampaignsPage();
  } catch (err) {
    toast('Fejl ved sletning', 'error');
  }
}

// Send manual campaign
async function sendCampaign(campaignId) {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) { toast('Vælg en restaurant først', 'warn'); return; }

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) { toast('Kampagne ikke fundet', 'error'); return; }

  if (!confirm(`Send "${campaign.name}" til alle modtagere nu?`)) return;

  try {
    const { data: customers } = await window.supabaseClient
      .from('customers')
      .select('phone, email')
      .eq('restaurant_id', restaurantId);

    if (!customers?.length) { toast('Ingen kunder at sende til', 'warn'); return; }

    let sent = 0;
    for (const customer of customers) {
      if (campaign.type === 'sms' && customer.phone) {
        await fetch('/supabase/functions/v1/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('orderflow-auth-token')}` },
          body: JSON.stringify({ to: customer.phone, message: campaign.message_template })
        });
        sent++;
      }
    }
    toast(`Kampagne sendt til ${sent} modtagere`, 'success');
  } catch (err) {
    toast('Fejl ved afsendelse: ' + err.message, 'error');
  }
}

// Export campaign functions
window.renderCampaignsPage = renderCampaignsPage;
window.createQuickCampaign = createQuickCampaign;
window.showCreateCampaignModal = showCreateCampaignModal;
window.closeCampaignModal = closeCampaignModal;
window.saveCampaign = saveCampaign;
window.editCampaign = editCampaign;
window.toggleCampaign = toggleCampaign;
window.deleteCampaign = deleteCampaign;
window.sendCampaign = sendCampaign;
window.toggleTriggerOptions = toggleTriggerOptions;


// ===== CUSTOMER SEGMENTS =====

// Segment data cache
let customerSegments = [];

// Default segment icons and colors
const SEGMENT_TYPES = {
  vip: { icon: '', color: '#f59e0b', name: 'VIP Kunder' },
  new: { icon: '', color: '#10b981', name: 'Nye Kunder' },
  inactive: { icon: '', color: '#ef4444', name: 'Inaktive' },
  high_value: { icon: '', color: '#8b5cf6', name: 'Højværdi' },
  at_risk: { icon: '', color: '#f97316', name: 'At Risk' },
  loyal: { icon: '', color: '#ec4899', name: 'Loyale' },
  custom: { icon: '', color: '#6366f1', name: 'Tilpasset' }
};

// Get segments for restaurant
async function getSegments(restaurantId) {
  try {
    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/customer_segments?restaurant_id=eq.${restaurantId}&order=segment_type.asc`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) return [];
    customerSegments = await response.json();
    return customerSegments;
  } catch (err) {
    console.error('getSegments error:', err);
    return [];
  }
}

// Create default segments for restaurant
async function createDefaultSegments(restaurantId) {
  const defaults = [
    { segment_type: 'vip', name: 'VIP Kunder', description: 'Kunder med mere end 10 ordrer', filter_rules: { min_orders: 10 } },
    { segment_type: 'new', name: 'Nye Kunder', description: 'Kunder med kun 1 ordre', filter_rules: { max_orders: 1, days_since_first: 30 } },
    { segment_type: 'inactive', name: 'Inaktive Kunder', description: 'Ingen ordre i 30+ dage', filter_rules: { days_inactive: 30 } },
    { segment_type: 'high_value', name: 'Højværdi Kunder', description: 'Gennemsnitlig ordre over 300 kr', filter_rules: { min_avg_order: 300 } },
    { segment_type: 'at_risk', name: 'At Risk', description: 'Aktive kunder uden ordre i 14-30 dage', filter_rules: { days_inactive_min: 14, days_inactive_max: 30, min_orders: 2 } },
    { segment_type: 'loyal', name: 'Loyale Kunder', description: 'Gold eller Platinum loyalty tier', filter_rules: { tier: ['gold', 'platinum'] } }
  ];

  for (const seg of defaults) {
    try {
      await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/customer_segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          ...seg,
          color: SEGMENT_TYPES[seg.segment_type]?.color || '#6366f1',
          icon: SEGMENT_TYPES[seg.segment_type]?.icon || ''
        })
      });
    } catch (err) {
      console.error('createDefaultSegments error:', err);
    }
  }
}

// Render segments page
async function renderSegmentsPage() {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  const content = document.getElementById('segments-content') || document.getElementById('main-content');

  if (!restaurantId) {
    content.innerHTML = '<div class="empty-state"><p>Vælg en restaurant først</p></div>';
    return;
  }

  let segments = await getSegments(restaurantId);

  // Create defaults if none exist
  if (segments.length === 0) {
    await createDefaultSegments(restaurantId);
    segments = await getSegments(restaurantId);
  }

  const totalCustomers = segments.reduce((sum, s) => sum + (s.customer_count || 0), 0);

  const html = `
    <div class="page-header">
      <h1>Kundesegmenter</h1>
      <p class="text-secondary">Gruppér kunder for målrettet kommunikation</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-value">${segments.length}</div>
        <div class="stat-label">Segmenter</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalCustomers}</div>
        <div class="stat-label">Kunder i segmenter</div>
      </div>
    </div>

    <!-- Segments Grid -->
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <h3>📊 Dine segmenter</h3>
        <button class="btn btn-primary btn-sm" onclick="showCreateSegmentModal()">+ Tilpasset segment</button>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px">
          ${segments.map(s => `
            <div class="segment-card" style="background:var(--card2);border-radius:12px;padding:20px;border:2px solid ${s.color || '#6366f1'}20;position:relative">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                <div style="width:48px;height:48px;border-radius:12px;background:${s.color || '#6366f1'}20;display:flex;align-items:center;justify-content:center;font-size:24px">
                  ${SEGMENT_TYPES[s.segment_type]?.icon || ''}
                </div>
                <div>
                  <h4 style="margin:0;font-size:16px">${s.name}</h4>
                  <p class="text-secondary" style="margin:0;font-size:12px">${s.description || ''}</p>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border)">
                <div>
                  <span style="font-size:24px;font-weight:700">${s.customer_count || 0}</span>
                  <span class="text-secondary" style="font-size:13px"> kunder</span>
                </div>
                <div style="display:flex;gap:8px">
                  <button class="btn btn-sm" onclick="viewSegmentCustomers('${s.id}')" title="Se kunder">Vis</button>
                  <button class="btn btn-sm" onclick="sendToSegment('${s.id}')" title="Send SMS">Send</button>
                  ${s.segment_type === 'custom' ? `<button class="btn btn-sm btn-danger" onclick="deleteSegment('${s.id}')" title="Slet">Slet</button>` : ''}
                </div>
              </div>
              ${s.last_updated ? `<p class="text-secondary" style="font-size:11px;margin-top:8px">Opdateret: ${new Date(s.last_updated).toLocaleDateString('da-DK')}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Segment Explanation -->
    <div class="card">
      <div class="card-header">
        <h3>Sådan virker segmenter</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:24px">
          <div>
            <h4 style="display:flex;align-items:center;gap:8px;margin-bottom:8px">VIP Kunder</h4>
            <p class="text-secondary" style="font-size:13px">Kunder med mange ordrer. Beløn dem med eksklusive tilbud.</p>
          </div>
          <div>
            <h4 style="display:flex;align-items:center;gap:8px;margin-bottom:8px">Inaktive</h4>
            <p class="text-secondary" style="font-size:13px">Kunder der ikke har bestilt i 30+ dage. Genaktiver dem med rabatkoder.</p>
          </div>
          <div>
            <h4 style="display:flex;align-items:center;gap:8px;margin-bottom:8px">At Risk</h4>
            <p class="text-secondary" style="font-size:13px">Kunder på vej til at blive inaktive. Handl hurtigt!</p>
          </div>
          <div>
            <h4 style="display:flex;align-items:center;gap:8px;margin-bottom:8px">Højværdi</h4>
            <p class="text-secondary" style="font-size:13px">Kunder med høj gennemsnitlig ordre. Tilbyd premium-service.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  content.innerHTML = html;
}

// Show create segment modal
function showCreateSegmentModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'segment-modal';
  modal.innerHTML = `
    <div class="modal" style="max-width:500px">
      <div class="modal-header">
        <h3>Opret tilpasset segment</h3>
        <button class="modal-close" onclick="closeSegmentModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Navn *</label>
          <input type="text" class="input" id="segment-name" placeholder="F.eks. Fredag-kunder">
        </div>
        <div class="form-group">
          <label class="form-label">Beskrivelse</label>
          <input type="text" class="input" id="segment-description" placeholder="Kort beskrivelse">
        </div>
        <h4 style="margin:20px 0 12px">Filterregler</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Min. antal ordrer</label>
            <input type="number" class="input" id="segment-min-orders" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Max antal ordrer</label>
            <input type="number" class="input" id="segment-max-orders" min="0" placeholder="Ubegrænset">
          </div>
          <div class="form-group">
            <label class="form-label">Dage inaktiv (min)</label>
            <input type="number" class="input" id="segment-days-inactive" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Min. gennemsnitsordre (kr)</label>
            <input type="number" class="input" id="segment-min-avg" min="0" placeholder="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Loyalty tier</label>
          <select class="input" id="segment-tier">
            <option value="">Alle tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Sølv</option>
            <option value="gold">Guld</option>
            <option value="platinum">Platin</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeSegmentModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveSegment()">Opret</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// Close segment modal
function closeSegmentModal() {
  document.getElementById('segment-modal')?.remove();
}

// Save segment
async function saveSegment() {
  const restaurantId = document.getElementById('test-restaurant')?.value;
  if (!restaurantId) return;

  const name = document.getElementById('segment-name')?.value?.trim();
  const description = document.getElementById('segment-description')?.value?.trim();

  if (!name) {
    toast('Indtast et navn', 'error');
    return;
  }

  const filter_rules = {};
  const minOrders = parseInt(document.getElementById('segment-min-orders')?.value);
  const maxOrders = parseInt(document.getElementById('segment-max-orders')?.value);
  const daysInactive = parseInt(document.getElementById('segment-days-inactive')?.value);
  const minAvg = parseInt(document.getElementById('segment-min-avg')?.value);
  const tier = document.getElementById('segment-tier')?.value;

  if (!isNaN(minOrders) && minOrders > 0) filter_rules.min_orders = minOrders;
  if (!isNaN(maxOrders)) filter_rules.max_orders = maxOrders;
  if (!isNaN(daysInactive) && daysInactive > 0) filter_rules.days_inactive = daysInactive;
  if (!isNaN(minAvg) && minAvg > 0) filter_rules.min_avg_order = minAvg;
  if (tier) filter_rules.tier = [tier];

  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/customer_segments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        name,
        description,
        segment_type: 'custom',
        filter_rules,
        color: '#6366f1',
        icon: ''
      })
    });

    toast('Segment oprettet', 'success');
    closeSegmentModal();
    renderSegmentsPage();
  } catch (err) {
    console.error('saveSegment error:', err);
    toast('Fejl ved oprettelse', 'error');
  }
}

// Delete segment
async function deleteSegment(segmentId) {
  if (!confirm('Er du sikker på du vil slette dette segment?')) return;

  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/customer_segments?id=eq.${segmentId}`, {
      method: 'DELETE',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });

    toast('Segment slettet', 'success');
    renderSegmentsPage();
  } catch (err) {
    toast('Fejl ved sletning', 'error');
  }
}

function viewSegmentCustomers(segmentId) {
  const segment = marketingSegments.find(s => s.id === segmentId) || customerSegments.find(s => s.id === segmentId);
  if (!segment) { toast('Segment ikke fundet', 'error'); return; }

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'segment-customers-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3>Kunder i "${segment.name}"</h3>
        <button class="modal-close" onclick="document.getElementById('segment-customers-modal').remove()">×</button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1">
        <p style="color:var(--muted);margin-bottom:var(--space-3)">${segment.customerCount || 0} kunder i dette segment</p>
        <div id="segment-customers-list" style="color:var(--muted);text-align:center;padding:20px">Henter kunder...</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('segment-customers-modal').remove()">Luk</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Load customers from Supabase
  loadSegmentCustomers(segmentId);
}

async function loadSegmentCustomers(segmentId) {
  const listEl = document.getElementById('segment-customers-list');
  if (!listEl) return;
  try {
    const restaurantId = document.getElementById('test-restaurant')?.value;
    if (!restaurantId) { listEl.innerHTML = '<p>Vælg en restaurant først</p>'; return; }

    const { data: customers } = await window.supabaseClient
      .from('customers')
      .select('id, name, phone, email, total_orders')
      .eq('restaurant_id', restaurantId)
      .limit(50);

    if (!customers?.length) { listEl.innerHTML = '<p style="color:var(--muted)">Ingen kunder fundet</p>'; return; }

    listEl.innerHTML = customers.map(c => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:500">${c.name || 'Ukendt'}</div>
          <div style="font-size:var(--font-size-xs);color:var(--muted)">${c.phone || ''} ${c.email ? '· ' + c.email : ''}</div>
        </div>
        <div style="font-size:var(--font-size-sm);color:var(--muted)">${c.total_orders || 0} ordrer</div>
      </div>`).join('');
  } catch (err) {
    listEl.innerHTML = '<p style="color:var(--danger)">Fejl ved hentning af kunder</p>';
  }
}

function sendToSegment(segmentId) {
  const segment = marketingSegments.find(s => s.id === segmentId) || customerSegments.find(s => s.id === segmentId);
  if (!segment) { toast('Segment ikke fundet', 'error'); return; }

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'send-segment-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px">
      <div class="modal-header">
        <h3>Send besked til "${segment.name}"</h3>
        <button class="modal-close" onclick="document.getElementById('send-segment-modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--muted);margin-bottom:var(--space-3)">Sender til ${segment.customerCount || 0} kunder</p>
        <div class="form-group">
          <label class="form-label">Beskedtype</label>
          <select class="input" id="segment-msg-type">
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Besked</label>
          <textarea class="input" id="segment-msg-text" rows="4" placeholder="Skriv din besked her..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('send-segment-modal').remove()">Annuller</button>
        <button class="btn btn-primary" onclick="executeSendToSegment('${segmentId}')">Send</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function executeSendToSegment(segmentId) {
  const message = document.getElementById('segment-msg-text')?.value?.trim();
  const type = document.getElementById('segment-msg-type')?.value || 'sms';
  if (!message) { toast('Skriv en besked', 'warn'); return; }

  try {
    const restaurantId = document.getElementById('test-restaurant')?.value;
    const { data: customers } = await window.supabaseClient
      .from('customers')
      .select('phone, email')
      .eq('restaurant_id', restaurantId);

    if (!customers?.length) { toast('Ingen kunder at sende til', 'warn'); return; }

    let sent = 0;
    for (const c of customers) {
      if (type === 'sms' && c.phone) {
        await fetch('/supabase/functions/v1/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('orderflow-auth-token')}` },
          body: JSON.stringify({ to: c.phone, message })
        });
        sent++;
      }
    }
    toast(`Besked sendt til ${sent} kunder`, 'success');
    document.getElementById('send-segment-modal')?.remove();
  } catch (err) {
    toast('Fejl: ' + err.message, 'error');
  }
}

// Export segment functions
window.renderSegmentsPage = renderSegmentsPage;
window.showCreateSegmentModal = showCreateSegmentModal;
window.closeSegmentModal = closeSegmentModal;
window.saveSegment = saveSegment;
window.deleteSegment = deleteSegment;
window.viewSegmentCustomers = viewSegmentCustomers;
window.sendToSegment = sendToSegment;

// =====================================================
// UDSENDELSER (Email/SMS Campaign Overview)
// =====================================================

// Cache for udsendelser
let udsendelserCache = [];

// Render udsendelser page
async function renderUdsendelserPage() {
  const contentEl = document.getElementById('udsendelser-content');
  if (!contentEl) return;

  contentEl.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  // Get restaurant ID
  const restaurantId = document.getElementById('test-restaurant')?.value;

  // Mock data for now - can be replaced with real API calls
  const udsendelser = [
    { id: 1, title: 'Velkomsttilbud til nye kunder', type: 'email', sent_at: '2024-01-15', recipients: 156, opened: 89, clicked: 34, status: 'completed' },
    { id: 2, title: 'Weekend special SMS', type: 'sms', sent_at: '2024-01-12', recipients: 423, opened: null, clicked: null, status: 'completed' },
    { id: 3, title: 'Nyhedsbrev januar', type: 'email', sent_at: '2024-01-10', recipients: 892, opened: 456, clicked: 123, status: 'completed' },
    { id: 4, title: 'Loyalitetsbonus reminder', type: 'sms', sent_at: '2024-01-05', recipients: 234, opened: null, clicked: null, status: 'completed' }
  ];

  // Calculate stats
  const totalSent = udsendelser.reduce((sum, u) => sum + u.recipients, 0);
  const emailUdsendelser = udsendelser.filter(u => u.type === 'email');
  const avgOpenRate = emailUdsendelser.length > 0
    ? Math.round(emailUdsendelser.reduce((sum, u) => sum + ((u.opened / u.recipients) * 100), 0) / emailUdsendelser.length)
    : 0;
  const avgClickRate = emailUdsendelser.length > 0
    ? Math.round(emailUdsendelser.reduce((sum, u) => sum + ((u.clicked / u.recipients) * 100), 0) / emailUdsendelser.length)
    : 0;

  const html = `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h1>Udsendelser</h1>
        <p class="text-secondary">Oversigt over email og SMS kampagner</p>
      </div>
      <button class="btn btn-primary" onclick="showCreateUdsendelseModal()">Opret udsendelse</button>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-value">${udsendelser.length}</div>
        <div class="stat-label">Udsendelser</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalSent.toLocaleString('da-DK')}</div>
        <div class="stat-label">Sendt i alt</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgOpenRate}%</div>
        <div class="stat-label">Gns. åbningsrate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgClickRate}%</div>
        <div class="stat-label">Gns. klikrate</div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h3>Sendte udsendelser</h3>
        <div class="btn-group" id="udsendelser-filter">
          <button class="btn btn-sm active" onclick="filterUdsendelser('all')">Alle</button>
          <button class="btn btn-sm" onclick="filterUdsendelser('email')">Email</button>
          <button class="btn btn-sm" onclick="filterUdsendelser('sms')">SMS</button>
        </div>
      </div>
      <div class="card-body">
        <div class="table-container">
          <table class="data-table" id="udsendelser-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Type</th>
                <th>Sendt</th>
                <th>Modtagere</th>
                <th>Åbnet</th>
                <th>Klikket</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${udsendelser.map(u => `
                <tr data-type="${u.type}">
                  <td><strong>${u.title}</strong></td>
                  <td>
                    <span class="badge" style="background:${u.type === 'email' ? 'var(--accent)' : 'var(--warning)'};color:white">
                      ${u.type === 'email' ? 'Email' : 'SMS'}
                    </span>
                  </td>
                  <td>${new Date(u.sent_at).toLocaleDateString('da-DK')}</td>
                  <td>${u.recipients.toLocaleString('da-DK')}</td>
                  <td>${u.opened !== null ? Math.round((u.opened / u.recipients) * 100) + '%' : '-'}</td>
                  <td>${u.clicked !== null ? Math.round((u.clicked / u.recipients) * 100) + '%' : '-'}</td>
                  <td>
                    <span class="badge badge-success">Sendt</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  contentEl.innerHTML = html;
}

// Filter udsendelser by type
function filterUdsendelser(type) {
  const table = document.getElementById('udsendelser-table');
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    if (type === 'all' || row.dataset.type === type) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  // Update active button
  const buttons = document.querySelectorAll('#udsendelser-filter .btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(type) || (type === 'all' && btn.textContent === 'Alle')) {
      btn.classList.add('active');
    }
  });
}

// Show create udsendelse modal
function showCreateUdsendelseModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'create-udsendelse-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:550px">
      <div class="modal-header">
        <h3>Opret udsendelse</h3>
        <button class="modal-close" onclick="document.getElementById('create-udsendelse-modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Navn</label>
          <input type="text" class="input" id="uds-name" placeholder="f.eks. Fredagstilbud">
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="input" id="uds-type">
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Modtagere</label>
          <select class="input" id="uds-target">
            <option value="all">Alle kunder</option>
            ${marketingSegments.map(s => `<option value="${s.id}">${s.name} (${s.customerCount})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Besked</label>
          <textarea class="input" id="uds-message" rows="4" placeholder="Skriv din besked..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Planlæg afsendelse</label>
          <select class="input" id="uds-schedule">
            <option value="now">Send nu</option>
            <option value="scheduled">Planlæg tidspunkt</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('create-udsendelse-modal').remove()">Annuller</button>
        <button class="btn btn-primary" onclick="saveUdsendelse()">Opret</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveUdsendelse() {
  const name = document.getElementById('uds-name')?.value?.trim();
  const type = document.getElementById('uds-type')?.value;
  const message = document.getElementById('uds-message')?.value?.trim();
  const target = document.getElementById('uds-target')?.value;
  const schedule = document.getElementById('uds-schedule')?.value;

  if (!name || !message) { toast('Udfyld navn og besked', 'warn'); return; }

  const udsendelse = {
    id: 'uds-' + Date.now(),
    name, type, message, target, schedule,
    status: schedule === 'now' ? 'sent' : 'scheduled',
    recipients: 0, opened: 0, clicked: 0,
    createdAt: new Date().toISOString()
  };

  udsendelserCache.push(udsendelse);
  localStorage.setItem('orderflow_udsendelser', JSON.stringify(udsendelserCache));
  document.getElementById('create-udsendelse-modal')?.remove();
  renderUdsendelserPage();
  toast(schedule === 'now' ? 'Udsendelse sendt' : 'Udsendelse planlagt', 'success');
}

// Export udsendelser functions
window.renderUdsendelserPage = renderUdsendelserPage;
window.filterUdsendelser = filterUdsendelser;
window.showCreateUdsendelseModal = showCreateUdsendelseModal;
window.saveUdsendelse = saveUdsendelse;
window.executeSendToSegment = executeSendToSegment;
window.loadSegmentCustomers = loadSegmentCustomers;

// =====================================================
// ROLE MANAGEMENT
// =====================================================

const AVAILABLE_PERMISSIONS = [
  { id: 'customers', label: 'Kunder', desc: 'Se og rediger kunder' },
  { id: 'customers_read', label: 'Kunder (læs)', desc: 'Kun se kunder' },
  { id: 'workflow', label: 'Workflow', desc: 'Administrer workflows' },
  { id: 'reports', label: 'Rapporter', desc: 'Se rapporter og statistik' },
  { id: 'leads', label: 'Leads', desc: 'Administrer leads' },
  { id: 'settings', label: 'Indstillinger', desc: 'Ændre indstillinger' },
  { id: 'users', label: 'Brugere', desc: 'Administrer brugere' },
  { id: 'billing', label: 'Fakturering', desc: 'Se fakturering' },
];

const ROLE_COLORS = [
  '#2dd4bf', '#22c55e', '#f97316', '#ef4444', '#8b5cf6',
  '#ec4899', '#3b82f6', '#eab308', '#6b7280', '#14b8a6'
];

let selectedRoleId = null;
let selectedRoleColor = '#6b7280';

// Load roles page

function getDefaultCampaigns() {
  return [
    {
      id: 'campaign-welcome',
      name: 'Velkomstbesked',
      description: 'Automatisk besked til nye kunder',
      type: 'announcement',
      status: 'active',
      channels: ['email', 'sms'],
      content: {
        headline: 'Velkommen til Flow!',
        body: 'Tak fordi du valgte os. Vi glæder os til at servicere dig.',
        ctaText: 'Se vores menu',
        ctaUrl: '/menu'
      },
      stats: { sent: 245, delivered: 240, opened: 180, clicked: 45, converted: 12 },
      createdAt: '2026-01-15T10:00:00Z',
      sentAt: '2026-01-20T12:00:00Z'
    },
    {
      id: 'campaign-birthday',
      name: 'Fødselsdagstilbud',
      description: 'Automatisk fødselsdagsrabat',
      type: 'promotion',
      status: 'active',
      channels: ['email', 'push', 'sms'],
      content: {
        headline: 'Tillykke med fødselsdagen!',
        body: 'Fejr din dag med 20% rabat på din næste ordre.',
        ctaText: 'Indløs rabat',
        ctaUrl: '/bestil'
      },
      stats: { sent: 89, delivered: 87, opened: 72, clicked: 34, converted: 18 },
      createdAt: '2026-01-10T10:00:00Z',
      sentAt: null
    }
  ];
}

// Default segments
function getDefaultSegments() {
  return [
    { id: 'segment-vip', name: 'VIP Kunder', description: 'Kunder med mere end 10 ordrer', customerCount: 234, createdAt: '2026-01-01T10:00:00Z' },
    { id: 'segment-new', name: 'Nye Kunder', description: 'Kunder fra de sidste 30 dage', customerCount: 89, createdAt: '2026-01-01T10:00:00Z' },
    { id: 'segment-inactive', name: 'Inaktive Kunder', description: 'Ingen ordre i 60+ dage', customerCount: 156, createdAt: '2026-01-01T10:00:00Z' }
  ];
}

// Default broadcasts
function getDefaultBroadcasts() {
  return [
    {
      id: 'broadcast-1',
      campaignId: 'campaign-welcome',
      campaignName: 'Velkomst Email Kampagne',
      channels: ['email'],
      sentAt: '2026-01-15T10:00:00Z',
      stats: { recipients: 156, delivered: 142, opened: 89, clicked: 34, failed: 14 },
      status: 'completed'
    },
    {
      id: 'broadcast-2',
      campaignId: 'campaign-promo',
      campaignName: 'Weekend Tilbud SMS',
      channels: ['sms'],
      sentAt: '2026-01-12T14:30:00Z',
      stats: { recipients: 423, delivered: 418, opened: 0, clicked: 0, failed: 5 },
      status: 'completed'
    },
    {
      id: 'broadcast-3',
      campaignId: 'campaign-newsletter',
      campaignName: 'Januar Nyhedsbrev',
      channels: ['email', 'app'],
      sentAt: '2026-01-10T09:00:00Z',
      stats: { recipients: 892, delivered: 876, opened: 456, clicked: 123, failed: 16 },
      status: 'completed'
    },
    {
      id: 'broadcast-4',
      campaignId: 'campaign-loyalty',
      campaignName: 'Loyalitetsbonus Reminder',
      channels: ['sms', 'push'],
      sentAt: '2026-01-05T16:00:00Z',
      stats: { recipients: 234, delivered: 230, opened: 0, clicked: 0, failed: 4 },
      status: 'completed'
    }
  ];
}

// Load Marketing Data
function loadMarketingData() {
  // Load campaigns
  const savedCampaigns = localStorage.getItem('orderflow_marketing_campaigns');
  marketingCampaigns = savedCampaigns ? JSON.parse(savedCampaigns) : getDefaultCampaigns();

  // Add demo campaigns if enabled
  if (isDemoDataEnabled()) {
    const demoCampaigns = getDemoDataCampaigns();
    marketingCampaigns = [...marketingCampaigns, ...demoCampaigns];
  }

  // Load broadcasts
  const savedBroadcasts = localStorage.getItem('orderflow_marketing_broadcasts');
  marketingBroadcasts = savedBroadcasts ? JSON.parse(savedBroadcasts) : getDefaultBroadcasts();

  // Load segments
  const savedSegments = localStorage.getItem('orderflow_marketing_segments');
  marketingSegments = savedSegments ? JSON.parse(savedSegments) : getDefaultSegments();

  marketingHasChanges = false;
  updateMarketingUnsavedBadge();
  renderCampaignsList();
}

// Save Marketing Data
function saveMarketingData() {
  localStorage.setItem('orderflow_marketing_campaigns', JSON.stringify(marketingCampaigns));
  localStorage.setItem('orderflow_marketing_broadcasts', JSON.stringify(marketingBroadcasts));
  localStorage.setItem('orderflow_marketing_segments', JSON.stringify(marketingSegments));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('marketing_data', {
      campaigns: marketingCampaigns,
      broadcasts: marketingBroadcasts,
      segments: marketingSegments
    }).catch(err => console.warn('Supabase sync fejl (marketing):', err));
  }

  marketingHasChanges = false;
  updateMarketingUnsavedBadge();
  toast('Marketing data gemt', 'success');
  if (typeof showSaveStatus === 'function') showSaveStatus('marketing-save-status');
}

// Mark marketing as changed
function markMarketingChanged() {
  marketingHasChanges = true;
  updateMarketingUnsavedBadge();
}

// Update unsaved badge
function updateMarketingUnsavedBadge() {
  const badge = document.getElementById('marketing-unsaved-badge');
  if (badge) {
    badge.style.display = marketingHasChanges ? 'inline-block' : 'none';
  }
}

// Switch Marketing Tab
function switchMarketingTab(tab) {
  // Update tab buttons
  document.querySelectorAll('#page-campaigns .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById('marketing-tab-' + tab)?.classList.add('active');

  // Hide all tabs
  document.getElementById('marketing-content-campaigns').style.display = 'none';
  document.getElementById('marketing-content-broadcasts').style.display = 'none';
  document.getElementById('marketing-content-segments').style.display = 'none';

  // Show selected tab
  document.getElementById('marketing-content-' + tab).style.display = 'block';

  // Render tab content
  if (tab === 'campaigns') renderCampaignsList();
  if (tab === 'broadcasts') renderBroadcastsList();
  if (tab === 'segments') renderSegmentsList();
}

// Render Campaigns List
function renderCampaignsList() {
  const container = document.getElementById('campaigns-list');
  if (!container) return;

  const statusColors = {
    draft: 'badge-warning',
    scheduled: 'badge-info',
    active: 'badge-success',
    completed: 'badge-secondary',
    cancelled: 'badge-danger'
  };

  const statusLabels = {
    draft: 'Kladde',
    scheduled: 'Planlagt',
    active: 'Aktiv',
    completed: 'Afsluttet',
    cancelled: 'Annulleret'
  };

  const typeIcons = {
    promotion: '',
    newsletter: '',
    event: '',
    announcement: ''
  };

  container.innerHTML = marketingCampaigns.map(campaign => `
    <div class="campaign-item" onclick="selectCampaign('${campaign.id}')" style="padding:12px;border-radius:8px;cursor:pointer;border:1px solid ${currentCampaignId === campaign.id ? 'var(--primary)' : 'transparent'};background:${currentCampaignId === campaign.id ? 'var(--primary-light)' : 'transparent'};margin-bottom:8px;transition:all 0.15s ease">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <span>${typeIcons[campaign.type] || ''}</span>
            <span style="font-weight:500;font-size:13px">${campaign.name}</span>
          </div>
          <p style="font-size:11px;color:var(--muted);margin:4px 0 0">${campaign.description || 'Ingen beskrivelse'}</p>
        </div>
        <span class="badge ${statusColors[campaign.status] || 'badge-secondary'}" style="font-size:10px">${statusLabels[campaign.status] || campaign.status}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${campaign.channels.map(ch => `<span style="font-size:10px;padding:2px 6px;background:var(--bg3);border-radius:4px">${getChannelIcon(ch)}</span>`).join('')}
      </div>
      ${campaign.stats?.sent > 0 ? `
        <div style="display:flex;gap:12px;margin-top:8px;font-size:10px;color:var(--muted)">
          <span>Sendt: ${campaign.stats.sent}</span>
          <span>Åbnet: ${campaign.stats.opened}</span>
          <span>Klikket: ${campaign.stats.clicked}</span>
        </div>
      ` : ''}
    </div>
  `).join('') || '<p style="text-align:center;padding:20px;color:var(--muted)">Ingen kampagner endnu</p>';
}

// Get channel label (no icons for cleaner design)
function getChannelIcon(channel) {
  const labels = {
    app: 'App',
    website: 'Web',
    email: 'Email',
    sms: 'SMS',
    push: 'Push'
  };
  return labels[channel] || channel;
}

// Select Campaign
function selectCampaign(campaignId) {
  currentCampaignId = campaignId;
  renderCampaignsList();
  renderCampaignEditor();
}

// Get current campaign
function getCurrentCampaign() {
  return marketingCampaigns.find(c => c.id === currentCampaignId);
}

// Render Campaign Editor
function renderCampaignEditor() {
  const campaign = getCurrentCampaign();
  const emptyEl = document.getElementById('campaign-editor-empty');
  const formEl = document.getElementById('campaign-editor-form');
  const headerEl = document.getElementById('campaign-editor-header');

  if (!campaign) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (formEl) formEl.style.display = 'none';
    if (headerEl) headerEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (formEl) formEl.style.display = 'block';
  if (headerEl) headerEl.style.display = 'block';

  // Fill form
  document.getElementById('campaign-name').value = campaign.name || '';
  document.getElementById('campaign-description').value = campaign.description || '';
  document.getElementById('campaign-type').value = campaign.type || 'promotion';
  document.getElementById('campaign-status').value = campaign.status || 'draft';

  // Channels
  document.getElementById('channel-app').checked = campaign.channels?.includes('app');
  document.getElementById('channel-website').checked = campaign.channels?.includes('website');
  document.getElementById('channel-email').checked = campaign.channels?.includes('email');
  document.getElementById('channel-sms').checked = campaign.channels?.includes('sms');
  document.getElementById('channel-push').checked = campaign.channels?.includes('push');

  // Content
  document.getElementById('campaign-headline').value = campaign.content?.headline || '';
  document.getElementById('campaign-body').value = campaign.content?.body || '';
  document.getElementById('campaign-cta-text').value = campaign.content?.ctaText || '';
  document.getElementById('campaign-cta-url').value = campaign.content?.ctaUrl || '';

  // Stats
  const statsEl = document.getElementById('campaign-stats');
  if (campaign.stats?.sent > 0) {
    statsEl.style.display = 'block';
    document.getElementById('stat-sent').textContent = campaign.stats.sent || 0;
    document.getElementById('stat-opened').textContent = campaign.stats.opened || 0;
    document.getElementById('stat-clicked').textContent = campaign.stats.clicked || 0;
    document.getElementById('stat-converted').textContent = campaign.stats.converted || 0;
  } else {
    statsEl.style.display = 'none';
  }
}

// Update current campaign field
function updateCurrentCampaignField(field, value) {
  const campaign = getCurrentCampaign();
  if (!campaign) return;
  campaign[field] = value;
  markMarketingChanged();
  renderCampaignsList();
}

// Update campaign channels
function updateCampaignChannels() {
  const campaign = getCurrentCampaign();
  if (!campaign) return;

  const channels = [];
  if (document.getElementById('channel-app').checked) channels.push('app');
  if (document.getElementById('channel-website').checked) channels.push('website');
  if (document.getElementById('channel-email').checked) channels.push('email');
  if (document.getElementById('channel-sms').checked) channels.push('sms');
  if (document.getElementById('channel-push').checked) channels.push('push');

  campaign.channels = channels;
  markMarketingChanged();
  renderCampaignsList();
}

// Update campaign content
function updateCampaignContent(field, value) {
  const campaign = getCurrentCampaign();
  if (!campaign) return;
  if (!campaign.content) campaign.content = {};
  campaign.content[field] = value;
  markMarketingChanged();
}

// Add new campaign
function addNewCampaign() {
  const newCampaign = {
    id: 'campaign-' + Date.now(),
    name: 'Ny Kampagne',
    description: '',
    type: 'promotion',
    status: 'draft',
    channels: ['email'],
    content: { headline: '', body: '', ctaText: '', ctaUrl: '' },
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
    createdAt: new Date().toISOString(),
    sentAt: null
  };

  marketingCampaigns.unshift(newCampaign);
  markMarketingChanged();
  renderCampaignsList();
  selectCampaign(newCampaign.id);
}

// Delete current campaign
function deleteCurrentCampaign() {
  const campaign = getCurrentCampaign();
  if (!campaign) return;
  if (!confirm(`Er du sikker på at du vil slette "${campaign.name}"?`)) return;

  marketingCampaigns = marketingCampaigns.filter(c => c.id !== campaign.id);
  currentCampaignId = null;
  markMarketingChanged();
  renderCampaignsList();
  renderCampaignEditor();
}

// Duplicate current campaign
function duplicateCurrentCampaign() {
  const campaign = getCurrentCampaign();
  if (!campaign) return;

  const duplicated = JSON.parse(JSON.stringify(campaign));
  duplicated.id = 'campaign-' + Date.now();
  duplicated.name = campaign.name + ' (Kopi)';
  duplicated.status = 'draft';
  duplicated.stats = { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 };
  duplicated.createdAt = new Date().toISOString();
  duplicated.sentAt = null;

  marketingCampaigns.unshift(duplicated);
  markMarketingChanged();
  renderCampaignsList();
  selectCampaign(duplicated.id);
  toast('Kampagne duplikeret', 'success');
}

// Send current campaign
function sendCurrentCampaign() {
  const campaign = getCurrentCampaign();
  if (!campaign) return;
  if (campaign.channels.length === 0) {
    toast('Vælg mindst én kanal', 'error');
    return;
  }

  // Create broadcast record
  const broadcast = {
    id: 'broadcast-' + Date.now(),
    campaignId: campaign.id,
    campaignName: campaign.name,
    channels: campaign.channels,
    sentAt: new Date().toISOString(),
    stats: {
      recipients: Math.floor(Math.random() * 500) + 100,
      delivered: 0,
      failed: 0
    },
    status: 'sending'
  };

  // Simulate sending
  broadcast.stats.delivered = Math.floor(broadcast.stats.recipients * 0.95);
  broadcast.stats.failed = broadcast.stats.recipients - broadcast.stats.delivered;
  broadcast.status = 'sent';

  // Update campaign stats
  campaign.stats.sent = (campaign.stats.sent || 0) + broadcast.stats.delivered;
  campaign.sentAt = broadcast.sentAt;

  marketingBroadcasts.unshift(broadcast);
  markMarketingChanged();
  renderCampaignsList();
  renderCampaignEditor();
  toast(`Kampagne sendt til ${broadcast.stats.delivered} modtagere`, 'success');
}

// Render Broadcasts List
// Track selected broadcasts for table
let selectedBroadcasts = [];

function renderBroadcastsList() {
  const container = document.getElementById('broadcasts-list');
  const emptyEl = document.getElementById('broadcasts-empty');
  if (!container) return;

  if (marketingBroadcasts.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const allSelected = selectedBroadcasts.length === marketingBroadcasts.length && marketingBroadcasts.length > 0;
  const someSelected = selectedBroadcasts.length > 0 && selectedBroadcasts.length < marketingBroadcasts.length;

  container.innerHTML = `
    <div class="table-container" style="overflow-x:auto">
      <table class="data-table" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="width:40px;padding:12px 8px;text-align:left">
              <input type="checkbox"
                id="select-all-broadcasts"
                onchange="toggleAllBroadcasts(this.checked)"
                ${allSelected ? 'checked' : ''}
                ${someSelected ? 'class="indeterminate"' : ''}>
            </th>
            <th style="padding:12px 8px;text-align:left;font-weight:500;font-size:13px">Titel</th>
            <th style="padding:12px 8px;text-align:left;font-weight:500;font-size:13px">Type</th>
            <th style="padding:12px 8px;text-align:left;font-weight:500;font-size:13px">Sendt</th>
            <th style="padding:12px 8px;text-align:left;font-weight:500;font-size:13px">Modtagere</th>
            <th style="padding:12px 8px;text-align:left;font-weight:500;font-size:13px">Åbnet</th>
            <th style="padding:12px 8px;text-align:left;font-weight:500;font-size:13px">Klikket</th>
            <th style="padding:12px 8px;text-align:left;font-weight:500;font-size:13px">Status</th>
          </tr>
        </thead>
        <tbody>
          ${marketingBroadcasts.map(broadcast => {
            const isSelected = selectedBroadcasts.includes(broadcast.id);
            const recipients = broadcast.stats?.recipients || broadcast.stats?.delivered + broadcast.stats?.failed || 0;
            const opened = broadcast.stats?.opened || broadcast.stats?.delivered || 0;
            const clicked = broadcast.stats?.clicked || 0;
            const openRate = recipients > 0 ? Math.round((opened / recipients) * 100) : 0;
            const clickRate = recipients > 0 ? Math.round((clicked / recipients) * 100) : 0;

            // Determine type badges
            const typeBadges = broadcast.channels.map(ch => {
              const colors = {
                'email': 'background:var(--accent);color:white',
                'sms': 'background:var(--warning);color:white',
                'app': 'background:var(--success);color:white',
                'web': 'background:var(--info);color:white'
              };
              return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;${colors[ch] || 'background:var(--muted)'}">${ch.toUpperCase()}</span>`;
            }).join(' ');

            // Status badge
            const statusColors = {
              'completed': 'background:var(--success);color:white',
              'pending': 'background:var(--warning);color:white',
              'failed': 'background:var(--danger);color:white',
              'draft': 'background:var(--muted);color:white'
            };
            const statusText = {
              'completed': 'Sendt',
              'pending': 'Afventer',
              'failed': 'Fejlet',
              'draft': 'Kladde'
            };
            const status = broadcast.status || 'completed';

            return `
              <tr style="border-bottom:1px solid var(--border);${isSelected ? 'background:var(--accent-light, rgba(45, 212, 191, 0.1))' : ''}">
                <td style="padding:12px 8px">
                  <input type="checkbox"
                    onchange="toggleBroadcastSelection('${broadcast.id}')"
                    ${isSelected ? 'checked' : ''}>
                </td>
                <td style="padding:12px 8px">
                  <span style="font-weight:500;font-size:14px">${broadcast.campaignName}</span>
                </td>
                <td style="padding:12px 8px">
                  <div style="display:flex;gap:4px;flex-wrap:wrap">${typeBadges}</div>
                </td>
                <td style="padding:12px 8px;font-size:13px;color:var(--muted)">
                  ${new Date(broadcast.sentAt).toLocaleDateString('da-DK')}
                </td>
                <td style="padding:12px 8px;font-size:13px">
                  ${recipients.toLocaleString('da-DK')}
                </td>
                <td style="padding:12px 8px;font-size:13px">
                  ${openRate}%
                </td>
                <td style="padding:12px 8px;font-size:13px">
                  ${clickRate > 0 ? clickRate + '%' : '-'}
                </td>
                <td style="padding:12px 8px">
                  <span style="display:inline-block;padding:4px 10px;border-radius:4px;font-size:12px;${statusColors[status]}">${statusText[status]}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Set indeterminate state for checkbox
  const selectAllCheckbox = document.getElementById('select-all-broadcasts');
  if (selectAllCheckbox && someSelected) {
    selectAllCheckbox.indeterminate = true;
  }
}

// Toggle single broadcast selection
function toggleBroadcastSelection(id) {
  if (selectedBroadcasts.includes(id)) {
    selectedBroadcasts = selectedBroadcasts.filter(item => item !== id);
  } else {
    selectedBroadcasts.push(id);
  }
  renderBroadcastsList();
}

// Toggle all broadcasts selection
function toggleAllBroadcasts(checked) {
  if (checked) {
    selectedBroadcasts = marketingBroadcasts.map(b => b.id);
  } else {
    selectedBroadcasts = [];
  }
  renderBroadcastsList();
}

// Render Segments List
function renderSegmentsList() {
  const container = document.getElementById('segments-grid');
  const emptyEl = document.getElementById('segments-empty');
  if (!container) return;

  if (marketingSegments.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  container.innerHTML = marketingSegments.map(segment => `
    <div class="setting-card" style="padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:600">${segment.name}</h3>
          <p style="margin:4px 0 0;font-size:12px;color:var(--muted)">${segment.description || 'Ingen beskrivelse'}</p>
        </div>
        <button class="btn btn-sm btn-danger" onclick="deleteSegment('${segment.id}')">Slet</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:12px;background:var(--bg3);border-radius:8px">
        <span style="font-size:24px;font-weight:600">${segment.customerCount}</span>
        <span style="font-size:12px;color:var(--muted)">kunder</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-sm btn-secondary" style="flex:1" onclick="viewSegmentCustomers('${segment.id}')">Se kunder</button>
        <button class="btn btn-sm btn-primary" style="flex:1" onclick="sendToSegment('${segment.id}')">Send besked</button>
      </div>
    </div>
  `).join('');
}

// Add new segment
function addNewSegment() {
  const name = prompt('Segmentnavn:');
  if (!name) return;

  const newSegment = {
    id: 'segment-' + Date.now(),
    name: name,
    description: '',
    customerCount: 0,
    createdAt: new Date().toISOString()
  };

  marketingSegments.push(newSegment);
  markMarketingChanged();
  renderSegmentsList();
}

// deleteSegment — see earlier definition with Supabase integration

// Initialize Marketing on page load
function initMarketingPage() {
  loadMarketingData();
  switchMarketingTab('campaigns');
}

// =====================================================
// BLOG FUNCTIONS
// =====================================================

// Load blog posts
