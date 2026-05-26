<?php
/**
 * The template for displaying Search Results pages.
 *
 * @package SKT Magazine
 */

get_header(); ?>

<div class="container">
     <div class="page_content">
     <?php get_sidebar('left');?>   
        <section class="site-main">
         <div class="contentbox">           
				<?php if ( have_posts() ) : ?>
                    <header>
                        <h1 class="entry-title"><?php printf( __( 'Search Results for: %s', 'skt-magazine' ), '<span>' . get_search_query() . '</span>' ); ?></h1>
                    </header>
                    <?php while ( have_posts() ) : the_post(); ?>
                        <?php get_template_part( 'content', 'search' ); ?>
                    <?php endwhile; ?>
                    <?php 
					// Previous/next post navigation.
					the_posts_pagination( array(
						'mid_size' => 2,
						'prev_text' => __( 'Back', 'skt-magazine' ),
						'next_text' => __( 'Next', 'skt-magazine' ),
						'screen_reader_text' => __( 'Posts navigation', 'skt-magazine' )
					) ); 
					?>
                <?php else : ?>
                    <?php get_template_part( 'no-results', 'search' ); ?>
                <?php endif; ?>  
                 <div class="clear"></div>       
            </div>
        </section>      
       <?php get_sidebar();?>       
        <div class="clear"></div>
    </div><!-- site-aligner -->
</div><!-- container -->

<?php get_footer(); ?>