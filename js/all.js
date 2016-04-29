var Diaries = React.createClass({

    appId: window.location.hostname == 'srrvnn.me' ? '1564184183893205' : '1589374801374143',

    getInitialState: function() {

        return { user: null, user_id: null, post_status: null, post_id: null, more: false };
    },

    userStatusChange: function() {

        var _this = this;

        FB.getLoginStatus(function(response) {

            if (response.status === 'connected') {

                _this.setState({user_id: response.authResponse.userID});

                FB.api('/me', function(response) {

                    _this.setState({user: response.name});
                })

            } else {

                _this.setState({user: null, user_id: null, post_status: null, post_id: null});

                // hack to have FB redraw the login button

                FB.init({
                    appId      : _this.appId,
                    cookie     : true,  // enable cookies for server to access the session
                    xfbml      : true,  // parse social plugins on this page
                    version    : 'v2.5' // use graph api version 2.5
                });
            }
        });
    },

    postStatusChange: function(status) {

        this.setState({post_status: status.message, post_id: status.id});
    },

    componentWillMount: function() {

        var _this = this;

        var appId = window.location.hostname == 'localhost' ? '1589374801374143' : '1564184183893205';

        window.fbAsyncInit = function() {

            FB.init({
                appId      : appId,
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

    onLearnClick: function() {

        this.setState({more: true});
    },

    render: function() {
        return (
            <div className="content">

                <div className="body">

                <DiariesHeader user={this.state.user} user_id={this.state.user_id} />

                {this.state.user_id !== null ? <DiariesPost user_id={this.state.user_id} onStatusChange={this.postStatusChange}
                    post_status={this.state.post_status} post_id={this.state.post_id}/> : ''}

                {this.state.user_id === null ? <FBLogin user_id={this.state.user_id}/> : ''}
                {this.state.user_id === null ? <DiariesIntro /> : ''}

                </div>

                <DiariesFooter />

            </div>
        );
    }
});

var DiariesPost = React.createClass({

    saveTimeout: null,

    statusTimeout: null,

    getInitialState: function() {

        return {content: null, created_at: null, updated_at: null, posting: false};
    },

    onChange: function(e) {

        var _this = this;

        // save to state
        this.setState({content: e.target.value});

        // clear previous timeouts
        clearTimeout(this.saveTimeout);

        // save to local storage in 1000ms
        this.saveTimeout = setTimeout(function() {

            if (Boolean(_this.state.content) == false) return;

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

        e.preventDefault();

        var _this = this;

        var post_message = {

            'message': this.state.content
        };

        clearTimeout(this.statusTimeout);

        _this.setState({posting: true});
        _this.props.onStatusChange({message: null, id: null});

        var first_line = post_message.message.split('\n')[0].replace('...', '');
        var date = Date.parse(first_line);

        post_message.message = isNaN(date)
            ? post_message.message
            : post_message.message.split('\n').slice(1).filter(function(item){ return item.length > 1; }).join('\n');

        FB.api('/me/feed', 'POST', post_message, function (response) {

            _this.setState({posting: false});

            if (store.enabled) {

                var diaries_posts = store.get('diaries_posts');
                diaries_posts[diaries_posts.length - 1].posted = true;
                store.set('diaries_posts', diaries_posts);
            }

            if (response && !response.error) {

                _this.props.onStatusChange({message: 'Post successful.', id: response.id});

                _this.statusTimeout = setTimeout(function() {

                    _this.props.onStatusChange({message: null, id: null});

                }, 10000);

            } else {

                _this.props.onStatusChange({message: 'Post Unsuccesful. ' + response.error.error_user_title});

                _this.statusTimeout = setTimeout(function() {

                    _this.props.onStatusChange({message: null, id: null});

                }, 10000);
            }
        });
    },

    onClear: function() {

        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

        this.setState({content: '', created_at: Date.now()});

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

            // var saved = store.get('diaries_posts').sort(function(a, b){ return b.created_at - a.created_at; }).pop();

            var saved = store.get('diaries_posts').pop();

            if (Boolean(saved.content) && saved.posted) {

                this.setState({content: ''});
                // this.setState({content: (new Date()).toLocaleString('en-US', options) + '...\n\n', created_at: Date.now()});

            } else if (Boolean(saved.content)) {

                this.setState({content: CryptoJS.AES.decrypt(saved.content, this.props.user_id).toString(CryptoJS.enc.Utf8), created_at: saved.created_at});
            }

        } else {

            this.setState({content: ''});
            // this.setState({content: (new Date()).toLocaleString('en-US', options) + '...\n\n', created_at: Date.now()});
        }

        this.refs.post_textarea.focus();
    },

    render: function() {

        var statusClassList = ['status'];

        if (this.state.posting) {

            statusClassList.push('loading');

        } else if (this.props.post_status && this.props.post_status.length > 1) {

            statusClassList.push('on');
        }

        statusClassList = statusClassList.join(' ');

        var statusMore = '';

        if (this.state.posting) {

            statusMore = <i className="fa fa-refresh fa-spin" aria-hidden="true"></i>;

        } else if (this.props.post_status && this.props.post_id) {

            statusMore = <a href={'http://facebook.com/' + this.props.post_id} target="_blank"> See it on Facebook. </a>;
        }

        return (
            <form className="diaries-post" onSubmit={this.onSubmit}>
                <div className="actions">
                    <button type="submit" className="btn-submit">Post to Facebook</button>
                    <button type="button" onClick={this.onClear}><i className="fa fa-times" aria-hidden="true"> </i></button>
                    <div className={statusClassList}>{this.props.post_status}{statusMore}</div>
                </div>
                <textarea ref="post_textarea" onChange={this.onChange} value={this.state.content}></textarea>
            </form>
        );
    }
});

var DiariesHeader = React.createClass({

    onLogout: function() {

        FB.logout();
    },

    render: function() {

        var classList = 'diaries-header ' + (this.props.user !== null ? 'user' : '');

        return (

            <div className={classList}>

                {this.props.user !== null ? <button className="btn-logout" onClick={this.onLogout}><img src={'http://graph.facebook.com/' + this.props.user_id + '/picture'} /></button> : ''}

                <h1>{this.props.user ? this.props.user.split(' ')[0] + '\'s ' : ''}Diary</h1>

                <h3>Add worry-free personal entries to your Facebook timeline.</h3>

            </div>
        )
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

                <ul className="more">

                    <li>
                        <i className="fa fa-paper-plane-o" aria-hidden="true"></i>
                        Write your personal entries to your Facebook timeline, to keep your thoughts with rest of your life events. </li>

                    <li>
                        <i className="fa fa-lock" aria-hidden="true"></i>
                        From an app that has only the 'only me' permission, there is no way of a private post going public. </li>

                    <li>
                        <i className="fa fa-floppy-o" aria-hidden="true"></i>
                        Diaries works seamlessly offline by saving drafts to browser storage, so you can work on your thoughts over days. </li>

                    <li>
                        <i className="fa fa-hand-spock-o" aria-hidden="true"></i>
                        Posts and Drafts encrypted while stored locally, so you needn't worry about your hacker friend. </li>

                    <li>
                        <i className="fa fa-picture-o" aria-hidden="true"></i>
                        Very Soon: Add a private photo to your posts, because nothing tells a story better. </li>

                </ul>

            </div>
        )
    }
});

var DiariesFooter = React.createClass({

    render: function() {
        return (
            <ul className="diaries-footer">
                <li> Built to land a phone screen at Facebook. <a href="mailto:saravanan@alumni.usc.edu?subject=Hello from Facebook" target="_blank">Recruiter?</a> </li>
                <li> <a href="http://srrvnn.me/resume" target="_blank">Resume</a> </li>
                <li> <a href="http://github.com/srrvnn/diaries" target="_blank">Source Code</a> </li>
                <li> <a href="http://srrvnn.me/diaries/privacypolicy.htm" target="_blank">Privacy Policy</a> </li>
            </ul>
        )
    }
});

var FBLogin = React.createClass({

    login: function() {

        FB.login(function() {}, {scope: 'publish_actions', default_audience: 'only_me'});
    },

    render: function() {
        return (
            <div className="diaries-login">
                <button onClick={this.login}><img src="img/fb-login.png" /></button>
            </div>
        );
    }
});

ReactDOM.render(<Diaries />, document.getElementById('container'));
