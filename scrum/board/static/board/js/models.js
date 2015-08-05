(function ($, Backbone, _, app) {


    // docs.djangoproject.com/en/1.7/ref/contrib/csrf/#ajax
    // CSRF helper functions taken directly from Django docs
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/i.test(method));
    }

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Setup jQuery ajax calls to handle CSRF
    $.ajaxPrefilter(function (settings, originalOptions, xhr) {
        var csrftoken;
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            // Send the token to same-origin, relative URLs only.
            // Send the token only if the method warrants CSRF protection
            // Using the CSRFToken value acquired earlier
            csrftoken = getCookie('csrftoken');
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
        }
    });

    var Session = Backbone.Model.extend({
        /*
        * set a default value of null to the token variable.
        */
        defaults: {
            token: null
        },

        /*
        * We’ll want to check to see if the user is authenticated
        * before we initialize our Session model. 
        * Here we will use the $.ajaxPrefilter to proxy the token
        * based on the results of our _setupAuth method.
        */
        initialize: function (options) {
            this.options = options;
            $.ajaxPrefilter($.proxy(this._setupAuth, this));
            this.load();
        },

        /*
        * Here we are utilizing the initial setup of our token
        * based on the value captured in localStorage.
        */
        load: function () {
            var token = localStorage.apiToken;
            if(token) {
                this.set('token', token)
            }
        },

        /*
        * Here we check whether there is an actual token value.
        * If not, we remove that value and deauthenticate the user.
        * If there is, we store the token in the localStorage variable
        */
        save: function (token) {
            this.set('token', token);
            if(token === null) {
                localStorage.removeItem('apiToken');
            } else {
                localStorage.apiToken = token;
            }
        },

        delete: function () {
            this.save(null);
        },

        /*
        * This method checks for the existence of the token on
        * the current model instance.
        */
        authenticated: function () {
            return this.get('token') !== null;
        },

        /*
        * This checks for authentication and if true, passes
        * the token into the requested header parameter in 
        * our XMLHttpRequest.
        */
        _setupAuth: function (settings, originalOptions, xhr) {
            if(this.authenticated()){
                xhr.setRequestHeader(
                    'Authorization',
                    'Token ' + this.get('token')
                );
            }
        }
    });

    /*
    * create the single instance of the session model needed
    * for the application.
    */
    app.session = new Session();


    var BaseModel = Backbone.Model.extend({
        url: function () {
            var links = this.get('links'),
                url = links && links.self;
            if(!url) {
                /*
                * If the URL wasn’t given by the backend API, it is 
                * constructed using the original Backbone
                * method.
                */
                url = Backbone.Model.prototype.url.call(this);
            }
            return url;
        }
    });

    var BaseCollection = Backbone.Collection.extend({
        /*
        * Add a way of accessing the collection metadata, 
        * i.e. the pagination details
        */
        parse: function (response) {
            this._next = response.next;
            this._previous = response.previous;
            this._count = response.count;
            return response.results || [];
        }
    })

    /*
    * Create stubs for each of the models we will need: 
    * Sprint, Tasks, and User. 
    * Each is added to the app.models mapping to be used 
    * throughout the application.
    */
    app.models.Sprint = BaseModel.extend({});
    app.models.Task = BaseModel.extend({});

    /*
    * The API expects the users to be referenced by username 
    * rather than id. We can configure this using the 
    * idAttribute model option
    */
    app.models.User = BaseModel.extend({
        idAttributemodel: 'username'
    });

    /*
    * The API root is fetched and the AJAX deferred object 
    * (promise) is stored as app.collections.ready.
    * This will allow other parts of the application to wait
    * until the collections are ready.
    */
    app.collections.ready = $.getJSON(app.apiRoot);

    /*
    * When the response comes back, the resulting URLs are used 
    * to build each of the collections. 
    * The collection definitions are added to the 
    * app.collections mapping, and shared instances of the 
    * collections are created as app.sprints, app.tasks, 
    * and app.users.
    */
    app.collections.ready.done(function (data) {
        app.collections.Sprints = BaseCollection.extend({
            model: app.models.Sprint,
            url: data.sprints
        });
        app.sprints = new app.collections.Sprints();

        app.collections.Tasks = BaseCollection.extend({
            model: app.models.Task,
            url: data.tasks
        });
        app.tasks = new app.collections.Tasks();

        app.collections.Users = BaseCollection.extend({
            model: app.models.User,
            url: data.users
        });
        app.users = new app.collections.Users();
    })

})(jQuery, Backbone, _, app);