<?php 
/**
 * The template for displaying home page.
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site will use a
 * different template.
 *
 * @package SKT Magazine
 */
get_header(); ?> 
<?php
if ( 'posts' == get_option( 'show_on_front' ) ) {
    get_template_part( 'index' );
} else {
?>
<section id="threeCatWrap">
   <div class="container">
	   <div class="cat-3-col catwrapleft">       
       <?php if( get_theme_mod('leftsection',false) ) { ?>
        		<?php $queryvar = new wp_query('showposts=2 &cat='.get_theme_mod('leftsection',true));
						if( have_posts()) : while( $queryvar->have_posts() ) : $queryvar->the_post(); ?>
                         <div class="catleft-1">
                          <a href="<?php the_permalink(); ?>">
						   <?php if ( has_post_thumbnail() ) { ?>
						      <?php the_post_thumbnail(); ?>
							<?php } else { ?>
                             <img src="<?php echo esc_url(get_template_directory_uri()); ?>/images/img404.jpg" alt="" />
                            <?php } ?>
                          
                              <h3><span><?php the_title(); ?></span></h3>
                           </a>
                           <div class="catbx catbx1"><?php the_category(); ?></div>
                         </div>
						<?php endwhile; endif;
						wp_reset_postdata(); ?>  
               <?php } ?> 
	 </div><!--end .cat-3-col-->
	 <div class="cat-3-col catwrapslider">
            <div class="owl-carousel">
              <?php if( get_theme_mod('slidersection',false) ) { ?>
        		<?php $queryvar = new wp_query('cat='.get_theme_mod('slidersection',true));
						if( have_posts()) : while( $queryvar->have_posts() ) : $queryvar->the_post(); ?>
                         <div class="slidesection"> 
                          <a href="<?php the_permalink(); ?>">
						   <?php if ( has_post_thumbnail() ) { ?>
						      <?php the_post_thumbnail(); ?>
							<?php } else { ?>
                             <img src="<?php echo esc_url(get_template_directory_uri()); ?>/images/img404.jpg" alt="" />
                            <?php } ?>
                              <h3><?php the_title(); ?></h3>
                           </a>
                           <div class="catbx catbx2"><?php the_category(); ?></div>
                         </div>
						<?php endwhile; endif;
						wp_reset_postdata(); ?>
               <?php } ?>
            </div><!--end .carousel-->
	 </div><!--end .cat-3-col-->
     <div class="cat-3-col catwrapright">     
     	<?php if( get_theme_mod('rightsection',false) ) { ?>
        		<?php $queryvar = new wp_query('showposts=2 &cat='.get_theme_mod('rightsection',true));
						if( have_posts()) : while( $queryvar->have_posts() ) : $queryvar->the_post(); ?>
                         <div class="catleft-1"> 
                          <a href="<?php the_permalink(); ?>">
						   <?php if ( has_post_thumbnail() ) { ?>
						      <?php the_post_thumbnail(); ?>
							<?php } else { ?>
                             <img src="<?php echo esc_url(get_template_directory_uri()); ?>/images/img404.jpg" alt="" />
                            <?php } ?>
                              <h3><span><?php the_title(); ?></span></h3>
                          </a>
                          <div class="catbx catbx3"><?php the_category(); ?></div>
                         </div>
						<?php endwhile; endif;
						wp_reset_postdata(); ?>  
               <?php } ?>    
	</div><!--end .cat-3-col-->

<div class="clear"></div>
</div><!--end .container-->
</section>
<div class="clear"></div>
<div class="container">
     <div class="page_content">
     <?php get_sidebar('left');?> 
        <section class="site-main"> 
        	<div class="contentbox">
				<?php if( have_posts()) : while( have_posts()) : the_post(); ?>
                <h1 class="entry-title"><?php the_title(); ?></h1>
                <div class="entry-content">
                <?php the_content(); ?>
                </div><!-- entry-content -->
                <div class="clear"></div>    
                <?php endwhile; endif; ?>                                  
           </div>	                  
        </section>
        <?php get_sidebar();?>     
        <div class="clear"></div>
    </div><!-- site-aligner -->
</div>
<?php
}
?>
<?php get_footer(); ?>