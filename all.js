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
                    : <DiariesPost user_id={this.state.user_id} onStatusChange={this.postStatusChange}/>}
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
    saveTimeout: null,
    getInitialState: function() {
        return {content: null, created_at: null, updated_at: null};
    },
    onChange: function(e) {
        var _this = this;
        this.setState({content: e.target.value});

        // debounce, and save to local storage
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(function() {
            if (_this.state.content == null || _this.state.content.length < 1) {
                return;
            }
            if (store.enabled) {
                var diaries_posts = store.get('diaries_posts') || [];
                if (diaries_posts.length > 0
                    && diaries_posts[diaries_posts.length - 1].posted == false) {
                    diaries_posts.pop();
                }
                diaries_posts.push({
                    created_at: _this.state.created_at,
                    content: CryptoJS.AES.encrypt(_this.state.content, _this.props.user_id).toString(),
                    posted: false
                });
                store.set('diaries_posts', diaries_posts);
            }
        }, 1000);
    },
    onSubmit: function(e) {
        var _this = this;
        e.preventDefault();
        var post_message = {
            'message': this.state.content
        };

        var first_line = post_message.message.split('\n')[0].replace('...', '');
        var date = Date.parse(first_line);

        post_message.message = isNaN(date)
            ? post_message.message
            : post_message.message.split('\n').slice(1).join('\n');

        FB.api('/me/feed', 'POST', post_message, function (response) {
            if (store.enabled) {
                var diaries_posts = store.get('diaries_posts');
                diaries_posts[diaries_posts.length - 1].posted = true;
                store.set('diaries_posts', diaries_posts);
            }
            if (response && !response.error) {
                _this.props.onStatusChange({message: 'successful', id: response.id});
            } else {
                _this.props.onStatusChange({message: 'unsuccessful'});
            }
        });
    },
    onClear: function() {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.setState({content: (new Date()).toLocaleString('en-US', options) + '...\n', created_at: Date.now()});
        if (store.enabled) {
            var diaries_posts = store.get('diaries_posts') || [];
            if (diaries_posts.length > 0
                && diaries_posts[diaries_posts.length - 1].posted == false) {
                diaries_posts.pop();
            }
            store.set('diaries_posts', diaries_posts);
            this.refs.post_textarea.focus();
        }
    },
    componentDidMount: function() {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

        if (store.enabled && store.get('diaries_posts') && store.get('diaries_posts').length > 0) {
            var saved = store.get('diaries_posts').sort(function(a, b){ return b.created_at - a.created_at; }).pop();
            if (saved && saved.posted) {
                this.setState({content: (new Date()).toLocaleString('en-US', options) + '...\n', created_at: Date.now()});
            } else if (saved) {
                this.setState({content: CryptoJS.AES.decrypt(saved.content, this.props.user_id).toString(CryptoJS.enc.Utf8), created_at: saved.created_at});
            }
        } else {
            this.setState({content: (new Date()).toLocaleString('en-US', options) + '...\n', created_at: Date.now()});
        }

        this.refs.post_textarea.focus();
    },
    render: function() {
        return (
            <form className="diaries-post" onSubmit={this.onSubmit}>
                <textarea ref="post_textarea" onChange={this.onChange} value={this.state.content}></textarea>
                <div className="actions">
                    <button className="post" type="submit">Post</button>
                    <button className="post" type="button" onClick={this.onClear}>x</button>
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
                -> All posts are encrypted, to keep dev console sneaks safe. <br/>
                -> Soon: Add photos from your facebook albums to posts. <br/>

                </span>

            </div>
        )
    }
});

ReactDOM.render(<Diaries />, document.getElementById('container'));
