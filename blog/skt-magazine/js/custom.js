jQuery(window).load(function() {
		if(jQuery('#slider') > 0) {
        jQuery('.nivoSlider').nivoSlider({
        	effect:'fade',
    });
		} else {
			jQuery('#slider').nivoSlider({
        	effect:'fade',
    });
		}
});
	

// NAVIGATION CALLBACK
var ww = jQuery(window).width();
jQuery(document).ready(function() { 
	jQuery(".sitenav li a").each(function() {
		if (jQuery(this).next().length > 0) {
			jQuery(this).addClass("parent");
		};
	})
	jQuery(".toggleMenu").click(function(e) { 
		e.preventDefault();
		jQuery(this).toggleClass("active");
		jQuery(".sitenav").slideToggle('fast');
	});
	adjustMenu();
})

// navigation orientation resize callbak
jQuery(window).bind('resize orientationchange', function() {
	ww = jQuery(window).width();
	adjustMenu();
});

var adjustMenu = function() {
	if (ww < 981) {
		jQuery(".toggleMenu").css("display", "block");
		if (!jQuery(".toggleMenu").hasClass("active")) {
			jQuery(".sitenav").hide();
		} else {
			jQuery(".sitenav").show();
		}
		jQuery(".sitenav li").unbind('mouseenter mouseleave');
	} else {
		jQuery(".toggleMenu").css("display", "none");
		jQuery(".sitenav").show();
		jQuery(".sitenav li").removeClass("hover");
		jQuery(".sitenav li a").unbind('click');
		jQuery(".sitenav li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function() {
			jQuery(this).toggleClass('hover');
		});
	}
}

// Top Menu Function
var ww = jQuery(window).width();
jQuery(document).ready(function() { 
	jQuery(".shortingmenu li a").each(function() {
		if (jQuery(this).next().length > 0) {
			jQuery(this).addClass("parent");
		};
	})
	jQuery(".TopMenu").click(function(e) { 
		e.preventDefault();
		jQuery(this).toggleClass("active");
		jQuery(".shortingmenu").slideToggle('fast');
	});
	TopMenufunction();
})

// navigation orientation resize callbak
jQuery(window).bind('resize orientationchange', function() {
	ww = jQuery(window).width();
	TopMenufunction();
});

var TopMenufunction = function() {
	if (ww < 981) {
		jQuery(".TopMenu").css("display", "block");
		if (!jQuery(".TopMenu").hasClass("active")) {
			jQuery(".shortingmenu").hide();
		} else {
			jQuery(".shortingmenu").show();
		}
		jQuery(".shortingmenu li").unbind('mouseenter mouseleave');
	} else {
		jQuery(".TopMenu").css("display", "none");
		jQuery(".shortingmenu").show();
		jQuery(".shortingmenu li").removeClass("hover");
		jQuery(".shortingmenu li a").unbind('click');
		jQuery(".shortingmenu li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function() {
			jQuery(this).toggleClass('hover');
		});
	}
}

jQuery(document).ready(function() {
  	jQuery('.srchicon').click(function() {
			jQuery('.searchtop').toggle();
			jQuery('.topsocial').toggle();
		});	
});
	
jQuery(document).ready(function() {
        jQuery('.logo h1').each(function(index, element) {
            var heading = jQuery(element);
            var word_array, last_word, first_part;

            word_array = heading.html().split(/\s+/); // split on spaces
            last_word = word_array.pop();             // pop the last word
            first_part = word_array.join(' ');        // rejoin the first words together

            heading.html([first_part, ' <span>', last_word, '</span>'].join(''));
        });
});	


jQuery(document).ready(function() { 
   jQuery('.owl-carousel').owlCarousel({
    loop:true,	
    margin:10,
    autoplay:true,   
	nav:true,
	smartSpeed:250,   
    responsive:{
        0:{
            items:1
        },

        600:{
            items:1
        },

        1000:{
            items:1
        }
    }
})
});