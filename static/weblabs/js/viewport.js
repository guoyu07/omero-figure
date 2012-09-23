(function( $ ){

    var methods = {

    init : function( options ) {

        return this.each(function(){
            var $this = $(this),
                data = $this.data('viewport');

            // If the plugin hasn't been initialized yet
            if ( ! data ) {

                var data = {};
                data['orig_width'] = options['orig_width'] || $this.width();
                data['orig_height'] = options['orig_height'] || $this.height();
                data['wrapwidth'] = options['wrapwidth'] || data['orig_width'];
                data['wrapheight'] = options['wrapheight'] || data['orig_height'];
                data['cur_zoom'] = 100;

                $this.addClass('weblitz-viewport-img');
                $this.wrap('<div style="display: inline; position: absolute;" class="draggable"></div>');

                $this.parent().wrap('<div style="border: solid black 1px; background-color: #ddd; position:relative; overflow: hidden">');
                
                var $frame = $this.parent().parent();
                $frame.css( {'width':data['wrapheight']+'px', 'height':data['wrapheight']+'px'} );
                
                // Status message display
                var $msg = $('<div class="viewport-msg" style="display:none"></div>')
                    .hide()
                    .appendTo($frame);
                $this.bind('status',function(e, status){
                    $msg.text(status)
                        .show();
                });

                var mw_zoom = function (e, delta) {
                    methods.doZoom.apply( $this, [delta] );
                    e.preventDefault();
                }
                var $zm_1_1 = $('<button class="zoom_1_1" title="Zoom 1:1">1:1</button>')
                    .click(function(){
                        methods.setZoom.apply( $this, [100] );
                    });
                var $zm_tofit = $('<button class="zoom_to_fit" title="Zoom to fit">fit</button>')
                    .click(function(){
                        methods.zoomToFit.apply( $this, [] );
                    });
                var $zm_in = $('<button class="zoom_in" title="Zoom In"></button>')
                    .click(function(){
                        methods.doZoom.apply( $this, [10] );
                    });
                var $zm_out = $('<button class="zoom_out" title="Zoom Out"></button>')
                    .click(function(){
                        methods.doZoom.apply( $this, [-10] );
                    });
                $('<div class="zoom_percent" title="Use Mouse-wheel to Zoom"><div class="cur_zoom"></div></div>')
                    .mousewheel(mw_zoom)
                    .append($zm_in)
                    .append($zm_out)
                    .append($zm_1_1)
                    .append($zm_tofit)
                    .mouseout(function(){$zm_1_1.hide(); $zm_tofit.hide(); $(this).css('opacity','0.7')})
                    .mouseover(function(){$zm_1_1.show(); $zm_tofit.show(); $(this).css('opacity','1.0')})
                    .css('opacity','0.7')
                    .appendTo($frame);
                $zm_1_1.hide();
                $zm_tofit.hide();

                if (typeof options.klass == "string") {
                    $frame.addClass(options.klass);
                    $this.removeClass(options.klass);
                }
                $(this).data('viewport', data);

                /**
                 * Handle panning by mouse drag
                 */
                var dragdiv = $this.parent();
                var ondrag = false;
                var clickinterval = null;
                var drag_px;
                var drag_py;
                dragdiv
                  .click(function (e) {
                      if (clickinterval != null) {
                        clickinterval = null;
                        $this.trigger(e);
                      }
                    })
                .mousedown(function (e) {
                  drag_px = e.screenX;
                  drag_py = e.screenY;
                  //jQuery(this).css('cursor', 'move');
                  jQuery(this).addClass('ondrag');
                  ondrag = true;
                  if (clickinterval != null) {
                    clearInterval(clickinterval);
                  }
                  clickinterval = setTimeout(function () {clearTimeout(clickinterval); clickinterval = null;}, 250)
                  return false;
                })
                .mouseup(function (e) {
                  if (ondrag) {
                    ondrag = false;
                    jQuery(this).removeClass('ondrag');
                    return false;
                    //jQuery(this).css('cursor', 'default');
                  }
                })
                .mouseout(function (e) {
                  if (ondrag) {
                    ondrag = false;
                    jQuery(this).removeClass('ondrag');
                    return false;
                    //jQuery(this).css('cursor', 'default');
                  }
                })
                .mousemove(function (e) {
                  if (ondrag) {
                    methods.doMove.apply( $this, [e.screenX-drag_px, e.screenY-drag_py] );
                    drag_px = e.screenX;
                    drag_py = e.screenY;
                    return false;
                  }
                })
                .dblclick(function (e) {
                    var x = e.pageX - dragdiv.offset().left;
                    var y = e.pageY - dragdiv.offset().top;
                    var w_before = $this.width();
                    var h_before = $this.height();
                    var czm = $this.data('viewport')['cur_zoom'];
                    if (czm) {
                        methods.setZoom.apply( $this, [czm * 2] );
                    } else {
                        methods.doZoom.apply( $this, [50] );
                    }
                    var zoom_w = $this.width() - w_before;
                    var zoom_h = $this.height() - h_before;
                    var offset_w = zoom_w * (x / w_before);
                    var offset_h = zoom_h * (y / h_before);
                    methods.doMove.apply( $this, [-offset_w, -offset_h] );
                });
                
            }
        });
    },

    setZoom : function (val) {
        return this.each(function(){
            var $this = $(this);
            var data = $this.data('viewport');
            var width = parseInt(data['orig_width']*val/100);
            var height = parseInt(data['orig_height']*val/100);
            data['cur_zoom'] = val;

            /*
            if (!changing) {
            changing = setTimeout(function () {;
            image.trigger("zoom", [cur_zoom]);
            changing = null;
            }, 20);
            }
            image.trigger("instant_zoom", [cur_zoom])
            */
            $this.attr({width: width, height: height});
            //overlay.attr({width: width, height: height});
            $this.data('viewport', data);
            
            $('.cur_zoom', $this.parent().parent()).text(parseInt(val) + " %");
            
            methods.doMove.apply( $(this), [0, 0] );
        });
    },

    doZoom : function(incr) {
        return this.each(function(){
            var $this = $(this);
            var data = $this.data('viewport');
            var zoom = data['cur_zoom'] + incr;
            methods.setZoom.apply( $(this), [zoom] );
        });
    },

    zoomToFit : function() {
        return this.each(function(){
            
            var $this = $(this);
            var data = $this.data('viewport');
            var ztf = Math.min(data['wrapwidth'] * 100.0 / data['orig_width'], data['wrapheight'] * 100.0 / data['orig_height']);
            methods.setZoom.apply( $(this), [ztf] );
        });
    },
    
    doMove : function (deltax, deltay, smooth, auto_move_cb) {
        
        return this.each(function(){
            
            var $this = $(this);
            var data = $this.data('viewport');
            var dragdiv = $this.parent();
            var dragdiv_dom = dragdiv.get(0);
            var wrapdiv = $(dragdiv_dom.parentNode);
            
            /* Image and wrapping div */
            var pos = dragdiv.offset();
            var rel = wrapdiv.offset();

            pos.left -= rel.left + parseInt(jQuery.curCSS(wrapdiv[0], "borderLeftWidth", true));
            pos.top -= rel.top + parseInt(jQuery.curCSS(wrapdiv[0], "borderTopWidth", true));
            var left = pos.left + deltax;
            var top = pos.top + deltay;
            var self = this;

            var imagewidth = $this.width(),
                wrapwidth = data['wrapwidth'],
                imageheight = $this.height(),
                wrapheight = data['wrapheight'];

            /* Is the viewport bigger than the image ? */
            if (imagewidth <= wrapwidth) {
                /* Viewport wider than image, center horizontally */
                left = (wrapwidth - imagewidth) / 2;
            } else {
                /* Image wider than viewport... */
                if (left >= 0) {
                    left = 0;
                }
                if ((wrapwidth - imagewidth) >= left ) {
                    left = wrapwidth - imagewidth;
                }
            }

            if (imageheight <= wrapheight) {
                /* Viewport higher than image, center vertically */
                top = (wrapheight - imageheight) / 2;
            } else {
                /* Image higher than viewport... */
                if (top >= 0) {
                    top = 0;
                }
                if ((wrapheight - imageheight) >= top ) {
                    top = wrapheight - imageheight;
                }
            }
            if (left == dragdiv_dom.offsetLeft && top == dragdiv_dom.offsetTop) {
                return;
            }

            if (smooth != null) {
                dragdiv.animate({left: left, top: top}, 'fast', 'linear', function () {
                    if (auto_move_cb != null && auto_move_cb()) {
                        self.doMove(deltax, deltay, smooth, auto_move_cb);
                    }
                });
            } else {
                dragdiv.css({left: left, top: top});
            }

        });
    },

    destroy : function( ) {

        return this.each(function(){

            var $this = $(this),
                data = $this.data('viewport');

            data.viewport.remove();
            $this.removeData('viewport');
        });
    }
    };

    $.fn.viewport = function( method ) {

        if ( methods[method] ) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.viewport' );
        }
    };

})( jQuery );