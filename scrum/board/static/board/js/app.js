/*
* This self-envoking function simply initializes
* the global variables (models, collections, views
* and router) rather than loading them each time.
* This gives us a great deal of modularity
*/
var app = (function ($) {
    var config = $('#config'),
        app = JSON.parse(config.text());

    $(document).ready(function () {
        var router = new app.router();
    });
    
    return app;
})(jQuery);