(function($) {
	'use strict';

	/*
	 * @name image-viewer
	 * @fileOverview Full-page / modal on-click/touch image previewer plugin
	 * @author <a href="https://github.com/battlesnake">Mark K Cowan</a>
	 * @version 0.0.1
	 */

	/* I hate jQuery */

	var defaultConfig = {

		/* Prepend this to CSS class names */
		classPrefix: 'image-viewer-',

		/* Events (on the source images) which trigger the viewer */
		triggerEvents: 'click',

		/* Non-exhaustive list of events which close the view */
		closeEvents: 'click keydown keypress blur',

		/* High-quality image URL generator (default: same as source image) */
		hiResImageGenerator: identity,

		/* Speed of viewer open animation */
		openSpeed: 'fast'

	};

	/* Preview container (singleton), active viewer object, active image (element) */
	var previewContainer, activeViewer, activeImage;

	/* Speed of viewer close animation */
	var closeSpeed = 'fast';

	/* Override hi-res image URL generator with ERR-specific generator */
	//defaultConfig.hiResImageGenerator = errHRImageGenerator;

	$.fn.imageViewer = imageViewer;
	
	$(document).on('keydown', keysNav)
	
	/* Bind the image viewer to a set of images */
	function imageViewer(options) {

		var viewer = $.extend({}, defaultConfig, options);

		/* Get/build the previewer */
		if (!previewContainer) {
			previewContainer = generateViewer(viewer);
		}

		viewer.open = openViewer;
		viewer.preview = previewImage;
		viewer.images = $(this);

		viewer.images.each(function() {
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
			.addClass(viewer.classPrefix + 'container')
			.css({ opacity: 0 })
			.on(viewer.closeEvents, closeViewer)
			.on('swipe', touchNav)
			.on('mousewheel DOMMouseScroll', wheelNav)
			.appendTo($('body'));
		$('<div></div>')
			.addClass(viewer.classPrefix + 'dialog')
			.appendTo(previewContainer);
		$('<a></a>')
			.addClass(viewer.classPrefix + 'close-button')
			.on('click', closeViewer)
			.appendTo(previewContainer);
		$('<a></a>')
			.addClass(viewer.classPrefix + 'prev-button')
			.on('click', prevImage)
			.appendTo(previewContainer);
		$('<a></a>')
			.addClass(viewer.classPrefix + 'next-button')
			.on('click', nextImage)
			.appendTo(previewContainer);
		closeViewer();
		return previewContainer;
	}

	/* Touch/swipe navigation */
	function touchNav(event) {
		var dx = event.swipestop.coords[0] - event.swipestart.coords[0];
		var dy = event.swipestop.coords[1] - event.swipestart.coords[1];
		var th = Math.atan2(dy, dx);
		var left = Math.abs(th) <= Math.PI / 4;
		var right = (Math.PI - Math.abs(th)) <= Math.PI / 4;
		if (left) {
			prevImage(event);
		} else if (right) {
			nextImage(event);
		} else {
			closeViewer();
		}
	}

	/* Keyboard (arrow keys) navigation */
	function keysNav(event) {
		if (!activeViewer) {
			return;
		}
		var key = event.which;
		if (key === 27) {
			closeViewer();
		} else if (key === 37) {
			prevImage(event);
		} else if (key === 39) {
			nextImage(event);
		}
	}

	/* Scroll-wheel navigation */
	function wheelNav(event) {
		var delta = event.originalEvent.wheelDelta || event.originalEvent.detail;
		if (!delta) {
			return;
		}
		if (delta < 0) {
			prevImage(event);
		} else {
			nextImage(event);
		}
	}

	/* Previous image */
	function prevImage(event) {
		deltaImage(-1);
		if (event) {
			event.stopPropagation();
		}
	}

	/* Next image */
	function nextImage(event) {
		deltaImage(+1);
		if (event) {
			event.stopPropagation();
		}
	}

	/* Move relative to current image in current image set */
	function deltaImage(delta) {
		var images = [].slice.apply(activeViewer.images);
		var idx = images.indexOf(activeImage[0]);
		if (idx === -1) {
			return;
		}
		idx = (idx + images.length + delta) % images.length;
		previewImage($(images[idx]));
	}

	/* Launch the image viewer on the given image */
	function previewImage(img) {

		if (this) {
			activeViewer = this;
		}

		if (!activeViewer) {
			return;
		}

		activeImage = img;

		/* Clear existing images from previewer */
		var preview = previewContainer.find('div').first();
		preview.empty();

		/* Get high-quality image URL */
		var loRes = img.attr('src');
		var hiRes = activeViewer.hiResImageGenerator(loRes);

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
		activeViewer.open();

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
			}, activeViewer.openSpeed, 'swing')
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
		activeViewer = undefined;
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
