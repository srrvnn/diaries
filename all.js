var Diaries = React.createClass({ getInitialState: function() {
        return { user: null, user_id: null, post_status: null, post_id: null};
    },
    userStatusChange: function() {
        var _this = this;
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                FB.api('/me', function(response) {
                    _this.setState({user: response.name, user_id: response.id});
                })
            } else {
                _this.setState({user: null, user_id: null, post_status: null, post_id: null});
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
                <h1>Diaries</h1>

                <DiariesStatus status={this.state.post_status} id={this.state.post_id}/>
                {this.state.user === null
                    ? <DiariesIntro />
                    : <DiariesPost onStatusChange={this.postStatusChange}/>}
                <FBLogin user_id={this.state.user_id}/>
            </div>
        );
    }
});

var FBLogin = React.createClass({
    render: function() {
        return (
            <div className="login">
                {this.props.user_id == null ? '' : <img src={'http://graph.facebook.com/' + this.props.user_id + '/picture'} />}
                <div className="fb-login-button" data-scope="public_profile,user_birthday,publish_actions"
                     data-size="xlarge" data-auto-logout-link="true">
                </div>
            </div>
        );
    }
});

var DiariesPost = React.createClass({
    getInitialState: function() {
        return {post_content: null, last_save: null, last_update: null};
    },
    onChange: function(e) {
        this.setState({post_content: e.target.value});
    },
    onSubmit: function(e) {
        var _this = this;
        e.preventDefault();
        var post_message = {
            'message': this.state.post_content
        };

        var first_line = post_message.message.split('\n')[0].replace('...', '');
        var date = Date.parse(first_line);

        post_message.message = isNaN(date)
            ? post_message.message
            : post_message.message.split('\n').slice(1).join('\n');

        FB.api('/me/feed', 'POST', post_message, function (response) {
            if (response && !response.error) {
                _this.props.onStatusChange({message: 'successful', id: response.id});
            } else {
                _this.props.onStatusChange({message: 'unsuccessful'});
            }
        });
    },
    componentDidMount: function() {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.setState({post_content: (new Date()).toLocaleString('en-US', options) + '...\n'});
        this.refs.post_textarea.focus();
    },
    render: function() {
        return (
            <form className="diaries-post" onSubmit={this.onSubmit}>
                <textarea ref="post_textarea" onChange={this.onChange} value={this.state.post_content}></textarea>
                <div className="actions">
                    <button className="post" type="submit">Post</button>
                </div>
            </form>
        );
    }
});

var DiariesStatus = React.createClass({
    render: function() {
        return (
            <div className="diaries-status">
                {this.props.status ? <span> The private post was {this.props.status}. </span> : ''}
                {this.props.id ? <a href={'http://facebook.com/' + this.props.id} target="_blank"> See it on Facebook. </a> : ''}
            </div>
        )
    }
});

var DiariesIntro = React.createClass({
    render: function() {
        return (
            <div className="diaries-intro">
                Write your heart out, and post it privately to facebook. <br/>

                <span className="more">
                -> All posts to fb will be tagged with 'only me' privacy &mdash; no exceptions. <br/>
                -> All posts are saved locally, on this browser and nowhere else. <br/>
                -> All posts are encrypted, to keep sneaking into the browser out. <br/>
                -> Add photos from your facebook albums to posts. <br/>

                </span>

            </div>
        )
    }
});

ReactDOM.render(<Diaries />, document.getElementById('container'));
