(function ($, Backbone, _, app){

    /*
    * TemplateView is a generic view which will 
    * extend in all our views
    */
    var TemplateView = Backbone.View.extend({
        /*
        * We’ll need to tell our application what
        * Underscore.js template to render for our
        * home page.
        */
        templateName: '',
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
    * Both the HomepageView and LoginView now extend 
    * from this base TemplateView, which cleans up 
    * the repeated code.
    */
    var HomepageView = TemplateView.extend({
        templateName: '#home-template'
    });

    var LoginView = TemplateView.extend({
        id: 'login',
        templateName: '#login-template',
        //add an inline Underscore.js template for displaying errors
        errorTemplate: _.template('<span class="error"><%- msg %></span>'),
        /*
        * In backbonejs, Events are written in the format 
        * {"event selector": "callback"}, and uses jQuery
        * 'on' function.
        * This event property listens for all submit events on
        * any form element inside the LoginView’s element.
        * When an event is triggered, it will execute the submit
        * callback.
        * This particular event can be read as 'on "submit" event 
        * of "form" selector, execute the "submit" callback'
        */
        events: {
            'submit form': 'submit'
        },
        submit: function (event) {
            var data = {};
            event.preventDefault();
            this.form = $(event.currentTarget);
            this.clearErrors();
            data = {
                username = $(':input[name ="username"]', this.form).val(),
                password: $(':input[name="password"]', this.form).val()
            };
            //this is similar to a jQuery $.ajax call
            $.post(app.apiLogin, data)
                .success($.proxy(this.loginSuccess, this))
                .fail($.proxy(this.loginFailure, this));
        },
        loginSuccess: function (data) {
            app.session.save(data.token);
            this.trigger('login', data.token);//trigger a login event
        },
        loginFailure: function (xhr, status, error){
            var errors = xhr.responseJSON;
            this.showErrors(errors);
        },
        /*
        * This loops over all the fields and errors in the response 
        * and adds each error to the DOM just before the fields label.
        * If no matching field is found, the error is added before the
        * first label.
        */
        showErrors: function (errors) {
            _.map(errors, function (fieldErrors, name){
                var field = $(':input[name='+ name + ']', this.form),
                    label = $('label[for='+ field.attr('id') + ']', this.form),

                if(label.length === 0){
                    label = $('label', this.form).first();
                }

                function appendError(msg){
                    label.before(this.errorTemplate({msg: msg}));
                }

                _.map(fieldErrors, appendError, this);
            }, this);
        },
        //removes any existing errors from the form on each submission.
        clearErrors: function () {
            $('.error', this.form).remove();
        }
    });

    /*
    * The HomepageView and LoginView are added to the app.views dictionary
    * so that it can be used in other parts of the application,
    * namely the router.
    */
    app.views.HomepageView = HomepageView;
    app.views.LoginView = LoginView;

})(jQuery, Backbone, _, app);