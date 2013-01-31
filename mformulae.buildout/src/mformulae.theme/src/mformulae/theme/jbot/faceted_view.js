
/* - faceted_view.js - */

/* - ++resource++eea.faceted-navigation.js - */
var Faceted = {version: '2.0'};
/* Events
*/
Faceted.Events = {};
Faceted.Events.INITIALIZE = 'FACETED-INITIALIZE';
Faceted.Events.AJAX_QUERY_START = 'FACETED-AJAX-QUERY-START';
Faceted.Events.AJAX_QUERY_SUCCESS = 'FACETED-AJAX-QUERY-SUCCESS';
Faceted.Events.QUERY_INITIALIZED = 'FACETED-QUERY-INITIALIZED';
Faceted.Events.QUERY_CHANGED = 'FACETED-QUERY-CHANGED';
Faceted.Events.RESET = 'FACETED-RESET';
Faceted.Events.FORM_DO_QUERY = 'FACETED-FORM-DO-QUERY';
Faceted.Events.WINDOW_WIDTH_CHANGED = 'FACETED-WINDOW-WIDTH-CHANGED';
Faceted.Events.WINDOW_HEIGHT_CHANGED = 'FACETED-WINDOW-HEIGHT-CHANGED';
Faceted.Events.AJAX_START = 'FACETED-AJAX-START';
Faceted.Events.AJAX_STOP = 'FACETED-AJAX-STOP';
Faceted.Events.AJAX_ERROR = 'FACETED-AJAX-ERROR';
Faceted.Events.REDRAW = 'FACETED-REDRAW';
Faceted.Events.HASHCHANGE = 'hashchange.FACETED-HASHCHANGE';

/* Unbind events
*/
Faceted.Events.cleanup = function(){
  jQuery(Faceted.Events).unbind(Faceted.Events.AJAX_QUERY_START);
  jQuery(Faceted.Events).unbind(Faceted.Events.AJAX_QUERY_SUCCESS);
  jQuery(Faceted.Events).unbind(Faceted.Events.QUERY_INITIALIZED);
  jQuery(Faceted.Events).unbind(Faceted.Events.QUERY_CHANGED);
  jQuery(Faceted.Events).unbind(Faceted.Events.RESET);
  jQuery(Faceted.Events).unbind(Faceted.Events.FORM_DO_QUERY);
  jQuery(Faceted.Events).unbind(Faceted.Events.WINDOW_WIDTH_CHANGED);
  jQuery(Faceted.Events).unbind(Faceted.Events.WINDOW_HEIGHT_CHANGED);
  jQuery(Faceted.Events).unbind(Faceted.Events.AJAX_START);
  jQuery(Faceted.Events).unbind(Faceted.Events.AJAX_STOP);
  jQuery(Faceted.Events).unbind(Faceted.Events.AJAX_ERROR);
  jQuery(Faceted.Events).unbind(Faceted.Events.REDRAW);
  jQuery(window).unbind(Faceted.Events.HASHCHANGE); /* jQuery.bbq events */
};

/* Widgets
*/
Faceted.Widgets = {};

/* Query
*/
Faceted.Query = {};

/* Context url.
Default: (context related)
*/
Faceted.BASEURL = '';

/* UI Options
 */
Faceted.Options = {};
Faceted.Options.SHOW_SPINNER = true;
Faceted.Options.FADE_SPEED = 'slow';

/* Return minimal and sorted query
*/
Faceted.SortedQuery = function(query){
  if(!query){
    query = Faceted.Query;
  }

  var keys = [];
  jQuery.each(query, function(key){
    if(!this || this == 'all'){
      return;
    }
    keys.push(key);
  });

  keys.sort();
  var res = {};
  jQuery.each(keys, function(index){
    res[this] = query[this];
  });
  return res;
};

Faceted.Window = {
  initialize: function(){
    this.width = jQuery(window).width();
    this.height = jQuery(window).height();
    var js_window = this;
    jQuery(window).resize(function(){
      js_window.width_change();
      js_window.height_change();
    });

    // Full screen icon clicked
    var fullscreen = jQuery('a:has(img#icon-full_screen)');
    if(fullscreen.length){
      js_window.toggle_fullscreen(fullscreen);
    }
  },

  width_change: function(){
    var width = jQuery(window).width();
    if(width != this.width){
      this.width = width;
      jQuery(Faceted.Events).trigger(
        Faceted.Events.WINDOW_WIDTH_CHANGED, {width: width}
      );
    }
  },

  height_change: function(){
    var height = jQuery(window).height();
    if(height != this.height){
      this.height = height;
      jQuery(Faceted.Events).trigger(
        Faceted.Events.WINDOW_HEIGHT_CHANGED, {height: height}
      );
    }
  },

  toggle_fullscreen: function(button){
    button.attr('href', '#');
    button.click(function(evt){
      var toggleFullScreenMode = window.toggleFullScreenMode;
      if(toggleFullScreenMode){
        toggleFullScreenMode();
        jQuery(Faceted.Events).trigger(Faceted.Events.WINDOW_WIDTH_CHANGED);
      }
      return false;
    });
  }
};

/*
  @class Faceted.Form
*/
Faceted.Form = {
  initialize: function(){
    this.form = jQuery('#faceted-form');
    // Handle form submit event
    this.area = jQuery('#faceted-results');
    this.mode = this.form.attr('data-mode') || 'view';

    // Faceted version
    this.version = '';
    var version = jQuery('#faceted-version', this.form);
    if(version){
      this.version = version.text();
    }

    // Handle errors
    this.area.ajaxError(function(event, request, settings){
      jQuery(this).html('' +
      '<h3>This site encountered an error trying to fulfill your request</h3>' +
      '<p>' +
        'If the error persists please contact the site maintainer. ' +
        'Thank you for your patience.' +
      '</p>');
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_ERROR);
    });

    var has_hash = false;
    var hashquery = Faceted.URLHandler.get();
    jQuery.each(hashquery, function(){
      has_hash = true;
      Faceted.Query = hashquery;
      return false;
    });

    if(Faceted.Query.b_start === undefined){
      Faceted.Query.b_start = 0;
    }

    if(this.mode === 'search'){
      return;
    }

    jQuery(Faceted.Events).trigger(Faceted.Events.QUERY_INITIALIZED);

    if(!has_hash){
      Faceted.URLHandler.set();
    }else{
      Faceted.URLHandler.hash_changed();
    }
  },

  initialize_paginator: function() {
    var context = this;
    Faceted.b_start_changed = false;
    jQuery('.listingBar a').each(function(i){
      jQuery(this).click(function(){
        var href = jQuery(this).attr('href');
        var regex = new RegExp('b_start\\:int=(\\d+)');
        var b_start = regex.exec(href)[1];
        Faceted.b_start_changed = true;
        context.do_query('b_start', b_start);
        return false;
      });
    });
  },

  reset: function(evt){
    Faceted.Query = {};
  },

  do_query: function(wid, value){
    // Update query
    if(wid != 'b_start' && !Faceted.b_start_changed){
      Faceted.Query.b_start = 0;
    }

    if(!value){
      value = [];
    }
    if(wid){
      Faceted.Query[wid] = value;
    }
    jQuery(Faceted.Events).trigger(Faceted.Events.FORM_DO_QUERY, {wid: wid});
    // Update url
    Faceted.URLHandler.set();
  },

  do_form_query: function(){
    var context = this;
    if(Faceted.Query.b_start === undefined){
      Faceted.Query.b_start = 0;
    }
    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_QUERY_START);
    context.area.fadeOut('fast', function(){
      if(Faceted.Options.SHOW_SPINNER){
        var loading = '<div class="faceted_loading"><img src="' +
        Faceted.BASEURL + '++resource++faceted_images/ajax-loader.gif" /></div>';
        context.area.html(loading);
        context.area.fadeIn(Faceted.Options.FADE_SPEED);
      }

      var query = Faceted.SortedQuery();
      if(context.version){
        query.version = context.version;
      }
      jQuery.get(Faceted.BASEURL + '@@faceted_query', query, function(data){
        context.area.fadeOut('fast', function(){
          context.area.html(data);

          // la següent línia força que es torni a passar l'script de renderitzat de funcions
          MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
          
          context.area.fadeIn(Faceted.Options.FADE_SPEED);
          jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_QUERY_SUCCESS);
        });
      });
    });
  },
  /* Errors
  */
  highlight: function(elements, css_class, remove){
    for(var i=0;i<elements.length;i++){
      var element = jQuery('#' + elements[i]);
      if(remove){
        jQuery(element).removeClass(css_class);
      }else{
        jQuery(element).addClass(css_class);
      }
    }
  },

  raise_error: function(msg, error_area, highlights){
    var area = jQuery('#' + error_area);
    msg = '<div class="portalMessage">' + msg + '</div>';
    area.html(msg);
    this.highlight(highlights, 'error');
  },

  clear_errors: function(error_area, highlights){
    var area = jQuery('#' + error_area);
    area.html('');
    this.highlight(highlights, 'error', true);
  }
};

Faceted.URLHandler = {
  initialize: function(){
  },

  hash_changed: function(){
    Faceted.Query = this.get();
    jQuery(Faceted.Events).trigger(Faceted.Events.QUERY_CHANGED);
    Faceted.Form.do_form_query();
  },

  document_hash: function(){
    var r = window.location.href;
    var i = r.indexOf("#");
    return (i >= 0 ? r.substr(i+1) : '');
  },

  get: function(){
    var hash = jQuery.bbq.getState();
    var query = {};
    var types = ["number", "boolean", "string"];
    jQuery.each(hash, function(key, value){
      var value_type = typeof(value);
      if(jQuery.inArray(value_type, types) !== -1){
        value = [value];
      }
      query[key] = value;
    });
    return query;
  },

  set: function(query){
    if(!query){
      query = Faceted.Query;
    }
    query = jQuery.param(query, traditional=true);
    jQuery.bbq.pushState(query, 2);
  }
};

Faceted.Sections = {
  initialize: function(){
    var self = this;
    self.form = jQuery('.faceted-form');
    self.advanced = jQuery('.faceted-advanced-widgets', self.form).hide();
    if(!self.advanced.length){
      return;
    }

    self.buttons = jQuery('.faceted-sections-buttons', self.form);
    self.more = jQuery('.faceted-sections-buttons-more', self.form).show();
    self.less = jQuery('.faceted-sections-buttons-less', self.form).hide();

    jQuery('a', self.buttons).click(function(evt){
      self.toggle(jQuery(this), evt);
      return false;
    });
  },

  toggle: function(element, evt){
    this.more.toggle();
    this.less.toggle();
    this.advanced.toggle('blind');

    // Refresh tags facets
    var tags = jQuery('.faceted-tagscloud-widget:visible', this.form);
    if(tags.length){
      jQuery(Faceted.Events).trigger(Faceted.Events.WINDOW_WIDTH_CHANGED);
    }
  }
};

Faceted.AjaxLook = {
  initialize: function(){
    this.slaves = [];
    this.locked = false;
    // Events
    var js_object = this;
    jQuery(Faceted.Events).bind(Faceted.Events.AJAX_START, function(evt, data){
      js_object.add(data.wid);
    });

    jQuery(Faceted.Events).bind(Faceted.Events.AJAX_STOP, function(evt, data){
      js_object.remove(data.wid);
    });

    jQuery(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_START, function(evt){
      js_object.add('faceted-results');
    });

    jQuery(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_SUCCESS, function(evt){
      js_object.remove('faceted-results');
    });

    jQuery(Faceted.Events).bind(Faceted.Events.AJAX_ERROR, function(evt){
      jQuery(this.slaves).each(function(index){
        js_object.remove(js_object.slaves[index]);
      });
    });
  },

  add: function(wid){
    this.lock();
    this.slaves.push(wid);

    var widget = jQuery('#' + wid + '_widget');
    if(widget.length){
      widget.addClass('faceted-widget-loading');
      if(jQuery.browser.msie){
        widget.addClass('faceted-widget-loading-msie');
      }
    }
  },

  remove: function(wid){
    if(this.slaves.length){
      this.slaves = jQuery.map(this.slaves, function(slave, index){
        if(slave == wid){
          return null;
        }
        return slave;
      });
    }

    var widget = jQuery('#' + wid + '_widget');
    if(widget.length){
      widget.removeClass('faceted-widget-loading');
      widget.removeClass('faceted-widget-loading-msie');
    }
    this.unlock();
  },

  lock: function(){
    if(this.locked){
      // Already locked
      return;
    }
    this.locked = true;
    jQuery.each(Faceted.Widgets, function(key){
      this.widget.addClass('faceted-widget-locked');
    });

    var overlay = jQuery('<div>');
    overlay.addClass('faceted-lock-overlay');
    overlay.addClass('ui-widget-overlay');
    overlay.css('z-index', 1001);
    jQuery('#faceted-form').append(overlay);
  },

  unlock: function(){
    if(this.slaves.length){
      return;
    }
    this.locked = false;

    jQuery.each(Faceted.Widgets, function(key){
      this.widget.removeClass('faceted-widget-locked');
    });

    jQuery('.faceted-lock-overlay').remove();
  }
};

/* Load facetednavigation
*/
Faceted.Load = function(evt, baseurl){
  if(baseurl){
    Faceted.BASEURL = baseurl;
  }

  // Remove widgets with errors
  jQuery('.faceted-widget:has(div.faceted-widget-error)').remove();

  jQuery(Faceted.Events).bind(Faceted.Events.REDRAW, function(){
    if(jQuery('#faceted-left-column:has(div.faceted-widget)').length){
      jQuery('#center-content-area').addClass('left-area-js');
    }else{
      jQuery('#center-content-area').removeClass('left-area-js');
    }

    if(jQuery('#faceted-right-column:has(div.faceted-widget)').length){
      jQuery('#center-content-area').addClass('right-area-js');
    }else{
      jQuery('#center-content-area').removeClass('right-area-js');
    }
  });
  jQuery(Faceted.Events).trigger(Faceted.Events.REDRAW);

  // Init widgets UI
  jQuery(Faceted.Events).trigger(Faceted.Events.INITIALIZE);

  // Bind events
  jQuery(window).bind(Faceted.Events.HASHCHANGE, function(evt){
    Faceted.URLHandler.hash_changed();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_SUCCESS, function(evt){
    Faceted.Form.initialize_paginator();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    Faceted.Form.reset();
  });

  Faceted.Window.initialize();
  Faceted.Sections.initialize();
  Faceted.AjaxLook.initialize();
  Faceted.Form.initialize();

  // Override calendar close handler method in order to raise custom events
  if(window.Calendar){
    Calendar.prototype.callCloseHandler = function () {
      // Original code
      if (this.onClose) {
        this.onClose(this);
      }
      this.hideShowCovered();
      // Custom events
      var wid = this.params.inputField.id;
      wid = wid.split('_')[2];
      if(!wid){
        return false;
      }

      var widget = Faceted.Widgets[wid];
      widget.do_query();
      return false;
    };
  }
};

Faceted.Unload = function(){
};

/* Cleanup
*/
Faceted.Cleanup = function(){
  // Unbind events
  Faceted.Events.cleanup();

  // Reset
  Faceted.Widgets = {};
  Faceted.Query = {};

  // Reset URL hash
  Faceted.URLHandler.set();
};


/* - ++resource++eea.faceted-navigation-expand.js - */
(function(jQuery) {
jQuery.fn.collapsible = function(settings){
  var self = this;
  self.colapsed = false;

  var options = {
    maxitems: 0,
    elements: 'li',

    events: {
      refresh: 'widget-refresh',
      expand: 'widget-expand',
      colapse: 'widget-colapse'
    },

    // Event handlers
    handle_refresh: function(evt, data){
      jQuery(options.elements, self).show();
      self.button.hide();

      if(!options.maxitems){
        return;
      }

      var elements = jQuery(options.elements, self);
      if(elements.length < options.maxitems){
        return;
      }

      if(self.colapsed){
        jQuery('a', self.button).text('More');
      }else{
        jQuery('a', self.button).text('Less');
      }
      self.button.show();

      if(!self.colapsed){
        return;
      }

      elements.each(function(index){
        if(index < options.maxitems){
          jQuery(this).show();
        }else{
          jQuery(this).hide();
        }
      });
    },

    handle_expand: function(evt, data){
      self.colapsed = false;
      self.trigger(options.events.refresh);
    },

    handle_colapse: function(evt, data){
      self.colapsed = true;
      self.trigger(options.events.refresh);
    },

    // Init
    initialize: function(){
      // Handle events
      self.bind(options.events.refresh, function(evt, data){
        options.handle_refresh(evt, data);
      });

      self.bind(options.events.expand, function(evt, data){
        options.handle_expand(evt, data);
      });

      self.bind(options.events.colapse, function(evt, data){
        options.handle_colapse(evt, data);
      });

      // More/Less button
      var link = jQuery('<a>').attr('href', '#').text('More');
      self.button = jQuery('<div>')
        .addClass('faceted-checkbox-more')
        .append(link)
        .hide();
      self.append(self.button);

      link.click(function(){
        if(self.colapsed){
          self.trigger(options.events.expand);
        }else{
          self.trigger(options.events.colapse);
        }
        return false;
      });

      if(options.maxitems){
        link.click();
      }
    }
  };

  if(settings){
    jQuery.extend(options, settings);
  }

  options.initialize();
  return this;

};
})(jQuery);


/* - ++resource++eea.faceted-navigation-independent.js - */
/*
  Help function which let you have
  normal independent input element sends values to a
  eea.facetednavigation object the correct way.

  How to use it. HTML example:

  <h2>Global search on data and maps</h2>
  <form action="find/global" method="get" class="faceted-external-search">
    <input type="text" name="c12" value="" />
    <input type="submit" value="Go!" name="search" />
  </form>

  c12 = is the parameter id of your text search facet.

*/
jQuery(document).ready(function(){
  jQuery('form.faceted-external-search').submit(function(evt){
    evt.preventDefault();
    var form = jQuery(this);
    var action = form.attr('action');
    var query = form.serialize();
    window.location.href = action + '#' + query;
  });
});


/* - ++resource++eea.facetednavigation.widgets.checkbox.view.js - */
/* Checkboxes Widget
*/
Faceted.CheckboxesWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.fieldset = jQuery('.widget-fieldset', this.widget);
  this.title = jQuery('legend', this.widget).html();
  this.elements = jQuery('input[type=checkbox]', this.widget);
  this.maxitems = parseInt(jQuery('span', this.widget).text(), 10);
  this.selected = [];

  // Faceted version
  this.version = '';
  var version = jQuery('#faceted-version');
  if(version){
    this.version = version.text();
  }

  jQuery('form', this.widget).submit(function(){
    return false;
  });

  // Handle checkbox click
  var js_widget = this;
  this.elements.click(function(evt){
    js_widget.checkbox_click(this, evt);
  });

  // Default values
  var selected = jQuery('input[type=checkbox]:checked', this.widget);
  if(selected.length){
    this.selected = selected;
    Faceted.Query[this.wid] = [];
    selected.each(function(){
      Faceted.Query[js_widget.wid].push(jQuery(this).val());
    });
  }

  // Handle More/Less buttons click
  if(this.maxitems){
    this.fieldset.collapsible({
      maxitems: this.maxitems,
      elements: 'li:not(.faceted-checkbox-item-zerocount)'
    });
  }

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
  if(this.widget.hasClass('faceted-count')){
    var sortcountable = this.widget.hasClass('faceted-sortcountable');
    jQuery(Faceted.Events).bind(Faceted.Events.QUERY_INITIALIZED, function(evt){
      js_widget.count(sortcountable);
    });
    jQuery(Faceted.Events).bind(Faceted.Events.FORM_DO_QUERY, function(evt, data){
      if(data.wid == js_widget.wid || data.wid == 'b_start'){
        return;
      }
      js_widget.count(sortcountable);
    });
  }
};

Faceted.CheckboxesWidget.prototype = {
  checkbox_click: function(element, evt){
    this.do_query(element);
  },

  do_query: function(element){
    this.selected = jQuery('input[type=checkbox]:checked', this.widget);
    var value = [];
    this.selected.each(function(i){
      value.push(jQuery(this).val());
    });
    Faceted.Form.do_query(this.wid, value);
  },

  reset: function(){
    // This is done by form.reset, so do nothing
    this.selected = [];
    jQuery(this.elements).attr('checked', false);
  },

  synchronize: function(){
    this.elements.attr('checked', false);
    var checked = Faceted.Query[this.wid];
    if(!checked){
      return;
    }

    jQuery('input[type=checkbox]', this.widget).val(checked);
    this.selected = jQuery('input[type=checkbox]:checked', this.widget);
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');

    widget.selected.each(function(i){
      var element = jQuery(this);
      var id = element.attr('id');
      var value = element.val();
      var label = jQuery('label[for=' + id + ']', widget.widget);
      var title = label.attr('title');
      label = label.html();

      var link = jQuery('<a href="#">[X]</a>');
      link.attr('id', 'criteria_' + id);
      link.attr('title', 'Remove ' + title + ' filter');
      link.click(function(evt){
        widget.criteria_remove(value, element);
        return false;
      });

      html.append(link);
      html.append('<span>' + label + '</span>');
    });

    return html;
  },

  criteria_remove: function(value, element){
    // Remove all
    if(!value){
      this.elements.attr('checked', false);
      this.do_query();
    }else{
      element.attr('checked', false);
      this.do_query();
    }
  },

  count: function(sortcountable){
    var query = Faceted.SortedQuery();
    query.cid = this.wid;
    if(this.version){
      query.version = this.version;
    }

    var context = this;
    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_START, {wid: context.wid});
    jQuery.getJSON(Faceted.BASEURL + '@@faceted_counter', query, function(data){
      context.count_update(data, sortcountable);
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_STOP, {wid: context.wid});
    });
  },

  count_update: function(data, sortcountable){
    var context = this;
    var lis = jQuery('li', context.widget);
    jQuery(lis).each(function(){
      var li = jQuery(this);
      li.removeClass('faceted-checkbox-item-disabled');
      li.removeClass('faceted-checkbox-item-zerocount');
      var input = jQuery('input', li);
      input.unbind();
      var key = input.val();

      var span = jQuery('span', li);
      if(!span.length){
        li.append(jQuery('<span>'));
        span = jQuery('span', li);
      }

      var value = data[key];
      value = value ? value : 0;
      span.text('(' + data[key] + ')');
      if(sortcountable){
        li.data('count', value);
      }
      if(!value){
        li.addClass('faceted-checkbox-item-disabled');
        if(context.widget.hasClass('faceted-zero-count-hidden')){
          li.addClass('faceted-checkbox-item-zerocount');
        }
        input.attr('disabled', 'disabled');
      }else{
        input.attr('disabled', false);
        input.click(function(evt){
          context.checkbox_click(this, evt);
        });
      }
    });
    if(sortcountable){
      lis.detach().sort(function(x, y) {
        var a = jQuery(x).data('count');
        var b = jQuery(y).data('count');
        return b - a;
      });
    }
    jQuery('ul', context.widget).append(lis);
    // Update expand/colapse
    context.fieldset.trigger('widget-refresh');
  }
};

Faceted.initializeCheckboxesWidget = function(evt){
  jQuery('div.faceted-checkboxes-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.CheckboxesWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeCheckboxesWidget);
});


/* - ++resource++eea.facetednavigation.widgets.sorting.view.js - */
/* Sorting Widget
*/
Faceted.SortingWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + this.wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.reverse = jQuery('#' + this.wid + '_reversed');
  this.elements = jQuery('option', this.widget);
  this.selected = [];
  this.select = jQuery('#' + this.wid);

  var error = jQuery('.faceted-widget:has(div.faceted-sorting-errors)');
  if(error.length){
    error.remove();
    jQuery(Faceted.Events).trigger(Faceted.Events.REDRAW);
    return;
  }

  // Handle select change
  jQuery('form', this.widget).submit(function(){
    return false;
  });

  var js_widget = this;
  this.select.change(function(evt){
    js_widget.select_change(this, evt);
  });
  this.reverse.click(function(evt){
    js_widget.reverse_change(this, evt);
  });

  // Default value
  var value = this.select.val();
  if(value){
    this.selected = jQuery('option[value=' + value + ']', this.widget);
    Faceted.Query[this.wid] = [value];

    var reverse = this.reverse.attr('checked');
    if(reverse){
      Faceted.Query.reversed = 'on';
    }
  }

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(){
    js_widget.reset();
  });
};

Faceted.SortingWidget.prototype = {
  select_change: function(element, evt){
    this.do_query(element);
  },

  reverse_change: function(element, evt){
    this.do_query(element);
  },

  do_query: function(element){
    if(!element){
      this.selected = [];
      Faceted.Form.do_query(this.wid, []);
      return;
    }

    var value = null;
    if(jQuery(element).attr('type') == 'checkbox'){
      value = jQuery(element).attr('checked') ? 'on' : [];
      if(!this.selected.length){
        Faceted.Query.reversed = value;
        return;
      }
      Faceted.Form.do_query('reversed', value);
      return;
    }else{
      value = jQuery(element).val();
      if(!value){
        this.selected = [];
        value = [];
      }else{
        this.selected = jQuery('option[value='+ value +']', this.widget);
      }
      Faceted.Form.do_query(this.wid, value);
      return;
    }
  },

  reset: function(reversed){
    reversed = reversed ? true : false;
    this.select.val("");
    this.reverse.attr('checked', reversed);
    this.selected = [];
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    var reversed_value = Faceted.Query.reversed;
    if(!reversed_value){
      reversed_value = false;
    }
    else if (reversed_value.length == 1 && !reversed_value[0]){
      /* reversed value is false if == [""] */
      reversed_value = false;
    }
    else{
      reversed_value = true;
    }
    if(!value){
      this.reset(reversed_value);
      return;
    }

    var context = this;
    jQuery.each(value, function(){
      var selected = jQuery('option[value='+ value +']', this.widget);
      if(!selected.length){
        context.reset(reversed_value);
      }else{
        context.selected = selected;
        context.select.val(value);
        context.reverse.attr('checked', reversed_value);
      }
    });
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var element = jQuery(this.selected);
    var value = element.val();
    var label = element.html();
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + this.wid + '_' + value);
    link.attr('title', 'Remove ' + label + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    html.append(link);
    html.append('<span>' + label + '</span>');

    if(this.reverse.attr('checked')){
      var rid = this.reverse.attr('id');
      var rlabel = jQuery('label[for=' + rid + ']' ).html();
      html.append('<span>(' + rlabel + ')</span>');
    }

    return html;
  },

  criteria_remove: function(){
    this.select.val('');
    this.reverse.attr('checked', false);
    this.do_query();
  }
};

Faceted.initializeSortingWidget = function(evt){
  jQuery('div.faceted-sorting-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.SortingWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeSortingWidget);
});


/* - ++resource++eea.facetednavigation.widgets.text.view.js - */
/* Text Widget
*/
Faceted.TextWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.selected = [];
  this.button = jQuery('input[type=submit]', this.widget);

  // Handle text change
  var js_widget = this;
  jQuery('form', this.widget).submit(function(){
    js_widget.text_change(js_widget.button);
    return false;
  });

  // Default value
  var input = jQuery('#' + this.wid);
  var value = input.val();
  if(value){
    this.selected = input;
    Faceted.Query[this.wid] = [value];
  }

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
};

Faceted.TextWidget.prototype = {
  text_change: function(element, evt){
    this.do_query(element);
    jQuery(element).removeClass("submitting");
  },

  do_query: function(element){
    var input = jQuery('#' + this.wid);
    var value = input.val();
    value = value ? [value] : [];

    if(!element){
      this.selected = [];
      return Faceted.Form.do_query(this.wid, []);
    }
    this.selected = [input];

    var where = jQuery('input[type=radio]:checked', this.widget);
    where = where ? where.val() : 'all';
    if(where == 'all'){
      return Faceted.Form.do_query(this.wid, value);
    }

    var current = Faceted.Query[this.wid];
    current = current ? current : [];
    if(value.length && !(value[0] in current)){
      current.push(value[0]);
    }
    return Faceted.Form.do_query(this.wid, current);
  },

  reset: function(){
    this.selected = [];
    jQuery('#' + this.wid).val('');
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return;
    }

    var input = jQuery('#' + this.wid);
    this.selected = [input];
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var elements = Faceted.Query[this.wid];
    elements = elements ? elements: [];
    jQuery.each(elements, function(){
      var label = this.toString();
      if(label.length>0){
	      var link = jQuery('<a href="#">[X]</a>');
	      link.attr('id', 'criteria_' + widget.wid + '_' + label);
	      link.attr('title', 'Remove ' + label + ' filter');
	      link.click(function(evt){
	        widget.criteria_remove(label);
	        return false;
	      });
	      html.append(link);
	      html.append('<span>' + label + '</span>');
      }
    });
    return html;
  },

  criteria_remove: function(value){
    jQuery('#' + this.wid).val('');
    if(!value){
      this.selected = [];
      this.do_query();
      return;
    }
    jQuery('#' + this.wid + '_place_current', this.widget).attr('checked', true);
    var element = jQuery('input[type=text]', this.widget);
    var current = Faceted.Query[this.wid];
    var index = jQuery.inArray(value, current);
    if(index == -1){
      return;
    }
    current.splice(index, 1);
    Faceted.Query[this.wid] = current;
    this.do_query(element);
  }
};

Faceted.initializeTextWidget = function(evt){
  jQuery('div.faceted-text-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.TextWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeTextWidget);
});


/* - ++resource++eea.facetednavigation.widgets.daterange.view.js - */
/* DateRange Widget
*/
Faceted.DateRangeWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();

  this.start = jQuery('input[name=start]', this.widget);
  this.yearRange =  jQuery('input[name=calYearRange]', this.widget).val();
  this.end = jQuery('input[name=end]', this.widget);
  this.selected = [];

  var start = this.start.val();
  var end = this.end.val();
  if(start && end){
    this.selected = [this.start, this.end];
    Faceted.Query[this.wid] = [start, end];
  }

  var js_widget = this;
  this.start.datepicker({
    changeMonth: true,
    changeYear: true,
    dateFormat: 'yy-mm-dd',
    yearRange: this.yearRange,
    onSelect: function(date, cal){
      js_widget.select_change(js_widget.start);
    }
  });

  this.end.datepicker({
    changeMonth: true,
    changeYear: true,
    yearRange: this.yearRange,
    dateFormat: 'yy-mm-dd',
    onSelect: function(date, cal){
      js_widget.select_change(js_widget.end);
    }
  });

  // Handle clicks
  jQuery('form', this.widget).submit(function(){
    return false;
  });

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
};

Faceted.DateRangeWidget.prototype = {
  select_change: function(element){
    this.do_query(element);
  },

  do_query: function(element){
    var start = this.start.val();
    var end = this.end.val();
    if(!start || !end){
      this.selected = [];
      return false;
    }

    var value = [start, end];
    var start_date = new Date(start.replace(/-/g, '/'));
    var end_date = new Date(end.replace(/-/g, '/'));

    if(end_date<start_date){
      var msg = 'Invalid date range';
      Faceted.Form.raise_error(msg, this.wid + '_errors', []);
    }else{
      this.selected = [this.start, this.end];
      Faceted.Form.clear_errors(this.wid + '_errors', []);
      Faceted.Form.do_query(this.wid, value);
    }
  },

  reset: function(){
    this.selected = [];
    this.start.val('');
    this.end.val('');
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return false;
    }
    if(!value.length){
      this.reset();
      return false;
    }
    if(value.length<2){
      this.reset();
      return false;
    }

    var start = value[0];
    var end = value[1];
    var start_date = new Date(start.replace(/-/g, '/'));
    var end_date = new Date(end.replace(/-/g, '/'));

    // Invalid date
    if(!start_date.getFullYear()){
      this.reset();
      return false;
    }
    if(!end_date.getFullYear()){
      this.reset();
      return false;
    }

    // Set start, end inputs
    this.start.val(start);
    this.end.val(end);
    this.selected = [this.start, this.end];
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var start = this.start.val();
    var end = this.end.val();
    var start_date = new Date(start.replace(/-/g, '/'));
    var end_date = new Date(end.replace(/-/g, '/'));

    var label = start_date.toDateString() + ' - ' + end_date.toDateString();
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + this.wid + '_');
    link.attr('title', 'Remove ' + label + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    html.append(link);
    html.append('<span>' + label + '</span>');

    return html;
  },

  criteria_remove: function(){
    this.reset();
    return Faceted.Form.do_query(this.wid, []);
  }
};

Faceted.initializeDateRangeWidget = function(evt){
  jQuery('div.faceted-daterange-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.DateRangeWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeDateRangeWidget);
});


/* - ++resource++eea.facetednavigation.widgets.alphabets.view.js - */
/* Alphabetical Widget
*/
Faceted.AlphabeticalWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();

  this.letters = jQuery('#' + wid + ' span');
  this.selected = [];

  // Faceted version
  this.version = '';
  var version = jQuery('#faceted-version');
  if(version){
    this.version = version.text();
  }

  // Set default value
  var selected = jQuery('.faceted_letter_selected');
  if(selected.length){
    Faceted.Query[this.wid] = [selected.attr('id').split('-')[1]];
    this.synchronize();
  }

  // Handle letter click
  var js_widget = this;
  this.letters.click(function(evt){
    js_widget.letter_click(this, evt);
  });

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
  if(this.widget.hasClass('faceted-count')){
    var sortcountable = this.widget.hasClass('faceted-sortcountable');
    jQuery(Faceted.Events).bind(Faceted.Events.QUERY_INITIALIZED, function(evt){
      js_widget.count(sortcountable);
    });
    jQuery(Faceted.Events).bind(Faceted.Events.FORM_DO_QUERY, function(evt, data){
      if(data.wid == js_widget.wid || data.wid == 'b_start'){
        return;
      }
      js_widget.count(sortcountable);
    });
  }
};

Faceted.AlphabeticalWidget.prototype = {
  letter_click: function(letter, evt){
    this.do_query(letter);
  },

  letter_unselect: function(letter){
    jQuery(letter).removeClass('faceted_letter_selected');
    this.selected = [];
  },

  letter_select: function(letter){
    this.letter_unselect(this.letters);
    jQuery(letter).addClass('faceted_letter_selected');
    if(jQuery(letter).attr('id').split('-')[1] != 'all'){
      this.selected = [letter];
    }
  },

  do_query: function(letter){
    var value=jQuery(letter).attr('id').split('-')[1];
    var selected_value = '';
    if(this.selected.length){
      selected_value = jQuery(this.selected[0]).attr('id').split('-')[1];
    }
    if(value == selected_value){
      this.letter_select(jQuery('#' + this.wid + '-all'), this.widget);
      value = [];
    }else{
      this.letter_select(letter);
    }
    Faceted.Form.do_query(this.wid, value);
  },

  reset: function(){
    this.letter_select(jQuery('#' + this.wid + '-all', this.widget));
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
    }else{
      var letter = jQuery('#' + this.wid + '-' + value[0]);
      if(letter.length){
        this.letter_select(letter[0]);
      }else{
        this.reset();
      }
    }
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove(this, evt);
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }
    var label=jQuery(this.selected[0]).attr('id').split('-')[1];
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid + '_' + label);
    link.attr('title', 'Remove ' + label + ' filter');

    var widget = this;
    link.click(function(evt){
      widget.criteria_remove(this, evt);
      return false;
    });

    var html = jQuery('<dd>');
    html.append(link);
    html.append('<span>' + label + '</span>');
    return html;
  },

  criteria_remove: function(element, evt){
    this.do_query(this.selected[0]);
  },

  count: function(sortcountable){
    var query = Faceted.SortedQuery();
    query.cid = this.wid;
    if(this.version){
      query.version = this.version;
    }

    var context = this;
    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_START, {wid: context.wid});
    jQuery.getJSON(Faceted.BASEURL + '@@faceted_counter', query, function(data){
      context.count_update(data, sortcountable);
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_STOP, {wid: context.wid});
    });
  },

  count_update: function(data, sortcountable){
    var context = this;
    context.letters.each(function(){
      var letter = jQuery(this);
      letter.removeClass('faceted-alphabetic-letter-disabled');
      letter.unbind();
      var key = letter.attr('id').split('-')[1];
      var value = data[key];
      value = value ? value : 0;
      letter.attr('title', value);
      if(sortcountable){
        letter.data('count', value);
      }
      if(!value){
        letter.addClass('faceted-alphabetic-letter-disabled');
      }else{
        letter.click(function(evt){
          context.letter_click(this, evt);
        });
      }
    });
    if(sortcountable){
      context.letters.detach().sort(function(x, y) {
        var a = jQuery(x).data('count');
        var b = jQuery(y).data('count');
        return b - a;
      });
    }
    jQuery('#' + context.wid, context.widget).append(context.letters);
  }
};

Faceted.initializeAlphabeticalWidget = function(evt){
  jQuery('div.faceted-alphabetic-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.AlphabeticalWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeAlphabeticalWidget);
});


/* - ++resource++eea.facetednavigation.widgets.tagscloud.view.js - */
Faceted.TagsCloudWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.tags = jQuery('li', this.widget);
  this.faceted_count = this.widget.hasClass('faceted-count');
  this.selected = [];

  // Faceted version
  this.version = '';
  var version = jQuery('#faceted-version');
  if(version){
    this.version = version.text();
  }

  this.config = {};
  this.initialize();

  var selected = jQuery('.faceted-tag-selected', this.widget);
  if(selected.length){
    var value = selected.attr('id').replace(this.wid, '');
    value = value.replace(/_-_/g, ' ');
    Faceted.Query[this.wid] = [value];
    this.synchronize();
  }

  // Handle clicks
  var js_widget = this;
  this.tags.click(function(evt){
   js_widget.tag_click(this, evt);
  });

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });

  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_INITIALIZED, function(evt){
    js_widget.count();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.FORM_DO_QUERY, function(evt, data){
    if(data.wid == js_widget.wid || data.wid == 'b_start'){
      return;
    }
    js_widget.count();
  });

  // Resize window
  jQuery(Faceted.Events).bind(Faceted.Events.WINDOW_WIDTH_CHANGED, function(evt, data){
    var width = js_widget.widget.width();
    jQuery('ul', js_widget.widget).width(width - 30);
    js_widget.update();
  });
};

Faceted.TagsCloudWidget.prototype = {
  initialize: function(){
    var cloud = jQuery('#' + this.wid + '-cloud', this.widget).text();
    cloud = cloud ? cloud : 'list';
    var sizemin = jQuery('#' + this.wid + '-sizemin', this.widget).text();
    sizemin = parseInt(sizemin, 10);
    sizemin = sizemin ? sizemin : 10;
    var sizemax = jQuery('#' + this.wid + '-sizemax', this.widget).text();
    sizemax = parseInt(sizemax, 10);
    sizemax = sizemax ? sizemax : 20;
    var colormin = jQuery('#' + this.wid + '-colormin', this.widget).text(); 
    var colormax = jQuery('#' + this.wid + '-colormax', this.widget).text(); 
    var height = jQuery('#' + this.wid + '-height', this.widget).text();
    height = parseInt(height, 10);
    height = height ? height : 200;
    height = (cloud == 'list') ? 'auto' : height;
    this.config = {
      type: cloud,
      sizemin: sizemin,
      sizemax: sizemax,
      height: height,
      colormin: colormin, 
      colormax: colormax 
    };
    this.update();
  },

  update: function(){
    jQuery('#' + this.wid, this.widget).tagcloud(this.config);
  },

  tag_click: function(tag, evt){
    this.do_query(tag);
  },

  unselect: function(tag){
    jQuery(tag).removeClass('faceted-tag-selected');
    this.selected = [];
  },

  select: function(tag){
    this.unselect(this.tags);
    jQuery(tag).addClass('faceted-tag-selected');
    if(jQuery(tag).attr('id').replace(this.wid, '') != 'all'){
      this.selected = [tag];
    }
  },

  do_query: function(tag){
    var value=jQuery(tag).attr('id').replace(this.wid, '');
    value = value.replace(/_-_/g, ' ');
    var selected_value = '';
    if(this.selected.length){
      selected_value = jQuery(this.selected[0]).attr('id').replace(this.wid, '');
      selected_value = selected_value.replace(/_-_/g, ' ');
    }
    if(value == selected_value){
      this.select(jQuery('#' + this.wid + 'all', this.widget));
      value = [];
    }else{
      this.select(tag);
    }
    Faceted.Form.do_query(this.wid, value);
  },

  reset: function(){
    this.select(jQuery('#' + this.wid + 'all', this.widget));
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
    }else{
      value = value[0].replace(/ /g, '_-_');
      var tag = jQuery('#' + this.wid + value, this.widget);
      if(tag.length){
        this.select(tag[0]);
      }
    }
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove(this, evt);
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }
    var tag_id = jQuery(this.selected[0]).attr('id');
    var label = jQuery(this.selected[0]).attr('title');
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + tag_id);
    link.attr('title', 'Remove ' + label + ' filter');

    var widget = this;
    link.click(function(evt){
      widget.criteria_remove(this, evt);
      return false;
    });

    var html = jQuery('<dd>');
    html.append(link);
    html.append('<span>' + label + '</span>');
    return html;
  },

  criteria_remove: function(tag, evt){
    this.do_query(this.selected[0]);
  },

  count: function(){
    var query = Faceted.SortedQuery();
    query.cid = this.wid;
    if(this.version){
      query.version = this.version;
    }
    var context = this;

    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_START, {wid: context.wid});
    jQuery.get(Faceted.BASEURL + '@@tagscloud_counter', query, function(data){
      context.count_update(data);
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_STOP, {wid: context.wid});
    });
  },

  count_update: function(data){
    var js_widget = this;
    var all_id = js_widget.wid + 'all';
    var fieldset = jQuery('fieldset', jQuery(data));
    js_widget.widget.html(fieldset);

    var min = 10000;
    jQuery('li', js_widget.widget).each(function(){
      var tag = jQuery(this);
      var val = tag.attr('value');
      val = parseInt(val, 10);
      if(val < min && val > 0){
        min = val;
      }
    });
    var all_tag = jQuery('#' + all_id, js_widget.widget);
    var all = all_tag.attr('value');
    all_tag.attr('value', min);

    js_widget.tags = jQuery('li', this.widget);

    // Handle clicks
    js_widget.tags.click(function(evt){
     js_widget.tag_click(this, evt);
    });

    if(!js_widget.faceted_count){
      // Update
      js_widget.update();
      return;
    }

    // Count
    js_widget.tags.each(function(){
      var tag = jQuery(this);

      var html = tag.text();
      var value = parseInt(tag.attr('value'), 10);

      if(tag.attr('id') == all_id){
        value = all;
      }else{
        value -= 1;
      }

      html = html.replace(/\s\(\d+\)/, '');
      html += ' (' + value + ')';
      tag.html(html);

      tag.unbind();
      if((tag.attr('value')===1) && (tag.attr('id') != all_id)){
        tag.addClass('faceted-tag-disabled');
      }else{
        tag.removeClass('faceted-tag-disabled');
        tag.click(function(evt){
          js_widget.tag_click(this, evt);
        });
      }
    });

    // Update
    js_widget.update();
  }
};

Faceted.initializeTagsCloudWidget = function(evt){
  jQuery('div.faceted-tagscloud-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.TagsCloudWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeTagsCloudWidget);
});


/* - ++resource++eea.facetednavigation.widgets.debug.view.js - */
/* Debug Widget
*/
Faceted.DebugWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.query_area = jQuery('dd.debug-query pre', this.widget);
  this.after_area = jQuery('dd.debug-after pre', this.widget);
  this.config_area = jQuery('dd.debug-config pre', this.widget);
  this.count_area = jQuery('dd.debug-count pre', this.widget);

  jQuery('dd', this.widget).hide();
  jQuery('dt', this.widget).each(function(){
    var dt = jQuery(this);
    var css = dt.attr('class');
    var parent = dt.parent('dl');
    var minmax = jQuery('<span>').addClass('ui-icon ui-icon-plus').css('float', 'left');
    minmax.click(function(){
      var button = jQuery(this);
      jQuery('dd.' + css, parent).toggle();
      if(button.hasClass('ui-icon-minus')){
        button.removeClass('ui-icon-minus');
        button.addClass('ui-icon-plus');
      }else{
        button.removeClass('ui-icon-plus');
        button.addClass('ui-icon-minus');
      }
    });
    dt.prepend(minmax);
  });

  // Bind events
  var js_widget = this;
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
};

Faceted.DebugWidget.prototype = {
  synchronize: function(){
    var context = this;
    var query = jQuery.extend({}, Faceted.Query);
    query['debugger'] = this.wid;
    jQuery.get(Faceted.BASEURL + '@@faceted.widget.debug.query', query, function(data){
      if(data == "[]"){
        jQuery('.debug-query', context.widget).hide();
      }else{
        jQuery('dt.debug-query', context.widget).show();
      }
      context.query_area.text(data);
    });
    jQuery.get(Faceted.BASEURL + '@@faceted.widget.debug.after', query, function(data){
      if(data == "[]"){
        jQuery('.debug-after', context.widget).hide();
      }else{
        jQuery('dt.debug-after', context.widget).show();
      }
      context.after_area.text(data);
    });
    jQuery.get(Faceted.BASEURL + '@@faceted.widget.debug.criteria', query, function(data){
      if(data == "[]"){
        jQuery('.debug-config', context.widget).hide();
      }else{
        jQuery('dt.debug-config', context.widget).show();
      }
      context.config_area.text(data);
    });
    jQuery.get(Faceted.BASEURL + '@@faceted.widget.debug.counters', query, function(data){
      if(data == "[]"){
        jQuery('.debug-count', context.widget).hide();
      }else{
        jQuery('dt.debug-count', context.widget).show();
      }
      context.count_area.text(data);
    });
  },

  criteria: function(){
    return [];
  }
};

Faceted.initializeDebugWidget = function(evt){
  jQuery('div.faceted-debug-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.DebugWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeDebugWidget);
});


/* - ++resource++eea.facetednavigation.widgets.range.view.js - */
/* Range Widget
*/

Faceted.RangeWidget = function(wid){
  var js_widget = this;
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();

  this.start = jQuery('input[name=start]', this.widget);
  this.end = jQuery('input[name=end]', this.widget);
  this.selected = [];

  var start = this.start.val();
  var end = this.end.val();
  if(start && end){
    this.selected = [this.start, this.end];
    Faceted.Query[this.wid] = [start, end];
  }

  // Handle clicks
  jQuery('form', this.widget).submit(function(){
    return false;
  });
  var handle = function(evt){js_widget.select_change(this, evt);};
  this.start.change(handle); 
  this.end.change(handle); 

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
}; 

Faceted.RangeWidget.prototype = {
  select_change: function(element){
    this.do_query(element);
  },

  do_query: function(element){
    var start = this.start.val();
    var end = this.end.val();
    if(!start || !end){
      this.selected = [];
      return false;
    }

    var value = [start, end];
    if(end<start){
      var msg = 'Invalid range';
      Faceted.Form.raise_error(msg, this.wid + '_errors', []);
    }else{
      this.selected = [this.start, this.end];
      Faceted.Form.clear_errors(this.wid + '_errors', []);
      Faceted.Form.do_query(this.wid, value);
    }
  },

  reset: function(){
    this.selected = [];
    this.start.val('');
    this.end.val('');
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return false;
    }
    if(!value.length){
      this.reset();
      return false;
    }
    if(value.length<2){
      this.reset();
      return false;
    }

    var start = value[0];
    var end = value[1];

    // Set start, end inputs
    this.start.val(start);
    this.end.val(end);
    this.selected = [this.start, this.end];
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var start = this.start.val();
    var end = this.end.val();

    var label = start + ' - ' + end;
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + this.wid + '_');
    link.attr('title', 'Remove ' + label + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    html.append(link);
    html.append('<span>' + label + '</span>');

    return html;
  },

  criteria_remove: function(){
    this.reset();
    return Faceted.Form.do_query(this.wid, []);
  }
};

Faceted.initializeRangeWidget = function(evt){
  jQuery('div.faceted-range-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.RangeWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeRangeWidget);
});


/* - ++resource++eea.facetednavigation.widgets.radio.view.js - */
/* Radio Widget
*/
Faceted.RadioWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.fieldset = jQuery('.widget-fieldset', this.widget);
  this.title = jQuery('legend', this.widget).html();
  this.elements = jQuery('input[type=radio]', this.widget);
  this.maxitems = parseInt(jQuery('span', this.widget).text(), 10);
  this.selected = [];

  // Faceted version
  this.version = '';
  var version = jQuery('#faceted-version');
  if(version){
    this.version = version.text();
  }

  jQuery('form', this.widget).submit(function(){
    return false;
  });

  var js_widget = this;
  this.elements.click(function(evt){
    js_widget.radio_click(this, evt);
  });

  // Default value
  var selected = jQuery('input[type=radio]:checked', this.widget);
  if(selected.length){
    this.selected = selected;
    Faceted.Query[this.wid] = [this.selected.val()];
  }

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(){
    js_widget.reset();
  });
  if(this.widget.hasClass('faceted-count')){
    var sortcountable = this.widget.hasClass('faceted-sortcountable');
    jQuery(Faceted.Events).bind(Faceted.Events.QUERY_INITIALIZED, function(evt){
      js_widget.count(sortcountable);
    });
    jQuery(Faceted.Events).bind(Faceted.Events.FORM_DO_QUERY, function(evt, data){
      if(data.wid == js_widget.wid || data.wid == 'b_start'){
        return;
      }
      js_widget.count(sortcountable);
    });
  }

  if(this.maxitems){
    this.fieldset.collapsible({
      maxitems: this.maxitems,
      elements: 'li:not(.faceted-radio-item-zerocount)'
    });
  }
};

Faceted.RadioWidget.prototype = {
  radio_click: function(element, evt){
    if(!jQuery(element).val()){
      element = null;
    }
    this.do_query(element);
  },

  do_query: function(element){
    if(!element){
      this.selected = [];
      return Faceted.Form.do_query(this.wid, []);
    }else{
      this.selected = [element];
      var value = jQuery(this.selected[0]).val();
      return Faceted.Form.do_query(this.wid, value);
    }
  },

  reset: function(){
    jQuery(this.elements[0]).attr('checked', true);
    this.selected = [];
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return;
    }

    var context = this;
    if(typeof value != 'object'){
      value = [value];
    }
    jQuery.each(value, function(){
      var radio = jQuery('#' + context.wid + '_widget input[type=radio][value='+ this + ']');
      if(!radio.length){
        context.reset();
      }else{
        context.selected = radio;
        context.selected.attr('checked', true);
      }
    });
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var element = jQuery(this.selected);
    var id = element.attr('id');
    var label = jQuery('label[for=' + id + ']');
    var title = label.attr('title');
    label = label.html();
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + id);
    link.attr('title', 'Remove ' + title + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    html.append(link);
    html.append('<span>' + label + '</span>');

    return html;
  },

  criteria_remove: function(){
    var element = jQuery(this.elements[0]);
    element.attr('checked', true);
    this.do_query();
  },

  count: function(sortcountable){
    var query = Faceted.SortedQuery();
    query.cid = this.wid;
    if(this.version){
      query.version = this.version;
    }

    var context = this;
    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_START, {wid: context.wid});
    jQuery.getJSON(Faceted.BASEURL + '@@faceted_counter', query, function(data){
      context.count_update(data, sortcountable);
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_STOP, {wid: context.wid});
    });
  },

  count_update: function(data, sortcountable){
    var context = this;
    var lis = jQuery('li', context.widget);
    jQuery(lis).each(function(){
      var li = jQuery(this);
      li.removeClass('faceted-radio-item-disabled');
      li.removeClass('faceted-radio-item-zerocount');
      var input = jQuery('input', li);
      input.unbind();
      var key = input.val();

      var span = jQuery('span', li);
      if(!span.length){
        li.append(jQuery('<span>'));
        span = jQuery('span', li);
      }

      var value = data[key];
      value = value ? value : 0;
      span.text('(' + value + ')');

      if(sortcountable){
        li.data('count', value);
      }

      if(!value){
        li.addClass('faceted-radio-item-disabled');
        if(context.widget.hasClass('faceted-zero-count-hidden')){
          li.addClass('faceted-radio-item-zerocount');
        }
        input.attr('disabled', 'disabled');
      }else{
        input.attr('disabled', false);
        input.click(function(evt){
          context.radio_click(this, evt);
        });
      }
    });
    if(sortcountable){
      lis.detach().sort(function(x, y) {
        var a = jQuery(x).data('count');
        var b = jQuery(y).data('count');
        return b - a;
      });
    }
    jQuery('ul', context.widget).append(lis);
    // Update expand/colapse
    context.fieldset.trigger('widget-refresh');
  }
};

Faceted.initializeRadioWidget = function(evt){
  jQuery('div.faceted-radio-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.RadioWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeRadioWidget);
});


/* - ++resource++eea.facetednavigation.widgets.criteria.view.js - */
/* Criteria Widget
*/
Faceted.CriteriaWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.title = jQuery('legend', this.widget).html();

  this.area = jQuery('#' + wid);
  this.reset_button = jQuery('#' + wid + '_reset');
  this.toggle_button = jQuery('.faceted-criteria-hide-show', this.widget);
  this.toggle_button_count = jQuery('.faceted-criteria-count', this.toggle_button);

  var js_widget = this;
  this.reset_button.click(function(evt){
    js_widget.reset_click(this, evt);
    return false;
  });

  var toggle_buttons = jQuery('a', this.toggle_button);
  toggle_buttons.click(function(evt){
    js_widget.toggle_button_click(this, evt);
    return false;
  });

  // Syndication
  js_widget.initialize_syndication();

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_START, function(evt){
    return js_widget.update();
  });

  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    return js_widget.update_syndication();
  });
};

Faceted.CriteriaWidget.prototype = {
  reset_click: function(element, evt){
    jQuery(Faceted.Events).trigger(Faceted.Events.RESET);
    this.do_query();
  },

  toggle_button_click: function(element, evt){
    this.area.toggle('blind');
    jQuery('a', this.toggle_button).toggle();
    this.toggle_button_count.toggle();
  },

  do_query: function(wid, value){
    Faceted.Form.do_query(wid, value);
  },

  update: function(){
    var context = this;
    var empty=true;
    context.widget.fadeOut('fast', function(){
      context.area.empty();
      jQuery.each(Faceted.Query, function(key){
        var widget = Faceted.Widgets[key];
        if(!widget){
          return;
        }
        var criteria = widget.criteria();
        jQuery.each(criteria, function(){
          context.area.append(this);
          empty = false;
        });
      });

      var count = jQuery('dd span', context.area).length;
      context.toggle_button_count.text('(' + count + ')');

      if(!empty){
        context.widget.fadeIn('fast');
      }
    });
  },

  criteria: function(){
    return [];
  },

  initialize_syndication: function(){
    this.rss = null;
    this.rss_href = '';
    this.skos = null;
    this.skos_href = '';
    var icon = null;
    var rss = jQuery('#document-action-rss, #document-action-rss2').find('a');
    if(rss.length){
      rss = jQuery(rss[0]).clone();
      icon = jQuery('img', rss);
      icon.attr('id', icon.attr('id') + '-' + this.wid);
      rss.addClass('faceted-criteria-syndication-rss');
      rss.attr('id', this.wid + 'syndication-rss');
      jQuery('.faceted-criteria-reset', this.widget).prepend(rss);
      this.rss = jQuery('#' + this.wid + 'syndication-rss', this.widget);
      this.rss_href = rss.attr('href');
    }

    var skos = jQuery('#document-action-skos').find('a');
    if(skos.length){
      skos = jQuery(skos[0]).clone();
      icon = jQuery('img', skos);
      icon.attr('id', icon.attr('id') + '-' + this.wid);
      skos.addClass('faceted-criteria-syndication-skos');
      skos.attr('id', this.wid + 'syndication-skos');
      jQuery('.faceted-criteria-reset', this.widget).prepend(skos);
      this.skos = jQuery('#' + this.wid + 'syndication-skos', this.widget);
      this.skos_href = this.skos.attr('href');
    }
  },

  update_syndication: function(){
    var hash = 'ajax=True&';
    hash += Faceted.URLHandler.document_hash();
    if(this.rss){
      this.rss.attr('href', this.rss_href + '?' + hash);
    }

    if(this.skos){
      this.skos.attr('href', this.skos_href + '?' + hash);
    }
  }
};

Faceted.initializeCriteriaWidget = function(evt){
  jQuery('div.faceted-criteria-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.CriteriaWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeCriteriaWidget);
});


/* - ++resource++eea.facetednavigation.widgets.date.view.js - */
/* Relative Date Widget
*/
Faceted.DateWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.select_from = jQuery('select[name=from]', this.widget);
  this.select_to = jQuery('select[name=to]', this.widget);

  this.select_from.hide();
  this.select_to.hide();

  var js_widget = this;
  this.slider = jQuery('select', this.widget).selectToUISlider({
    labels: 2,
    labelSrc: 'text',
    sliderOptions: {
      change: function(){
        js_widget.change();
      }
    }
  });

  jQuery('span.ui-slider-label', this.widget).each(function(i){
    if(i!==11){
      return;
    }
    var span = jQuery(this);
    span.addClass('ui-slider-label-show');
  });

  this.selected = [];

  // Default value
  var from = this.select_from.val();
  var to = this.select_to.val();
  if((from !== 'now-past') || (to !== 'now_future')){
    this.selected = [this.select_from, this.select_to];
    Faceted.Query[this.wid] = [from, to];
  }

  // Handle clicks
  jQuery('form', this.widget).submit(function(){
    return false;
  });

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset_ui();
  });
};

Faceted.DateWidget.prototype = {
  change: function(){
    var from = this.select_from.val();
    var to = this.select_to.val();
    if(from === 'now-past' && to === 'now_future'){
      this.reset();
      Faceted.Form.do_query(this.wid, []);
    }else{
      this.do_query();
    }
  },

  do_query: function(){
    var value = [this.select_from.val(), this.select_to.val()];
    this.selected = [this.select_from, this.select_to];
    Faceted.Form.do_query(this.wid, value);
  },

  reset: function(){
    this.selected = [];
    this.select_from.val('now-past');
    this.select_to.val('now_future');
  },

  reset_ui: function(){
    this.reset();
    this.select_from.trigger('change');
    this.select_to.trigger('change');
  },

  synchronize: function(){
    var q_value = Faceted.Query[this.wid];
    if(!q_value){
      this.reset_ui();
      return;
    }
    if(!q_value.length){
      this.reset_ui();
      return;
    }
    if(q_value.length<2){
      this.reset_ui();
      return;
    }

    this.select_from.val(q_value[0]);
    this.select_to.val(q_value[1]);
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var from = jQuery('option:selected', this.select_from).text();
    var to = jQuery('option:selected', this.select_to).text();
    var label = from + ' - ' + to;

    var widget = this;
    var html = jQuery('<dd>');
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + this.wid + '_');
    link.attr('title', 'Remove ' + label + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    html.append(link);
    html.append('<span>' + label + '</span>');

    return html;
  },

  criteria_remove: function(){
    this.reset_ui();
    return Faceted.Form.do_query(this.wid, []);
  }
};

Faceted.initializeDateWidget = function(evt){
  jQuery('div.faceted-date-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.DateWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeDateWidget);
});


/* - ++resource++eea.facetednavigation.widgets.resultsperpage.view.js - */
Faceted.ResultsPerPageWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + this.wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.elements = jQuery('option', this.widget);
  this.select = jQuery('#' + this.wid);
  this.selected = [];

  // Handle change
  jQuery('form', this.widget).submit(function(){
    return false;
  });

  var js_widget = this;
  this.select.change(function(evt){
    js_widget.select_change(this, evt);
  });

  // Default value
  var value = this.select.val();
  if(value){
    this.selected = jQuery('option[value='+ value +']', this.widget);
    Faceted.Query[this.wid] = [value];
  }

    // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
};

Faceted.ResultsPerPageWidget.prototype = {
  select_change: function(element, evt){
    if(!jQuery(element).val()){
      element = null;
    }
    this.do_query(element);
  },

  do_query: function(element){
    if(!element){
      this.selected = [];
      return Faceted.Form.do_query(this.wid, []);
    }else{
      var value = jQuery(element).val();
      this.selected = jQuery('#' + this.wid + '_widget option[value='+ value +']');
      return Faceted.Form.do_query(this.wid, value);
    }
  },

  reset: function(){
    this.select.val("");
    this.selected = [];
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return;
    }

    var context = this;
    jQuery.each(value, function(){
      var selected = jQuery('#' + context.wid + '_widget option[value='+ value +']');
      if(!selected.length){
        context.reset();
      }else{
        context.selected = selected;
        context.select.val(value);
      }
    });
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var element = jQuery(this.selected);
    var value = element.val();
    var label = element.html();
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + this.wid + '_' + value);
    link.attr('title', 'Remove ' + label + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    html.append(link);
    html.append('<span>' + label + '</span>');

    return html;
  },

  criteria_remove: function(){
    this.select.val('');
    this.do_query();
  }
};

Faceted.initializeResultsPerPageWidget = function(evt){
  jQuery('div.faceted-resultsperpage-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.ResultsPerPageWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeResultsPerPageWidget);
});


/* - ++resource++eea.facetednavigation.widgets.path.tree.js - */
var FacetedTree = {version: '2.0'};

FacetedTree.Events = {};
FacetedTree.Events.CHANGED = 'FACETEDTREE-CHANGED';
FacetedTree.Events.AJAX_START = 'FACETEDTREE-AJAX-START';
FacetedTree.Events.AJAX_STOP = 'FACETEDTREE-AJAX-STOP';

FacetedTree.JsTree = function(wid, container, mode){
  this.BASEURL = '';
  if(window.Faceted){
    this.BASEURL = Faceted.BASEURL;
  }
  this.wid = wid;
  this.mode = mode || 'view';
  this.input = jQuery('#' + wid, container);
  this.input.attr('readonly', 'readonly');
  this.theme = jQuery('#' + wid + '-theme', container);

  this.area = jQuery('<div>');
  this.area.addClass('tree');
  this.area.text('Loading...');
  this.area.hide();
  this.area.width(this.input.width());
  this.input.after(this.area);

  var js_tree = this;
  this.input.click(function(evt){
    js_tree.show();
  });

  jQuery(document).click(function(e){
    var target = jQuery(e.target);
    if(target.is('#' + js_tree.input.attr('id'))){
      return;
    }
    var parent = target.parents('#' + js_tree.area.attr('id'));
    if(parent.length){
      return;
    }
    js_tree.hide();
  });

  jQuery(document).keydown(function(e){
    if(e.keyCode == 27){
      js_tree.hide();
    }
  });

  var query = {};
  query.cid = this.wid;
  query.mode = this.mode;

  jQuery(FacetedTree.Events).trigger(FacetedTree.Events.AJAX_START, {msg: 'Loading ...'});
  jQuery.getJSON(js_tree.BASEURL + '@@faceted.path.tree.json', query, function(data){
    if(data.length){
      js_tree.initialize(data);
    }else{
      if(mode=='edit'){
        jQuery('form', container).hide();
        jQuery('div.faceted-path-errors', container).show();
      }else{
        jQuery('.faceted-widget:has(div.faceted-path-errors)').remove();
        jQuery(Faceted.Events).trigger(Faceted.Events.REDRAW);
      }
    }
    jQuery(FacetedTree.Events).trigger(FacetedTree.Events.AJAX_STOP, {msg: data});
  });
};

FacetedTree.JsTree.prototype = {
  initialize: function(static_tree){
    var js_tree = this;
    js_tree.area.tree({
      ui: {
        theme_name: js_tree.theme.attr('title'),
        theme_path: js_tree.theme.text()
      },

      types   : {
        "default" : {
          clickable  : true,
          renameable : false,
          deletable  : false,
          creatable  : false,
          draggable  : false
        }
      },

      data: {
        type: 'json',
        async: true,
        opts: {
          method: 'POST',
          url: js_tree.BASEURL  + '@@faceted.path.tree.json'
        }
      },
      callback: {
        beforedata: function(node, tree){
          if(node===false){
            tree.settings.data.opts['static'] = static_tree;
            return;
          }
          tree.settings.data.opts['static'] = false;
          var data = {cid: js_tree.wid};
          data.mode = js_tree.mode;
          if(node){
            data.path = node.attr('path');
          }
          return data;
        },
        onselect: function(node, tree){
          js_tree.change(node, tree);
        }
      }
    });
  },

  show: function(){
    this.area.show();
  },

  hide: function(){
    this.area.hide();
  },

  change: function(node, tree){
    this.hide();
    node = jQuery(node);
    var value = node.attr('path');
    if(this.input.val() == value){
      value = '';
    }
    this.input.val(value);
    jQuery(FacetedTree.Events).trigger(
      FacetedTree.Events.CHANGED, {path: value}
    );
  }
};


/* - ++resource++eea.facetednavigation.widgets.path.view.js - */
/* Path Widget
*/
Faceted.PathWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.input = jQuery('input', this.widget);
  this.breadcrumbs = jQuery('<dd>');
  this.selected = [];

  // Default value
  var value = this.input.val();
  if(value){
    this.selected = this.input;
    Faceted.Query[this.wid] = [value];
  }

  // Navigation Tree
  var tree = new FacetedTree.JsTree(this.wid, this.widget);

  // Bind events
  var js_widget = this;
  jQuery('form', this.widget).submit(function(){
    return false;
  });
  jQuery(FacetedTree.Events).bind(FacetedTree.Events.CHANGED, function(data){
    js_widget.text_change(js_widget.input);
  });
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
};

Faceted.PathWidget.prototype = {
  text_change: function(element, evt){
    this.do_query(element);
  },

  do_query: function(element){
    var value = this.input.val();
    value = value ? [value] : [];

    if(!element){
      this.selected = [];
      return Faceted.Form.do_query(this.wid, []);
    }
    this.selected = [this.input];
    return Faceted.Form.do_query(this.wid, value);
  },

  reset: function(){
    this.selected = [];
    this.input.val('');
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return;
    }
    this.selected = [this.input];
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }
    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var js_widget = this;
    js_widget.breadcrumbs.text('Loading...');
    var query = {};
    query.path = js_widget.input.val();
    query.cid = js_widget.wid;
    jQuery.getJSON(Faceted.BASEURL + '@@faceted.path.breadcrumbs.json', query, function(data){
      js_widget.breadcrumbs.empty();
      jQuery.each(data, function(){
        js_widget.breadcrumbs.append(jQuery('<span>').html('&raquo;'));
        var a = jQuery('<a>');
        a.attr('href', this.url);
        a.attr('title', this.title);
        a.text(this.title);
        a.click(function(){
          var path = jQuery(this).attr('href');
          js_widget.input.val(path);
          jQuery(FacetedTree.Events).trigger(
            FacetedTree.Events.CHANGED, {path: path}
          );
          return false;
        });
        js_widget.breadcrumbs.append(a);
      });
    });
    return js_widget.breadcrumbs;
  },

  criteria_remove: function(){
    this.selected = [];
    this.input.val('');
    this.do_query();
  }
};

Faceted.initializePathWidget = function(evt){
  jQuery('div.faceted-path-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.PathWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializePathWidget);
});


/* - ++resource++eea.facetednavigation.widgets.portlet.view.js - */
Faceted.PortletWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + wid + '_widget');
  this.widget.show();

  jQuery('legend', this.widget).hide();
  jQuery('fieldset', this.widget).css('border', 'none');

  jQuery('form', this.widget).submit(function(){
    return true;
  });
};

Faceted.initializePortletWidget = function(evt){
  jQuery('div.faceted-portlet-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    var widget = new Faceted.PortletWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializePortletWidget);
});


/* - ++resource++eea.facetednavigation.widgets.select.view.js - */
/* Select Widget
*/
Faceted.SelectWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + this.wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.elements = jQuery('option', this.widget);
  this.select = jQuery('#' + this.wid);
  this.selected = [];

  // Faceted version
  this.version = '';
  var version = jQuery('#faceted-version');
  if(version){
    this.version = version.text();
  }

  // Handle change
  jQuery('form', this.widget).submit(function(){
    return false;
  });

  var js_widget = this;
  this.select.change(function(evt){
    js_widget.select_change(this, evt);
  });

  // Default value
  var value = this.select.val();
  if(value){
    this.selected = jQuery("option[value='" + value + "']", js_widget.widget);
    Faceted.Query[this.wid] = [value];
  }

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
  if(this.widget.hasClass('faceted-count')){
    var sortcountable = this.widget.hasClass('faceted-sortcountable');
    jQuery(Faceted.Events).bind(Faceted.Events.QUERY_INITIALIZED, function(evt){
      js_widget.count(sortcountable);
    });
    jQuery(Faceted.Events).bind(Faceted.Events.FORM_DO_QUERY, function(evt, data){
      if(data.wid == js_widget.wid || data.wid == 'b_start'){
        return;
      }
      js_widget.count(sortcountable);
    });
  }
};

Faceted.SelectWidget.prototype = {
  select_change: function(element, evt){
    if(!jQuery(element).val()){
      element = null;
    }
    this.do_query(element);
  },

  do_query: function(element){
    if(!element){
      this.selected = [];
      return Faceted.Form.do_query(this.wid, []);
    }else{
      var value = jQuery(element).val();
      this.selected = jQuery("#" + this.wid + "_widget option[value='" + value + "']");
      return Faceted.Form.do_query(this.wid, value);
    }
  },

  reset: function(){
    this.select.val("");
    this.selected = [];
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return;
    }

    var context = this;
    jQuery.each(value, function(){
      var selected = jQuery("option[value='" + value + "']", context.widget);
      if(!selected.length){
        context.reset();
      }else{
        context.selected = selected;
        context.select.val(value);
      }
    });
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var element = jQuery(this.selected);
    var value = element.val();
    var label = element.attr('title');
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + this.wid + '_' + value);
    link.attr('title', 'Remove ' + label + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    html.append(link);
    html.append('<span>' + label + '</span>');

    return html;
  },

  criteria_remove: function(){
    this.select.val('');
    this.do_query();
  },

  count: function(sortcountable){
    var query = Faceted.SortedQuery();
    query.cid = this.wid;
    if(this.version){
      query.version = this.version;
    }

    var context = this;
    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_START, {wid: context.wid});
    jQuery.getJSON(Faceted.BASEURL + '@@faceted_counter', query, function(data){
      context.count_update(data, sortcountable);
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_STOP, {wid: context.wid});
    });
  },

  count_update: function(data, sortcountable){
    var context = this;
    var options = jQuery('option', context.widget);
    jQuery(options).each(function(){
      var option = jQuery(this);
      option.removeClass('faceted-select-item-disabled');
      option.attr('disabled', false);
      var key = option.val();

      var value = data[key];
      value = value ? value : 0;
      var option_txt = option.attr('title');
      option_txt += ' (' + value + ')';

      option.html(option_txt);
      if(sortcountable){
        option.data('count', value);
      }
      if(!value){
        option.attr('disabled', 'disabled');
        option.addClass('faceted-select-item-disabled');
      }
    });
    if(sortcountable){
      options.detach().sort(function(x, y) {
        var a = jQuery(x).data('count');
        var b = jQuery(y).data('count');
        return b - a;
      });
      jQuery('select', context.widget).append(options);
    }
  }
};

Faceted.initializeSelectWidget = function(evt){
  jQuery('div.faceted-select-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.SelectWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeSelectWidget);
});

