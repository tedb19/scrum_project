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
    * FormView is a generic form view which will 
    * extend in all our views
    */
    var FormView = TemplateView.extend({
        events: {
            'submit form': 'submit'
        },
        //add an inline Underscore.js template for displaying errors
        errorTemplate: _.template('<span class="error"><%- msg %></span>'),
        //removes any existing errors from the form on each submission.
        clearErrors: function () {
            $('.error', this.form).remove();
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
                    label = $('label[for='+ field.attr('id') + ']', this.form);

                if(label.length === 0){
                    label = $('label', this.form).first();
                }

                function appendError(msg){
                    label.before(this.errorTemplate({msg: msg}));
                }

                _.map(fieldErrors, appendError, this);
            }, this);
        },
        /*
        * serializeForm is a generic serialization
        * of the form field values
        */
        serializeForm: function (form) {
            return _.object(_.map(form.serializeArray(), function (item) {
                // convert object to tuple of (name, value)
                return [item.name, item.value];
            }));
        },
        submit: function (event) {
            event.preventDefault();
            this.form = $(event.currentTarget);
            this.clearErrors();
        },
        failure: function (xhr, status, error) {
            var errors = xhr.responseJSON;
            this.showErrors(errors);
        },
        done: function (event) {
            if(event) {
                event.preventDefault();
            }
            this.trigger('done');
            this.remove();
        },
        /*
        * This is needed because while the $.ajax failure callback
        * has the response object as the first argument, 
        * the Model.save has the model instance as the first argument
        * and the response as the second.
        */
        modelFailure: function (model, xhr, options) {
            var errors = xhr.responseJSON;
            this.showErrors(errors);
        }

    });


    var NewSprintView = FormView.extend({
        templateName: '#new-sprint-template',
        className: 'new-sprint',
        /*
        * In addition to the default submit event handler,
        * which is handled by the FormView base, the view
        * will also handle a cancel button
        */
        events: _.extend({
            'click button.cancel': 'done'
        }, FormView.prototype.events),
        submit: function (event) {
            var self = this,
                attributes = {};
            FormView.prototype.submit.apply(this, arguments);
            attributes = this.serializeForm(this.form);
            app.collections.ready.done(function () {
                app.sprints.create(attributes, {
                    wait: true,
                    success: $.proxy(self.success, self),
                    error: $.proxy(self.modelFailure, self)
                });
            });
        },
        success: function (model) {
            this.done();
            /*
            * redirect to the detail route for the sprint
            */
            window.location.hash = '#sprint/' + model.get('id');
        }
    });

    /*
    * Both the HomepageView and LoginView now extend 
    * from the base TemplateView, which cleans up 
    * the repeated code.
    */
    var HomepageView = TemplateView.extend({
        templateName: '#home-template',
        events: {
            'click button.add': 'renderAddForm'
        },
        initialize: function (options) {
            var self = this;
            /*
            * The following brings in all the variables initialized
            * in the parent object (TemplateView) to the HomepageView
            * and changes 'this' context to the parent.
            */
            TemplateView.prototype.initialize.apply(this, arguments);
            app.collections.ready.done(function () {
                
                app.sprints.fetch({
                    //data: {end_min: end},
                    /*
                    * The $.proxy method takes an existing function and returns
                    * a new one with the specified context.
                    * $.proxy(function,context)
                    * In the below case, we are calling the render function,
                    * but as defined in the initialize function
                    */
                    success: $.proxy(self.render, self)
                });
            });
        },
        /*
        * The template context now contains the current sprints from app.sprints. 
        * This may be undefined if app.collections is not ready.
        * In that case, the template will get a null value.
        */
        getContext: function () {
            return {sprints: app.sprints || null};
        },
        renderAddForm: function (event) {
            var view = new NewSprintView(),
                link = $(event.currentTarget);
            event.preventDefault();
            link.before(view.el);
            link.hide();
            view.render();
            view.on('done', function () {
                link.show();
            });
        }    
    });

    var LoginView = FormView.extend({
        id: 'login',
        templateName: '#login-template',
        submit: function (event) {
            /*
            * The submit callback calls the original FormView submit 
            * to prevent the submission and clear any errors.
            * JavaScript doesn’t have a super call like Python.
            * FormView.prototype.submit.apply is the effective equivalent
            * to call the parent method.
            */
            FormView.prototype.submit.apply(this, arguments);
            var data = {};
            /*
            * Instead of the username and password fields being 
            * retrieved manually, the form data is serialized with
            * the serializeForm helper.
            */
            data = this.serializeForm(this.form);
            //this is similar to a jQuery $.ajax call
            $.post(app.apiLogin, data)
                .success($.proxy(this.loginSuccess, this))
                .fail($.proxy(this.failure, this));
        },
        loginSuccess: function (data) {
            app.session.save(data.token);
            this.done();
        }
        
    });


    var HeaderView = TemplateView.extend({
        /*
        * The tagName makes the template render into a
        * <header> element.
        */
        tagName: 'header',
        templateName: '#header-template',
        events: {
            'click a.logout': 'logout',
        },
        getContext: function () {
            return {authenticated: app.session.authenticated()};
        },
        logout: function (event) {
            event.preventDefault();
            app.session.delete();
            window.location = '/';
        }
    });
    /*
    * The HomepageView and LoginView are added to the app.views dictionary
    * so that it can be used in other parts of the application,
    * namely the router.
    */
    app.views.HomepageView = HomepageView;
    app.views.LoginView = LoginView;
    app.views.HeaderView = HeaderView;

})(jQuery, Backbone, _, app);