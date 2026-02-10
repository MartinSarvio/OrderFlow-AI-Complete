// Feane Skabelon-2 v4.4.9 - Custom JS

// to get current year
function getYear() {
    var els = document.querySelectorAll("#displayYear");
    var currentYear = new Date().getFullYear();
    els.forEach(function(el) { el.innerHTML = currentYear; });
}
getYear();

// isotope js - category filtering
$(window).on('load', function () {
    var $grid = $(".grid").isotope({
        itemSelector: ".all",
        percentPosition: false,
        masonry: {
            columnWidth: ".all"
        }
    });

    $('.filters_menu li').click(function (e) {
        e.preventDefault();
        $('.filters_menu li').removeClass('active');
        $(this).addClass('active');

        var data = $(this).attr('data-filter');
        $grid.isotope({
            filter: data
        });
    });
});

// nice select
$(document).ready(function() {
    $('select').niceSelect();
});

/** google_map js **/
function myMap() {
    var mapProp = {
        center: new google.maps.LatLng(55.6761, 12.5683), // København
        zoom: 14,
    };
    var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
}

// client section owl carousel
$(".client_owl-carousel").owlCarousel({
    loop: true,
    margin: 0,
    dots: false,
    nav: true,
    navText: [],
    autoplay: true,
    autoplayHoverPause: true,
    navText: [
        '<i class="fa fa-angle-left" aria-hidden="true"></i>',
        '<i class="fa fa-angle-right" aria-hidden="true"></i>'
    ],
    responsive: {
        0: {
            items: 1
        },
        768: {
            items: 2
        },
        1000: {
            items: 2
        }
    }
});

// Smooth scroll for anchor links
$(document).on('click', 'a[href^="#"]', function(e) {
    var target = $(this).attr('href');
    if (target === '#' || target === '') {
        e.preventDefault();
        return;
    }
    var $target = $(target);
    if ($target.length) {
        e.preventDefault();
        $('html, body').animate({ scrollTop: $target.offset().top - 80 }, 600);
    }
});

// Prevent empty href="#" from scrolling to top
$(document).on('click', 'a[href=""], a[href="#"]', function(e) {
    e.preventDefault();
});

// Add to cart functionality for food items
$(document).ready(function() {
    var counter = 0;
    $('.food_section .options a, .options a').each(function() {
        var $link = $(this);
        if ($link.find('svg').length) {
            counter++;
            var $box = $link.closest('.box');
            var name = $box.find('.detail-box h5').text().trim();
            var priceText = $box.find('.options h6').text().trim();
            var price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
            var image = $box.find('.img-box img').attr('src') || '';
            var itemId = 'feane-item-' + counter;

            $link.attr('href', 'javascript:void(0)');
            $link.attr('data-item-id', itemId);
            $link.attr('data-item-name', name);
            $link.attr('data-item-price', price);
            $link.attr('data-item-image', image);

            $link.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var item = {
                    id: $(this).attr('data-item-id'),
                    name: $(this).attr('data-item-name'),
                    price: parseFloat($(this).attr('data-item-price')),
                    image: $(this).attr('data-item-image'),
                    quantity: 1
                };
                // Use orderflow cart if available, else feane cart
                if (window.OrderFlowCart && typeof OrderFlowCart.addItem === 'function') {
                    OrderFlowCart.addItem(item);
                } else if (window.FeaneCart && typeof FeaneCart.add === 'function') {
                    FeaneCart.add(item);
                } else {
                    // Fallback: store in localStorage
                    var key = 'flow_feane_cart';
                    var cart = [];
                    try { cart = JSON.parse(localStorage.getItem(key) || '[]'); } catch(ex) {}
                    var existing = cart.find(function(c) { return c.id === item.id; });
                    if (existing) { existing.quantity++; } else { cart.push(item); }
                    localStorage.setItem(key, JSON.stringify(cart));
                }
                // Visual feedback
                var $btn = $(this);
                $btn.css('transform', 'scale(1.3)');
                setTimeout(function() { $btn.css('transform', 'scale(1)'); }, 200);
            });
        }
    });
});

// Dynamic category updates via postMessage from parent app
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'updateMenu') {
        var categories = event.data.categories;
        if (Array.isArray(categories) && categories.length > 0) {
            var $menu = $('.filters_menu');
            if ($menu.length) {
                $menu.empty();
                $menu.append('<li class="active" data-filter="*">Alle</li>');
                categories.forEach(function(cat) {
                    var filterClass = cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    $menu.append('<li data-filter=".' + filterClass + '">' + cat + '</li>');
                });
                // Re-bind click events
                $menu.find('li').on('click', function(e) {
                    e.preventDefault();
                    $menu.find('li').removeClass('active');
                    $(this).addClass('active');
                    var data = $(this).attr('data-filter');
                    $(".grid").isotope({ filter: data });
                });
            }
        }
    }
});
