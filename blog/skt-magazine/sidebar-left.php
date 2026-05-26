<?php
/**
 * The Sidebar containing the main widget areas.
 *
 * @package SKT Magazine
 */
?>
<div id="sidebar" class="left">    
    <?php if ( ! dynamic_sidebar( 'sidebar-1' ) ) : ?>        
        <aside id="categories" class="widget">
         <h3 class="widget-title"><?php _e( 'Category', 'skt-magazine' ); ?></h3>           
            <ul>
                <?php wp_list_categories('title_li=');  ?>
            </ul>
        </aside>
         
         <aside id="meta" class="widget">
         <h3 class="widget-title"><?php _e( 'Meta', 'skt-magazine' ); ?></h3>           
            <ul>
                <?php wp_register(); ?>
                <li><?php wp_loginout(); ?></li>
                <?php wp_meta(); ?>
            </ul>
        </aside>
    <?php endif; // end sidebar widget area ?>	
</div><!-- sidebar -->