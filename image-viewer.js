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
		classPrefix: 'image-viewer',

		/* Class to add to images when they're bound to the viewer */
		boundClass: 'image-viewer-bound',

		/* Events (on the source images) which trigger the viewer */
		triggerEvents: 'click',

		/* Non-exhaustive list of events which close the view */
		closeEvents: 'click keydown keypress blur',

		/* High-quality image URL generator (default: same as source image) */
		hiResImageGenerator: identity,
		
		/* Buttons are in container or dialog? */
		buttonParent: 'container',

		/* Called when an image is viewed */
		onView: scrollImageIntoView

	};

	/* Preview container (singleton), active viewer object, active image (element) */
	var previewContainer, activeViewer, activeImage;

	/* Override hi-res image URL generator with ERR-specific generator */
	//defaultConfig.hiResImageGenerator = errHRImageGenerator;

	$.fn.imageViewer = imageViewer;
	
	$(document).on('keydown', keysNav);
	
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
		var prefix = viewer.classPrefix;
		var buttonClass = prefix + '-button';
		var buttonParent;
		previewContainer = $('<div></div>')
			.addClass(prefix + '-container')
			.on(viewer.closeEvents, closeViewer)
			.on('swipe', touchNav)
			.on('mousewheel DOMMouseScroll', wheelNav)
			.appendTo($('body'));
		var dialog = $('<div></div>')
			.addClass(prefix + '-dialog')
			.appendTo(previewContainer);
		if (viewer.buttonParent === 'container') {
			buttonParent = previewContainer;
		} else if (viewer.buttonParent === 'dialog') {
			buttonParent = dialog;
		}
		$('<a></a>')
			.addClass(buttonClass + '-close ' + buttonClass)
			.on('click', closeViewer)
			.appendTo(buttonParent);
		$('<a></a>')
			.addClass(buttonClass + '-prev ' + buttonClass + '-nav ' + buttonClass)
			.on('click', prevImage)
			.appendTo(buttonParent);
		$('<a></a>')
			.addClass(buttonClass + '-next ' + buttonClass + '-nav ' + buttonClass)
			.on('click', nextImage)
			.appendTo(buttonParent);
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
		
		var prefix = activeViewer.classPrefix;
		var imageContainerClass = prefix + '-layers';
		var imagePrefix = prefix + '-image';

		/* Clear existing images from previewer */
		var preview = previewContainer.find('div').first();
		preview.find('.' + imageContainerClass)
			.remove();

		/* Container */
		var layers = $('<div></div')
			.addClass(imageContainerClass)
			.appendTo(preview);

		/* Get high-quality image URL */
		var loRes = img.attr('src');
		var hiRes = activeViewer.hiResImageGenerator(loRes);

		/* Low quality image (already loaded) */
		var imgLo = $('<div></div>')
			.addClass(imagePrefix + '-low ' + imagePrefix)
			.css({ backgroundImage: 'url("' + loRes.replace(/"\\/g, '\\$1') + '")' })
			.on('click', nextImage)
			.appendTo(layers);

		/* High quality image (loads asynchronously, overlays low quality image) */
		var imgHi = $('<div></div>')
			.addClass(imagePrefix + '-high ' + imagePrefix)
			.css({ backgroundImage: 'url("' + hiRes.replace(/"\\/g, '\\$1') + '")' })
			.on('click', nextImage)
			.appendTo(layers);

		/* Show preview */
		activeViewer.open();

		if (activeViewer.onView) {
			activeViewer.onView(activeImage);
		}

	}

	/* Opens the viewer */
	function openViewer() {
		previewContainer
			.addClass('show');
	}

	/* Closes the viewer */
	function closeViewer() {
		previewContainer
			.removeClass('show');
		activeViewer = undefined;
	}

	/* Scroll active image into view (behind viewer) */
	function scrollImageIntoView(img) {
		$('html, body').stop(true).animate({
			scrollTop: img.offset().top - 100
		}, 2000);
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
