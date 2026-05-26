<?php
/**
 * The template for displaying the footer.
 *
 * Contains the closing of the #content div and all content after
 *
 * @package SKT Magazine
 */
?>
<?php if( get_theme_mod( 'hide_footer' ) == '') { ?>
<div id="footer-wrapper">
    	<div class="container">
            <div class="cols-4 widget-column-1">
            <?php if (function_exists('dynamic_sidebar') && dynamic_sidebar('footer-1') ) : else : ?>
				<div class="footer-col-4"><?php esc_html_e('Please go to Appearance >> Widgets >> Footer Widget 1 and add some widget here.', 'skt-magazine');?></div> 
			<?php endif; ?>
            </div><!--end .widget-column-1-->                  
            <div class="cols-4 widget-column-2"> 
            	<?php if (function_exists('dynamic_sidebar') && dynamic_sidebar('footer-2') ) : else : ?>
				<div class="footer-col-4"><?php esc_html_e('Please go to Appearance >> Widgets >> ooter Widget 2 and add some widget here.', 'skt-magazine');?></div> 
			<?php endif; ?>                     	
            </div><!--end .widget-column-2-->     
            <div class="cols-4 widget-column-3">
				<?php if (function_exists('dynamic_sidebar') && dynamic_sidebar('footer-3') ) : else : ?>
				<div class="footer-col-4"><?php esc_html_e('Please go to Appearance >> Widgets >> ooter Widget 3 and add some widget here.', 'skt-magazine');?></div> 
			<?php endif; ?> 
            </div><!--end .widget-column-3-->
            <div class="cols-4 widget-column-4">
             	<?php if (function_exists('dynamic_sidebar') && dynamic_sidebar('footer-4') ) : else : ?>
				<div class="footer-col-4"><?php esc_html_e('Please go to Appearance >> Widgets >> Footer Widget 4 and add some widget here.', 'skt-magazine');?></div> 
			<?php endif; ?> 
            </div><!--end .widget-column-4-->
            <div class="space50"></div>
        </div><!--end .container-->
    </div>
<?php } ?>    
<div class="copyright-wrapper">
        	<div class="container">
            	<div class="copyright-txt"><?php esc_html_e('&copy; ','skt-magazine');?><?php echo esc_html( date('Y') ); ?> <?php bloginfo('name'); ?>. <?php esc_html_e('All Rights Reserved', 'skt-magazine');?></div>
                <div class="design-by"><?php bloginfo('name'); ?> <?php esc_html_e('Theme By ','skt-magazine');?> <a href="<?php echo esc_url('https://www.sktthemes.org/shop/skt-magazine/');?>" rel="noopener" target="_blank">
        <?php esc_html_e('SKT Magazine','skt-magazine'); ?>
        </a></div>
            </div>
            <div class="clear"></div>
        </div>    
<?php wp_footer(); ?>
</body>
</html>