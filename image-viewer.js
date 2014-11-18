(function($) {
	'use strict';

	/*
	 * @name image-viewer
	 * @fileOverview Full-page / modal on-click/touch image previewer plugin
	 * @author <a href="https://github.com/battlesnake">Mark K Cowan</a>
	 * @version 0.0.1
	 */

	var defaultConfig = {
newEl Class to add to images which have the imageViewer binding */
		boundClass: 'image-viewer-bound',

		/* Events which trigger the viewer */
		triggerEvents: 'click',

		/* Events which close the view */
		closeEvents: 'click keydown keypress blur',

		/* Preview container ID */
		previewContainerId: 'slider-preview-container',

		/* Don't apply CSS from here (use if you style the viewer externally) */
		useExternalCss: false,

		/* High-quality image URL generator (default: same as source image) */
		hiResImageGenerator: String.apply

	};

	/* Override hi-res image URL generator with ERR-specific generator */
	defaultConfig.hiResImageGenerator = errHRImageGenerator;

	$.fn.imageViewer = imageViewer;

	/* Bind the image viewer to a set of images */
	function imageViewer(options) {
		var config = $.extend({}, defaultConfig, options);
		$(this).find('img:not(.' + config.boundClass + ')').each(function() {
			var el = $(this);
			el.addClass(config.boundClass);
			el.on(config.triggerEvents, function() {
				previewImage(config, el);
			});
		});
	}

	/* Launch the image viewer on the given image */
	function previewImage(config, img) {

		/* Get/build the previewer */
		var previewContainer = $('#' + config.previewContainerId);
		if (!previewContainer.length) {
			previewContainer = generatePreview(config);
		}

		/* Clear existing images from previewer */
		var preview = previewContainer.find('div').first();
		preview.empty();

		/* Get high-quality image URL */
		var src = config.hiResImageGenerator(img.attr('src'));

		/* Low quality image (already loaded) */
		var imgLo = $('<div></div>')
			.css({
				position: 'absolute', backgroundImage: 'url(' + img.attr('src') + ')',
				backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
				backgroundPosition: '50% 50%', borderRadius: '20px', left: 0,
				top: 0, width: '100%', height: '100%', border: 0, zIndex: 1
			})
			.appendTo(preview);

		/* High quality image (loads asynchronously, overlays low quality image) */
		var imgHi = $('<div></div>')
			.css({
				position: 'absolute', backgroundImage: 'url(' + src + ')',
				backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
				backgroundPosition: '50% 50%', borderRadius: '20px', left: 0,
				top: 0, width: '100%', height: '100%', border: 0, zIndex: 2
			})
			.appendTo(preview);

		/* Show preview */
		previewContainer
			.css({
				pointerEvents: 'auto'
			})
			.animate({
				opacity: 1
			}, 'slow', 'swing');

	}

	/* Generates the image previewer */
	function generatePreview(config) {
		var previewContainer = $('<div id="' + config.previewContainerId + '"></div>')
			.css(useExternalCss ? {} : {
				position: 'fixed', display: 'block', zIndex: 999999, top: 0,
				left: 0, right: 0, bottom: 0, padding: 0, margin: 0,
				border: 0
			})
			.css({ opacity: 0 })
			.on(config.closeEvents, closePreview)
			.appendTo($('body'));
		$('<div></div>')
			.css(useExternalCss ? {} : {
				display: 'block', position: 'absolute', top: 0, left: 0,
				right: 0, bottom: 0, overflow: 'hidden', margin: '40px',
				padding: '20px', backgroundColor: '#222', borderRadius: '40px'
			})
			.appendTo(previewContainer);
		$('<a>' + 'x' + '</a>')
			.css(useExternalCss ? {} : {
				boxSizing: 'border-box', position: 'absolute',
				display: 'block', right: '45px', top: '45px', width: '35px',
				height: '35px', borderTopRightRadius: '35px',
				borderBottomLeftRadius: '5px', background: '#444',
				color: '#aaa', cursor: 'arrow', textAlign: 'right',
				padding: '15px 15px 0 0', lineHeight: 0, fontSize: 0
			})
			.on('click', closePreview)
			.appendTo(previewContainer);
		return previewContainer;
	}

	/* Closes the preview */
	function closePreview() {
		var previewContainer = $('#' + config.previewContainerId);
		previewContainer
			.css({
				pointerEvents: 'none'
			})
			.animate({
				opacity: 0
			}, 'fast', 'swing');
	}

	/* Resizes image to window, sets appropriate quality, rounds corners */
	function errHRImageGenerator(loRes) {
		return = loRes
			.replace(/(width)(?:=\w+)/g, '$1=' + $(window).innerWidth())
			.replace(/(height)(?:=\w+)/g, '$1=' + $(window).innerHeight())
			.replace(/(quality)(?:=\w+)/g, '$1=80')
			.replace(/$/, '&s.roundcorners=10');
	}

})(window.$ || window.jQuery);
