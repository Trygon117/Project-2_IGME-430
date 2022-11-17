// Navbar for every page
const Navbar = (props) => {
    const clickBurger = (e) => {
        e.preventDefault();
        try {
            let navbarMenue = e.currentTarget.parentElement.parentElement.querySelector("#nav-links");
            e.currentTarget.classList.toggle('is-active');
            navbarMenue.classList.toggle('is-active');
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <nav className="navbar is-dark has-shadow">
            <div className="navbar-brand">
                <a className="navbar-item" href="/">
                    <i className="fa-solid fa-scroll"></i>
                </a>
                <a className="navbar-burger" id="burger" onClick={clickBurger}>
                    <span></span>
                    <span></span>
                    <span></span>
                </a>
            </div>
            <div className="navbar-menu" id="nav-links">
                <div className="navbar-start">
                    <a id="home" className="navbar-item is-tab" href='/home'>Home</a>
                    <a id="create" className="navbar-item is-tab" href='/create'>Create</a>
                    <a id="library" className="navbar-item is-tab" href='/library'>Library</a>
                    <a id="profile" className="navbar-item is-tab" href='/profile'>Profile</a>
                </div>
                <div className="navbar-end">
                    <a id="login" className="navbar-item is-tab" onClick={updateSelectedPage}>Login</a>
                    <a id="signup" className="navbar-item is-tab" onClick={updateSelectedPage}>Sign Up</a>
                    <a id="signout" className="navbar-item is-tab">Sign Out</a>
                </div>
            </div>
        </nav>
    );
};

const updateSelectedPage = () => {
    const currentPage = document.querySelector('header').getAttribute('data-current-page');

    const navbarItems = Array.from(document.querySelector('.navbar-start').children)
        .concat(Array.from(document.querySelector('.navbar-end').children));

    // update each navbar item so it shows what page we are on
    navbarItems.forEach(navItem => {
        if (navItem.id === currentPage) {
            // login page means we need to do some extra logic to swap between login / sign up
            if (currentPage === 'login') {
                const loginButton = document.querySelector('#login');
                const signUpButton = document.querySelector('#signup');
                if (document.querySelector('#loginForm')) {
                    loginButton.classList = 'navbar-item is-tab is-active';
                    signUpButton.classList = 'navbar-item is-tab';
                } else {
                    loginButton.classList = 'navbar-item is-tab';
                    signUpButton.classList = 'navbar-item is-tab is-active';
                    console.log(signUpButton.classList.value);
                }
            } else {
                navItem.classList = 'navbar-item is-tab is-active';
            }
        } else {
            if (navItem.id === 'signup') {
                // this made me angry >:(
            } else {
                navItem.classList = 'navbar-item is-tab';
            }
        }
    });
};

// Initialize Navbar State
const initializeNavbar = async (passedFunctions, _csrf) => {
    let response = await fetch('/isLoggedIn');
    let data = await response.json();

    updateSelectedPage();

    let signOutButton = document.getElementById('signout');
    let signUpButton = document.getElementById('signup');
    let loginButton = document.getElementById('login');

    // if the user is currently logged in
    if (data.loggedIn) {
        // hide the log in and sign up buttons, and show the Log Out button
        signOutButton.style.display = 'flex';
        signUpButton.style.display = 'none';
        loginButton.style.display = 'none';

        // log the user out
        signOutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            let logoutResponse = await fetch('/logout');
            window.localStorage.setItem('partchment-LoadSignUp', false);
            window.location.assign(logoutResponse.url);
        });
    } else {
        // hide the log out button, and show the log in and sign up buttons
        signOutButton.style.display = 'none';
        signUpButton.style.display = 'flex';
        loginButton.style.display = 'flex';

        let onLoginPage = false;

        if (document.getElementById('login-content') != null) onLoginPage = true;

        // If on the login page, then render the log in window, otherwise load the log in page
        loginButton.addEventListener('click', async (e) => {
            e.preventDefault();
            if (onLoginPage) {
                await passedFunctions.renderLoginWindow({ _csrf });
                return false;
            } else {
                let loginResponse = await fetch('/login');
                window.localStorage.setItem('partchment-LoadSignUp', false);
                window.location.assign(loginResponse.url);
                return false;
            }
        });

        // If on the login page, then render the signup window, otherwise load the log in page and load the signup window
        signUpButton.addEventListener('click', async (e) => {
            e.preventDefault();
            if (onLoginPage) {
                await passedFunctions.renderSignUpWindow({ _csrf });
                return false;
            } else {
                let loginResponse = await fetch('/login');
                window.localStorage.setItem('partchment-LoadSignUp', true);
                window.location.assign(loginResponse.url);
                return false;
            }
        });
    }
}

module.exports = {
    Navbar,
    initializeNavbar,
    updateSelectedPage,
}
