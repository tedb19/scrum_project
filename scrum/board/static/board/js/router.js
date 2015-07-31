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
            //initialize the headerview
            this.header = new app.views.HeaderView();
            $('body').prepend(this.header.el);
            this.header.render();
            Backbone.history.start();
        },
        home: function () {
            var view = new app.views.HomepageView({el: this.contentElement});
            this.render(view);
        },
        /*
        * This overrides the default route method for the router.
        * It is passed as a hash route and either the name of the
        * callback method or an explicit callback function.
        */
        route: function (route, name, callback) {
            // Override default route to enforce login on every page
            var login;
            callback = callback || this[name];
            callback = _.wrap(callback, function (original) {
                var args = _.without(arguments, original);
                //If the user is authenticated, then the original callback is simply called.
                if(app.session.authenticated()) {
                    original.apply(this, args);
                } else {
                    /*
                    * If the user is not authenticated, hide the current page content and 
                    * render the login view instead.
                    * When the login view triggers a done event, the original callback is
                    * allowed to proceed.
                    */
                    $(this.contentElement).hide();
                    //bind original callback once the login is successful
                    login = new app.views.LoginView();
                    $(this.contentElement).after(login.el);
                    login.on('done', function () {
                        this.header.render();
                        $(this.contentElement).show();
                        original.apply(this, args);

                    }, this);

                    //render the login form
                    login.render();
                }
            });
            return Backbone.Router.prototype.route.apply(this, [route, name, callback]);
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