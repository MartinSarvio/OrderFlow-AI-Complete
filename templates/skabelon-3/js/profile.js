/**
 * Pizza Delicious - Profile & Order History
 * Loads loyalty points and order history when profile modal opens
 */
(function($) {
  'use strict';

  var profileLoaded = false;

  $(document).on('show.bs.modal', '#flow-profile-modal', function() {
    if (!window.FlowAuth || !FlowAuth.isLoggedIn()) return;
    loadProfile();
  });

  async function loadProfile() {
    if (!window.supabase?.createClient && !window._flowSupabase) return;

    var sb = window._flowSupabase;
    if (!sb) {
      try {
        sb = window.supabase.createClient(
          'https://qymtjhzgtcittohutmay.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjMzNjYsImV4cCI6MjA2NzI5OTM2Nn0.n6FYURqirRHO0pLPVDflAjH34aiiSxx7a_ZckDPW4DE'
        );
        window._flowSupabase = sb;
      } catch (e) { return; }
    }

    var user = FlowAuth.getUser();
    if (!user) return;

    // Load loyalty points
    try {
      var { data: lp } = await sb.from('loyalty_points')
        .select('points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (lp && lp.points > 0) {
        $('#flow-profile-loyalty').show();
        $('#flow-loyalty-points').text(lp.points);
      } else {
        $('#flow-profile-loyalty').hide();
      }
    } catch (e) {
      $('#flow-profile-loyalty').hide();
    }

    // Load recent orders
    try {
      var { data: orders } = await sb.from('unified_orders')
        .select('id, order_number, total, status, created_at')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })
        .limit(5);

      var $list = $('#flow-orders-list');
      if (!orders || orders.length === 0) {
        $list.html('<div style="text-align:center;color:#999;font-size:13px;padding:12px">Ingen ordrer endnu</div>');
        return;
      }

      var html = '';
      orders.forEach(function(o) {
        var date = new Date(o.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
        var status = o.status || 'pending';
        var statusColor = status === 'completed' ? '#28a745' : status === 'cancelled' ? '#dc3545' : '#ffc107';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0">';
        html += '<div><div style="font-weight:600;font-size:13px">#' + (o.order_number || o.id.substring(0, 8)) + '</div><div style="font-size:11px;color:#888">' + date + '</div></div>';
        html += '<div style="text-align:right"><div style="font-weight:600;font-size:13px">' + (o.total ? o.total.toFixed(2).replace('.', ',') + ' kr.' : '') + '</div><span style="font-size:11px;color:' + statusColor + ';font-weight:600">' + status + '</span></div>';
        html += '</div>';
      });
      $list.html(html);
    } catch (e) {
      $('#flow-orders-list').html('<div style="text-align:center;color:#999;font-size:13px;padding:12px">Kunne ikke hente ordrer</div>');
    }
  }

})(jQuery);
