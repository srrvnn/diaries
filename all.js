var FBDiaries = React.createClass({
    getInitialState: function() {
        return { user: null, status: null, entry: null};
    },
    userStatusChange: function() {
        var _this = this;
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                FB.api('/me', function(response) {
                    _this.setState({user: response.name, entry: ''});
                })
            } else {
                _this.setState({user: null});
            }
        });
    },
    componentWillMount: function() {
        var _this = this;
        window.fbAsyncInit = function() {
            FB.init({
                appId      : '1564184183893205',
                cookie     : true,  // enable cookies for server to access the session
                xfbml      : true,  // parse social plugins on this page
                version    : 'v2.5' // use graph api version 2.5
            });
            FB.Event.subscribe('auth.statusChange', _this.userStatusChange);
            _this.userStatusChange();
        };

         // Load the SDK asynchronously
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    },
    render: function() {
        return (
            <div className="content">
                <h1>Diaries</h1>
                <FBLogin />
                {this.state.user === null ? <FBDiariesIntro /> : <FBDiariesEntry />}
            </div>
        );
    }
});

var FBLogin = React.createClass({
    html: function() {
        return { __html: '<fb:login-button size="large" scope="public_profile,user_birthday,publish_actions" \
            default_audience="only_me" auto-logout-link="true"></fb:login-button>' };
    },
    render: function() {
        return (
            <div dangerouslySetInnerHTML={this.html()}></div>
        );
    }
});

var FBDiariesEntry = React.createClass({
    onChange: function() {
        console.log('Hey, I have no clue what to do on change, yet.');
    },
    render: function() {
        return (
            <input onChange={this.onChange}/>
        )
    }
});


var FBDiariesIntro = React.createClass({
    render: function() {
        return (
            <div> ;) </div>
        )
    }
});

// for starters create all components here

ReactDOM.render(
  <FBDiaries />,
  document.getElementById('container')
);
