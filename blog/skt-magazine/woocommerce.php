<?php get_header(); ?>
<div class="container">
      <div class="page_content">
      <?php get_sidebar('left');?>     
    		 <section class="site-main"> 
                <div class="contentbox">
						<?php woocommerce_content(); ?>
 				<div class="clear"></div>          
               </div>
            </section><!-- section-->   
     <?php get_sidebar();?>      
    <div class="clear"></div>
    </div><!-- .page_content --> 
 </div><!-- .container --> 
<?php get_footer(); ?>