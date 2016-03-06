var Diaries = React.createClass({
    getInitialState: function() {
        return { user: null, post_status: null, post_id: null, entry: null};
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
    postStatusChange: function(status) {
        this.setState({post_status: status.message, post_id: status.id});
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
                <h1>{this.state.user ? this.state.user.split(' ')[0] + '\'s' : ''} Diaries</h1>
                <FBLogin />
                <DiariesStatus status={this.state.post_status} id={this.state.post_id}/>
                {this.state.user === null
                    ? <DiariesIntro />
                    : <DiariesPost onStatusChange={this.postStatusChange}/>}
            </div>
        );
    }
});

var FBLogin = React.createClass({
    render: function() {
        return (
            <div className="fb-login-button" data-scope="public_profile,user_birthday,publish_actions"
                 data-size="large" data-auto-logout-link="true">
            </div>
        );
    }
});

var DiariesPost = React.createClass({
    onChange: function() {
        console.log('Hey, I have no clue what to do on change, yet.');
    },
    onSubmit: function(e) {
        var _this = this;
        e.preventDefault();
        var post_message = {
            'message': 'Testing private post from Diaries.'
        };
        FB.api('/me/feed', 'POST', post_message, function (response) {
            if (response && !response.error) {
                _this.props.onStatusChange({message: 'successful', id: response.id});
            } else {
                _this.props.onStatusChange({message: 'unsuccessful'});
            }
        });
    },
    render: function() {
        return (
            <form className="diaries-entry" onSubmit={this.onSubmit}>
                <textarea onChange={this.onChange}></textarea>
                <button type="submit">Post</button>
            </form>
        );
    }
});

var DiariesStatus = React.createClass({
    render: function() {
        return (
            <div>
                {this.props.status ? <span> The private post was {this.props.status}. </span> : ''}
                {this.props.id ? <a href={'http://facebook.com/' + this.props.id}> See it on Facebook. </a> : ''}
            </div>
        )
    }
});

var DiariesIntro = React.createClass({
    render: function() {
        return (
            <div> Write your heart, and post it privately to facebook. Look at the post years later, and you'll love the memories. </div>
        )
    }
});

ReactDOM.render(<Diaries />, document.getElementById('container'));
