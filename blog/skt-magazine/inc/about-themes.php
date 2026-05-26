<?php
/**
 * SKT Magazine About Theme
 *
 * @package SKT Magazine
 */
 
//about theme info
add_action( 'admin_menu', 'skt_magazine_abouttheme' );
function skt_magazine_abouttheme() {    	
	add_theme_page( __('About Theme', 'skt-magazine'), __('About Theme', 'skt-magazine'), 'edit_theme_options', 'skt_magazine_guide', 'skt_magazine_mostrar_guide');   
} 

//guidline for about theme
function skt_magazine_mostrar_guide() { 
	//custom function about theme customizer
	$return = add_query_arg( array()) ;
?>

<style type="text/css">
@media screen and (min-width: 800px) {
.col-left {float:left; width: 65%; padding: 1%;}
.col-right {float:right; width: 30%; padding:1%; border-left:1px solid #DDDDDD; }
}
</style>

<div class="wrapper-info">
	<div class="col-left">
   		   <div style="font-size:16px; font-weight:bold; padding-bottom:5px; border-bottom:1px solid #ccc;">
			  <?php esc_html_e('About Theme Info', 'skt-magazine'); ?>
		   </div>
          <p><?php esc_html_e('SKT Magazine is a responsive free news and magazine WordPress theme which can be used for newspaper, publishing, personal and corporate blogs, and editorial style websites. Multilingual and compatible with any multilingual plugin and translation ready and compatible with WooCommerce for Ecommerce and shop and Nextgen gallery compatibility for portfolio and gallery. Compatible with all SEO plugins and contact form 7.','skt-magazine'); ?></p>
		  <a href="<?php echo esc_url(SKT_PRO_THEME_URL); ?>"><img src="<?php echo esc_url(get_template_directory_uri()); ?>/images/free-vs-pro.png" alt="" /></a>
	</div><!-- .col-left -->
	
	<div class="col-right">			
			<div style="text-align:center; font-weight:bold;">
				<hr />
				<a href="<?php echo esc_url(SKT_LIVE_DEMO); ?>" target="_blank"><?php esc_html_e('Live Demo', 'skt-magazine'); ?></a> | 
				<a href="<?php echo esc_url(SKT_PRO_THEME_URL); ?>"><?php esc_html_e('Buy Pro', 'skt-magazine'); ?></a> | 
				<a href="<?php echo esc_url(SKT_THEME_DOC); ?>" target="_blank"><?php esc_html_e('Documentation', 'skt-magazine'); ?></a>
                <div style="height:5px"></div>
				<hr />                
                <a href="<?php echo esc_url(SKT_THEME_URL); ?>" target="_blank"><img src="<?php echo esc_url(get_template_directory_uri()); ?>/images/sktskill.jpg" alt="" /></a>
			</div>		
	</div><!-- .col-right -->
</div><!-- .wrapper-info -->
<?php } ?>