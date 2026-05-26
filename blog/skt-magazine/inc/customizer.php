<?php
/**
 * SKT Magazine Theme Customizer
 *
 * @package SKT Magazine
 */

/**
 * Add postMessage support for site title and description for the Theme Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */

get_template_part('/inc/select/category-dropdown-custom-control');

function skt_magazine_customize_register( $wp_customize ) {
	
	//Add a class for titles
    class skt_magazine_Info extends WP_Customize_Control {
        public $type = 'info';
        public $label = '';
        public function render_content() {
        ?>
			<h3 style="text-decoration: underline; color: #DA4141; text-transform: uppercase;"><?php echo esc_html( $this->label ); ?></h3>
        <?php
        }
    }
	
	class WP_Customize_Textarea_Control extends WP_Customize_Control {
    public $type = 'textarea';
 
    public function render_content() {
        ?>
            <label>
                <span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
                <textarea rows="5" style="width:100%;" <?php $this->link(); ?>><?php echo esc_textarea( $this->value() ); ?></textarea>
            </label>
        <?php
    }
}
	
	$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
	$wp_customize->remove_control('header_textcolor');
	$wp_customize->remove_control('display_header_text');
	
	$wp_customize->add_setting('color_scheme',array(
			'default'	=> '#046dd6',
			'sanitize_callback'	=> 'sanitize_hex_color'
	));
	
	$wp_customize->add_control(
		new WP_Customize_Color_Control($wp_customize,'color_scheme',array(
			'label' => __('Color Scheme','skt-magazine'),			
			'description' => __( 'More color options in PRO Version.', 'skt-magazine' ),			
			'section' => 'colors',
			'settings' => 'color_scheme'
		))
	);
	
	$wp_customize->add_section('headernews_section',array(
			'title'	=> __('Header News Ticker','skt-magazine'),
			'priority'	=> null
	));	
	
	$wp_customize->add_setting('news_title',array(
			'default'	=> __('Headline','skt-magazine'),
			'sanitize_callback'	=> 'sanitize_text_field'
	));
	
	$wp_customize->add_control('news_title',array(
			'label'	=> __('Add news title for header','skt-magazine'),
			'section'	=> 'headernews_section',
			'setting'	=> 'news_title'
	));	
	$wp_customize->add_setting('news_description',array(
			'default'	=> __('Add your news ticker description here.','skt-magazine'),
			'sanitize_callback'	=> 'wp_kses_post'
	));
	$wp_customize->add_control(	new WP_Customize_Textarea_Control( $wp_customize, 'news_description', array(
				'label'	=> __('Add news description for header','skt-magazine'),
				'section'	=> 'headernews_section',
				'setting'	=> 'news_description'
			)
		)
	);
	
	//Hide news Ticker Section		 
	$wp_customize->add_setting('hide_newstickker',array(
			'default' => true,
			'sanitize_callback' => 'sanitize_text_field',
			'capability' => 'edit_theme_options',
	));	 

	$wp_customize->add_control( 'hide_newstickker', array(
    	   'section'   => 'headernews_section',    	 
		   'label'	=> __('Uncheck this to show this Section','skt-magazine'),
    	   'type'      => 'checkbox'
     )); // Hide news Ticker Section		 
	
	
	
	// Home Three Coloumn Category Dropdown Section 	
		$wp_customize->add_section('three_cols_section',array(
			'title'	=> __('Homepage Three Coloumn Section','skt-magazine'),
			'description'	=> __('Select Categories from the Dropdowns','skt-magazine'),
			'priority'	=> null
		));
	 // Add a category dropdown Left Coloumn        
        $wp_customize->add_setting( 'leftsection', array(
			'sanitize_callback'	=> 'esc_textarea'
        ) );
        $wp_customize->add_control( new Category_Dropdown_Custom_Control( $wp_customize, 'leftsection', array(
            'label'   => __('Select Category for Left Coloumn','skt-magazine'),
            'section' => 'three_cols_section',
            'settings'   => 'leftsection',            
        ) ) );
		// Add a category dropdown Slider Coloumn
		$wp_customize->add_setting( 'slidersection', array(
			'sanitize_callback'	=> 'esc_textarea'
        ) );
        $wp_customize->add_control( new Category_Dropdown_Custom_Control( $wp_customize, 'slidersection', array(
            'label'   => __('Select Category for Slider( Middle ) Section','skt-magazine'),
            'section' => 'three_cols_section',
            'settings'   => 'slidersection',            
        ) ) );
		
		// Add a category dropdown Right Coloumn
		$wp_customize->add_setting( 'rightsection', array(
			'sanitize_callback'	=> 'esc_textarea'
        ) );
        $wp_customize->add_control( new Category_Dropdown_Custom_Control( $wp_customize, 'rightsection', array(
            'label'   => __('Select Category for Right Section','skt-magazine'),
            'section' => 'three_cols_section',
            'settings'   => 'rightsection',            
        ) ) );		
	
	 
		 //Hide Three Column Section		
		$wp_customize->add_setting('hide_categorysec',array(
				'default' => true,
				'sanitize_callback' => 'sanitize_text_field',
				'capability' => 'edit_theme_options',
		));	 
	
		$wp_customize->add_control( 'hide_categorysec', array(
			   'settings' => 'hide_categorysec',
			   'section'   => 'three_cols_section',
			   'label'     => __('Uncheck This Option To Display This Section','skt-magazine'),
			   'type'      => 'checkbox'
		 ));//Hide Three Column Section		
 
		
		$wp_customize->add_section('footer_area',array(
				'title'	=> __('Footer Area','skt-magazine'),
				'priority'	=> null,
				'description'	=> __('Please go to Appearance >> idgets >> Footer Widget 1, Footer Widget 2, Footer Widget 3, Footer Widget 4 and add some widget.','skt-magazine')
		));
 		
		 //Hide footer Section		
		$wp_customize->add_setting('hide_footer',array(
			'sanitize_callback' => 'sanitize_text_field',
			'capability' => 'edit_theme_options',
		));	 

		$wp_customize->add_control( 'hide_footer', array(
		   'settings' => 'hide_footer',
    	   'section'   => 'footer_area',
    	   'label'     => __('Hide This Section','skt-magazine'),
    	   'type'      => 'checkbox'
    	 ));//Hide footer Section		
	
 }
add_action( 'customize_register', 'skt_magazine_customize_register' );

//Integer
function skt_magazine_sanitize_integer( $input ) {
    if( is_numeric( $input ) ) {
        return intval( $input );
    }
}

function skt_magazine_custom_css(){
		?>
        	<style type="text/css"> 
					a,	#sidebar ul li a:hover,
					.lists_cats h5 a:hover,			
					.logo h1 span,
					.copyright-wrapper a:hover											
					{ color:<?php echo esc_attr(get_theme_mod('color_scheme','#046dd6')); ?>;}
					.pagination ul li .current, .pagination ul li a:hover, 
					#commentform input#submit:hover,													
					.wpcf7 input[type='submit'],										
					.sitenav ul li a:hover, .sitenav ul li.current_page_item a,
					.current,
					
					.shortingmenu ul li a:hover, .shortingmenu ul li.current_page_item a,
					.social-icons a:hover
					{ background-color:<?php echo esc_attr(get_theme_mod('color_scheme','#046dd6')); ?> !important;}
			</style> 
<?php   
}
add_action('wp_head','skt_magazine_custom_css');	

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function skt_magazine_customize_preview_js() {
	wp_enqueue_script( 'skt_magazine_customizer', get_template_directory_uri() . '/js/customize-preview.js', array( 'customize-preview' ), '20130508', true );
}
add_action( 'customize_preview_init', 'skt_magazine_customize_preview_js' );
function skt_magazine_custom_customize_enqueue() {
	wp_enqueue_script( 'skt-magazine-custom-customize', get_template_directory_uri() . '/js/custom.customize.js', array( 'jquery', 'customize-controls' ), false, true );
}
add_action( 'customize_controls_enqueue_scripts', 'skt_magazine_custom_customize_enqueue' );