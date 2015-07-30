(function ($, Backbone, _, app){
    var AppRouter = Backbone.Router.extend({
        //This is where we define our routes for the application.
        routes: {
            '': 'home'
        },
        /*
        * This is where we reference the ID selector where
        * our Underscore.js template will load on the page.
        * Calling Backbone.history.start(); will trigger the
        * router to call the first matching route for the user
        */
        initialize : function (options) {
            this.contentElement = '#content';
            this.current = null;
            Backbone.history.start();
        },
        home: function () {
            var view = new app.views.HomepageView({el: this.contentElement});
            this.render(view);
        },
        /*
        * The render function is a helper for the router
        * to track when we are switching from one view
        * to another.
        */
        render: function (view) {
            if(this.current) {
                this.current.$el = $();
                this.current.remove();
            }
            this.current = view;
            this.current.render();
        }
    });

    /*
    * Attach the router definition to the app configuration to make it available
    * in the project scope.
    */
    app.router = AppRouter;

})(jQuery, Backbone, _, app);