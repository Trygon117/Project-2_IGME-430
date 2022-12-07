const Modal = require('./modal.jsx');
const helper = require('./helper.js');

const ProfileWindow = (props) => {

    const activatePremium = async (e) => {
        console.log('acitvate premium');
        if (e.currentTarget.innerText === 'Activate Premium') {
            premiumResponse = await fetch('/activatePremium');
            const activateResponse = await premiumResponse.json();
            //console.log(activateResponse);
        } else {
            premiumResponse = await fetch('/deactivatePremium');
            const deactivateResponse = await premiumResponse.json();
            //console.log(deactivateResponse);
        }
        loadButtons();
    }

    const changePassword = () => {
        console.log('change password');
        Modal.openModal({ modalType: 'changePassword' }, (response) => {
            console.log(response);
            helper.sendPost('/changePassword', { oldPass: response.oldPass, newPass1: response.newPass1, newPass2: response.newPass2, _csrf: props.csrf }, (changedPassword) => {
                if (changedPassword.message === 'success') {
                    const messageSpan = document.getElementById('message-span');
                    messageSpan.innerText = 'Password Changed Successfully';
                }
            });
        });
    }

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const readableCreatedDate = new Date(props.account.createdDate).toLocaleDateString(undefined, dateOptions);

    return (
        <div>

            <div id="modal" className="modal">
                <div className="modal-background" onClick={Modal.closeAllModals}></div>
                <div className="modal-card">
                    <header className="modal-card-head">
                        <p id="modal-title" className="modal-card-title"></p>
                        <button className="delete" aria-label="close" onClick={Modal.closeModal}></button>
                    </header>

                    <section id='modal-card-body' className="modal-card-body">

                    </section>

                    <footer className="modal-card-foot">
                        <button id='modal-save-button' className="button is-success" onClick={Modal.closeModal}>Save changes</button>
                        <button className="button" onClick={Modal.closeModal}>Cancel</button>
                    </footer>
                </div>
            </div>

            <div style={{ width: '90vw', minHeight: '90vh', margin: 'auto', position: 'relative' }}>
                <h1 className='title'>Profile</h1>

                <h2 className="subtitle">Username: {props.account.username}</h2>

                <h2 className="subtitle">User Id: {props.account._id}</h2>

                <h2 className="subtitle">Account Created: {readableCreatedDate}</h2>

                <div style={{ position: 'absolute', bottom: '0px', width: '100vw', marginBottom: '30px' }}>

                    <div id='buttons' style={{ display: 'flex', flexFlow: 'row', gap: '20px', justifyContent: 'center' }}>
                        <a id='premium-button' className="button is-primary" onClick={activatePremium}>Activate Premium</a>
                        <a id='change-password-button' className="button is-warning" onClick={changePassword}>Change Password</a>
                    </div>

                    <div style={{ margin: 'auto', width: '100%', minHeight: '1.5', display: 'flex', justifyContent: 'center' }}>
                        <span id='message-span' className='has-text-success'></span>
                    </div>

                </div>

            </div>

        </div>

    );
}

const loadButtons = async () => {
    const premiumButton = document.getElementById('premium-button');

    premiumResponse = await fetch('/isPremium');
    const isPremium = await premiumResponse.json();

    if (isPremium) {
        premiumButton.className = 'button is-danger';
        premiumButton.innerText = 'Deactivate Premium';
    } else {
        premiumButton.className = 'button is-primary';
        premiumButton.innerText = 'Activate Premium';
    }
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    loggedInAsResponse = await fetch('/getLoggedInAs');
    myAccount = await loggedInAsResponse.json();

    console.log(myAccount);

    ReactDOM.render(<ProfileWindow account={myAccount} csrf={data.csrfToken} />,
        document.getElementById('profile-content'));

    loadButtons();
};

module.exports = {
    init,
}