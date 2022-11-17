const helper = require('./helper.js');

const handleLogin = (e) => {
    e.preventDefault();

    const username = e.target.querySelector('#user').value;
    const pass = e.target.querySelector('#pass').value;
    const _csrf = e.target.querySelector('#_csrf').value;

    if (!username || !pass) {
        const loginErrorSpan = e.target.querySelector('#login-error-span');
        loginErrorSpan.innerHTML = 'Username or password is empty!';
        return false;
    }

    helper.sendPost(e.target.action, { username, pass, _csrf });

    return false;
};

const handleSignup = (e) => {
    e.preventDefault();

    const username = e.target.querySelector('#user').value;
    const pass = e.target.querySelector('#pass').value;
    const pass2 = e.target.querySelector('#pass2').value;
    const _csrf = e.target.querySelector('#_csrf').value;

    if (!username || !pass || !pass2) {
        const signupErrorSpan = e.target.querySelector('#signup-error-span');
        signupErrorSpan.innerHTML = 'Username or password is empty!';
        return false;
    }

    if (pass !== pass2) {
        const signupErrorSpan = e.target.querySelector('#signup-error-span');
        signupErrorSpan.innerHTML = 'Passwords do not match!';
        return false;
    }

    helper.sendPost(e.target.action, { username, pass, pass2, _csrf });

    return false;
};

const LoginWindow = (props) => {
    console.log("login window");
    console.log(props);
    return (
        <form id="loginForm"
            name="loginForm"
            onSubmit={handleLogin}
            action="/login"
            method='POST'
            className='mainForm box'
        >
            <div className='title'>
                <h1>Login</h1>
            </div>

            <div className="field">
                <label className='label' htmlFor='username'>Username: </label>
                <div className='control has-icons-left'>
                    <input className='input' id="user" type="text" name='username' placeholder='Username' />
                    <span className="icon is-small is-left">
                        <i className="fas fa-user"></i>
                    </span>
                </div>
            </div>

            <div className="field">
                <label className='label' htmlFor='pass'>Password: </label>
                <div className='control has-icons-left'>
                    <input className='input' id='pass' type='password' name='pass' placeholder='Password' />
                    <span className="icon is-small is-left">
                        <i className="fa-solid fa-lock"></i>
                    </span>
                </div>
            </div>

            <input id='_csrf' type='hidden' name='_csrf' value={props.csrf} />

            <span id="login-error-span" className='has-text-danger'></span>

            <div className='control is-pulled-right'>
                <input className='formSubmit button is-link' type='submit' value='Sign in' />
            </div>
        </form>
    );
};

const renderLoginWindow = async (props) => {
    ReactDOM.render(<LoginWindow csrf={props.csrf} />,
        document.getElementById('login-content'));
};

const SignupWindow = (props) => {
    authenticateUsername = async (e) => {
        const input = e.currentTarget;
        console.log('signup window - authenitcate username');
        console.log(props);
        await helper.sendPost('/isUsernameAvailable', { username: e.currentTarget.value, _csrf: props.csrf },
            (response) => {
                let controlDiv = input.parentElement;
                let iconSpan = controlDiv.querySelector("#username-success-icon");
                let formDiv = controlDiv.parentElement;
                let isAvailableText = formDiv.querySelector("#isAvailable");
                if (response.found) {
                    iconSpan.innerHTML = '<i class="fa-solid fa-exclamation"></i>';
                    isAvailableText.innerHTML = 'This username is taken';
                    isAvailableText.classList = 'help is-danger';
                } else {
                    iconSpan.innerHTML = '<i class="fas fa-check"></i>';
                    isAvailableText.innerHTML = 'This username is available';
                    isAvailableText.classList = 'help is-success';
                }
            });
    };

    return (
        <form id="signupForm"
            name="signupForm"
            onSubmit={handleSignup}
            action="/signup"
            method='POST'
            className='mainForm box'
        >
            <div className='title'>
                <h1>Sign Up</h1>
            </div>

            <div className="field">
                <label className='label' htmlFor='username'>Username: </label>
                <div className='control has-icons-left has-icons-right'>
                    <input className='input' id="user" type="text" name='username' placeholder='Username' onChange={authenticateUsername} />
                    <span className="icon is-small is-left">
                        <i className="fas fa-user"></i>
                    </span>
                    <span id="username-success-icon" className="icon is-small is-right"></span>
                </div>
                <p id="isAvailable" className="help is-success"></p>
            </div>

            <div className="field">
                <label className='label' htmlFor='pass'>Password: </label>
                <div className='control has-icons-left'>
                    <input className='input' id='pass' type='password' name='pass' placeholder='Password' />
                    <span className="icon is-small is-left">
                        <i className="fa-solid fa-lock"></i>
                    </span>
                </div>
            </div>

            <div className="field">
                <label className='label' htmlFor='pass2'>Password: </label>
                <div className='control has-icons-left'>
                    <input className='input' id='pass2' type='password' name='pass' placeholder='Retype Password' />
                    <span className="icon is-small is-left">
                        <i className="fa-solid fa-lock"></i>
                    </span>
                </div>
            </div >

            <input id='_csrf' type='hidden' name='_csrf' value={props.csrf} />

            <span id="signup-error-span" className='has-text-danger'></span>

            <div className='control is-pulled-right'>
                <input className='formSubmit button is-link' type='submit' value='Sign Up' />
            </div>
        </form >
    );
};

const renderSignUpWindow = async (props) => {
    console.log('render signup window');
    console.log(props._csrf);
    ReactDOM.render(<SignupWindow csrf={props._csrf} />,
        document.getElementById('login-content'));
};

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log('init login');
    console.log(data);

    ReactDOM.render(<LoginWindow csrf={data.csrfToken} />,
        document.getElementById('login-content')
    );
};

module.exports = {
    init,
    renderLoginWindow,
    renderSignUpWindow,
}