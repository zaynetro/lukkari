/**
 * Search view
 */

var
  _ = require('underscore'),
  Backbone = require('backbone');

var Search = require('../../models/search');

var templates = require('../../dist');

module.exports = Backbone.View.extend({
  className : 'searchbox',
  template : templates.search,
  query : {},

  events : {
    'click .button' : 'search',
    'keyup .field'  : 'makeQuery'
  },

  initialize : function (options) {
    this.model = new Search(options);
  },

  render : function () {
    var data = this.model.toJSON();
    data.fields = Object.keys(data.schema);

    this.$el.html(_.template(this.template,
                             data,
                             { variable : 'data' }));
    return this;
  },

  search : function () {
    var query = this.$el.find('#query').val();

    try {
      query = JSON.parse(query);
      console.log(query);
      this.$el.find('#error').text('');
    } catch (err) {
      this.$el.find('#error').text(err);
    }
  },

  /**
   * Form query into full query field
   * @param  {Object} e Event
   */
  makeQuery : function (e) {
    var $el = this.$(e.currentTarget);

    if($el.val()) {
      // If value is not empty
      this.query[$el.attr('id')] = $el.val();
    } else if(typeof this.query[$el.attr('id')] !== 'undefined') {
      // If value is empty and object property exists
      delete this.query[$el.attr('id')];
    }

    this
      .$el
      .find('#query')
      .val(JSON.stringify(this.query, null, '  '));
  }
});
