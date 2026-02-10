/**
 * Feane Auth UI - Skabelon 2
 * Injects login/signup/profile modals and wires up the user icon
 */
(function($) {
  'use strict';

  const FeaneAuth = {
    init() {
      this.injectModals();
      this.wireUserIcon();
      this.setupAuthListener();
    },

    injectModals() {
      if ($('#flow-login-modal').length) return;

      const modalsHtml = `
<!-- Login Modal -->
<div class="modal fade" id="flow-login-modal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content" style="border-radius:12px;overflow:hidden">
      <div class="modal-header" style="background:#1a1a2e;color:#fff;border:none;padding:20px 24px">
        <h5 class="modal-title" style="font-weight:600">Log ind</h5>
        <button type="button" class="close" style="color:#fff;opacity:0.8" data-dismiss="modal">&times;</button>
      </div>
      <div class="modal-body" style="padding:24px">
        <form onsubmit="FlowAuth.handleLogin(event)">
          <div class="form-group">
            <label style="font-weight:500">Email</label>
            <input type="email" class="form-control" id="flow-login-email" placeholder="din@email.dk" required>
          </div>
          <div class="form-group">
            <label style="font-weight:500">Adgangskode</label>
            <input type="password" class="form-control" id="flow-login-password" placeholder="Adgangskode" required>
          </div>
          <div id="flow-login-error" style="color:#dc3545;font-size:13px;margin-bottom:12px"></div>
          <button type="submit" id="flow-login-btn" class="btn btn-block" style="background:#1a1a2e;color:#fff;padding:10px;font-weight:600;border-radius:8px">Log ind</button>
        </form>
        <div style="text-align:center;margin-top:16px;font-size:13px">
          Har du ikke en konto? <a href="javascript:void(0)" onclick="$('#flow-login-modal').modal('hide');FlowAuth.showSignupModal();" style="color:#1a1a2e;font-weight:600">Opret konto</a>
        </div>
        <div style="text-align:center;margin-top:8px">
          <a href="menu.html" onclick="$('#flow-login-modal').modal('hide');" style="color:#888;font-size:12px">Fortsæt som gæst &rarr;</a>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Signup Modal -->
<div class="modal fade" id="flow-signup-modal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content" style="border-radius:12px;overflow:hidden">
      <div class="modal-header" style="background:#1a1a2e;color:#fff;border:none;padding:20px 24px">
        <h5 class="modal-title" style="font-weight:600">Opret konto</h5>
        <button type="button" class="close" style="color:#fff;opacity:0.8" data-dismiss="modal">&times;</button>
      </div>
      <div class="modal-body" style="padding:24px">
        <form onsubmit="FlowAuth.handleSignup(event)">
          <div class="form-group">
            <label style="font-weight:500">Navn</label>
            <input type="text" class="form-control" id="flow-signup-name" placeholder="Dit navn">
          </div>
          <div class="form-group">
            <label style="font-weight:500">Email</label>
            <input type="email" class="form-control" id="flow-signup-email" placeholder="din@email.dk" required>
          </div>
          <div class="form-group">
            <label style="font-weight:500">Telefon</label>
            <input type="tel" class="form-control" id="flow-signup-phone" placeholder="+45 12 34 56 78">
          </div>
          <div class="form-group">
            <label style="font-weight:500">Adgangskode</label>
            <input type="password" class="form-control" id="flow-signup-password" placeholder="Min. 6 tegn" required>
          </div>
          <div id="flow-signup-error" style="color:#dc3545;font-size:13px;margin-bottom:12px"></div>
          <button type="submit" id="flow-signup-btn" class="btn btn-block" style="background:#1a1a2e;color:#fff;padding:10px;font-weight:600;border-radius:8px">Opret konto</button>
        </form>
        <div style="text-align:center;margin-top:16px;font-size:13px">
          Har du allerede en konto? <a href="javascript:void(0)" onclick="$('#flow-signup-modal').modal('hide');FlowAuth.showLoginModal();" style="color:#1a1a2e;font-weight:600">Log ind</a>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Profile Modal -->
<div class="modal fade" id="flow-profile-modal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
    <div class="modal-content" style="border-radius:12px;overflow:hidden">
      <div class="modal-header" style="background:#1a1a2e;color:#fff;border:none;padding:20px 24px">
        <h5 class="modal-title" style="font-weight:600">Min profil</h5>
        <button type="button" class="close" style="color:#fff;opacity:0.8" data-dismiss="modal">&times;</button>
      </div>
      <div class="modal-body" style="padding:24px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:72px;height:72px;background:#1a1a2e;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#fff;font-size:28px"><i class="fa fa-user"></i></div>
          <h5 data-auth-name style="font-weight:700;margin:0"></h5>
          <small data-auth-email style="color:#888"></small>
        </div>

        <!-- Loyalty Points -->
        <div id="feane-loyalty-section" style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center">
          <div style="font-size:13px;opacity:0.8;margin-bottom:4px">Loyalty Points</div>
          <div id="feane-loyalty-points" style="font-size:36px;font-weight:700">0</div>
          <div style="font-size:12px;opacity:0.6;margin-top:4px">Optjen point med hver bestilling</div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs" style="margin-bottom:16px">
          <li class="nav-item"><a class="nav-link active" data-toggle="tab" href="#profile-orders" style="color:#1a1a2e;font-weight:600">Mine ordrer</a></li>
          <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#profile-settings" style="color:#1a1a2e;font-weight:600">Indstillinger</a></li>
        </ul>

        <div class="tab-content">
          <div class="tab-pane fade show active" id="profile-orders">
            <div id="feane-order-history" style="max-height:300px;overflow-y:auto">
              <div style="text-align:center;padding:24px;color:#999">
                <i class="fa fa-spinner fa-spin"></i> Henter ordrer...
              </div>
            </div>
          </div>
          <div class="tab-pane fade" id="profile-settings">
            <div style="padding:12px 0">
              <button onclick="FlowAuth.logout();$('#flow-profile-modal').modal('hide');" class="btn btn-block" style="background:#fff;color:#dc3545;padding:12px;border-radius:8px;border:1px solid #dc3545;font-weight:600">
                <i class="fa fa-sign-out"></i> Log ud
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
      `;
      $('body').append(modalsHtml);
    },

    wireUserIcon() {
      $(document).on('click', '.user_link', function(e) {
        e.preventDefault();
        if (window.FlowAuth && FlowAuth.isLoggedIn()) {
          FeaneAuth.loadProfile();
          FlowAuth.showProfileModal();
        } else {
          FlowAuth.showLoginModal();
        }
      });
    },

    setupAuthListener() {
      if (!window.FlowAuth) return;

      FlowAuth.onAuthChange(function(isLoggedIn, user) {
        // Update user icon appearance
        if (isLoggedIn) {
          $('.user_link').css({ color: '#ffbe33' }).attr('title', 'Min profil');
        } else {
          $('.user_link').css({ color: '' }).attr('title', 'Log ind');
        }
      });
    },

    async loadProfile() {
      if (!window.FlowAuth || !window.FlowOrders) return;

      const email = FlowAuth.getCustomerEmail();
      if (!email) return;

      // Load order history
      const result = await FlowOrders.getOrderHistory(email);
      const $container = $('#feane-order-history');

      if (!result.orders || result.orders.length === 0) {
        $container.html('<div style="text-align:center;padding:24px;color:#999"><i class="fa fa-inbox" style="font-size:32px;display:block;margin-bottom:8px"></i>Ingen ordrer endnu</div>');
      } else {
        let html = '';
        let totalPoints = 0;
        result.orders.forEach(function(order) {
          const date = new Date(order.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
          const statusColors = { pending: '#ffc107', confirmed: '#17a2b8', preparing: '#fd7e14', ready: '#28a745', delivered: '#28a745', completed: '#28a745', cancelled: '#dc3545' };
          const statusLabels = { pending: 'Afventer', confirmed: 'Bekræftet', preparing: 'Tilberedes', ready: 'Klar', delivered: 'Leveret', completed: 'Fuldført', cancelled: 'Annulleret' };
          const color = statusColors[order.status] || '#888';
          const label = statusLabels[order.status] || order.status;

          // 1 point per 10 DKK spent on completed orders
          if (['completed', 'delivered'].includes(order.status)) {
            totalPoints += Math.floor((order.total || 0) / 10);
          }

          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0">';
          html += '<div><div style="font-weight:600;font-size:14px">#' + (order.order_number || order.id?.substring(0,8)) + '</div>';
          html += '<div style="font-size:12px;color:#888">' + date + ' &middot; ' + (order.fulfillment_type === 'delivery' ? 'Levering' : 'Afhentning') + '</div></div>';
          html += '<div style="text-align:right"><div style="font-weight:600">' + (order.total || 0).toFixed(2).replace('.',',') + ' kr.</div>';
          html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + color + '20;color:' + color + ';font-weight:600">' + label + '</span></div>';
          html += '</div>';
        });
        $container.html(html);
        $('#feane-loyalty-points').text(totalPoints);
      }
    }
  };

  window.FeaneAuth = FeaneAuth;

  $(function() {
    FeaneAuth.init();
  });

})(jQuery);
