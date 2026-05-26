<?php
/**
 * The Sidebar containing the main widget areas.
 *
 * @package SKT Magazine
 */
?>
<div id="sidebar">    
    <?php if ( ! dynamic_sidebar( 'sidebar-2' ) ) : ?>        
        <aside id="archives" class="widget"> 
        <h3 class="widget-title"><?php _e( 'Archives', 'skt-magazine' ); ?></h3>          
            <ul>
                <?php wp_get_archives( array( 'type' => 'monthly' ) ); ?>
            </ul>
        </aside>
    <?php endif; // end sidebar widget area ?>	
</div><!-- sidebar -->