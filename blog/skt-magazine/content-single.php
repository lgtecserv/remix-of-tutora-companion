<?php
/**
 * @package SKT Magazine
 */
?>
<article id="post-<?php the_ID(); ?>" <?php post_class('single-post'); ?>>
  <header class="entry-header">
    <h1 class="entry-title">
      <?php the_title(); ?>
    </h1>
  </header>
  <!-- .entry-header -->
  <div class="postmeta">
    <div class="post-date"><?php echo get_the_date(); ?></div>
    <!-- post-date -->
    <div class="post-comment"> &nbsp;|&nbsp; <?php comments_popup_link( __('0 Comment', 'skt-magazine'), __('1 Comment', 'skt-magazine'), __('% Comments', 'skt-magazine'), '', __('Comments closed' , 'skt-magazine')); ?></div>
    <div class="clear"></div>
  </div>
  <!-- postmeta -->
  <?php 
        if (has_post_thumbnail() ){
			echo '<div class="post-thumb">';
            the_post_thumbnail();
			echo '</div>';
		}
        ?>
  <div class="entry-content">
    <?php the_content(); ?>
    <?php
        wp_link_pages( array(
            'before' => '<div class="page-links">' . __( 'Pages:', 'skt-magazine' ),
            'after'  => '</div>',
        ) );
        ?>
    <div class="postmeta">
      <div class="post-categories">
        <?php the_category(); ?>
      </div>
      <div class="post-tags">
        <?php the_tags( __('&nbsp;|&nbsp; Tags: ', 'skt-magazine')); ?>
      </div>
      <div class="clear"></div>
    </div>
    <!-- postmeta --> 
  </div>
  <!-- .entry-content -->
  
  <footer class="entry-meta">
    <?php edit_post_link( __( 'Edit', 'skt-magazine' ), '<span class="edit-link">', '</span>' ); ?>
  </footer>
  <!-- .entry-meta --> 
  
</article>