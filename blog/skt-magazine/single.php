<?php
/**
 * The Template for displaying all single posts.
 *
 * @package SKT Magazine
 */

get_header(); ?>

<div class="container">
     <div class="page_content">
     <?php get_sidebar('left');?>
        <section class="site-main">
           <div class="contentbox">            
                <?php while ( have_posts() ) : the_post(); ?>
                    <?php get_template_part( 'content', 'single' ); ?>
                    <?php skt_magazine_content_nav( 'nav-below' ); ?>
                    <?php
                    // If comments are open or we have at least one comment, load up the comment template
					if ( comments_open() || get_comments_number() ) {
						comments_template();
					}
                    ?>
                <?php endwhile; // end of the loop. ?>
                <div class="clear"></div>
            </div>          
         </section>       
        <?php get_sidebar();?>
        <div class="clear"></div>
    </div><!-- page_content -->
</div><!-- container -->	
<?php get_footer(); ?>