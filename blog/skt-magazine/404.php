<?php
/**
 * The template for displaying 404 pages (Not Found).
 *
 * @package SKT Magazine
 */

get_header(); ?>

<div class="container">
  <div class="page_content">
    <section class="site-main" id="sitemain">
      <header class="page-header">
        <h1 class="entry-title">
          <?php _e( '<strong>404</strong> Not Found', 'skt-magazine' ); ?>
        </h1>
      </header>
      <!-- .page-header -->
      <div class="page-content">
        <p class="text-404">
          <?php _e( 'Looks like you have taken a wrong turn. Dont worry... it happens to the best of us.', 'skt-magazine' ); ?>
        </p>
      </div>
      <!-- .page-content --> 
    </section>
    <div class="clear"></div>
  </div>
</div>
<?php get_footer(); ?>