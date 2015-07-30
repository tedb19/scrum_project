(function ($, Backbone, _, app){
    var HomepageView = Backbone.View.extend({
        /*
        * We’ll need to tell our application what
        * Underscore.js template to render for our
        * home page.
        */
        templateName: '#home-template',
        /*
        * We use the Underscore.js _.template utility to
        * render our home page template into HTML.
        */
        initialize: function () {
            this.template = _.template($(this.templateName).html());
        },
        render: function () {
            var context = this.getContext(),
                html = this.template(context);
            this.$el.html(html);
        },
        getContext: function () {
            return {};
        }
    });
    /*
    * The HomepageView is added to the app.views dictionary
    * so that it can be used in other parts of the application,
    * namely the router.
    */
    app.views.HomepageView = HomepageView;
})(jQuery, Backbone, _, app);