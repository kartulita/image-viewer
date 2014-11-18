(function($) {
	'use strict';

	/*
	 * @name image-viewer
	 * @fileOverview Full-page / modal on-click/touch image previewer plugin
	 * @author <a href="https://github.com/battlesnake">Mark K Cowan</a>
	 * @version 0.0.1
	 */

	var defaultConfig = {

		/* Class to add to images which have the imageViewer binding */
		boundClass: 'image-viewer-bound',

		/* Events which trigger the viewer */
		triggerEvents: 'click',

		/* Events which close the view */
		closeEvents: 'click keydown keypress blur',

		/* Don't apply CSS from here (use if you style the viewer externally) */
		useExternalCss: false,

		/* High-quality image URL generator (default: same as source image) */
		hiResImageGenerator: identity,

		/* Speed of viewer open animation */
		openSpeed: 'fast'

	};

	var previewContainer;

	/* Viewer container class */
	var previewContainerClass = 'slider-preview-container';

	/* Speed of viewer close animation */
	var closeSpeed = 'fast';

	/* Override hi-res image URL generator with ERR-specific generator */
	//defaultConfig.hiResImageGenerator = errHRImageGenerator;

	$.fn.imageViewer = imageViewer;
	
	/* Bind the image viewer to a set of images */
	function imageViewer(options) {

		var viewer = $.extend({}, defaultConfig, options);

		/* Get/build the previewer */
		if (!previewContainer) {
			previewContainer = generateViewer(viewer);
		}

		viewer.open = openViewer;
		viewer.preview = previewImage;

		$(this).each(function() {
			var img = $(this);
			if (img.hasClass(viewer.boundClass)) {
				return;
			}
			img.addClass(viewer.boundClass);
			img.on(viewer.triggerEvents, function() {
				viewer.preview(img);
			});
		});
	}

	/* Generates the image viewer */
	function generateViewer(viewer) {
		previewContainer = $('<div></div>')
			.addClass(previewContainerClass)
			.css(viewer.useExternalCss ? {} : {
				position: 'fixed', display: 'block', zIndex: 999999, top: 0,
				left: 0, right: 0, bottom: 0, padding: 0, margin: 0,
				border: 0, backgroundColor: 'rgba(255,255,255,0.6)'
			})
			.css({ opacity: 0 })
			.on(viewer.closeEvents, closeViewer)
			.appendTo($('body'));
		$('<div></div>')
			.css(viewer.useExternalCss ? {} : {
				display: 'block', position: 'absolute', top: 0, left: 0,
				right: 0, bottom: 0, overflow: 'hidden', margin: '40px',
				padding: '20px', backgroundColor: '#222', borderRadius: '40px'
			})
			.appendTo(previewContainer);
		$('<a></a>')
			.addClass('close-button')
			.css(viewer.useExternalCss ? {} : {
				boxSizing: 'border-box', position: 'absolute',
				display: 'block', right: '45px', top: '45px', width: '35px',
				height: '35px', borderTopRightRadius: '35px',
				borderBottomLeftRadius: '5px', background: '#444',
				cursor: 'arrow'
			})
			.on('click', closeViewer)
			.appendTo(previewContainer);
		closeViewer();
		return previewContainer;
	}

	/* Launch the image viewer on the given image */
	function previewImage(img) {

		/* Clear existing images from previewer */
		var preview = previewContainer.find('div').first();
		preview.empty();

		/* Get high-quality image URL */
		var loRes = img.attr('src');
		var hiRes = this.hiResImageGenerator(loRes);

		/* Low quality image (already loaded) */
		var imgLo = $('<div></div>')
			.css({
				position: 'absolute', backgroundImage: 'url(' + loRes + ')',
				backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
				backgroundPosition: '50% 50%',
				left: '40px', top: '40px', right: '40px', bottom: '40px',
				border: 0, zIndex: 1,
			})
			.appendTo(preview);

		/* High quality image (loads asynchronously, overlays low quality image) */
		var imgHi = $('<div></div>')
			.css({
				position: 'absolute', backgroundImage: 'url(' + hiRes + ')',
				backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
				backgroundPosition: '50% 50%',
				left: '40px', top: '40px', right: '40px', bottom: '40px',
				border: 0, zIndex: 2,
			})
			.appendTo(preview);

		/* Show preview */
		this.open();

	}

	/* Opens the viewer */
	function openViewer() {
		previewContainer
			.stop(true)
			.removeClass('shown showing hidden hiding')
			.addClass('showing')
			.css({
				pointerEvents: 'auto'
			})
			.animate({
				opacity: 1
			}, this.openSpeed, 'swing')
			.removeClass('shown showing hidden hiding')
			.addClass('shown');
	}

	/* Closes the viewer */
	function closeViewer() {
		previewContainer
			.stop(true)
			.removeClass('shown showing hidden hiding')
			.addClass('hiding')
			.css({
				pointerEvents: 'none'
			})
			.animate({
				opacity: 0
			}, closeSpeed, 'swing')
			.removeClass('shown showing hidden hiding')
			.addClass('hidden');
	}

	/* Used for high-quality image URL generator */
	function identity(s) {
		return s;
	}

	/* Resizes image to window, sets appropriate quality, rounds corners */
	function errHRImageGenerator(loRes) {
		return loRes
			.replace(/(width)(?:=\w+)/g, '$1=' + $(window).innerWidth())
			.replace(/(height)(?:=\w+)/g, '$1=' + $(window).innerHeight())
			.replace(/(quality)(?:=\w+)/g, '$1=80')
			.replace(/$/, '&s.roundcorners=10');
	}

})(window.$ || window.jQuery);
