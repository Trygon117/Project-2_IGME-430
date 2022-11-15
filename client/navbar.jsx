// Navbar for every page
const Navbar = (props) => {
    updateSelectedPage = (e) => {
        Array.from(e.currentTarget.parentElement.children).forEach(tab => tab.classList = 'navbar-item is-tab');
        e.currentTarget.classList = 'navbar-item is-tab is-active';
    };

    clickBurger = (e) => {
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
                    <a id="Write" className="navbar-item is-tab" href='/home'>Create</a>
                    <a id="Library" className="navbar-item is-tab" href='/home'>Library</a>
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

// Initialize Navbar State
const initializeNavbar = async (passedFunctions, _csrf) => {
    let response = await fetch('/isLoggedIn');
    let data = await response.json();

    const currentPage = document.querySelector('header').getAttribute('data-current-page');

    const navbarItems = Array.from(document.querySelector('.navbar-start').children)
        .concat(Array.from(document.querySelector('.navbar-end').children));

    // update each navbar item so it shows what page we are on
    navbarItems.forEach(navItem => {
        if (navItem.id === currentPage) {
            navItem.classList = 'navbar-item is-tab is-active';
        } else {
            navItem.classList = 'navbar-item is-tab';
        }
    });

    let signOutButton = document.getElementById('signout');
    let signUpButton = document.getElementById('signup');
    let loginButton = document.getElementById('login');

    // if the user is currently logged in
    if (data.LoggedIn) {
        // hide the log in and sign up buttons, and show the Log Out button
        signOutButton.style.display = 'flex';
        signUpButton.style.display = 'none';
        loginButton.style.display = 'none';

        // log the user out
        signoutButton = async (e) => {
            e.preventDefault();
            setPageWeight(e);
            await fetch('/logout');
        };
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
                await fetch('/login');
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
                await fetch('/login');
                await passedFunctions.renderSignUpWindow({ _csrf });
                return false;
            }
        });
    }
}

module.exports = {
    Navbar,
    initializeNavbar,
}
