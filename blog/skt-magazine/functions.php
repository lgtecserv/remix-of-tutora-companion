<?php  
/**
 * SKT Magazine functions and definitions
 *
 * @package SKT Magazine
 */
 
global $content_width; 
if ( ! isset( $content_width ) )
	$content_width = 640; /* pixels */ 

// Set the word limit of post content 
function skt_magazine_content($limit) {
$content = explode(' ', get_the_excerpt(), $limit);
if (count($content)>=$limit) {
array_pop($content);
$content = implode(" ",$content).'...';
} else {
$content = implode(" ",$content);
}	
$content = preg_replace('/\[.+\]/','', $content);
$content = apply_filters('the_content', $content);
$content = str_replace(']]>', ']]&gt;', $content);
return $content;
}

/**
 * Set the content width based on the theme's design and stylesheet.
 */

if ( ! function_exists( 'skt_magazine_setup' ) ) :
/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which runs
 * before the init hook. The init hook is too late for some features, such as indicating
 * support post thumbnails.
 */
function skt_magazine_setup() {
	load_theme_textdomain( 'skt-magazine', get_template_directory() . '/languages' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support('woocommerce');
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-header' );
	add_theme_support( 'title-tag' );
		add_theme_support( 'custom-logo', array(
		'height'      => 100,
		'width'       => 255,
		'flex-height' => true,
	) );
	add_theme_support( 'custom-header', array( 'header-text' => false ) );
	add_image_size('skt-magazine-homepage-thumb',240,145,true);
	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'skt-magazine' ),
		'topmenu' => __( 'Top Menu', 'skt-magazine' ),		
	) );
	add_theme_support( 'custom-background', array(
		'default-color' => 'ffffff'
	) );
	add_editor_style( 'editor-style.css' );
} 
endif; // skt_magazine_setup
add_action( 'after_setup_theme', 'skt_magazine_setup' );


function skt_magazine_widgets_init() { 

	
	
	register_sidebar( array(
		'name'          => __( 'Left Sidebar', 'skt-magazine' ),
		'description'   => __( 'Appears on blog page sidebar', 'skt-magazine' ),
		'id'            => 'sidebar-1',
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',	
		'after_widget'  => '</aside>',	
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
		
	) );
	
	register_sidebar( array(
		'name'          => __( 'Right Sidebar', 'skt-magazine' ),
		'description'   => __( 'Appears on blog page sidebar', 'skt-magazine' ),
		'id'            => 'sidebar-2',
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',	
		'after_widget'  => '</aside>',	
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
		
	) );
	
	register_sidebar( array(
		'name'          => __( 'Header Ads Widget', 'skt-magazine' ),
		'description'   => __( 'Appears on header of site', 'skt-magazine' ),
		'id'            => 'header-add-widget',
		'before_widget' => '<div class="tparea">',	
		'after_widget'  => '</div>',	
		'before_title'  => '<h3>',
		'after_title'   => '</h3>',		
	) );		
	
	register_sidebar( array(
		'name'          => __( 'Footer Widget 1', 'skt-magazine' ),
		'description'   => __( 'Appears on footer', 'skt-magazine' ),
		'id'            => 'footer-1',
		'before_widget' => '',		
		'before_title'  => '<h5>',
		'after_title'   => '</h5><div class="footer-col-4">',
		'after_widget'  => '</div>',
	) );
	
	register_sidebar( array(
		'name'          => __( 'Footer Widget 2', 'skt-magazine' ),
		'description'   => __( 'Appears on footer', 'skt-magazine' ),
		'id'            => 'footer-2',
		'before_widget' => '',		
		'before_title'  => '<h5>',
		'after_title'   => '</h5><div class="footer-col-4">',
		'after_widget'  => '</div>',
	) );
	
	register_sidebar( array(
		'name'          => __( 'Footer Widget 3', 'skt-magazine' ),
		'description'   => __( 'Appears on footer', 'skt-magazine' ),
		'id'            => 'footer-3',
		'before_widget' => '',		
		'before_title'  => '<h5>',
		'after_title'   => '</h5><div class="footer-col-4">',
		'after_widget'  => '</div>',
	) );
	
	register_sidebar( array(
		'name'          => __( 'Footer Widget 4', 'skt-magazine' ),
		'description'   => __( 'Appears on footer', 'skt-magazine' ),
		'id'            => 'footer-4',
		'before_widget' => '',		
		'before_title'  => '<h5>',
		'after_title'   => '</h5><div class="footer-col-4">',
		'after_widget'  => '</div>',
	) );		
	
}
add_action( 'widgets_init', 'skt_magazine_widgets_init' );


function skt_magazine_font_url(){
		$font_url = '';		
		
		/* Translators: If there are any character that are not
		* supported by Roboto, trsnalate this to off, do not
		* translate into your own language.
		*/
		$roboto = _x('on','roboto:on or off','skt-magazine');		
		
		
		/* Translators: If there has any character that are not supported 
		*  by Scada, translate this to off, do not translate
		*  into your own language.
		*/
		$scada = _x('on','Scada:on or off','skt-magazine');	
		
		if('off' !== $roboto ){
			$font_family = array();
			
			if('off' !== $roboto){
				$font_family[] = 'Roboto:300,400,600,700,800,900';
			}
					
						
			$query_args = array(
				'family'	=> urlencode(implode('|',$font_family)),
			);
			
			$font_url = add_query_arg($query_args,'//fonts.googleapis.com/css');
		}
		
	return $font_url;
	}

function skt_magazine_scripts() {
	wp_enqueue_style('skt-magazine-font', skt_magazine_font_url(), array());
	wp_enqueue_style( 'skt-magazine-basic-style', get_stylesheet_uri() );
	add_editor_style( 'skt-magazine-editor-style', get_template_directory_uri().'/editor-style.css');	
	wp_enqueue_style( 'skt-magazine-main-style', get_template_directory_uri().'/css/responsive.css');		
	wp_enqueue_style( 'skt-magazine-base-style', get_template_directory_uri().'/css/style_base.css');
	wp_enqueue_script( 'nivo-script', get_template_directory_uri() . '/js/jquery.nivo.slider.js', array('jquery') );
	wp_enqueue_script( 'skt-magazine-custom_js', get_template_directory_uri() . '/js/custom.js' );	
	
	wp_enqueue_style( 'owl-style', get_template_directory_uri().'/rotator/js/owl.carousel.css' );
	wp_enqueue_script( 'owljs', get_template_directory_uri().'/rotator/js/owl.carousel.js', array('jquery') );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'skt_magazine_scripts' );

define('SKT_URL','https://www.sktthemes.org/');
define('SKT_THEME_URL','https://www.sktthemes.org/themes/');
define('SKT_THEME_DOC','http://sktthemesdemo.net/documentation/skt-magazine-doc/');
define('SKT_PRO_THEME_URL','https://www.sktthemes.org/shop/responsive-magazine-wordpress-theme/');
define('SKT_FREE_THEME_URL','https://www.sktthemes.org/shop/skt-magazine/');
define('SKT_LIVE_DEMO','https://sktthemesdemo.net/magazine/');
 
/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Custom template for about theme.
 */
require get_template_directory() . '/inc/about-themes.php';

/**
 * Custom functions that act independently of the theme templates.
 */
require get_template_directory() . '/inc/extras.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

function skt_magazine_admin_theme_style() {
	    wp_enqueue_style('skt-magazine-custom-admin-style', get_template_directory_uri() . '/css/admin-style.css');
}
add_action('admin_enqueue_scripts', 'skt_magazine_admin_theme_style');

if ( ! function_exists( 'skt_magazine_the_custom_logo' ) ) :
/**
 * Displays the optional custom logo.
 *
 * Does nothing if the custom logo is not available.
 *
 */
function skt_magazine_the_custom_logo() {
	if ( function_exists( 'the_custom_logo' ) ) {
		the_custom_logo();
	}
}
endif;