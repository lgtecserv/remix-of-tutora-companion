<?php
/**
 * The Header for our theme.
 *
 * Displays all of the <head> section and everything up till <div class="container">
 *
 * @package SKT Magazine
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="http://gmpg.org/xfn/11">
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php
$newsticker = get_theme_mod('hide_newstickker', '1');
if( $newsticker == ''){
?>
 <div class="site-topbar">
    <div class="container">
    <div class="site-topbar-wrap">
      <div class="row">
        <div class="headline">           
                    <span class="icn"><?php echo esc_html(get_theme_mod('news_title',__('Headline','skt-magazine'))); ?></span>
        </div>
        <div class="topright">
        <div class="newsticker <?php if ( !has_nav_menu( 'topmenu' ) ) echo "fullticker"; ?>">
          <marquee>
                    <span class="icn"> 
                    <?php echo wp_kses_post(get_theme_mod('news_description', __('Add your news ticker description here.','skt-magazine'))); ?>
                     </span>
           </marquee>
        </div>
        <!--end .newsticker-->
        <?php if ( has_nav_menu( 'topmenu' ) ) { ?>
                <div class="togglediv">
                    <a class="TopMenu" href="<?php echo esc_url('#');?>"><?php _e('Menu','skt-magazine'); ?></a>
                </div><!-- toggle -->
              <div class="shortingmenu"> 
     			<?php wp_nav_menu( array( 'theme_location' => 'topmenu' ) ); ?>
              </div>
		<?php } ?>
        <div class="clear"></div>
        </div>
       <div class="clear"></div>
      </div>
    </div>
    </div>
 </div><!--end .site-topbar-->
 <?php } ?>
  <div class="header <?php if ( !is_front_page() && ! is_home() ) { ?>innerheader<?php } ?>">
        <div class="container">
            <div class="logo">
            			<?php skt_magazine_the_custom_logo(); ?>
                        <a href="<?php echo esc_url(home_url('/')); ?>"><h1><?php bloginfo('name'); ?></h1></a>
                        <p><?php bloginfo('description'); ?></p>
            </div><!-- logo -->
            <div class="header_right"> 
            
             <?php if ( ! dynamic_sidebar( 'header-add-widget' ) ) : ?>
            <?php endif; // end sidebar widget area ?>          
            <div class="clear"></div>
          </div><!-- header_right -->
          <div class="clear"></div>
        </div><!-- container -->
  </div><!--.header -->
  <div id="menubar">
     <div class="container">
    <div class="toggle">
        <a class="toggleMenu" href="<?php echo esc_url('#');?>" style="display:none;"><?php _e('Menu','skt-magazine'); ?></a>
     </div><!-- toggle --> 
     <div class="sitenav">
            <?php wp_nav_menu(array('theme_location' => 'primary')); ?>
     </div><!-- site-nav -->
     </div>
  </div><!--.menubar -->